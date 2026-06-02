import { describe, expect, it } from "vitest";
import { defaultEngagementPolicyConfig, engagementPolicyConfigSchema } from "@logmyplate/contracts";
import { buildApp, type BuildAppOptions } from "./app.js";
import { currentRequestIdentity, type RequestIdentity } from "./request-context.js";
import { InMemoryStore } from "./repositories/in-memory-store.js";
import type { AdMobRewardedAdVerifier, AdMobRewardedSsvCallback } from "./services/admob-ssv.js";
import type { AiProvider, AnalyzeMealImageInput } from "./services/ai-provider.js";
import {
  globalFoodPhotoPromptKey,
  indiaFoodPhotoPromptKey,
} from "./services/food-photo-prompt-routing.js";
import { analyzeWithMockProvider } from "./services/mock-ai-provider.js";
import type {
  MealImageStorage,
  StoredObjectDeletionTarget,
  StoredMealImage,
  UploadMealImageInput,
  UploadScanImageInput,
} from "./services/meal-image-storage.js";
import { DisabledMealImageStorage as DisabledStorage } from "./services/meal-image-storage.js";
import {
  OAuthVerificationError,
  type OAuthIdentityVerifier,
  type OAuthVerificationInput,
  type VerifiedOAuthIdentity,
} from "./services/oauth-identity-verifier.js";
import type {
  PasswordResetEmailInput,
  PasswordResetEmailSender,
} from "./services/password-reset-email.js";
import type { MealImageSummary } from "@logmyplate/domain";

const testApp = (options: BuildAppOptions = {}) =>
  buildApp({
    repository: options.repository ?? new InMemoryStore(),
    mealImageStorage: options.mealImageStorage ?? new DisabledStorage(),
    ...options,
  });

class TestRewardedAdVerifier implements AdMobRewardedAdVerifier {
  async verifyCallbackUrl(rawUrl: string): Promise<AdMobRewardedSsvCallback> {
    const query = rawUrl.includes("?") ? rawUrl.slice(rawUrl.indexOf("?") + 1) : rawUrl;
    const rawQuery = Object.fromEntries(new URLSearchParams(query).entries());
    return {
      adNetwork: rawQuery.ad_network,
      adUnitId: rawQuery.ad_unit,
      customData: rawQuery.custom_data,
      keyId: rawQuery.key_id ?? "test-key",
      rewardAmount: rawQuery.reward_amount ? Number(rawQuery.reward_amount) : undefined,
      rewardType: rawQuery.reward_item,
      signature: rawQuery.signature ?? "test-signature",
      timestamp: rawQuery.timestamp,
      transactionId: rawQuery.transaction_id ?? "test-transaction",
      userId: rawQuery.user_id,
      rawQuery,
    };
  }
}

class TestMealImageStorage implements MealImageStorage {
  readonly enabled = true;
  readonly uploads: Array<UploadMealImageInput | UploadScanImageInput> = [];
  readonly deletes: StoredObjectDeletionTarget[] = [];

  async uploadMealImage(input: UploadMealImageInput): Promise<StoredMealImage> {
    this.uploads.push(input);
    return {
      bucket: "meal-images",
      objectKey: `profiles/${input.profileId}/meals/${input.mealId}/original.jpg`,
      mimeType: input.mimeType,
      byteSize: input.bytes.byteLength,
    };
  }

  async uploadScanImage(input: UploadScanImageInput): Promise<StoredMealImage> {
    this.uploads.push(input);
    return {
      bucket: "meal-images",
      objectKey: `profiles/${input.profileId}/scans/${input.scanId}/original.jpg`,
      mimeType: input.mimeType,
      byteSize: input.bytes.byteLength,
    };
  }

  async createSignedReadUrl(image: MealImageSummary): Promise<string> {
    return `https://images.test/${image.objectKey}`;
  }

  async deleteMealImage(image: MealImageSummary): Promise<void> {
    this.deletes.push(image);
  }

  async deleteStoredObject(target: StoredObjectDeletionTarget): Promise<void> {
    this.deletes.push(target);
  }
}

class TestOAuthVerifier implements OAuthIdentityVerifier {
  constructor(private readonly identities: Record<string, VerifiedOAuthIdentity>) {}

  async verify(input: OAuthVerificationInput): Promise<VerifiedOAuthIdentity> {
    const identity = this.identities[`${input.provider}:${input.idToken}`];
    if (!identity) {
      throw new OAuthVerificationError("invalid_oauth_token", "Invalid OAuth token.");
    }
    return identity;
  }
}

class TestPasswordResetEmailSender implements PasswordResetEmailSender {
  readonly deliveries: PasswordResetEmailInput[] = [];

  async sendPasswordResetCode(input: PasswordResetEmailInput): Promise<void> {
    this.deliveries.push(input);
  }
}

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

