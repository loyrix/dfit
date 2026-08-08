import type { MealScorePolicyContract, ScoreRatingContract } from "@logmyplate/contracts";
import {
  applyConditionAdjustment,
  averageQualityScore,
  calculateFoodQuality,
  calculateMacroTargets,
  dominantCookingMethod,
  toScoreRating,
  type CookingMethodValue,
  type HealthFocus,
  type MacroTotals,
  type MacroTargets,
} from "@logmyplate/domain";
import type { ProfileHealthTarget } from "../repositories/app-repository.js";
import { toStarThresholds } from "./meal-score-policy.js";

/**
 * Turns stored meals into the star ratings users actually see.
 *
 * Everything here is wrapped so a failure returns undefined rather than
 * throwing: scoring must never fail a journal load. An absent rating renders as
 * no card, which is a far better outcome than a 500 on the home screen.
 *
 * **Each meal is rated on its own merits.** The rating answers "how healthy was
 * this?" from the food itself — nutrient quality per calorie — not "how well
 * does this match a full day's macro split". The day and the week are then the
 * average of those meal ratings, so the headline is a genuine summary of what
 * was eaten rather than a separate calculation that can disagree with every
 * meal beneath it.
 *
 * A health target is no longer required. Whether an orange is a good thing to
 * eat does not depend on someone's height, so a user who has not filled in
 * their profile still gets rated.
 */

export type MealScoringItem = {
  nutrition: MacroTotals;
  portion?: { grams?: number };
  cookingMethod?: CookingMethodValue;
};

export const toMacroTargets = (
  healthTarget: ProfileHealthTarget | null | undefined,
): MacroTargets | undefined => {
  if (!healthTarget) return undefined;
  try {
    return calculateMacroTargets({
      heightCm: healthTarget.heightCm,
      weightKg: healthTarget.weightKg,
      ageYears: healthTarget.ageYears,
      sex: healthTarget.sex,
      activityLevel: healthTarget.activityLevel,
      goal: healthTarget.goal,
      customMacroSplit: healthTarget.customMacroSplit,
    });
  } catch {
    return undefined;
  }
};

/**
 * Everything the rating functions need, resolved once per request.
 *
 * `targets` is kept because the calorie target still drives other surfaces,
 * even though the quality score no longer depends on it.
 */
export type RatingContext = {
  targets: MacroTargets | undefined;
  policy: MealScorePolicyContract;
  /**
   * The user's selected conditions. These never change the stored score, only
   * what this particular user is shown — a condition is a fact about the
   * person, not about the food.
   */
  healthFocus: HealthFocus[];
};

/**
 * Collapses a meal's items into one food to judge.
 *
 * Absent micronutrients stay absent: a meal where no item reported fiber must
 * not arrive as 0 g of fiber, which would read as a real measurement of a
 * fiber-free meal.
 */
const sumForScoring = (items: MealScoringItem[]) => {
  let calories = 0;
  let carbsG = 0;
  let fatG = 0;
  let proteinG = 0;
  let grams = 0;
  let fiberG: number | undefined;
  let sugarG: number | undefined;
  let sodiumMg: number | undefined;

  for (const item of items) {
    calories += item.nutrition.calories || 0;
    carbsG += item.nutrition.carbsG || 0;
    fatG += item.nutrition.fatG || 0;
    proteinG += item.nutrition.proteinG || 0;
    grams += item.portion?.grams || 0;
    if (typeof item.nutrition.fiberG === "number") fiberG = (fiberG ?? 0) + item.nutrition.fiberG;
    if (typeof item.nutrition.sugarG === "number") sugarG = (sugarG ?? 0) + item.nutrition.sugarG;
    if (typeof item.nutrition.sodiumMg === "number") {
      sodiumMg = (sodiumMg ?? 0) + item.nutrition.sodiumMg;
    }
  }

  return {
    // Some older rows carry no calorie value; deriving it keeps them scoreable.
    calories: calories > 0 ? calories : carbsG * 4 + proteinG * 4 + fatG * 9,
    carbsG,
    fatG,
    proteinG,
    fiberG,
    sugarG,
    sodiumMg,
    grams: grams > 0 ? grams : undefined,
    cookingMethod: dominantCookingMethod(
      items.map((item) => ({
        cookingMethod: item.cookingMethod,
        grams: item.portion?.grams,
      })),
    ),
  };
};

/**
 * The 0-100 quality score for one meal, as this user should see it.
 *
 * The universal score is computed first and stays the canonical measure of the
 * food; the condition adjustment is layered on top for display. Both are
 * derived on read rather than stored, which is what makes a condition change
 * take effect immediately and retroactively instead of leaving a trail of
 * scores computed under a condition the user no longer has.
 */
export const mealQualityScore = (
  items: MealScoringItem[],
  context: RatingContext,
): number | undefined => {
  if (items.length === 0) return undefined;
  try {
    const food = sumForScoring(items);
    const base = calculateFoodQuality(food, context.policy.quality);
    if (!base) return undefined;
    return applyConditionAdjustment(base, food, context.healthFocus).score;
  } catch {
    return undefined;
  }
};

/** The food's own score, ignoring who is looking at it. For analytics. */
export const universalMealScore = (
  items: MealScoringItem[],
  context: RatingContext,
): number | undefined => {
  if (items.length === 0) return undefined;
  try {
    return calculateFoodQuality(sumForScoring(items), context.policy.quality)?.score;
  } catch {
    return undefined;
  }
};

/** How healthy this meal was, as stars. Reachable by opening the meal. */
export const mealRating = (
  items: MealScoringItem[],
  context: RatingContext,
): ScoreRatingContract | undefined => {
  const score = mealQualityScore(items, context);
  if (score === undefined) return undefined;
  try {
    return toScoreRating(score, "meal", { thresholds: toStarThresholds(context.policy) });
  } catch {
    return undefined;
  }
};

/**
 * The day, as the average of its meal scores.
 *
 * Averaging rather than re-scoring the day's combined nutrition is what keeps
 * the headline honest: the number on the home screen is the same one the meals
 * beneath it produce, so the two can never contradict each other.
 */
export const dailyQualityScore = (
  meals: MealScoringItem[][],
  context: RatingContext,
): number | undefined => {
  const scores = meals
    .map((items) => mealQualityScore(items, context))
    .filter((score): score is number => score !== undefined);
  return averageQualityScore(scores);
};

export const dailyRating = (
  score: number | undefined,
  context: RatingContext,
  options: { provisional: boolean },
): ScoreRatingContract | undefined => {
  if (score === undefined) return undefined;
  try {
    return toScoreRating(score, "daily", {
      provisional: options.provisional,
      thresholds: toStarThresholds(context.policy),
    });
  } catch {
    return undefined;
  }
};

/**
 * The week, as the average of its daily averages.
 *
 * Days with nothing logged are passed as undefined and excluded, never scored
 * zero — a gap in logging is not evidence of poor eating.
 */
export const weeklyRating = (
  dailyScores: (number | undefined)[],
  context: RatingContext,
): ScoreRatingContract | undefined => {
  try {
    const scored = dailyScores.filter((score): score is number => score !== undefined);
    const average = averageQualityScore(scored);
    if (average === undefined) return undefined;
    return toScoreRating(average, "weekly", { thresholds: toStarThresholds(context.policy) });
  } catch {
    return undefined;
  }
};
