import { describe, expect, it } from "vitest";
import {
  calculateBmr,
  calculateMacroTargets,
  type MacroActivityLevel,
  type MacroGoal,
  type MacroTargetInput,
} from "./macro-targets.js";

/** The worked-example user: female, 28, 65kg, 165cm, lightly active, muscle gain. */
const workedExample: MacroTargetInput = {
  heightCm: 165,
  weightKg: 65,
  ageYears: 28,
  sex: "female",
  activityLevel: "light",
  goal: "gain_gently",
};

describe("calculateBmr", () => {
  it("follows Mifflin-St Jeor for female", () => {
    // 10(65) + 6.25(165) - 5(28) - 161
    expect(calculateBmr(workedExample)).toBeCloseTo(1380.25, 2);
  });

  it("follows Mifflin-St Jeor for male", () => {
    expect(calculateBmr({ ...workedExample, sex: "male" })).toBeCloseTo(1546.25, 2);
  });

  it("averages the two when sex is not specified", () => {
    const female = calculateBmr({ ...workedExample, sex: "female" });
    const male = calculateBmr({ ...workedExample, sex: "male" });
    expect(calculateBmr({ ...workedExample, sex: "not_specified" })).toBeCloseTo(
      (female + male) / 2,
      2,
    );
  });
});