describe("LogMyPlate API", () => {
  it("serves health", async () => {
    const app = await testApp();
    const response = await app.inject({ method: "GET", url: "/health" });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ ok: true, service: "logmyplate-api" });
    await app.close();
  });

  it("serves interactive API documentation and the raw OpenAPI document", async () => {
    const app = await testApp();
    const docs = await app.inject({ method: "GET", url: "/docs" });
    const spec = await app.inject({ method: "GET", url: "/openapi.yaml" });

    expect(docs.statusCode).toBe(200);
    expect(docs.headers["content-type"]).toContain("text/html");
    expect(spec.statusCode).toBe(200);
    expect(spec.headers["content-type"]).toContain("application/yaml");
    expect(spec.body).toContain("title: LogMyPlate API");

    await app.close();
  });

  it("can disable interactive API documentation while serving the raw OpenAPI document", async () => {
    const previousApiDocsEnabled = process.env.API_DOCS_ENABLED;
    process.env.API_DOCS_ENABLED = "false";

    const app = await testApp();
    const docs = await app.inject({ method: "GET", url: "/docs" });
    const spec = await app.inject({ method: "GET", url: "/openapi.yaml" });

    expect(docs.statusCode).toBe(404);
    expect(spec.statusCode).toBe(200);
    expect(spec.headers["content-type"]).toContain("application/yaml");
    expect(spec.body).toContain("title: LogMyPlate API");

    if (previousApiDocsEnabled === undefined) {
      delete process.env.API_DOCS_ENABLED;
    } else {
      process.env.API_DOCS_ENABLED = previousApiDocsEnabled;
    }
    await app.close();
  });

  it("keeps the admin AI cost dashboard disabled until admin credentials are configured", async () => {
    const previousUsername = process.env.ADMIN_DASHBOARD_USERNAME;
    const previousPassword = process.env.ADMIN_DASHBOARD_PASSWORD;
    delete process.env.ADMIN_DASHBOARD_USERNAME;
    delete process.env.ADMIN_DASHBOARD_PASSWORD;

    const app = await testApp();
    const response = await app.inject({ method: "GET", url: "/admin/ai-cost" });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({ error: "admin_dashboard_disabled" });

    if (previousUsername === undefined) {
      delete process.env.ADMIN_DASHBOARD_USERNAME;
    } else {
      process.env.ADMIN_DASHBOARD_USERNAME = previousUsername;
    }
    if (previousPassword === undefined) {
      delete process.env.ADMIN_DASHBOARD_PASSWORD;
    } else {
      process.env.ADMIN_DASHBOARD_PASSWORD = previousPassword;
    }
    await app.close();
  });

  it("requires admin authorization for the AI cost dashboard", async () => {
    const previousUsername = process.env.ADMIN_DASHBOARD_USERNAME;
    const previousPassword = process.env.ADMIN_DASHBOARD_PASSWORD;
    process.env.ADMIN_DASHBOARD_USERNAME = "test-admin";
    process.env.ADMIN_DASHBOARD_PASSWORD = "test-admin-password";

    const app = await testApp();
    const blocked = await app.inject({ method: "GET", url: "/admin/ai-cost" });
    const allowed = await app.inject({
      method: "GET",
      url: "/admin/ai-cost",
      headers: {
        authorization: `Basic ${Buffer.from("test-admin:test-admin-password").toString("base64")}`,
      },
    });

    expect(blocked.statusCode).toBe(401);
    expect(blocked.headers["www-authenticate"]).toContain("LogMyPlate Admin");
    expect(allowed.statusCode).toBe(200);
    expect(allowed.headers["content-type"]).toContain("text/html");
    expect(allowed.body).toContain("AI Cost Dashboard");

    if (previousUsername === undefined) {
      delete process.env.ADMIN_DASHBOARD_USERNAME;
    } else {
      process.env.ADMIN_DASHBOARD_USERNAME = previousUsername;
    }
    if (previousPassword === undefined) {
      delete process.env.ADMIN_DASHBOARD_PASSWORD;
    } else {
      process.env.ADMIN_DASHBOARD_PASSWORD = previousPassword;
    }
    await app.close();
  });

  it("requires database access for admin AI cost data", async () => {
    const previousUsername = process.env.ADMIN_DASHBOARD_USERNAME;
    const previousPassword = process.env.ADMIN_DASHBOARD_PASSWORD;
    process.env.ADMIN_DASHBOARD_USERNAME = "test-admin";
    process.env.ADMIN_DASHBOARD_PASSWORD = "test-admin-password";

    const app = await testApp();
    const response = await app.inject({
      method: "GET",
      url: "/admin/ai-cost/data",
      headers: {
        authorization: `Basic ${Buffer.from("test-admin:test-admin-password").toString("base64")}`,
      },
    });

    expect(response.statusCode).toBe(503);
    expect(response.json()).toMatchObject({ error: "database_unavailable" });

    if (previousUsername === undefined) {
      delete process.env.ADMIN_DASHBOARD_USERNAME;
    } else {
      process.env.ADMIN_DASHBOARD_USERNAME = previousUsername;
    }
    if (previousPassword === undefined) {
      delete process.env.ADMIN_DASHBOARD_PASSWORD;
    } else {
      process.env.ADMIN_DASHBOARD_PASSWORD = previousPassword;
    }
    await app.close();
  });

  it("keeps engagement policy admin endpoints database-backed", async () => {
    const previousUsername = process.env.ADMIN_DASHBOARD_USERNAME;
    const previousPassword = process.env.ADMIN_DASHBOARD_PASSWORD;
    process.env.ADMIN_DASHBOARD_USERNAME = "test-admin";
    process.env.ADMIN_DASHBOARD_PASSWORD = "test-admin-password";

    const app = await testApp();
    const response = await app.inject({
      method: "GET",
      url: "/admin/engagement-policy",
      headers: {
        authorization: `Basic ${Buffer.from("test-admin:test-admin-password").toString("base64")}`,
      },
    });

    expect(response.statusCode).toBe(503);
    expect(response.json()).toMatchObject({ error: "database_unavailable" });

    if (previousUsername === undefined) {
      delete process.env.ADMIN_DASHBOARD_USERNAME;
    } else {
      process.env.ADMIN_DASHBOARD_USERNAME = previousUsername;
    }
    if (previousPassword === undefined) {
      delete process.env.ADMIN_DASHBOARD_PASSWORD;
    } else {
      process.env.ADMIN_DASHBOARD_PASSWORD = previousPassword;
    }
    await app.close();
  });

  it("normalizes engagement policy defaults and rejects unsafe values", () => {
    const defaults = defaultEngagementPolicyConfig();

    expect(defaults.reviewPrompt.enabled).toBe(false);
    expect(defaults.interstitialAds.enabled).toBe(false);
    expect(defaults.notifications.enabled).toBe(false);
    expect(defaults.streaks.enabled).toBe(false);
    expect(defaults.streaks.scanRewards.enabled).toBe(false);
    expect(
      engagementPolicyConfigSchema.safeParse({
        reviewPrompt: { cooldownDays: 0 },
      }).success,
    ).toBe(false);
    expect(
      engagementPolicyConfigSchema.safeParse({
        interstitialAds: { scansBetweenAds: 0 },
      }).success,
    ).toBe(false);
  });

  it("serves launch feature configuration", async () => {
    const app = await testApp();
    const response = await app.inject({ method: "GET", url: "/v1/config" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      appName: "LogMyPlate",
      scanLimits: {
        freeLifetime: 3,
        rewardedCap: 5,
        launchTotalCap: 8,
        rewardedAdsPerScan: 1,
        rewardedPeriod: "day",
      },
      features: {
        accountLink: true,
        premium: false,
      },
    });
    expect(response.json().features.imageStorage).toBe(!response.json().features.noImageStorage);
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

  it("does not return empty journal weeks", async () => {
    const app = await testApp();
    const response = await app.inject({ method: "GET", url: "/v1/journal/weeks" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ weeks: [] });
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
        "x-logmyplate-install-id": "install-test",
        "x-logmyplate-app-platform": "ios",
        "x-logmyplate-app-version": "1.0.0",
        "x-logmyplate-app-build": "7",
        "x-logmyplate-locale": "en-IN",
      },
    });

    expect(response.statusCode).toBe(200);
    expect(seenIdentity).toMatchObject({
      installId: "install-test",
      platform: "ios",
      appVersion: "1.0.0",
      appBuild: 7,
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
        hint: "dal rice roti sabzi",
        image: {
          mimeType: "image/jpeg",
          base64: "AQID",
          byteSize: 3,
        },
      },
    });
    expect(analyzed.statusCode).toBe(200);
    expect(analyzed.json()).toMatchObject({
      status: "ready_for_review",
      mealType: "lunch",
      imageStored: false,
    });

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

  it("reuses exact scan analysis for the same profile image", async () => {
    let calls = 0;
    const aiProvider: AiProvider = {
      async analyzeMealImage(input) {
        calls += 1;
        return {
          analysis: analyzeWithMockProvider(input.scanId),
          providerRun: {
            provider: "mock",
            model: "test-cache-provider",
            promptVersion: "test",
            schemaVersion: "scan_v1",
          },
        };
      },
    };
    const app = await buildApp({
      repository: new InMemoryStore(),
      aiProvider,
      mealImageStorage: new DisabledStorage(),
    });
    const image = {
      mimeType: "image/jpeg" as const,
      base64: "AQID",
      byteSize: 3,
    };
    const analyze = async (key: string) => {
      const prepared = await app.inject({
        method: "POST",
        url: "/v1/scans/prepare",
        headers: { "idempotency-key": `cache-prepare-${key}` },
      });
      const scanId = prepared.json().scanId as string;
      const analyzed = await app.inject({
        method: "POST",
        url: `/v1/scans/${scanId}/analyze`,
        headers: { "idempotency-key": `cache-analyze-${key}` },
        payload: {
          hint: "dal rice",
          image,
        },
      });
      return { scanId, analyzed };
    };

    const first = await analyze("first");
    const quotaAfterFirst = await app.inject({ method: "GET", url: "/v1/quota" });
    const second = await analyze("second");
    const quotaAfterSecond = await app.inject({ method: "GET", url: "/v1/quota" });

    expect(first.analyzed.statusCode).toBe(200);
    expect(second.analyzed.statusCode).toBe(200);
    expect(calls).toBe(1);
    expect(second.analyzed.json()).toMatchObject({
      scanId: second.scanId,
      mealName: first.analyzed.json().mealName,
      imageStored: false,
    });
    expect(second.analyzed.json().scanId).not.toBe(first.scanId);
    expect(quotaAfterSecond.json()).toEqual(quotaAfterFirst.json());
    await app.close();
  });

  it("reuses exact scan analysis even when the plate note changes", async () => {
    let calls = 0;
    const aiProvider: AiProvider = {
      async analyzeMealImage(input) {
        calls += 1;
        return {
          analysis: analyzeWithMockProvider(input.scanId),
          providerRun: {
            provider: "mock",
            model: "test-cache-provider",
            promptVersion: "test",
            schemaVersion: "scan_v1",
          },
        };
      },
    };
    const app = await buildApp({
      repository: new InMemoryStore(),
      aiProvider,
      mealImageStorage: new DisabledStorage(),
    });
    const image = {
      mimeType: "image/jpeg" as const,
      base64: "AQID",
      byteSize: 3,
    };
    const analyze = async (key: string, hint: string) => {
      const prepared = await app.inject({
        method: "POST",
        url: "/v1/scans/prepare",
        headers: { "idempotency-key": `note-cache-prepare-${key}` },
      });
      return app.inject({
        method: "POST",
        url: `/v1/scans/${prepared.json().scanId}/analyze`,
        headers: { "idempotency-key": `note-cache-analyze-${key}` },
        payload: {
          hint,
          image,
        },
      });
    };

    expect((await analyze("first", "dal rice")).statusCode).toBe(200);
    expect((await analyze("second", "dal rice with solkadhi")).statusCode).toBe(200);
    expect(calls).toBe(1);
    await app.close();
  });

  it("updates exact scan analysis cache from reviewed confirmation", async () => {
    let calls = 0;
    const aiProvider: AiProvider = {
      async analyzeMealImage(input) {
        calls += 1;
        return {
          analysis: analyzeWithMockProvider(input.scanId),
          providerRun: {
            provider: "mock",
            model: "test-cache-provider",
            promptVersion: "test",
            schemaVersion: "scan_v1",
          },
        };
      },
    };
    const app = await buildApp({
      repository: new InMemoryStore(),
      aiProvider,
      mealImageStorage: new DisabledStorage(),
    });
    const image = {
      mimeType: "image/jpeg" as const,
      base64: "AQID",
      byteSize: 3,
    };
    const analyze = async (key: string) => {
      const prepared = await app.inject({
        method: "POST",
        url: "/v1/scans/prepare",
        headers: { "idempotency-key": `review-cache-prepare-${key}` },
      });
      const scanId = prepared.json().scanId as string;
      const analyzed = await app.inject({
        method: "POST",
        url: `/v1/scans/${scanId}/analyze`,
        headers: { "idempotency-key": `review-cache-analyze-${key}` },
        payload: {
          hint: "dal rice",
          image,
        },
      });
      return { scanId, analyzed };
    };
    const confirm = async (
      key: string,
      scanId: string,
      analysis: {
        mealType: string;
        mealName: string;
        items: Array<{
          name: string;
          quantity: number;
          unit: string;
          estimatedGrams: number;
          nutrition: unknown;
        }>;
      },
      title = analysis.mealName,
    ) =>
      app.inject({
        method: "POST",
        url: `/v1/scans/${scanId}/confirm`,
        headers: { "idempotency-key": `review-cache-confirm-${key}` },
        payload: {
          mealType: analysis.mealType,
          title,
          items: analysis.items.map((item, index) => ({
            name: index === 0 && key === "edited" ? "Solkadhi" : item.name,
            quantity: item.quantity,
            unit: item.unit,
            estimatedGrams: item.estimatedGrams,
            nutrition: item.nutrition,
          })),
        },
      });

    const first = await analyze("first");
    expect(first.analyzed.statusCode).toBe(200);
    expect(await confirm("first", first.scanId, first.analyzed.json())).toMatchObject({
      statusCode: 201,
    });

    const second = await analyze("second");
    expect(second.analyzed.statusCode).toBe(200);
    const edited = await confirm(
      "edited",
      second.scanId,
      second.analyzed.json(),
      "Chicken thali with solkadhi",
    );
    expect(edited.statusCode).toBe(201);

    const third = await analyze("third");
    const thirdAnalysis = third.analyzed.json();

    expect(third.analyzed.statusCode).toBe(200);
    expect(calls).toBe(1);
    expect(thirdAnalysis).toMatchObject({
      mealName: "Chicken thali with solkadhi",
    });
    expect(thirdAnalysis.items[0]).toMatchObject({ name: "Solkadhi", confidence: 1 });
    await app.close();
  });

  it("does not reuse scan analysis across profiles", async () => {
    let calls = 0;
    const aiProvider: AiProvider = {
      async analyzeMealImage(input) {
        calls += 1;
        return {
          analysis: analyzeWithMockProvider(input.scanId),
          providerRun: {
            provider: "mock",
            model: "test-cache-provider",
            promptVersion: "test",
            schemaVersion: "scan_v1",
          },
        };
      },
    };
    const app = await buildApp({
      repository: new InMemoryStore(),
      aiProvider,
      mealImageStorage: new DisabledStorage(),
    });
    const image = {
      mimeType: "image/jpeg" as const,
      base64: "AQID",
      byteSize: 3,
    };
    const analyze = async (installId: string, key: string) => {
      const identityHeaders = {
        "x-logmyplate-install-id": installId,
        "x-logmyplate-platform": "ios",
      };
      const prepared = await app.inject({
        method: "POST",
        url: "/v1/scans/prepare",
        headers: { ...identityHeaders, "idempotency-key": `profile-cache-prepare-${key}` },
      });
      return app.inject({
        method: "POST",
        url: `/v1/scans/${prepared.json().scanId}/analyze`,
        headers: { ...identityHeaders, "idempotency-key": `profile-cache-analyze-${key}` },
        payload: {
          hint: "dal rice",
          image,
        },
      });
    };

    expect((await analyze("install-cache-one", "first")).statusCode).toBe(200);
    expect((await analyze("install-cache-two", "second")).statusCode).toBe(200);
    expect(calls).toBe(2);
    await app.close();
  });

  it("stores a confirmed scan image and returns a signed image URL", async () => {
    const mealImageStorage = new TestMealImageStorage();
    const app = await buildApp({
      repository: new InMemoryStore(),
      mealImageStorage,
    });
    const prepared = await app.inject({
      method: "POST",
      url: "/v1/scans/prepare",
      headers: { "idempotency-key": "image-prepare" },
    });
    const scanId = prepared.json().scanId as string;

    const analyzed = await app.inject({
      method: "POST",
      url: `/v1/scans/${scanId}/analyze`,
      headers: { "idempotency-key": "image-analyze" },
      payload: {
        hint: "dal rice",
        image: {
          mimeType: "image/jpeg",
          base64: "AQID",
          byteSize: 3,
        },
      },
    });
    expect(analyzed.statusCode).toBe(200);
    expect(analyzed.json()).toMatchObject({ imageStored: true });

    const analysis = analyzed.json();
    const confirmed = await app.inject({
      method: "POST",
      url: `/v1/scans/${scanId}/confirm`,
      headers: { "idempotency-key": "image-confirm" },
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
    expect(mealImageStorage.uploads).toHaveLength(1);
    expect("scanId" in mealImageStorage.uploads[0]).toBe(true);
    expect(confirmed.json().meal.image).toMatchObject({
      url: expect.stringContaining("https://images.test/profiles/"),
      mimeType: "image/jpeg",
      byteSize: 3,
    });

    const today = await app.inject({ method: "GET", url: "/v1/journal/today" });
    expect(today.json().meals[0].image.url).toContain("https://images.test/profiles/");
    await app.close();
  });

  it("deletes meals with their stored image and unlinks linked scan history", async () => {
    const repository = new InMemoryStore();
    const mealImageStorage = new TestMealImageStorage();
    const app = await buildApp({ repository, mealImageStorage });
    const prepared = await app.inject({
      method: "POST",
      url: "/v1/scans/prepare",
      headers: { "idempotency-key": "delete-prepare" },
    });
    const scanId = prepared.json().scanId as string;

    const analyzed = await app.inject({
      method: "POST",
      url: `/v1/scans/${scanId}/analyze`,
      headers: { "idempotency-key": "delete-analyze" },
      payload: {
        hint: "dal rice",
        image: {
          mimeType: "image/jpeg",
          base64: "AQID",
          byteSize: 3,
        },
      },
    });
    const analysis = analyzed.json();
    const confirmed = await app.inject({
      method: "POST",
      url: `/v1/scans/${scanId}/confirm`,
      headers: { "idempotency-key": "delete-confirm" },
      payload: {
        mealType: analysis.mealType,
        title: analysis.mealName,
        image: {
          mimeType: "image/jpeg",
          base64: "AQID",
          byteSize: 3,
        },
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
    const mealId = confirmed.json().mealId as string;

    const deleted = await app.inject({
      method: "DELETE",
      url: `/v1/meals/${mealId}`,
      headers: { "idempotency-key": "delete-meal" },
    });
    expect(deleted.statusCode).toBe(204);

    const replayedDelete = await app.inject({
      method: "DELETE",
      url: `/v1/meals/${mealId}`,
      headers: { "idempotency-key": "delete-meal" },
    });
    expect(replayedDelete.statusCode).toBe(204);

    expect(mealImageStorage.deletes).toHaveLength(1);
    expect(await repository.getScan(scanId)).toBeUndefined();

    const today = await app.inject({ method: "GET", url: "/v1/journal/today" });
    expect(today.json().meals).toEqual([]);
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
    expect(range.json().summary.trackedDayAverage.calories).toBe(180);
    expect(range.json().summary.calendarDayAverage.calories).toBe(51);

    const weeks = await app.inject({
      method: "GET",
      url: "/v1/journal/weeks",
    });
    expect(weeks.statusCode).toBe(200);
    expect(weeks.json().weeks[0]).toMatchObject({
      weekOffset: 0,
      activeDays: 2,
    });
    await app.close();
  });

  it("updates an existing meal with previewed portion changes", async () => {
    const app = await testApp();
    const created = await app.inject({
      method: "POST",
      url: "/v1/meals",
      headers: { "idempotency-key": "preview-create" },
      payload: mealPayload(new Date().toISOString()),
    });
    expect(created.statusCode).toBe(201);

    const mealId = created.json().id as string;
    const updated = await app.inject({
      method: "PATCH",
      url: `/v1/meals/${mealId}`,
      headers: { "idempotency-key": "preview-update" },
      payload: {
        mealType: "lunch",
        title: "Dal rice",
        items: [
          {
            foodId: "food_dal",
            displayName: "Dal",
            quantity: 2,
            unit: "katori",
            grams: 360,
            nutrition: {
              calories: 360,
              proteinG: 21.6,
              carbsG: 50.4,
              fatG: 10.8,
            },
          },
        ],
      },
    });

    expect(updated.statusCode).toBe(200);
    expect(updated.json()).toMatchObject({
      id: mealId,
      totals: {
        calories: 360,
        proteinG: 21.6,
        carbsG: 50.4,
        fatG: 10.8,
      },
      items: [
        {
          displayName: "Dal",
          foodId: "food_dal",
          quantity: 2,
          grams: 360,
          nutrition: {
            calories: 360,
          },
        },
      ],
    });

    const reloaded = await app.inject({
      method: "GET",
      url: `/v1/meals/${mealId}`,
    });
    expect(reloaded.statusCode).toBe(200);
    expect(reloaded.json()).toMatchObject({
      id: mealId,
      totals: { calories: 360 },
    });
    await app.close();
  });

  it("treats unknown meal item food IDs as custom foods on update", async () => {
    const app = await testApp();
    const created = await app.inject({
      method: "POST",
      url: "/v1/meals",
      headers: { "idempotency-key": "custom-create" },
      payload: mealPayload(new Date().toISOString()),
    });
    expect(created.statusCode).toBe(201);

    const mealId = created.json().id as string;
    expect(created.json().items[0]).not.toHaveProperty("foodId");

    const updated = await app.inject({
      method: "PATCH",
      url: `/v1/meals/${mealId}`,
      headers: { "idempotency-key": "custom-update" },
      payload: {
        mealType: "lunch",
        title: "Custom dal rice",
        items: [
          {
            foodId: "4b6c1d6b-cf07-4a7d-9cca-bc870e083d64",
            displayName: "Custom dal",
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
      },
    });

    expect(updated.statusCode).toBe(200);
    expect(updated.json().items[0]).toMatchObject({
      displayName: "Custom dal",
      quantity: 1,
      grams: 180,
    });
    expect(updated.json().items[0]).not.toHaveProperty("foodId");

    await app.close();
  });

  it("returns bootstrap data for the first app paint", async () => {
    const app = await testApp();
    const created = await app.inject({
      method: "POST",
      url: "/v1/meals",
      headers: {
        "x-logmyplate-install-id": "bootstrap-install",
        "x-logmyplate-platform": "ios",
        "idempotency-key": "bootstrap-meal",
      },
      payload: mealPayload(new Date().toISOString()),
    });
    expect(created.statusCode).toBe(201);

    const bootstrap = await app.inject({
      method: "GET",
      url: "/v1/app/bootstrap",
      headers: {
        "x-logmyplate-install-id": "bootstrap-install",
        "x-logmyplate-platform": "ios",
      },
    });

    expect(bootstrap.statusCode).toBe(200);
    expect(bootstrap.json()).toMatchObject({
      profile: { authMethod: "anonymous" },
      quota: {
        freeRemaining: 3,
        rewardedRemaining: 0,
        premiumRemaining: 0,
      },
      today: { totals: { calories: 180 } },
      engagementPolicy: {
        reviewPrompt: { enabled: false },
        interstitialAds: { enabled: false },
        notifications: { enabled: false },
        streaks: {
          enabled: false,
          scanRewards: { enabled: false },
        },
      },
      weeklySummary: {
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
    expect(bootstrap.json().weeklyRange).toBeUndefined();
    expect(bootstrap.json().weeklySummary.days).toBeUndefined();
    await app.close();
  });

  it("requires an account before saving BMI based daily targets", async () => {
    const app = await testApp();
    const response = await app.inject({
      method: "PUT",
      url: "/v1/profiles/me/health",
      headers: {
        "x-logmyplate-install-id": "anonymous-health-target",
        "x-logmyplate-platform": "ios",
        "idempotency-key": "anonymous-health-target-save",
      },
      payload: {
        heightCm: 170,
        weightKg: 70,
        ageYears: 28,
        sex: "male",
        activityLevel: "light",
        goal: "maintain",
      },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({ error: "account_required" });
    await app.close();
  });

  it("requires an account before deactivating or deleting a profile", async () => {
    const app = await testApp();

    const deactivated = await app.inject({
      method: "POST",
      url: "/v1/profiles/me/deactivate",
      headers: {
        "x-logmyplate-install-id": "anonymous-profile-lifecycle",
        "x-logmyplate-platform": "ios",
      },
    });
    const deleted = await app.inject({
      method: "DELETE",
      url: "/v1/profiles/me",
      headers: {
        "x-logmyplate-install-id": "anonymous-profile-lifecycle",
        "x-logmyplate-platform": "ios",
      },
    });

    expect(deactivated.statusCode).toBe(401);
    expect(deactivated.json()).toMatchObject({ error: "account_required" });
    expect(deleted.statusCode).toBe(401);
    expect(deleted.json()).toMatchObject({ error: "account_required" });
    await app.close();
  });

  it("deactivates a profile, revokes sessions, and blocks future login", async () => {
    const app = await testApp();
    const installHeaders = {
      "x-logmyplate-install-id": "deactivate-profile-install",
      "x-logmyplate-platform": "ios",
    };
    const signup = await app.inject({
      method: "POST",
      url: "/v1/auth/email/signup",
      headers: installHeaders,
      payload: { email: "deactivate@example.com", password: "secret1" },
    });
    expect(signup.statusCode).toBe(201);

    const deactivated = await app.inject({
      method: "POST",
      url: "/v1/profiles/me/deactivate",
      headers: {
        ...installHeaders,
        authorization: `Bearer ${signup.json().accessToken}`,
      },
    });
    expect(deactivated.statusCode).toBe(204);

    const bootstrap = await app.inject({
      method: "GET",
      url: "/v1/app/bootstrap",
      headers: {
        ...installHeaders,
        authorization: `Bearer ${signup.json().accessToken}`,
      },
    });
    expect(bootstrap.statusCode).toBe(200);
    expect(bootstrap.json().profile.authMethod).toBe("anonymous");

    const login = await app.inject({
      method: "POST",
      url: "/v1/auth/email/login",
      headers: installHeaders,
      payload: { email: "deactivate@example.com", password: "secret1" },
    });
    expect(login.statusCode).toBe(403);
    expect(login.json()).toMatchObject({ error: "account_deactivated" });
    await app.close();
  });

  it("deletes profile data and stored profile images end to end", async () => {
    const repository = new InMemoryStore();
    const mealImageStorage = new TestMealImageStorage();
    const app = await buildApp({ repository, mealImageStorage });
    const installHeaders = {
      "x-logmyplate-install-id": "delete-profile-install",
      "x-logmyplate-platform": "ios",
    };
    const signup = await app.inject({
      method: "POST",
      url: "/v1/auth/email/signup",
      headers: installHeaders,
      payload: { email: "delete-profile@example.com", password: "secret1" },
    });
    expect(signup.statusCode).toBe(201);
    const accountHeaders = {
      ...installHeaders,
      authorization: `Bearer ${signup.json().accessToken}`,
    };

    const prepared = await app.inject({
      method: "POST",
      url: "/v1/scans/prepare",
      headers: { ...accountHeaders, "idempotency-key": "profile-delete-prepare" },
    });
    const scanId = prepared.json().scanId as string;
    const analyzed = await app.inject({
      method: "POST",
      url: `/v1/scans/${scanId}/analyze`,
      headers: { ...accountHeaders, "idempotency-key": "profile-delete-analyze" },
      payload: {
        hint: "dal rice",
        image: {
          mimeType: "image/jpeg",
          base64: "AQID",
          byteSize: 3,
        },
      },
    });
    expect(analyzed.statusCode).toBe(200);
    expect(analyzed.json().imageStored).toBe(true);

    const analysis = analyzed.json();
    const confirmed = await app.inject({
      method: "POST",
      url: `/v1/scans/${scanId}/confirm`,
      headers: { ...accountHeaders, "idempotency-key": "profile-delete-confirm" },
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

    const deleted = await app.inject({
      method: "DELETE",
      url: "/v1/profiles/me",
      headers: accountHeaders,
    });
    expect(deleted.statusCode).toBe(204);
    expect(mealImageStorage.deletes).toHaveLength(1);
    expect(mealImageStorage.deletes[0].objectKey).toContain(`/scans/${scanId}/`);

    const bootstrap = await app.inject({
      method: "GET",
      url: "/v1/app/bootstrap",
      headers: accountHeaders,
    });
    expect(bootstrap.statusCode).toBe(200);
    expect(bootstrap.json().profile.authMethod).toBe("anonymous");
    expect(bootstrap.json().today.meals).toEqual([]);

    const login = await app.inject({
      method: "POST",
      url: "/v1/auth/email/login",
      headers: installHeaders,
      payload: { email: "delete-profile@example.com", password: "secret1" },
    });
    expect(login.statusCode).toBe(404);
    expect(login.json()).toMatchObject({
      error: "account_not_found",
      message: "User does not exist.",
    });

    const recreated = await app.inject({
      method: "POST",
      url: "/v1/auth/email/signup",
      headers: installHeaders,
      payload: { email: "delete-profile@example.com", password: "secret1" },
    });
    expect(recreated.statusCode).toBe(201);
    expect(recreated.json().profile).toMatchObject({
      authMethod: "email",
      email: "delete-profile@example.com",
    });
    await app.close();
  });

  it("saves health targets and exposes daily calorie targets in bootstrap", async () => {
    const app = await testApp();
    const installHeaders = {
      "x-logmyplate-install-id": "health-target-account",
      "x-logmyplate-platform": "ios",
    };
    const signup = await app.inject({
      method: "POST",
      url: "/v1/auth/email/signup",
      headers: installHeaders,
      payload: { email: "health@example.com", password: "secret1" },
    });
    expect(signup.statusCode).toBe(201);

    const accountHeaders = {
      ...installHeaders,
      authorization: `Bearer ${signup.json().accessToken}`,
    };
    const saved = await app.inject({
      method: "PUT",
      url: "/v1/profiles/me/health",
      headers: {
        ...accountHeaders,
        "idempotency-key": "account-health-target-save",
      },
      payload: {
        heightCm: 170,
        weightKg: 70,
        ageYears: 28,
        sex: "male",
        activityLevel: "light",
        goal: "maintain",
      },
    });

    expect(saved.statusCode).toBe(200);
    expect(saved.json().healthTarget).toMatchObject({
      heightCm: 170,
      weightKg: 70,
      ageYears: 28,
      bmi: 24.2,
      bmiCategory: "healthy",
      bmrCalories: 1628,
      dailyCalorieTarget: 2238,
    });

    const bootstrap = await app.inject({
      method: "GET",
      url: "/v1/app/bootstrap",
      headers: accountHeaders,
    });

    expect(bootstrap.statusCode).toBe(200);
    expect(bootstrap.json().healthTarget).toMatchObject({
      dailyCalorieTarget: 2238,
    });
    expect(bootstrap.json().today.target).toMatchObject({
      calories: 2238,
    });
    expect(bootstrap.json().weeklySummary.target).toMatchObject({
      calories: 2238,
    });
    await app.close();
  });

  it("binds anonymous journal data when an email account is created", async () => {
    const app = await testApp();
    const installHeaders = {
      "x-logmyplate-install-id": "install-account-create",
      "x-logmyplate-platform": "ios",
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
        "x-logmyplate-install-id": "install-account-create",
        "x-logmyplate-platform": "ios",
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

  it("resets an email password with a delivered code without revealing missing accounts", async () => {
    const passwordResetEmailSender = new TestPasswordResetEmailSender();
    const app = await testApp({ passwordResetEmailSender });

    const missing = await app.inject({
      method: "POST",
      url: "/v1/auth/email/password-reset/request",
      payload: { email: "missing@example.com" },
    });
    expect(missing.statusCode).toBe(202);
    expect(missing.json()).toMatchObject({ status: "accepted" });
    expect(passwordResetEmailSender.deliveries).toHaveLength(0);

    const signup = await app.inject({
      method: "POST",
      url: "/v1/auth/email/signup",
      payload: { email: "reset@example.com", password: "oldpass1" },
    });
    expect(signup.statusCode).toBe(201);

    const request = await app.inject({
      method: "POST",
      url: "/v1/auth/email/password-reset/request",
      payload: { email: "reset@example.com" },
    });
    expect(request.statusCode).toBe(202);
    expect(passwordResetEmailSender.deliveries).toHaveLength(1);
    expect(passwordResetEmailSender.deliveries[0]).toMatchObject({
      email: "reset@example.com",
    });
    expect(passwordResetEmailSender.deliveries[0].code).toMatch(/^\d{6}$/);

    const rejected = await app.inject({
      method: "POST",
      url: "/v1/auth/email/password-reset/confirm",
      payload: {
        email: "reset@example.com",
        code: "000000",
        password: "newpass1",
      },
    });
    expect(rejected.statusCode).toBe(400);
    expect(rejected.json()).toMatchObject({ error: "invalid_password_reset_code" });

    const confirmed = await app.inject({
      method: "POST",
      url: "/v1/auth/email/password-reset/confirm",
      payload: {
        email: "reset@example.com",
        code: passwordResetEmailSender.deliveries[0].code,
        password: "newpass1",
      },
    });
    expect(confirmed.statusCode).toBe(200);
    expect(confirmed.json().profile).toMatchObject({
      authMethod: "email",
      email: "reset@example.com",
    });

    const oldLogin = await app.inject({
      method: "POST",
      url: "/v1/auth/email/login",
      payload: { email: "reset@example.com", password: "oldpass1" },
    });
    expect(oldLogin.statusCode).toBe(401);

    const newLogin = await app.inject({
      method: "POST",
      url: "/v1/auth/email/login",
      payload: { email: "reset@example.com", password: "newpass1" },
    });
    expect(newLogin.statusCode).toBe(200);
    await app.close();
  });

  it("lets an OAuth account with email set an email password through reset", async () => {
    const passwordResetEmailSender = new TestPasswordResetEmailSender();
    const app = await testApp({
      passwordResetEmailSender,
      oauthVerifier: new TestOAuthVerifier({
        "google:google-token-password-reset": {
          provider: "google",
          providerSubject: "google-password-reset-sub",
          email: "oauth-reset@example.com",
          emailVerified: true,
          displayName: "OAuth Reset",
        },
      }),
    });

    const signIn = await app.inject({
      method: "POST",
      url: "/v1/auth/oauth",
      payload: { provider: "google", idToken: "google-token-password-reset" },
    });
    expect(signIn.statusCode).toBe(200);
    expect(signIn.json().profile).toMatchObject({
      authMethod: "google",
      email: "oauth-reset@example.com",
    });

    const request = await app.inject({
      method: "POST",
      url: "/v1/auth/email/password-reset/request",
      payload: { email: "oauth-reset@example.com" },
    });
    expect(request.statusCode).toBe(202);
    expect(passwordResetEmailSender.deliveries).toHaveLength(1);

    const confirmed = await app.inject({
      method: "POST",
      url: "/v1/auth/email/password-reset/confirm",
      payload: {
        email: "oauth-reset@example.com",
        code: passwordResetEmailSender.deliveries[0].code,
        password: "secret2",
      },
    });
    expect(confirmed.statusCode).toBe(200);
    expect(confirmed.json().profile).toMatchObject({
      authMethod: "email",
      email: "oauth-reset@example.com",
    });

    const emailLogin = await app.inject({
      method: "POST",
      url: "/v1/auth/email/login",
      payload: { email: "oauth-reset@example.com", password: "secret2" },
    });
    expect(emailLogin.statusCode).toBe(200);
    await app.close();
  });

  it("binds anonymous journal data when a Google account is created", async () => {
    const app = await testApp({
      oauthVerifier: new TestOAuthVerifier({
        "google:google-token-one-for-tests": {
          provider: "google",
          providerSubject: "google-sub-one",
          email: "google-user@example.com",
          emailVerified: true,
          displayName: "Google User",
        },
      }),
    });
    const installHeaders = {
      "x-logmyplate-install-id": "install-google-create",
      "x-logmyplate-platform": "android",
    };

    const meal = await app.inject({
      method: "POST",
      url: "/v1/meals",
      headers: { ...installHeaders, "idempotency-key": "anonymous-meal-before-google" },
      payload: mealPayload(new Date().toISOString()),
    });
    expect(meal.statusCode).toBe(201);

    const signIn = await app.inject({
      method: "POST",
      url: "/v1/auth/oauth",
      headers: installHeaders,
      payload: { provider: "google", idToken: "google-token-one-for-tests" },
    });
    expect(signIn.statusCode).toBe(200);
    expect(signIn.json().profile).toMatchObject({
      authMethod: "google",
      email: "google-user@example.com",
    });

    const bootstrap = await app.inject({
      method: "GET",
      url: "/v1/app/bootstrap",
      headers: {
        ...installHeaders,
        authorization: `Bearer ${signIn.json().accessToken}`,
      },
    });
    expect(bootstrap.statusCode).toBe(200);
    expect(bootstrap.json().today.meals[0]).toMatchObject({
      id: meal.json().id,
      title: "Dal rice",
    });
    await app.close();
  });

  it("returns the same profile on repeated OAuth login and merges the current anonymous device", async () => {
    const app = await testApp({
      oauthVerifier: new TestOAuthVerifier({
        "apple:apple-token-one-for-tests": {
          provider: "apple",
          providerSubject: "apple-sub-one",
          email: "apple-user@example.com",
          emailVerified: true,
          displayName: "Apple User",
        },
      }),
    });
    const firstSignIn = await app.inject({
      method: "POST",
      url: "/v1/auth/oauth",
      headers: {
        "x-logmyplate-install-id": "install-apple-first",
        "x-logmyplate-platform": "ios",
      },
      payload: {
        provider: "apple",
        idToken: "apple-token-one-for-tests",
        authorizationCode: "apple-code-one",
        nonce: "apple-nonce-one",
      },
    });
    expect(firstSignIn.statusCode).toBe(200);
    const profileId = firstSignIn.json().profile.id;

    const anonymousMeal = await app.inject({
      method: "POST",
      url: "/v1/meals",
      headers: {
        "x-logmyplate-install-id": "install-apple-second",
        "x-logmyplate-platform": "ios",
        "idempotency-key": "anonymous-meal-before-apple-login",
      },
      payload: mealPayload(new Date().toISOString()),
    });
    expect(anonymousMeal.statusCode).toBe(201);

    const secondSignIn = await app.inject({
      method: "POST",
      url: "/v1/auth/oauth",
      headers: {
        "x-logmyplate-install-id": "install-apple-second",
        "x-logmyplate-platform": "ios",
      },
      payload: { provider: "apple", idToken: "apple-token-one-for-tests" },
    });
    expect(secondSignIn.statusCode).toBe(200);
    expect(secondSignIn.json().profile.id).toBe(profileId);
    expect(secondSignIn.json().profile).toMatchObject({
      authMethod: "apple",
      email: "apple-user@example.com",
    });

    const bootstrap = await app.inject({
      method: "GET",
      url: "/v1/app/bootstrap",
      headers: {
        authorization: `Bearer ${secondSignIn.json().accessToken}`,
        "x-logmyplate-install-id": "install-apple-second",
        "x-logmyplate-platform": "ios",
      },
    });
    expect(bootstrap.statusCode).toBe(200);
    expect(bootstrap.json().today.meals[0]).toMatchObject({
      id: anonymousMeal.json().id,
    });
    await app.close();
  });

  it("rejects invalid OAuth tokens", async () => {
    const app = await testApp({ oauthVerifier: new TestOAuthVerifier({}) });
    const response = await app.inject({
      method: "POST",
      url: "/v1/auth/oauth",
      headers: {
        "x-logmyplate-install-id": "install-invalid-oauth",
        "x-logmyplate-platform": "ios",
      },
      payload: { provider: "google", idToken: "invalid-google-token" },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({ error: "invalid_oauth_token" });
    await app.close();
  });

  it("keeps registered user journals isolated by account token", async () => {
    const app = await testApp();

    const firstSignup = await app.inject({
      method: "POST",
      url: "/v1/auth/email/signup",
      headers: {
        "x-logmyplate-install-id": "install-user-a",
        "x-logmyplate-platform": "ios",
      },
      payload: { email: "a@example.com", password: "secret1" },
    });
    expect(firstSignup.statusCode).toBe(201);

    const secondSignup = await app.inject({
      method: "POST",
      url: "/v1/auth/email/signup",
      headers: {
        "x-logmyplate-install-id": "install-user-b",
        "x-logmyplate-platform": "ios",
      },
      payload: { email: "b@example.com", password: "secret1" },
    });
    expect(secondSignup.statusCode).toBe(201);

    const firstMeal = await app.inject({
      method: "POST",
      url: "/v1/meals",
      headers: {
        authorization: `Bearer ${firstSignup.json().accessToken}`,
        "x-logmyplate-install-id": "install-user-a",
        "x-logmyplate-platform": "ios",
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
        "x-logmyplate-install-id": "install-user-b",
        "x-logmyplate-platform": "ios",
      },
    });
    expect(secondBootstrap.statusCode).toBe(200);
    expect(secondBootstrap.json().today.meals).toHaveLength(0);

    const secondMealLookup = await app.inject({
      method: "GET",
      url: `/v1/meals/${firstMeal.json().id}`,
      headers: {
        authorization: `Bearer ${secondSignup.json().accessToken}`,
        "x-logmyplate-install-id": "install-user-b",
        "x-logmyplate-platform": "ios",
      },
    });
    expect(secondMealLookup.statusCode).toBe(404);

    const firstBootstrap = await app.inject({
      method: "GET",
      url: "/v1/app/bootstrap",
      headers: {
        authorization: `Bearer ${firstSignup.json().accessToken}`,
        "x-logmyplate-install-id": "install-user-a",
        "x-logmyplate-platform": "ios",
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
        "x-logmyplate-install-id": "install-existing-account",
        "x-logmyplate-platform": "ios",
      },
      payload: { email: "merge@example.com", password: "secret1" },
    });
    expect(signup.statusCode).toBe(201);

    const anonymousMeal = await app.inject({
      method: "POST",
      url: "/v1/meals",
      headers: {
        "x-logmyplate-install-id": "install-new-device",
        "x-logmyplate-platform": "ios",
        "idempotency-key": "anonymous-new-device-meal",
      },
      payload: mealPayload(new Date().toISOString()),
    });
    expect(anonymousMeal.statusCode).toBe(201);

    const login = await app.inject({
      method: "POST",
      url: "/v1/auth/email/login",
      headers: {
        "x-logmyplate-install-id": "install-new-device",
        "x-logmyplate-platform": "ios",
      },
      payload: { email: "merge@example.com", password: "secret1" },
    });
    expect(login.statusCode).toBe(200);

    const bootstrap = await app.inject({
      method: "GET",
      url: "/v1/app/bootstrap",
      headers: {
        authorization: `Bearer ${login.json().accessToken}`,
        "x-logmyplate-install-id": "install-new-device",
        "x-logmyplate-platform": "ios",
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
        "x-logmyplate-install-id": "install-logout",
        "x-logmyplate-platform": "ios",
      },
      payload: { email: "logout@example.com", password: "secret1" },
    });
    expect(signup.statusCode).toBe(201);

    const meal = await app.inject({
      method: "POST",
      url: "/v1/meals",
      headers: {
        authorization: `Bearer ${signup.json().accessToken}`,
        "x-logmyplate-install-id": "install-logout",
        "x-logmyplate-platform": "ios",
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
        "x-logmyplate-install-id": "install-logout",
        "x-logmyplate-platform": "ios",
      },
    });
    expect(logout.statusCode).toBe(204);

    const anonymousBootstrap = await app.inject({
      method: "GET",
      url: "/v1/app/bootstrap",
      headers: {
        "x-logmyplate-install-id": "install-logout",
        "x-logmyplate-platform": "ios",
      },
    });
    expect(anonymousBootstrap.statusCode).toBe(200);
    expect(anonymousBootstrap.json().profile.authMethod).toBe("anonymous");
    expect(anonymousBootstrap.json().today.meals).toHaveLength(0);

    const login = await app.inject({
      method: "POST",
      url: "/v1/auth/email/login",
      headers: {
        "x-logmyplate-install-id": "install-logout",
        "x-logmyplate-platform": "ios",
      },
      payload: { email: "logout@example.com", password: "secret1" },
    });
    expect(login.statusCode).toBe(200);

    const accountBootstrap = await app.inject({
      method: "GET",
      url: "/v1/app/bootstrap",
      headers: {
        authorization: `Bearer ${login.json().accessToken}`,
        "x-logmyplate-install-id": "install-logout",
        "x-logmyplate-platform": "ios",
      },
    });
    expect(accountBootstrap.json().today.meals[0]).toMatchObject({
      id: meal.json().id,
    });
    await app.close();
  });

  it("returns to an anonymous profile when an account-bound install has no session token", async () => {
    const app = await testApp();
    const installHeaders = {
      "x-logmyplate-install-id": "install-missing-session",
      "x-logmyplate-platform": "ios",
    };

    const signup = await app.inject({
      method: "POST",
      url: "/v1/auth/email/signup",
      headers: installHeaders,
      payload: { email: "missing-session@example.com", password: "secret1" },
    });
    expect(signup.statusCode).toBe(201);

    const accountMeal = await app.inject({
      method: "POST",
      url: "/v1/meals",
      headers: {
        ...installHeaders,
        authorization: `Bearer ${signup.json().accessToken}`,
        "idempotency-key": "missing-session-account-meal",
      },
      payload: mealPayload(new Date().toISOString()),
    });
    expect(accountMeal.statusCode).toBe(201);

    const anonymousBootstrap = await app.inject({
      method: "GET",
      url: "/v1/app/bootstrap",
      headers: installHeaders,
    });
    expect(anonymousBootstrap.statusCode).toBe(200);
    expect(anonymousBootstrap.json()).toMatchObject({
      profile: { authMethod: "anonymous" },
      today: { meals: [] },
    });

    const prepare = await app.inject({
      method: "POST",
      url: "/v1/scans/prepare",
      headers: { ...installHeaders, "idempotency-key": "missing-session-prepare" },
    });
    expect(prepare.statusCode).toBe(201);
    await app.close();
  });

  it("does not refresh the lifetime install scan quota after logout", async () => {
    const app = await testApp();
    const installHeaders = {
      "x-logmyplate-install-id": "install-lifetime-quota",
      "x-logmyplate-platform": "ios",
    };
    const analyzeScan = async (key: string) => {
      const imageBytes = Buffer.from(`quota-scan-${key}`);
      const prepared = await app.inject({
        method: "POST",
        url: "/v1/scans/prepare",
        headers: { ...installHeaders, "idempotency-key": `quota-prepare-${key}` },
      });
      expect(prepared.statusCode).toBe(201);

      const analyzed = await app.inject({
        method: "POST",
        url: `/v1/scans/${prepared.json().scanId}/analyze`,
        headers: { ...installHeaders, "idempotency-key": `quota-analyze-${key}` },
        payload: {
          hint: "dal rice",
          image: {
            mimeType: "image/jpeg",
            base64: imageBytes.toString("base64"),
            byteSize: imageBytes.byteLength,
          },
        },
      });
      expect(analyzed.statusCode).toBe(200);
    };

    await analyzeScan("one");
    await analyzeScan("two");
    await analyzeScan("three");

    const exhaustedQuota = await app.inject({
      method: "GET",
      url: "/v1/quota",
      headers: installHeaders,
    });
    expect(exhaustedQuota.json()).toMatchObject({
      freeRemaining: 0,
      rewardedRemaining: 0,
      premiumRemaining: 0,
    });

    const signup = await app.inject({
      method: "POST",
      url: "/v1/auth/email/signup",
      headers: installHeaders,
      payload: { email: "quota-logout@example.com", password: "secret1" },
    });
    expect(signup.statusCode).toBe(201);

    const logout = await app.inject({
      method: "POST",
      url: "/v1/auth/logout",
      headers: {
        ...installHeaders,
        authorization: `Bearer ${signup.json().accessToken}`,
      },
    });
    expect(logout.statusCode).toBe(204);

    const anonymousBootstrap = await app.inject({
      method: "GET",
      url: "/v1/app/bootstrap",
      headers: installHeaders,
    });
    expect(anonymousBootstrap.statusCode).toBe(200);
    expect(anonymousBootstrap.json()).toMatchObject({
      profile: { authMethod: "anonymous" },
      quota: {
        freeRemaining: 0,
        rewardedRemaining: 0,
        premiumRemaining: 0,
      },
    });

    const prepared = await app.inject({
      method: "POST",
      url: "/v1/scans/prepare",
      headers: { ...installHeaders, "idempotency-key": "quota-prepare-blocked" },
    });
    const blocked = await app.inject({
      method: "POST",
      url: `/v1/scans/${prepared.json().scanId}/analyze`,
      headers: { ...installHeaders, "idempotency-key": "quota-analyze-blocked" },
      payload: {
        hint: "dal rice",
        image: {
          mimeType: "image/jpeg",
          base64: "AQID",
          byteSize: 3,
        },
      },
    });

    expect(blocked.statusCode).toBe(402);
    expect(blocked.json()).toMatchObject({
      error: "scan_credit_required",
      reason: "needs_rewarded_ad",
      quota: {
        freeRemaining: 0,
        rewardedRemaining: 0,
        premiumRemaining: 0,
      },
    });
    await app.close();
  });

  it("requires an account before rewarded ad scan unlocks", async () => {
    const app = await testApp();
    const response = await app.inject({
      method: "POST",
      url: "/v1/ads/rewarded/complete",
      headers: {
        "x-logmyplate-install-id": "install-anonymous-ad",
        "x-logmyplate-platform": "ios",
        "idempotency-key": "anonymous-ad-complete",
      },
      payload: { provider: "admob", placement: "scan_unlock" },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({ error: "account_required" });
    await app.close();
  });

  it("records AdMob SSV callbacks and uses the verified token when required", async () => {
    const app = await testApp({
      rewardedAdVerifier: new TestRewardedAdVerifier(),
      requireRewardedAdServerVerification: true,
    });
    const installHeaders = {
      "x-logmyplate-install-id": "install-rewarded-ssv",
      "x-logmyplate-platform": "ios",
    };
    const signup = await app.inject({
      method: "POST",
      url: "/v1/auth/email/signup",
      headers: installHeaders,
      payload: { email: "ads-ssv@example.com", password: "secret1" },
    });
    expect(signup.statusCode).toBe(201);
    const profileId = signup.json().profile.id as string;
    const token = "reward-token-ssv-123456";

    const callback = await app.inject({
      method: "GET",
      url:
        `/v1/ads/rewarded/ssv?ad_network=5450213213286189855&ad_unit=1712485313` +
        `&custom_data=${token}&reward_amount=1&reward_item=scan&timestamp=1770000000000` +
        `&transaction_id=txn-ssv-1&user_id=${profileId}&signature=test-signature&key_id=test-key`,
    });
    expect(callback.statusCode).toBe(200);
    expect(callback.json()).toEqual({ ok: true });

    const complete = await app.inject({
      method: "POST",
      url: "/v1/ads/rewarded/complete",
      headers: {
        ...installHeaders,
        authorization: `Bearer ${signup.json().accessToken}`,
        "idempotency-key": "rewarded-ssv-complete",
      },
      payload: {
        provider: "admob",
        placement: "scan_unlock",
        verificationToken: token,
      },
    });

    expect(complete.statusCode).toBe(200);
    expect(complete.json()).toMatchObject({
      grantedScan: true,
      adsWatchedToday: 1,
      scansGrantedToday: 1,
      quota: { freeRemaining: 3, rewardedRemaining: 1, premiumRemaining: 0 },
    });
    await app.close();
  });

  it("holds rewarded scan grants when required SSV has not arrived", async () => {
    const app = await testApp({
      rewardedAdVerifier: new TestRewardedAdVerifier(),
      requireRewardedAdServerVerification: true,
    });
    const installHeaders = {
      "x-logmyplate-install-id": "install-rewarded-ssv-pending",
      "x-logmyplate-platform": "ios",
    };
    const signup = await app.inject({
      method: "POST",
      url: "/v1/auth/email/signup",
      headers: installHeaders,
      payload: { email: "ads-ssv-pending@example.com", password: "secret1" },
    });
    expect(signup.statusCode).toBe(201);
    const profileId = signup.json().profile.id as string;
    const token = "reward-token-missing-123456";

    const response = await app.inject({
      method: "POST",
      url: "/v1/ads/rewarded/complete",
      headers: {
        ...installHeaders,
        authorization: `Bearer ${signup.json().accessToken}`,
        "idempotency-key": "rewarded-ssv-pending",
      },
      payload: {
        provider: "admob",
        placement: "scan_unlock",
        verificationToken: token,
      },
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toMatchObject({ error: "rewarded_ad_verification_pending" });

    await app.inject({
      method: "GET",
      url:
        `/v1/ads/rewarded/ssv?custom_data=${token}&reward_amount=1&reward_item=scan` +
        `&transaction_id=txn-ssv-late&user_id=${profileId}&signature=test-signature&key_id=test-key`,
    });
    const retry = await app.inject({
      method: "POST",
      url: "/v1/ads/rewarded/complete",
      headers: {
        ...installHeaders,
        authorization: `Bearer ${signup.json().accessToken}`,
        "idempotency-key": "rewarded-ssv-pending",
      },
      payload: {
        provider: "admob",
        placement: "scan_unlock",
        verificationToken: token,
      },
    });
    expect(retry.statusCode).toBe(200);
    expect(retry.json()).toMatchObject({ grantedScan: true });
    await app.close();
  });

  it("grants one rewarded scan after one completed ad", async () => {
    const app = await testApp();
    const installHeaders = {
      "x-logmyplate-install-id": "install-rewarded-ad",
      "x-logmyplate-platform": "ios",
    };
    const signup = await app.inject({
      method: "POST",
      url: "/v1/auth/email/signup",
      headers: installHeaders,
      payload: { email: "ads@example.com", password: "secret1" },
    });
    expect(signup.statusCode).toBe(201);
    const headers = {
      ...installHeaders,
      authorization: `Bearer ${signup.json().accessToken}`,
    };

    const first = await app.inject({
      method: "POST",
      url: "/v1/ads/rewarded/complete",
      headers: { ...headers, "idempotency-key": "rewarded-ad-one" },
      payload: {
        provider: "admob",
        placement: "scan_unlock",
        adUnitId: "ca-app-pub-3940256099942544/1712485313",
      },
    });
    expect(first.statusCode).toBe(200);
    expect(first.json()).toMatchObject({
      grantedScan: true,
      adsWatchedToday: 1,
      adsNeededForNextScan: 1,
      scansGrantedToday: 1,
      dailyScanLimit: 5,
      quota: { freeRemaining: 3, rewardedRemaining: 1, premiumRemaining: 0 },
    });
    await app.close();
  });

  it("caps rewarded ad scan grants at five per day", async () => {
    const app = await testApp();
    const installHeaders = {
      "x-logmyplate-install-id": "install-rewarded-cap",
      "x-logmyplate-platform": "ios",
    };
    const signup = await app.inject({
      method: "POST",
      url: "/v1/auth/email/signup",
      headers: installHeaders,
      payload: { email: "ads-cap@example.com", password: "secret1" },
    });
    expect(signup.statusCode).toBe(201);
    const headers = {
      ...installHeaders,
      authorization: `Bearer ${signup.json().accessToken}`,
    };

    let lastPayload: Record<string, unknown> = {};
    for (let index = 1; index <= 6; index += 1) {
      const response = await app.inject({
        method: "POST",
        url: "/v1/ads/rewarded/complete",
        headers: { ...headers, "idempotency-key": `rewarded-cap-${index}` },
        payload: { provider: "admob", placement: "scan_unlock" },
      });
      expect(response.statusCode).toBe(200);
      lastPayload = response.json();
    }

    expect(lastPayload).toMatchObject({
      grantedScan: false,
      adsWatchedToday: 6,
      adsNeededForNextScan: 0,
      scansGrantedToday: 5,
      quota: { freeRemaining: 3, rewardedRemaining: 5, premiumRemaining: 0 },
    });
    await app.close();
  });

  it("keeps signed-in rewarded scans off the anonymous install after logout", async () => {
    const app = await testApp();
    const installHeaders = {
      "x-logmyplate-install-id": "install-rewarded-logout",
      "x-logmyplate-platform": "ios",
    };

    for (let index = 1; index <= 3; index += 1) {
      const imageBytes = Buffer.from(`logout-reward-scan-${index}`);
      const prepared = await app.inject({
        method: "POST",
        url: "/v1/scans/prepare",
        headers: { ...installHeaders, "idempotency-key": `logout-prepare-${index}` },
      });
      expect(prepared.statusCode).toBe(201);

      const analyzed = await app.inject({
        method: "POST",
        url: `/v1/scans/${prepared.json().scanId}/analyze`,
        headers: { ...installHeaders, "idempotency-key": `logout-analyze-${index}` },
        payload: {
          hint: "dal rice",
          image: {
            mimeType: "image/jpeg",
            base64: imageBytes.toString("base64"),
            byteSize: imageBytes.byteLength,
          },
        },
      });
      expect(analyzed.statusCode).toBe(200);
    }

    const signup = await app.inject({
      method: "POST",
      url: "/v1/auth/email/signup",
      headers: installHeaders,
      payload: { email: "logout-reward@example.com", password: "secret1" },
    });
    expect(signup.statusCode).toBe(201);
    const accountHeaders = {
      ...installHeaders,
      authorization: `Bearer ${signup.json().accessToken}`,
    };

    const rewarded = await app.inject({
      method: "POST",
      url: "/v1/ads/rewarded/complete",
      headers: { ...accountHeaders, "idempotency-key": "logout-rewarded-1" },
      payload: { provider: "admob", placement: "scan_unlock" },
    });
    expect(rewarded.statusCode).toBe(200);

    const accountBootstrap = await app.inject({
      method: "GET",
      url: "/v1/app/bootstrap",
      headers: accountHeaders,
    });
    expect(accountBootstrap.statusCode).toBe(200);
    expect(accountBootstrap.json().quota).toMatchObject({
      freeRemaining: 0,
      rewardedRemaining: 1,
      premiumRemaining: 0,
    });

    const logout = await app.inject({
      method: "POST",
      url: "/v1/auth/logout",
      headers: accountHeaders,
    });
    expect(logout.statusCode).toBe(204);

    const anonymousBootstrap = await app.inject({
      method: "GET",
      url: "/v1/app/bootstrap",
      headers: installHeaders,
    });
    expect(anonymousBootstrap.statusCode).toBe(200);
    expect(anonymousBootstrap.json().profile).toMatchObject({ authMethod: "anonymous" });
    expect(anonymousBootstrap.json().quota).toMatchObject({
      freeRemaining: 0,
      rewardedRemaining: 0,
      premiumRemaining: 0,
    });
    await app.close();
  });

  it("passes plate notes into AI analysis", async () => {
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
    const app = await buildApp({
      repository,
      aiProvider,
      mealImageStorage: new DisabledStorage(),
    });
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

  it("routes food photo prompt keys from request locale and region", async () => {
    const seenInputs: AnalyzeMealImageInput[] = [];
    const aiProvider: AiProvider = {
      async analyzeMealImage(input) {
        seenInputs.push(input);
        return {
          analysis: analyzeWithMockProvider(input.scanId),
          providerRun: {
            provider: "mock",
            model: "test-provider",
            promptVersion: "test",
            schemaVersion: "scan_v1",
          },
        };
      },
    };
    const app = await buildApp({
      repository: new InMemoryStore(),
      aiProvider,
      mealImageStorage: new DisabledStorage(),
    });

    const analyze = async ({
      key,
      headers,
      imageBase64,
    }: {
      key: string;
      headers: Record<string, string>;
      imageBase64: string;
    }) => {
      const prepared = await app.inject({
        method: "POST",
        url: "/v1/scans/prepare",
        headers: { "idempotency-key": `prompt-route-prepare-${key}`, ...headers },
      });
      const scanId = prepared.json().scanId as string;
      const analyzed = await app.inject({
        method: "POST",
        url: `/v1/scans/${scanId}/analyze`,
        headers: { "idempotency-key": `prompt-route-analyze-${key}`, ...headers },
        payload: {
          hint: "meal plate",
          image: {
            mimeType: "image/jpeg",
            base64: imageBase64,
            byteSize: Buffer.from(imageBase64, "base64").byteLength,
          },
        },
      });
      expect(analyzed.statusCode).toBe(200);
    };

    await analyze({
      key: "india",
      headers: {
        "x-logmyplate-region": "IN",
        "x-logmyplate-locale": "en-IN",
        "x-logmyplate-timezone": "IST",
      },
      imageBase64: "AQID",
    });
    await analyze({
      key: "global",
      headers: {
        "x-logmyplate-region": "US",
        "x-logmyplate-locale": "en-US",
        "x-logmyplate-timezone": "PST",
      },
      imageBase64: "BAUG",
    });

    expect(seenInputs).toHaveLength(2);
    expect(seenInputs[0]).toMatchObject({
      promptKey: indiaFoodPhotoPromptKey,
      region: "IN",
      locale: "en-IN",
      timezone: "IST",
    });
    expect(seenInputs[1]).toMatchObject({
      promptKey: globalFoodPhotoPromptKey,
      region: "US",
      locale: "en-US",
      timezone: "PST",
    });
    await app.close();
  });

  it("does not consume scan credit when AI detects no food", async () => {
    const aiProvider: AiProvider = {
      async analyzeMealImage(input) {
        return {
          analysis: {
            scanId: input.scanId,
            status: "ready_for_review",
            mealType: "snack",
            mealName: "No food detected",
            detectedLanguage: "en",
            items: [],
            totals: {
              calories: 0,
              proteinG: 0,
              carbsG: 0,
              fatG: 0,
            },
          },
          providerRun: {
            provider: "mock",
            model: "test-no-food-provider",
            promptVersion: "test",
            schemaVersion: "scan_v1",
          },
        };
      },
    };
    const repository = new InMemoryStore();
    const mealImageStorage = new TestMealImageStorage();
    const app = await buildApp({
      repository,
      aiProvider,
      mealImageStorage,
    });
    const beforeQuota = await app.inject({ method: "GET", url: "/v1/quota" });
    const prepared = await app.inject({
      method: "POST",
      url: "/v1/scans/prepare",
      headers: { "idempotency-key": "no-food-prepare" },
    });
    const scanId = prepared.json().scanId as string;

    const analyzed = await app.inject({
      method: "POST",
      url: `/v1/scans/${scanId}/analyze`,
      headers: { "idempotency-key": "no-food-analyze" },
      payload: {
        hint: "plate",
        image: {
          mimeType: "image/jpeg",
          base64: "AQID",
          byteSize: 3,
        },
      },
    });
    const afterQuota = await app.inject({ method: "GET", url: "/v1/quota" });

    expect(analyzed.statusCode).toBe(422);
    expect(analyzed.json()).toMatchObject({
      error: "no_food_detected",
      retryable: false,
    });
    expect(afterQuota.json()).toMatchObject(beforeQuota.json());
    expect(mealImageStorage.uploads).toHaveLength(0);
    await expect(repository.getScan(scanId)).resolves.toMatchObject({
      status: "failed",
      analyzedResponse: {
        mealName: "No food detected",
        items: [],
      },
    });
    await app.close();
  });

  it("rate limits repeated no-food scan attempts before calling AI again", async () => {
    const previousLimit = process.env.NO_FOOD_SCAN_DAILY_LIMIT;
    process.env.NO_FOOD_SCAN_DAILY_LIMIT = "2";
    let calls = 0;
    const aiProvider: AiProvider = {
      async analyzeMealImage(input) {
        calls += 1;
        return {
          analysis: {
            scanId: input.scanId,
            status: "ready_for_review",
            mealType: "snack",
            mealName: "No food detected",
            detectedLanguage: "en",
            items: [],
            totals: {
              calories: 0,
              proteinG: 0,
              carbsG: 0,
              fatG: 0,
            },
          },
          providerRun: {
            provider: "mock",
            model: "test-no-food-provider",
            promptVersion: "test",
            schemaVersion: "scan_v1",
          },
        };
      },
    };
    const app = await buildApp({
      repository: new InMemoryStore(),
      aiProvider,
      mealImageStorage: new DisabledStorage(),
    });
    const analyze = async (key: string) => {
      const prepared = await app.inject({
        method: "POST",
        url: "/v1/scans/prepare",
        headers: { "idempotency-key": `no-food-limit-prepare-${key}` },
      });
      return app.inject({
        method: "POST",
        url: `/v1/scans/${prepared.json().scanId}/analyze`,
        headers: { "idempotency-key": `no-food-limit-analyze-${key}` },
        payload: {
          hint: "plate",
          image: {
            mimeType: "image/jpeg",
            base64: "AQID",
            byteSize: 3,
          },
        },
      });
    };

    try {
      expect((await analyze("one")).statusCode).toBe(422);
      expect((await analyze("two")).statusCode).toBe(422);
      const blocked = await analyze("three");

      expect(blocked.statusCode).toBe(429);
      expect(blocked.json()).toMatchObject({
        error: "no_food_scan_limit_exceeded",
        retryable: false,
      });
      expect(calls).toBe(2);
    } finally {
      if (previousLimit === undefined) {
        delete process.env.NO_FOOD_SCAN_DAILY_LIMIT;
      } else {
        process.env.NO_FOOD_SCAN_DAILY_LIMIT = previousLimit;
      }
      await app.close();
    }
  });

  it("requires a concise plate note before analysis", async () => {
    const app = await testApp();
    const prepared = await app.inject({
      method: "POST",
      url: "/v1/scans/prepare",
      headers: { "idempotency-key": "missing-hint-prepare" },
    });
    const scanId = prepared.json().scanId as string;

    const analyzed = await app.inject({
      method: "POST",
      url: `/v1/scans/${scanId}/analyze`,
      headers: { "idempotency-key": "missing-hint-analyze" },
      payload: {
        image: {
          mimeType: "image/jpeg",
          base64: "AQID",
          byteSize: 3,
        },
      },
    });

    expect(analyzed.statusCode).toBe(400);
    expect(analyzed.json()).toMatchObject({ error: "invalid_scan_image" });
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
