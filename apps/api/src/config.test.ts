import { describe, expect, it } from "vitest";
import { buildApiConfig } from "./config.js";

describe("API config", () => {
  it("rejects mock AI in production", () => {
    expect(() =>
      buildApiConfig({
        NODE_ENV: "production",
        AI_PROVIDER: "mock",
      }),
    ).toThrow(/AI_PROVIDER=mock/);
  });

  it("rejects unsupported AI providers", () => {
    expect(() =>
      buildApiConfig({
        NODE_ENV: "development",
        AI_PROVIDER: "unsupported",
      }),
    ).toThrow(/Unsupported AI_PROVIDER/);
  });

  it("requires a Gemini key when Gemini is selected", () => {
    expect(() =>
      buildApiConfig({
        NODE_ENV: "development",
        AI_PROVIDER: "gemini",
      }),
    ).toThrow(/GEMINI_API_KEY/);
  });

  it("accepts Gemini in production when configured", () => {
    expect(
      buildApiConfig({
        NODE_ENV: "production",
        AI_PROVIDER: "gemini",
        GEMINI_API_KEY: "test-key",
        RESEND_API_KEY: "re_test",
        REVENUECAT_WEBHOOK_AUTH_TOKEN: "test-token",
      }).aiProvider,
    ).toBe("gemini");
  });

  it("reads rewarded AdMob SSV settings", () => {
    const config = buildApiConfig({
      NODE_ENV: "development",
      ADMOB_REWARDED_SSV_REQUIRED: "true",
      ADMOB_REWARDED_SSV_PUBLIC_KEYS_URL: "https://keys.test/verifier-keys.json",
      ADMOB_REWARDED_SSV_KEY_CACHE_TTL_MS: "60000",
    });

    expect(config.adMob).toMatchObject({
      rewardedSsvRequired: true,
      rewardedSsvPublicKeysUrl: "https://keys.test/verifier-keys.json",
      rewardedSsvKeyCacheTtlMs: 60000,
    });
  });

  it("reads password reset email settings", () => {
    const config = buildApiConfig({
      NODE_ENV: "development",
      RESEND_API_KEY: "re_test",
      PASSWORD_RESET_EMAIL_FROM: "LogMyPlate <reset@test.logmyplate.com>",
    });

    expect(config.email).toMatchObject({
      resendApiKey: "re_test",
      passwordResetFrom: "LogMyPlate <reset@test.logmyplate.com>",
    });
  });

  it("reads cron secret settings", () => {
    const config = buildApiConfig({
      NODE_ENV: "development",
      CRON_SECRET: "scheduled-reminder-secret",
    });

    expect(config.cron.secret).toBe("scheduled-reminder-secret");
  });

  it("defaults password reset emails to no-reply", () => {
    const config = buildApiConfig({
      NODE_ENV: "development",
    });

    expect(config.email.passwordResetFrom).toBe("LogMyPlate <no-reply@logmyplate.com>");
  });

  it("requires password reset email delivery in production", () => {
    expect(() =>
      buildApiConfig({
        NODE_ENV: "production",
        AI_PROVIDER: "gemini",
        GEMINI_API_KEY: "test-key",
      }),
    ).toThrow(/RESEND_API_KEY/);
  });

  it("reads OAuth provider settings", () => {
    const config = buildApiConfig({
      NODE_ENV: "development",
      AUTH_GOOGLE_CLIENT_IDS:
        "web-client.apps.googleusercontent.com,ios-client.apps.googleusercontent.com",
      AUTH_APPLE_CLIENT_IDS: "com.logmyplate.app",
      AUTH_APPLE_TEAM_ID: "M7ZGXF8RPW",
      AUTH_APPLE_KEY_ID: "ABC123DEFG",
      AUTH_APPLE_PRIVATE_KEY_BASE64: Buffer.from("private-key").toString("base64"),
    });

    expect(config.auth).toMatchObject({
      googleClientIds: [
        "web-client.apps.googleusercontent.com",
        "ios-client.apps.googleusercontent.com",
      ],
      appleClientIds: ["com.logmyplate.app"],
      appleTeamId: "M7ZGXF8RPW",
      appleKeyId: "ABC123DEFG",
      applePrivateKey: "private-key",
      appleJwksUrl: "https://appleid.apple.com/auth/keys",
    });
  });

  it("rejects malformed Google OAuth client IDs", () => {
    expect(() =>
      buildApiConfig({
        NODE_ENV: "development",
        AUTH_GOOGLE_CLIENT_IDS: "not-a-google-client",
      }),
    ).toThrow(/AUTH_GOOGLE_CLIENT_IDS/);
  });

  it("rejects invalid rewarded AdMob SSV cache settings", () => {
    expect(() =>
      buildApiConfig({
        NODE_ENV: "development",
        ADMOB_REWARDED_SSV_KEY_CACHE_TTL_MS: "0",
      }),
    ).toThrow(/ADMOB_REWARDED_SSV_KEY_CACHE_TTL_MS/);
  });

  it("requires Vertex AI service account config when Vertex is selected", () => {
    expect(() =>
      buildApiConfig({
        NODE_ENV: "development",
        AI_PROVIDER: "vertex",
        GOOGLE_CLOUD_PROJECT: "logmyplate-ai",
        GOOGLE_CLOUD_LOCATION: "asia-south1",
      }),
    ).toThrow(/GOOGLE_APPLICATION_CREDENTIALS_JSON_BASE64/);
  });

  it("accepts Vertex AI when service account config is present", () => {
    const config = buildApiConfig({
      NODE_ENV: "production",
      AI_PROVIDER: "vertex",
      GOOGLE_CLOUD_PROJECT: "logmyplate-ai",
      GOOGLE_CLOUD_LOCATION: "asia-south1",
      VERTEX_AI_MODEL: "gemini-2.5-flash",
      GOOGLE_APPLICATION_CREDENTIALS_JSON_BASE64: "eyJjbGllbnRfZW1haWwiOiJzYSJ9",
      VERTEX_AI_MAX_OUTPUT_TOKENS: "3072",
      RESEND_API_KEY: "re_test",
      REVENUECAT_WEBHOOK_AUTH_TOKEN: "test-token",
    });

    expect(config.aiProvider).toBe("vertex");
    expect(config.vertex).toMatchObject({
      project: "logmyplate-ai",
      location: "asia-south1",
      model: "gemini-2.5-flash",
      maxOutputTokens: 3072,
    });
  });
});
