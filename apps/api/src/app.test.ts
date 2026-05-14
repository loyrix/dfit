import { describe, expect, it } from "vitest";
import { buildApp } from "./app.js";
import { currentRequestIdentity, type RequestIdentity } from "./request-context.js";
import { InMemoryStore } from "./repositories/in-memory-store.js";
import type { AiProvider, AnalyzeMealImageInput } from "./services/ai-provider.js";
import { analyzeWithMockProvider } from "./services/mock-ai-provider.js";

const testApp = () => buildApp({ repository: new InMemoryStore() });

const mealPayload = (loggedAt: string) => ({
  mealType: "lunch",
  title: "Dal rice",
  loggedAt,
  items: [
    {
      displayName: "Dal",
      quantity: 1,
      unit: "katori",
      grams: 180,
      nutrition: {
        calories: 180,
        proteinG: 10.8,
        carbsG: 25.2,
        fatG: 5.4,
      },
    },
  ],
});

describe("DFit API", () => {
  it("serves health", async () => {
    const app = await testApp();
    const response = await app.inject({ method: "GET", url: "/health" });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ ok: true, service: "dfit-api" });
    await app.close();
  });

  it("requires idempotency for mutating endpoints", async () => {
    const app = await testApp();
    const response = await app.inject({ method: "POST", url: "/v1/scans/prepare" });
    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ error: "missing_idempotency_key" });
    await app.close();
  });

  it("prepares a scan when idempotency key is supplied", async () => {
    const app = await testApp();
    const response = await app.inject({
      method: "POST",
      url: "/v1/scans/prepare",
      headers: { "idempotency-key": "test-scan-prepare" },
    });
    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({ status: "prepared" });
    await app.close();
  });

  it("searches seeded Indian foods by Hinglish aliases", async () => {
    const app = await testApp();
    const response = await app.inject({ method: "GET", url: "/v1/foods?q=chawal" });
    expect(response.statusCode).toBe(200);
    expect(response.json().results[0]).toMatchObject({
      id: "food_cooked_rice",
      matchedAlias: "chawal",
    });
    await app.close();
  });

  it("makes anonymous device identity available to repositories", async () => {
    let seenIdentity: RequestIdentity | undefined;
    class IdentityAwareStore extends InMemoryStore {
      override async getProfile() {
        seenIdentity = currentRequestIdentity();
        return super.getProfile();
      }
    }

    const app = await buildApp({ repository: new IdentityAwareStore() });
    const response = await app.inject({
      method: "GET",
      url: "/v1/journal/today",
      headers: {
        "x-dfit-install-id": "install-test",
        "x-dfit-platform": "ios",
        "x-dfit-locale": "en-IN",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(seenIdentity).toMatchObject({
      installId: "install-test",
      platform: "ios",
      locale: "en-IN",
    });
    await app.close();
  });

  it("analyzes, confirms, and returns the meal in today journal", async () => {
    const app = await testApp();
    const prepared = await app.inject({
      method: "POST",
      url: "/v1/scans/prepare",
      headers: { "idempotency-key": "flow-prepare" },
    });
    const scanId = prepared.json().scanId as string;

    const analyzed = await app.inject({
      method: "POST",
      url: `/v1/scans/${scanId}/analyze`,
      headers: { "idempotency-key": "flow-analyze" },
      payload: {
        image: {
          mimeType: "image/jpeg",
          base64: "AQID",
          byteSize: 3,
        },
      },
    });
    expect(analyzed.statusCode).toBe(200);
    expect(analyzed.json()).toMatchObject({ status: "ready_for_review", mealType: "lunch" });

    const analysis = analyzed.json();
    const confirmed = await app.inject({
      method: "POST",
      url: `/v1/scans/${scanId}/confirm`,
      headers: { "idempotency-key": "flow-confirm" },
      payload: {
        mealType: analysis.mealType,
        title: analysis.mealName,
        items: analysis.items.map(
          (item: {
            name: string;
            quantity: number;
            unit: string;
            estimatedGrams: number;
            nutrition: unknown;
          }) => ({
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
            estimatedGrams: item.estimatedGrams,
            nutrition: item.nutrition,
          }),
        ),
      },
    });
    expect(confirmed.statusCode).toBe(201);
    expect(confirmed.json().meal).toMatchObject({
      id: confirmed.json().mealId,
      title: "Dal rice, roti and sabzi",
      mealType: "lunch",
    });

    const today = await app.inject({ method: "GET", url: "/v1/journal/today" });
    expect(today.statusCode).toBe(200);
    expect(today.json().meals[0]).toMatchObject({
      id: confirmed.json().mealId,
      title: "Dal rice, roti and sabzi",
    });
    await app.close();
  });

  it("returns a seven day journal range with daily summary", async () => {
    const app = await testApp();
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);

    const firstMeal = await app.inject({
      method: "POST",
      url: "/v1/meals",
      headers: { "idempotency-key": "range-meal-today" },
      payload: mealPayload(now.toISOString()),
    });
    expect(firstMeal.statusCode).toBe(201);

    const secondMeal = await app.inject({
      method: "POST",
      url: "/v1/meals",
      headers: { "idempotency-key": "range-meal-yesterday" },
      payload: mealPayload(yesterday.toISOString()),
    });
    expect(secondMeal.statusCode).toBe(201);

    const range = await app.inject({
      method: "GET",
      url: "/v1/journal/range?days=7",
    });

    expect(range.statusCode).toBe(200);
    expect(range.json().days).toHaveLength(7);
    expect(range.json().summary).toMatchObject({
      windowDays: 7,
      activeDays: 2,
      mealCount: 2,
    });
    expect(range.json().summary.totals.calories).toBe(360);
    expect(range.json().summary.dailyAverage.calories).toBe(51);
    await app.close();
  });

  it("returns bootstrap data for the first app paint", async () => {
    const app = await testApp();
    const created = await app.inject({
      method: "POST",
      url: "/v1/meals",
      headers: {
        "x-dfit-install-id": "bootstrap-install",
        "x-dfit-platform": "ios",
        "idempotency-key": "bootstrap-meal",
      },
      payload: mealPayload(new Date().toISOString()),
    });
    expect(created.statusCode).toBe(201);

    const bootstrap = await app.inject({
      method: "GET",
      url: "/v1/app/bootstrap",
      headers: {
        "x-dfit-install-id": "bootstrap-install",
        "x-dfit-platform": "ios",
      },
    });

    expect(bootstrap.statusCode).toBe(200);
    expect(bootstrap.json()).toMatchObject({
      profile: { authMethod: "anonymous" },
      quota: {
        freeRemaining: 1,
        rewardedRemaining: 2,
        premiumRemaining: 0,
      },
      today: {
        target: { calories: 1900 },
        totals: { calories: 180 },
      },
      weeklyRange: {
        summary: {
          windowDays: 7,
          activeDays: 1,
          mealCount: 1,
        },
      },
    });
    expect(bootstrap.json().serverTime).toEqual(expect.any(String));
    expect(bootstrap.json().today.meals[0]).toMatchObject({
      id: created.json().id,
      title: "Dal rice",
    });
    await app.close();
  });

  it("binds anonymous journal data when an email account is created", async () => {
    const app = await testApp();
    const installHeaders = {
      "x-dfit-install-id": "install-account-create",
      "x-dfit-platform": "ios",
    };

    const meal = await app.inject({
      method: "POST",
      url: "/v1/meals",
      headers: { ...installHeaders, "idempotency-key": "anonymous-meal-before-signup" },
      payload: mealPayload(new Date().toISOString()),
    });
    expect(meal.statusCode).toBe(201);

    const signup = await app.inject({
      method: "POST",
      url: "/v1/auth/email/signup",
      headers: installHeaders,
      payload: {
        email: "tester@example.com",
        password: "secret1",
      },
    });
    expect(signup.statusCode).toBe(201);
    expect(signup.json().profile).toMatchObject({
      authMethod: "email",
      email: "tester@example.com",
    });

    const bootstrap = await app.inject({
      method: "GET",
      url: "/v1/app/bootstrap",
      headers: {
        authorization: `Bearer ${signup.json().accessToken}`,
        "x-dfit-install-id": "install-account-create",
        "x-dfit-platform": "ios",
      },
    });

    expect(bootstrap.statusCode).toBe(200);
    expect(bootstrap.json().profile).toMatchObject({
      authMethod: "email",
      email: "tester@example.com",
    });
    expect(bootstrap.json().today.meals[0]).toMatchObject({
      id: meal.json().id,
      title: "Dal rice",
    });
    await app.close();
  });

  it("keeps registered user journals isolated by account token", async () => {
    const app = await testApp();

    const firstSignup = await app.inject({
      method: "POST",
      url: "/v1/auth/email/signup",
      headers: {
        "x-dfit-install-id": "install-user-a",
        "x-dfit-platform": "ios",
      },
      payload: { email: "a@example.com", password: "secret1" },
    });
    expect(firstSignup.statusCode).toBe(201);

    const secondSignup = await app.inject({
      method: "POST",
      url: "/v1/auth/email/signup",
      headers: {
        "x-dfit-install-id": "install-user-b",
        "x-dfit-platform": "ios",
      },
      payload: { email: "b@example.com", password: "secret1" },
    });
    expect(secondSignup.statusCode).toBe(201);

    const firstMeal = await app.inject({
      method: "POST",
      url: "/v1/meals",
      headers: {
        authorization: `Bearer ${firstSignup.json().accessToken}`,
        "x-dfit-install-id": "install-user-a",
        "x-dfit-platform": "ios",
        "idempotency-key": "user-a-meal",
      },
      payload: mealPayload(new Date().toISOString()),
    });
    expect(firstMeal.statusCode).toBe(201);

    const secondBootstrap = await app.inject({
      method: "GET",
      url: "/v1/app/bootstrap",
      headers: {
        authorization: `Bearer ${secondSignup.json().accessToken}`,
        "x-dfit-install-id": "install-user-b",
        "x-dfit-platform": "ios",
      },
    });
    expect(secondBootstrap.statusCode).toBe(200);
    expect(secondBootstrap.json().today.meals).toHaveLength(0);

    const secondMealLookup = await app.inject({
      method: "GET",
      url: `/v1/meals/${firstMeal.json().id}`,
      headers: {
        authorization: `Bearer ${secondSignup.json().accessToken}`,
        "x-dfit-install-id": "install-user-b",
        "x-dfit-platform": "ios",
      },
    });
    expect(secondMealLookup.statusCode).toBe(404);

    const firstBootstrap = await app.inject({
      method: "GET",
      url: "/v1/app/bootstrap",
      headers: {
        authorization: `Bearer ${firstSignup.json().accessToken}`,
        "x-dfit-install-id": "install-user-a",
        "x-dfit-platform": "ios",
      },
    });
    expect(firstBootstrap.json().today.meals[0]).toMatchObject({
      id: firstMeal.json().id,
    });
    await app.close();
  });

  it("merges the current anonymous device profile when logging into an existing account", async () => {
    const app = await testApp();
    const signup = await app.inject({
      method: "POST",
      url: "/v1/auth/email/signup",
      headers: {
        "x-dfit-install-id": "install-existing-account",
        "x-dfit-platform": "ios",
      },
      payload: { email: "merge@example.com", password: "secret1" },
    });
    expect(signup.statusCode).toBe(201);

    const anonymousMeal = await app.inject({
      method: "POST",
      url: "/v1/meals",
      headers: {
        "x-dfit-install-id": "install-new-device",
        "x-dfit-platform": "ios",
        "idempotency-key": "anonymous-new-device-meal",
      },
      payload: mealPayload(new Date().toISOString()),
    });
    expect(anonymousMeal.statusCode).toBe(201);

    const login = await app.inject({
      method: "POST",
      url: "/v1/auth/email/login",
      headers: {
        "x-dfit-install-id": "install-new-device",
        "x-dfit-platform": "ios",
      },
      payload: { email: "merge@example.com", password: "secret1" },
    });
    expect(login.statusCode).toBe(200);

    const bootstrap = await app.inject({
      method: "GET",
      url: "/v1/app/bootstrap",
      headers: {
        authorization: `Bearer ${login.json().accessToken}`,
        "x-dfit-install-id": "install-new-device",
        "x-dfit-platform": "ios",
      },
    });

    expect(bootstrap.statusCode).toBe(200);
    expect(bootstrap.json().today.meals[0]).toMatchObject({
      id: anonymousMeal.json().id,
      title: "Dal rice",
    });
    await app.close();
  });

  it("returns to a fresh anonymous profile after logout on the same device", async () => {
    const app = await testApp();
    const signup = await app.inject({
      method: "POST",
      url: "/v1/auth/email/signup",
      headers: {
        "x-dfit-install-id": "install-logout",
        "x-dfit-platform": "ios",
      },
      payload: { email: "logout@example.com", password: "secret1" },
    });
    expect(signup.statusCode).toBe(201);

    const meal = await app.inject({
      method: "POST",
      url: "/v1/meals",
      headers: {
        authorization: `Bearer ${signup.json().accessToken}`,
        "x-dfit-install-id": "install-logout",
        "x-dfit-platform": "ios",
        "idempotency-key": "logout-account-meal",
      },
      payload: mealPayload(new Date().toISOString()),
    });
    expect(meal.statusCode).toBe(201);

    const logout = await app.inject({
      method: "POST",
      url: "/v1/auth/logout",
      headers: {
        authorization: `Bearer ${signup.json().accessToken}`,
        "x-dfit-install-id": "install-logout",
        "x-dfit-platform": "ios",
      },
    });
    expect(logout.statusCode).toBe(204);

    const anonymousBootstrap = await app.inject({
      method: "GET",
      url: "/v1/app/bootstrap",
      headers: {
        "x-dfit-install-id": "install-logout",
        "x-dfit-platform": "ios",
      },
    });
    expect(anonymousBootstrap.statusCode).toBe(200);
    expect(anonymousBootstrap.json().profile.authMethod).toBe("anonymous");
    expect(anonymousBootstrap.json().today.meals).toHaveLength(0);

    const login = await app.inject({
      method: "POST",
      url: "/v1/auth/email/login",
      headers: {
        "x-dfit-install-id": "install-logout",
        "x-dfit-platform": "ios",
      },
      payload: { email: "logout@example.com", password: "secret1" },
    });
    expect(login.statusCode).toBe(200);

    const accountBootstrap = await app.inject({
      method: "GET",
      url: "/v1/app/bootstrap",
      headers: {
        authorization: `Bearer ${login.json().accessToken}`,
        "x-dfit-install-id": "install-logout",
        "x-dfit-platform": "ios",
      },
    });
    expect(accountBootstrap.json().today.meals[0]).toMatchObject({
      id: meal.json().id,
    });
    await app.close();
  });

  it("passes optional plate hints into AI analysis", async () => {
    let seenInput: AnalyzeMealImageInput | undefined;
    const aiProvider: AiProvider = {
      async analyzeMealImage(input) {
        seenInput = input;
        const analysis = analyzeWithMockProvider(input.scanId);
        return {
          analysis,
          providerRun: {
            provider: "mock",
            model: "test-provider",
            promptVersion: "test",
            schemaVersion: "scan_v1",
          },
        };
      },
    };
    const repository = new InMemoryStore();
    const app = await buildApp({ repository, aiProvider });
    const prepared = await app.inject({
      method: "POST",
      url: "/v1/scans/prepare",
      headers: { "idempotency-key": "hint-prepare" },
    });
    const scanId = prepared.json().scanId as string;

    const analyzed = await app.inject({
      method: "POST",
      url: `/v1/scans/${scanId}/analyze`,
      headers: { "idempotency-key": "hint-analyze" },
      payload: {
        hint: "dal chawal roti",
        image: {
          mimeType: "image/jpeg",
          base64: "AQID",
          byteSize: 3,
        },
      },
    });

    expect(analyzed.statusCode).toBe(200);
    expect(seenInput).toMatchObject({
      scanId,
      userHint: "dal chawal roti",
      image: {
        mimeType: "image/jpeg",
        base64: "AQID",
        byteSize: 3,
      },
    });
    await expect(repository.getScan(scanId)).resolves.toMatchObject({
      userHint: "dal chawal roti",
      status: "ready_for_review",
    });
    await app.close();
  });

  it("rejects invalid scan image payloads", async () => {
    const app = await testApp();
    const prepared = await app.inject({
      method: "POST",
      url: "/v1/scans/prepare",
      headers: { "idempotency-key": "invalid-image-prepare" },
    });
    const scanId = prepared.json().scanId as string;

    const analyzed = await app.inject({
      method: "POST",
      url: `/v1/scans/${scanId}/analyze`,
      headers: { "idempotency-key": "invalid-image-analyze" },
      payload: {
        image: {
          mimeType: "image/gif",
          base64: "",
          byteSize: 0,
        },
      },
    });

    expect(analyzed.statusCode).toBe(400);
    expect(analyzed.json()).toMatchObject({ error: "invalid_scan_image" });
    await app.close();
  });
});
