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
});