describe("calculateMacroTargets", () => {
  it("reproduces the worked example's BMI, centres, tolerance and bands", () => {
    const result = calculateMacroTargets(workedExample);

    // These all agree with meal-health-score-worked-example.md.
    expect(result.bmi).toBe(23.9);
    expect(result.centers).toEqual({ carbsPct: 40, fatPct: 25, proteinPct: 35 });
    expect(result.tolerance).toBe(5);
    expect(result.bands).toEqual({
      carbsPct: { min: 35, max: 45 },
      fatPct: { min: 20, max: 30 },
      proteinPct: { min: 30, max: 40 },
    });
  });

  it("computes calories from the formula, not the worked example's arithmetic", () => {
    const result = calculateMacroTargets(workedExample);

    // The worked example states BMR 1,346 / TDEE 1,851 / target 2,036. That BMR
    // does not follow Mifflin-St Jeor (it matches a height of ~159.5cm) and the
    // error cascades. Part A as written gives these values.
    expect(result.bmrCalories).toBeCloseTo(1380.3, 1);
    expect(result.tdeeCalories).toBeCloseTo(1897.8, 1);
    expect(result.targetDailyCalories).toBe(2088);
  });

  describe("A3 activity factors", () => {
    const factors: Array<[MacroActivityLevel, number]> = [
      ["sedentary", 1.2],
      ["light", 1.375],
      ["moderate", 1.55],
      ["active", 1.725],
      ["extra_active", 1.9],
    ];

    for (const [level, factor] of factors) {
      it(`scales TDEE by ${factor} for ${level}`, () => {
        const result = calculateMacroTargets({ ...workedExample, activityLevel: level });
        expect(result.tdeeCalories).toBeCloseTo(1380.25 * factor, 1);
      });
    }
  });

  describe("A4 goal factors are multiplicative", () => {
    const factors: Array<[MacroGoal, number]> = [
      ["lose_gently", 0.8],
      ["maintain", 1.0],
      ["gain_gently", 1.1],
    ];

    for (const [goal, factor] of factors) {
      it(`applies x${factor} for ${goal}`, () => {
        const result = calculateMacroTargets({ ...workedExample, goal });
        expect(result.targetDailyCalories).toBe(Math.round(1380.25 * 1.375 * factor));
      });
    }
  });

  describe("A5 macro centres by goal x activity", () => {
    // Every cell of the lookup table, so a typo cannot slip through.
    const cases: Array<[MacroGoal, MacroActivityLevel, number, number, number]> = [
      ["lose_gently", "sedentary", 30, 30, 40],
      ["lose_gently", "light", 30, 30, 40],
      ["lose_gently", "moderate", 35, 25, 40],
      ["lose_gently", "active", 35, 25, 40],
      ["lose_gently", "extra_active", 35, 25, 40],
      ["gain_gently", "sedentary", 40, 25, 35],
      ["gain_gently", "light", 40, 25, 35],
      ["gain_gently", "moderate", 45, 25, 30],
      ["gain_gently", "active", 45, 25, 30],
      ["gain_gently", "extra_active", 45, 25, 30],
      ["maintain", "sedentary", 45, 30, 25],
      ["maintain", "light", 45, 30, 25],
      ["maintain", "moderate", 50, 25, 25],
      ["maintain", "active", 50, 25, 25],
      ["maintain", "extra_active", 50, 25, 25],
    ];

    for (const [goal, activityLevel, carbsPct, fatPct, proteinPct] of cases) {
      it(`${goal} + ${activityLevel} -> ${carbsPct}/${fatPct}/${proteinPct}`, () => {
        const result = calculateMacroTargets({ ...workedExample, goal, activityLevel });
        expect(result.centers).toEqual({ carbsPct, fatPct, proteinPct });
      });
    }

    it("sums centres to 100 in every cell", () => {
      for (const [goal, activityLevel] of cases) {
        const { centers } = calculateMacroTargets({ ...workedExample, goal, activityLevel });
        expect(centers.carbsPct + centers.fatPct + centers.proteinPct).toBe(100);
      }
    });
  });

  describe("A6 BMI nudge", () => {
    it("shifts carbs to protein when BMI is 30 or above", () => {
      // 95kg at 165cm -> BMI 34.9
      const result = calculateMacroTargets({ ...workedExample, weightKg: 95 });

      expect(result.bmi).toBeGreaterThanOrEqual(30);
      expect(result.centers).toEqual({ carbsPct: 35, fatPct: 25, proteinPct: 40 });
    });

    it("shifts toward carbs and fat when BMI is under 18.5", () => {
      // 45kg at 165cm -> BMI 16.5
      const result = calculateMacroTargets({ ...workedExample, weightKg: 45 });

      expect(result.bmi).toBeLessThan(18.5);
      expect(result.centers).toEqual({ carbsPct: 45, fatPct: 28, proteinPct: 32 });
    });

    it("leaves a normal BMI untouched", () => {
      const result = calculateMacroTargets(workedExample);
      expect(result.centers).toEqual({ carbsPct: 40, fatPct: 25, proteinPct: 35 });
    });

    it("is additive, so goal and activity still drive the shape", () => {
      // An obese maintenance user keeps maintenance's fat centre; only the
      // carb/protein pair moves.
      const result = calculateMacroTargets({
        ...workedExample,
        weightKg: 95,
        goal: "maintain",
        activityLevel: "sedentary",
      });
      expect(result.centers).toEqual({ carbsPct: 40, fatPct: 30, proteinPct: 30 });
    });
  });

  describe("A7 tolerance", () => {
    it("is tighter for goal-driven users", () => {
      expect(calculateMacroTargets({ ...workedExample, goal: "lose_gently" }).tolerance).toBe(5);
      expect(calculateMacroTargets({ ...workedExample, goal: "gain_gently" }).tolerance).toBe(5);
    });

    it("is looser for maintenance", () => {
      expect(calculateMacroTargets({ ...workedExample, goal: "maintain" }).tolerance).toBe(8);
    });
  });

  describe("A9 manual override", () => {
    it("replaces the computed centres outright", () => {
      const result = calculateMacroTargets({
        ...workedExample,
        customMacroSplit: { carbsPct: 50, fatPct: 20, proteinPct: 30 },
      });

      expect(result.customSplitApplied).toBe(true);
      expect(result.centers).toEqual({ carbsPct: 50, fatPct: 20, proteinPct: 30 });
      expect(result.tolerance).toBe(5);
      expect(result.bands.carbsPct).toEqual({ min: 45, max: 55 });
    });

    it("ignores the BMI nudge, since an explicit choice outranks it", () => {
      const result = calculateMacroTargets({
        ...workedExample,
        weightKg: 95,
        customMacroSplit: { carbsPct: 50, fatPct: 20, proteinPct: 30 },
      });

      expect(result.centers.carbsPct).toBe(50);
    });

    it("reports no override when none was given", () => {
      expect(calculateMacroTargets(workedExample).customSplitApplied).toBe(false);
    });
  });

  it("is deterministic", () => {
    expect(calculateMacroTargets(workedExample)).toEqual(calculateMacroTargets(workedExample));
  });
});
