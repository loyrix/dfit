import { describe, expect, it } from "vitest";
import {
  defaultMealScorePolicyConfig,
  mealScorePolicySchema,
  scoreRatingSchema,
} from "./score-rating.js";

describe("mealScorePolicySchema", () => {
  /**
   * The last-resort fallback everywhere in the API is `parse({})`. If the schema
   * cannot parse its own defaults, that fallback throws instead of falling back,
   * and every journal request 500s rather than quietly omitting a star. That is
   * exactly what happened in Phase 8 when the calorie window's 110 default hit a
   * bound of 100, so this is a regression test, not a tautology.
   */
  it("parses its own defaults", () => {
    expect(() => defaultMealScorePolicyConfig()).not.toThrow();
  });

  it("defaults match the values the domain ships", () => {
    const policy = defaultMealScorePolicyConfig();
    expect(policy.meal.falloff).toBe(15);
    expect(policy.meal.weights).toEqual({ carbs: 0.4, fat: 0.35, protein: 0.25 });
    expect(policy.daily.calorieWindow).toEqual({ min: 90, max: 110 });
    expect(policy.daily.blend).toEqual({ composite: 0.7, calories: 0.3 });
    expect(policy.weekly.goodDayThreshold).toBe(61);
    expect(policy.stars).toEqual({ oneStar: 20, twoStar: 40, threeStar: 60, fourStar: 80 });
  });

  it("allows a calorie window above 100 percent of target", () => {
    // Eating over target is a normal state, not an invalid one.
    const parsed = mealScorePolicySchema.parse({
      daily: { calorieWindow: { min: 85, max: 130 } },
    });
    expect(parsed.daily.calorieWindow).toEqual({ min: 85, max: 130 });
  });

  it("fills in the untouched half of a partially edited row", () => {
    // An operator loosening only the star cutoffs must not blank everything else.
    const parsed = mealScorePolicySchema.parse({ stars: { oneStar: 10 } });
    expect(parsed.stars).toEqual({ oneStar: 10, twoStar: 40, threeStar: 60, fourStar: 80 });
    expect(parsed.meal.falloff).toBe(15);
  });
});

describe("scoreRatingSchema", () => {
  it("carries no numeric score", () => {
    // The 0-100 value is internal. If it is not in the shape, no client can
    // render it by accident.
    expect(Object.keys(scoreRatingSchema.shape)).toEqual([
      "stars",
      "message",
      "level",
      "provisional",
    ]);
  });

  it("defaults provisional to false", () => {
    const parsed = scoreRatingSchema.parse({ stars: 3, message: "ok", level: "meal" });
    expect(parsed.provisional).toBe(false);
  });

  it("rejects a star count outside 1-5", () => {
    expect(() => scoreRatingSchema.parse({ stars: 0, message: "x", level: "daily" })).toThrow();
    expect(() => scoreRatingSchema.parse({ stars: 6, message: "x", level: "daily" })).toThrow();
  });
});
