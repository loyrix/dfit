import { describe, expect, it } from "vitest";
import {
  confidenceAfterSignals,
  detectPortionSignals,
  isAccuracyDefect,
  type PortionSignalInput,
} from "./portion-sanity.js";

const item = (overrides: Partial<PortionSignalInput> = {}): PortionSignalInput => ({
  estimatedGrams: 150,
  nutrition: { calories: 180, proteinG: 10, carbsG: 25, fatG: 5 },
  ...overrides,
});

describe("detectPortionSignals", () => {
  it("accepts a normal single serving", () => {
    expect(detectPortionSignals(item())).toEqual([]);
  });

  it("accepts calorie-dense foods in small portions", () => {
    // 10 g of almonds at 580 kcal/100g is correct, not an outlier.
    const almonds = item({
      estimatedGrams: 10,
      nutrition: { calories: 58, proteinG: 2.1, carbsG: 2.2, fatG: 5 },
    });
    expect(detectPortionSignals(almonds)).toEqual([]);
  });

  it("accepts a family-size pot without any signal", () => {
    // Bulk cooking is a legitimate photo; it must not be treated as an error.
    const familyPot = item({
      estimatedGrams: 1_200,
      nutrition: { calories: 1_100, proteinG: 40, carbsG: 150, fatG: 40 },
    });
    expect(detectPortionSignals(familyPot)).toEqual([]);
  });

  it("accepts a full packet of biscuits", () => {
    const packet = item({
      estimatedGrams: 200,
      nutrition: { calories: 960, proteinG: 12, carbsG: 130, fatG: 42 },
    });
    expect(detectPortionSignals(packet)).toEqual([]);
  });

  it("flags calories that disagree with the macros", () => {
    // 4*10 + 4*25 + 9*5 = 185 kcal, but the model claimed 600.
    const incoherent = item({ nutrition: { calories: 600, proteinG: 10, carbsG: 25, fatG: 5 } });
    expect(detectPortionSignals(incoherent)).toContain("macro_incoherent");
  });

  it("tolerates the small gap fiber and rounding normally cause", () => {
    // Banana: 89 kcal stated, 98.3 derived — a ~10% gap is expected.
    const banana = item({
      estimatedGrams: 100,
      nutrition: { calories: 89, proteinG: 1.1, carbsG: 22.8, fatG: 0.3 },
    });
    expect(detectPortionSignals(banana)).toEqual([]);
  });

  it("raises review signals for the mustard oil bottle", () => {
    const bottle = item({
      estimatedGrams: 920,
      nutrition: { calories: 8_140, proteinG: 0, carbsG: 0, fatG: 920 },
    });
    expect(detectPortionSignals(bottle)).toContain("high_calorie");
  });

  it("raises a review signal for a very large mass", () => {
    const vat = item({
      estimatedGrams: 3_000,
      nutrition: { calories: 1_800, proteinG: 60, carbsG: 250, fatG: 50 },
    });
    expect(detectPortionSignals(vat)).toContain("large_portion");
  });

  it("does not flag coherence when macros are missing entirely", () => {
    const macrosMissing = item({ nutrition: { calories: 200, proteinG: 0, carbsG: 0, fatG: 0 } });
    expect(detectPortionSignals(macrosMissing)).toEqual([]);
  });

  it("ignores non-finite and non-positive values instead of flagging them", () => {
    const broken = item({
      estimatedGrams: Number.NaN,
      nutrition: { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
    });
    expect(detectPortionSignals(broken)).toEqual([]);
  });
});

describe("isAccuracyDefect", () => {
  it("treats only macro incoherence as a defect", () => {
    expect(isAccuracyDefect("macro_incoherent")).toBe(true);
    expect(isAccuracyDefect("large_portion")).toBe(false);
    expect(isAccuracyDefect("high_calorie")).toBe(false);
  });
});

describe("confidenceAfterSignals", () => {
  it("leaves confidence untouched when nothing is signalled", () => {
    expect(confidenceAfterSignals(0.9, [])).toBe(0.9);
  });

  it("never penalises a correctly estimated large portion", () => {
    expect(confidenceAfterSignals(0.9, ["large_portion", "high_calorie"])).toBe(0.9);
  });

  it("lowers confidence when the numbers do not add up", () => {
    expect(confidenceAfterSignals(0.9, ["macro_incoherent"])).toBeLessThan(0.9);
  });

  it("keeps confidence within the 0..1 range", () => {
    expect(confidenceAfterSignals(1, ["macro_incoherent"])).toBeLessThanOrEqual(1);
    expect(confidenceAfterSignals(0, ["macro_incoherent"])).toBeGreaterThanOrEqual(0);
  });
});
