import { describe, expect, it } from "vitest";
import { calculateDailyScore, type DailyScoreMeal } from "./daily-score.js";
import { calculateMacroTargets } from "./macro-targets.js";
import { calculateMealScore } from "./meal-score.js";

/** The worked-example user: bands carbs 35–45, fat 20–30, protein 30–40. */
const targets = calculateMacroTargets({
  heightCm: 165,
  weightKg: 65,
  ageYears: 28,
  sex: "female",
  activityLevel: "light",
  goal: "gain_gently",
});

/** The worked example's Wednesday. */
const breakfast: DailyScoreMeal = {
  carbsG: 45,
  fatG: 8,
  proteinG: 22,
  fiberG: 4,
  sugarG: 18,
  cookingMethod: "raw",
  confidence: 0.85,
};
const lunch: DailyScoreMeal = {
  carbsG: 60,
  fatG: 18,
  proteinG: 45,
  fiberG: 8,
  sugarG: 6,
  cookingMethod: "sauced_creamy",
  confidence: 0.7,
};
const dinner: DailyScoreMeal = {
  carbsG: 90,
  fatG: 12,
  proteinG: 20,
  fiberG: 5,
  sugarG: 10,
  cookingMethod: "baked",
  confidence: 0.8,
};

const day = (meals: DailyScoreMeal[]) => calculateDailyScore(meals, targets);

