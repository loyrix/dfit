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
      }).aiProvider,
    ).toBe("gemini");
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
