import { describe, expect, it } from "vitest";
import { estimateGeminiCostUsd, GEMINI_TOKEN_PRICING_USD_PER_MILLION } from "./ai-pricing.js";

describe("estimateGeminiCostUsd", () => {
  it("prices a run from its input and output tokens", () => {
    // 3,782 in / 345 out is the measured average for a v9 scan on 2.5 Flash.
    const cost = estimateGeminiCostUsd({
      model: "gemini-2.5-flash",
      inputTokens: 3_782,
      outputTokens: 345,
    });

    const expected = (3_782 / 1_000_000) * 0.3 + (345 / 1_000_000) * 2.5;
    expect(cost).toBeCloseTo(expected, 10);
    // Confirms the ~$0.002 per scan figure the audit quotes.
    expect(cost).toBeCloseTo(0.002, 4);
  });

  it("charges output tokens at the higher rate", () => {
    const input = estimateGeminiCostUsd({ model: "gemini-2.5-flash", inputTokens: 1_000 });
    const output = estimateGeminiCostUsd({ model: "gemini-2.5-flash", outputTokens: 1_000 });

    expect(output!).toBeGreaterThan(input!);
  });

  it("returns undefined for a model with no published price", () => {
    // Not 0: an unpriced model and a free run are different facts, and
    // recording the second understates spend silently.
    expect(
      estimateGeminiCostUsd({ model: "gemini-9.0-imaginary", inputTokens: 1_000 }),
    ).toBeUndefined();
  });

  it("returns undefined when no token counts are known", () => {
    expect(estimateGeminiCostUsd({ model: "gemini-2.5-flash" })).toBeUndefined();
  });

  it("treats a missing side as zero rather than skipping the run", () => {
    const cost = estimateGeminiCostUsd({ model: "gemini-2.5-flash", inputTokens: 1_000 });
    expect(cost).toBeCloseTo(0.0003, 10);
  });

  it("prices every model the app is configured to run", () => {
    // The scan config offers flash and flash-lite; both must be priced or the
    // dashboard silently reports zero spend.
    for (const model of ["gemini-2.5-flash", "gemini-2.5-flash-lite"]) {
      expect(GEMINI_TOKEN_PRICING_USD_PER_MILLION[model]).toBeDefined();
      expect(
        estimateGeminiCostUsd({ model, inputTokens: 1_000, outputTokens: 100 }),
      ).toBeGreaterThan(0);
    }
  });
});