describe("calculateDailyScore", () => {
  it("returns undefined when nothing has been logged", () => {
    // An untracked day is not a bad day, so the caller shows an empty state.
    expect(day([])).toBeUndefined();
  });

  it("is deterministic", () => {
    expect(day([breakfast, lunch, dinner])).toEqual(day([breakfast, lunch, dinner]));
  });

  describe("C1 aggregates grams, it does not average meal scores", () => {
    it("matches the worked example's daily totals", () => {
      const result = day([breakfast, lunch, dinner]);

      // carbs 195g, fat 38g, protein 87g -> 780 + 342 + 348
      expect(result?.calories).toBe(1470);
      expect(result?.percentages).toEqual({ carbsPct: 53.1, fatPct: 23.3, proteinPct: 23.7 });
    });

    it("catches a day that per-meal scores would hide", () => {
      // Two strong meals and one poor one. Averaging their scores would let them
      // cancel out; the day's combined profile is what the body experiences.
      const mealScores =
        [breakfast, lunch, dinner]
          .map((meal) => calculateMealScore(meal, targets)?.score ?? 0)
          .reduce((sum, score) => sum + score, 0) / 3;
      const dayScore = day([breakfast, lunch, dinner])?.score ?? 0;

      expect(dayScore).toBeLessThan(mealScores);
    });

    it("is unaffected by how the same food is split across meals", () => {
      const asOne = day([{ carbsG: 105, fatG: 26, proteinG: 67 }]);
      const asTwo = day([
        { carbsG: 45, fatG: 8, proteinG: 22 },
        { carbsG: 60, fatG: 18, proteinG: 45 },
      ]);

      expect(asOne?.percentages).toEqual(asTwo?.percentages);
      expect(asOne?.baseScore).toBe(asTwo?.baseScore);
    });
  });

  describe("C4 calorie adherence", () => {
    it("scores full marks inside the target window", () => {
      // Target 2,088. Hit it squarely with an on-band split.
      const onTarget = day([{ carbsG: 209, fatG: 58, proteinG: 183 }]);

      expect(onTarget?.caloriePctOfTarget).toBeGreaterThanOrEqual(90);
      expect(onTarget?.caloriePctOfTarget).toBeLessThanOrEqual(110);
      expect(onTarget?.calorieScore).toBe(100);
    });

    it("collapses to near zero when the day is far under target", () => {
      // The worked example's Wednesday is 1,470 kcal. Against the Part A target
      // of 2,088 that is 70.4%, which sits 19.6 points below the window and one
      // falloff (20) is the whole budget — so it scores 2, not the flat 0 the
      // worked example states.
      const result = day([breakfast, lunch, dinner]);

      expect(result?.caloriePctOfTarget).toBeCloseTo(70.4, 1);
      expect(result?.calorieScore).toBeLessThanOrEqual(5);
    });

    it("scores a hard zero once a full falloff outside the window", () => {
      const starved = day([{ carbsG: 20, fatG: 5, proteinG: 15 }]);
      expect(starved?.calorieScore).toBe(0);
    });

    it("penalises overeating as well as undereating", () => {
      const over = day([{ carbsG: 400, fatG: 110, proteinG: 350 }]);
      expect(over?.caloriePctOfTarget).toBeGreaterThan(110);
      expect(over?.calorieScore).toBeLessThan(100);
    });

    it("decays more gently than the macro bands do", () => {
      // Daily calorie totals swing more than macro ratios, so falloff is 20.
      const slightlyUnder = day([{ carbsG: 160, fatG: 45, proteinG: 140 }]);
      expect(slightlyUnder?.calorieScore).toBeGreaterThan(0);
    });
  });

  describe("C6 blends composition with calorie adherence", () => {
    it("weights composition 70% and calories 30%", () => {
      const result = day([breakfast, lunch, dinner]);
      const expected = 0.7 * (result?.composite ?? 0) + 0.3 * (result?.calorieScore ?? 0);

      expect(result?.score).toBe(Math.round(expected));
    });

    it("lets a well-composed but badly under-eaten day still lose marks", () => {
      const onBand = { carbsG: 40, fatG: 11, proteinG: 35 };
      const full = day([
        onBand,
        { carbsG: 80, fatG: 22, proteinG: 70 },
        { carbsG: 89, fatG: 25, proteinG: 78 },
      ]);
      const tiny = day([onBand]);

      expect(tiny?.baseScore).toBe(full?.baseScore);
      expect(tiny?.score).toBeLessThan(full?.score ?? 0);
    });
  });

  describe("C7 live and provisional", () => {
    it("scores from the very first logged meal", () => {
      // Product decision: immediate feedback beats waiting for a threshold.
      const result = day([breakfast]);

      expect(result).toBeDefined();
      expect(result?.mealsLogged).toBe(1);
      expect(result?.provisional).toBe(true);
    });

    it("can be marked final once the day is over", () => {
      const result = calculateDailyScore([breakfast], targets, undefined, { provisional: false });
      expect(result?.provisional).toBe(false);
    });
  });

  describe("C5 modifiers", () => {
    it("weights the cooking modifier by each meal's share of calories", () => {
      // A big fried dinner should move the day more than a small steamed side.
      const bigFried = day([
        { carbsG: 5, fatG: 2, proteinG: 3, cookingMethod: "steamed" },
        { carbsG: 100, fatG: 50, proteinG: 40, cookingMethod: "fried" },
      ]);

      expect(bigFried?.cookingModifier).toBeLessThan(0);
    });

    it("omits the cooking modifier when no meal reported a method", () => {
      const result = day([{ carbsG: 45, fatG: 8, proteinG: 22 }]);
      expect(result?.cookingModifier).toBeUndefined();
    });

    it("treats a missing nutrient as unknown across the whole day", () => {
      const noMicros = day([{ carbsG: 45, fatG: 8, proteinG: 22 }]);
      expect(noMicros?.fiberBonus).toBeUndefined();
      expect(noMicros?.sugarPenalty).toBeUndefined();
    });

    it("counts only the meals that reported a nutrient", () => {
      const partial = day([
        { carbsG: 45, fatG: 8, proteinG: 22, fiberG: 6 },
        { carbsG: 45, fatG: 8, proteinG: 22 },
      ]);

      // 6g of fiber, not 6 plus an assumed zero.
      expect(partial?.fiberBonus).toBeCloseTo(3, 5);
    });

    it("fires the skew penalty on a day dominated by one macro", () => {
      const allCarbs = day([{ carbsG: 300, fatG: 2, proteinG: 5 }]);
      expect(allCarbs?.skewPenalty).toBe(15);
    });
  });

  it("keeps the score within 0..100", () => {
    const awful = day([{ carbsG: 500, fatG: 5, proteinG: 2, sugarG: 200 }]);
    expect(awful?.score).toBeGreaterThanOrEqual(0);
    expect(awful?.score).toBeLessThanOrEqual(100);
  });
});
