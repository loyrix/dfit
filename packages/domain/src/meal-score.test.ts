import { describe, expect, it } from "vitest";
import { calculateMacroTargets } from "./macro-targets.js";
import {
  calculateMealScore,
  closeness,
  defaultMealScorePolicy,
  macroCalories,
  type MealScoreInput,
} from "./meal-score.js";

/** The worked-example user's bands: carbs 35–45, fat 20–30, protein 30–40. */
const targets = calculateMacroTargets({
  heightCm: 165,
  weightKg: 65,
  ageYears: 28,
  sex: "female",
  activityLevel: "light",
  goal: "gain_gently",
});

const score = (input: MealScoreInput) => calculateMealScore(input, targets);

describe("closeness", () => {
  const band = { min: 35, max: 45 };

  it("is 100 anywhere inside the band, including the edges", () => {
    expect(closeness(35, band, 15)).toBe(100);
    expect(closeness(40, band, 15)).toBe(100);
    expect(closeness(45, band, 15)).toBe(100);
  });

  it("decays smoothly rather than falling off a cliff", () => {
    // 55 vs 56 carbs should not score wildly differently.
    expect(closeness(46, band, 15)).toBeCloseTo(93.3, 1);
    expect(closeness(50, band, 15)).toBeCloseTo(66.7, 1);
  });

  it("reaches zero exactly one falloff outside the band, and never goes below", () => {
    expect(closeness(60, band, 15)).toBe(0);
    expect(closeness(200, band, 15)).toBe(0);
  });

  it("decays symmetrically below the band", () => {
    expect(closeness(30, band, 15)).toBeCloseTo(closeness(50, band, 15), 6);
  });
});

describe("macroCalories", () => {
  it("uses standard energy values", () => {
    // Fat carries more than double the energy of carbs or protein.
    expect(macroCalories({ carbsG: 45, fatG: 8, proteinG: 22 })).toEqual({
      carbs: 180,
      fat: 72,
      protein: 88,
      total: 340,
    });
  });
});

