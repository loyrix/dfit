import { describe, expect, it } from "vitest";
import { buildApp } from "./app.js";
import { currentRequestIdentity, type RequestIdentity } from "./request-context.js";
import { InMemoryStore } from "./repositories/in-memory-store.js";

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