describe("calculateMealScore", () => {
  it("returns undefined when there is nothing to score", () => {
    expect(score({ carbsG: 0, fatG: 0, proteinG: 0 })).toBeUndefined();
  });

  it("is deterministic", () => {
    const meal: MealScoreInput = { carbsG: 45, fatG: 8, proteinG: 22 };
    expect(score(meal)).toEqual(score(meal));
  });

  describe("has no calorie or portion axis", () => {
    it("scores a small and a large meal of identical composition the same", () => {
      // This is the point of Part B: a light breakfast is not a worse meal than
      // a big one with the same macro split. The old design scored portion fit
      // per meal and produced a bare zero on 29% of real meals.
      const small = score({ carbsG: 22.5, fatG: 4, proteinG: 11 });
      const large = score({ carbsG: 90, fatG: 16, proteinG: 44 });

      expect(small?.score).toBe(large?.score);
    });
  });

  describe("worked example — Meal 1 (yogurt, berries, granola)", () => {
    const meal: MealScoreInput = {
      carbsG: 45,
      fatG: 8,
      proteinG: 22,
      fiberG: 4,
      sugarG: 18,
      cookingMethod: "raw",
      confidence: 0.85,
    };

    it("matches the documented calories and percentages", () => {
      const result = score(meal);
      expect(result?.calories).toBe(340);
      expect(result?.percentages).toEqual({ carbsPct: 52.9, fatPct: 21.2, proteinPct: 25.9 });
    });

    it("matches the documented B7 modifiers exactly", () => {
      const result = score(meal);
      expect(result?.fiberBonus).toBe(1.7);
      expect(result?.sugarPenalty).toBeCloseTo(7.7, 1);
      expect(result?.cookingModifier).toBeCloseTo(4.3, 1);
    });

    it("computes closeness from the formula, not the worked example's figures", () => {
      // The worked example states carbs 53 and protein 41. Neither follows its
      // own closeness function, which gives 47.1 and 72.5 for these percentages.
      const result = score(meal);
      expect(result?.closeness.carbs).toBeCloseTo(47.1, 1);
      expect(result?.closeness.fat).toBe(100);
      expect(result?.closeness.protein).toBeCloseTo(72.5, 1);
    });
  });

  describe("worked example — Meal 2 (chicken burrito bowl)", () => {
    const meal: MealScoreInput = {
      carbsG: 60,
      fatG: 18,
      proteinG: 45,
      fiberG: 8,
      sugarG: 6,
      cookingMethod: "sauced_creamy",
      confidence: 0.7,
    };

    it("scores every macro inside its band", () => {
      const result = score(meal);
      expect(result?.calories).toBe(582);
      expect(result?.closeness).toEqual({ carbs: 100, fat: 100, protein: 100 });
      expect(result?.baseScore).toBe(100);
    });

    it("matches the documented B7 modifiers exactly", () => {
      const result = score(meal);
      expect(result?.fiberBonus).toBeCloseTo(2.8, 1);
      expect(result?.sugarPenalty).toBeCloseTo(2.1, 1);
      expect(result?.cookingModifier).toBeCloseTo(-3.5, 1);
    });

    it("caps at 100", () => {
      expect(score(meal)?.score).toBe(100);
    });
  });

  describe("worked example — Meal 3 (pasta, small chicken)", () => {
    const meal: MealScoreInput = {
      carbsG: 90,
      fatG: 12,
      proteinG: 20,
      fiberG: 5,
      sugarG: 10,
      cookingMethod: "baked",
      confidence: 0.8,
    };

    it("zeroes both out-of-band macros and scores fat from the formula", () => {
      const result = score(meal);
      expect(result?.calories).toBe(548);
      expect(result?.closeness.carbs).toBe(0);
      expect(result?.closeness.protein).toBe(0);

      // The worked example states fat closeness 96 and base 33.6. At 19.71% fat
      // against a 20-30 band the formula gives 98.05, so the base is 34.3.
      expect(result?.closeness.fat).toBeCloseTo(98.1, 1);
      expect(result?.baseScore).toBeCloseTo(34.3, 1);
    });

    it("matches the documented B7 modifiers exactly", () => {
      const result = score(meal);
      expect(result?.fiberBonus).toBeCloseTo(2, 1);
      expect(result?.sugarPenalty).toBeCloseTo(4, 1);
      expect(result?.cookingModifier).toBeCloseTo(-1.6, 1);
    });

    it("does not trigger the skew penalty at 65.7% carbs", () => {
      expect(score(meal)?.skewPenalty).toBe(0);
    });
  });

  describe("B5 skew penalty", () => {
    it("fires when one macro passes 70% of calories", () => {
      // Almost pure carbohydrate.
      const result = score({ carbsG: 100, fatG: 1, proteinG: 2 });
      expect(result?.percentages.carbsPct).toBeGreaterThan(70);
      expect(result?.skewPenalty).toBe(15);
    });

    it("does not fire just below the threshold", () => {
      const result = score({ carbsG: 90, fatG: 12, proteinG: 20 });
      expect(result?.skewPenalty).toBe(0);
    });

    it("catches a fat-dominated meal that individual bands would let pass", () => {
      const result = score({ carbsG: 5, fatG: 40, proteinG: 5 });
      expect(result?.skewPenalty).toBe(15);
    });
  });

  describe("B6 protein bonus", () => {
    it("rewards protein per calorie", () => {
      const lean = score({ carbsG: 30, fatG: 5, proteinG: 40 });
      const poor = score({ carbsG: 30, fatG: 5, proteinG: 5 });
      expect(lean?.proteinBonus).toBeGreaterThan(poor?.proteinBonus ?? 0);
    });

    it("is capped so it cannot mask other problems", () => {
      // A very high-protein meal should not buy its way past high sugar.
      const result = score({ carbsG: 1, fatG: 1, proteinG: 100 });
      expect(result?.proteinBonus).toBeLessThanOrEqual(defaultMealScorePolicy.protein.cap);
    });
  });

  describe("B7 treats a missing nutrient as unknown, never zero", () => {
    it("omits the fiber bonus when fiber was not recorded", () => {
      const result = score({ carbsG: 45, fatG: 8, proteinG: 22 });
      expect(result?.fiberBonus).toBeUndefined();
      expect(result?.sugarPenalty).toBeUndefined();
      expect(result?.cookingModifier).toBeUndefined();
    });

    it("does not punish a meal for having no sugar reading", () => {
      // Production has sugar on 0 of 1,295 rows, so this is the common case.
      const withoutSugar = score({ carbsG: 45, fatG: 8, proteinG: 22, fiberG: 4 });
      const withZeroSugar = score({ carbsG: 45, fatG: 8, proteinG: 22, fiberG: 4, sugarG: 0 });
      expect(withoutSugar?.score).toBe(withZeroSugar?.score);
    });

    it("scales every modifier by confidence", () => {
      const sure = score({ carbsG: 45, fatG: 8, proteinG: 22, fiberG: 10, confidence: 1 });
      const unsure = score({ carbsG: 45, fatG: 8, proteinG: 22, fiberG: 10, confidence: 0.5 });
      expect(unsure?.fiberBonus).toBeCloseTo((sure?.fiberBonus ?? 0) / 2, 5);
    });

    it("treats a missing confidence as full confidence", () => {
      const explicit = score({ carbsG: 45, fatG: 8, proteinG: 22, fiberG: 4, confidence: 1 });
      const absent = score({ carbsG: 45, fatG: 8, proteinG: 22, fiberG: 4 });
      expect(absent?.fiberBonus).toBe(explicit?.fiberBonus);
    });
  });

  describe("B8 clamping", () => {
    it("never goes below zero", () => {
      const result = score({
        carbsG: 200,
        fatG: 1,
        proteinG: 1,
        sugarG: 100,
        cookingMethod: "fried",
      });
      expect(result?.score).toBeGreaterThanOrEqual(0);
    });

    it("never goes above 100", () => {
      const result = score({
        carbsG: 40,
        fatG: 11,
        proteinG: 35,
        fiberG: 30,
        cookingMethod: "steamed",
      });
      expect(result?.score).toBeLessThanOrEqual(100);
    });
  });

  it("scores against the user's own bands, not fixed ones", () => {
    const fatLossTargets = calculateMacroTargets({
      heightCm: 165,
      weightKg: 65,
      ageYears: 28,
      sex: "female",
      activityLevel: "light",
      goal: "lose_gently",
    });

    const meal: MealScoreInput = { carbsG: 45, fatG: 8, proteinG: 22 };
    const forGain = calculateMealScore(meal, targets);
    const forLoss = calculateMealScore(meal, fatLossTargets);

    // Same plate, different targets, so a different verdict.
    expect(forGain?.score).not.toBe(forLoss?.score);
  });
});
