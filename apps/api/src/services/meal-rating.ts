import type { MealScorePolicyContract, ScoreRatingContract } from "@logmyplate/contracts";
import {
  calculateDailyScore,
  calculateMacroTargets,
  calculateMealScore,
  calculateWeeklyScore,
  dominantCookingMethod,
  toScoreRating,
  type CookingMethodValue,
  type DailyScoreBreakdown,
  type MacroTotals,
  type MacroTargets,
} from "@logmyplate/domain";
import type { ProfileHealthTarget } from "../repositories/app-repository.js";
import { toDailyScorePolicy, toStarThresholds, toWeeklyScorePolicy } from "./meal-score-policy.js";

/**
 * Turns stored meals into the star ratings users actually see.
 *
 * Everything here is wrapped so a failure returns undefined rather than
 * throwing: scoring must never fail a journal load. An absent rating renders as
 * no card, which is a far better outcome than a 500 on the home screen.
 *
 * **No health target means no rating.** Parts B–D measure against bands derived
 * from the user's own height, weight, age, activity and goal. Without those
 * there is nothing honest to measure against, and inventing a default band would
 * hand someone a star count computed from a stranger's body.
 */

export type MealScoringItem = {
  nutrition: MacroTotals;
  portion?: { grams?: number };
  cookingMethod?: CookingMethodValue;
};

/** One day's worth of already-summed input, used for both daily and weekly. */
export type DayScoringInput = {
  date: string;
  items: MealScoringItem[];
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
 * `targets` is undefined for a user with no health target, which is the signal
 * to omit every rating rather than a reason to substitute defaults.
 */
export type RatingContext = {
  targets: MacroTargets | undefined;
  policy: MealScorePolicyContract;
};

/**
 * Collapses a meal's items into the single set of numbers Part B scores.
 *
 * Absent micronutrients stay absent: a meal where no item reported fiber must
 * not arrive as 0 g of fiber, which would read as a real measurement of a
 * fiber-free meal and apply a bonus of exactly nothing while looking deliberate.
 */
const sumForScoring = (items: MealScoringItem[]) => {
  let carbsG = 0;
  let fatG = 0;
  let proteinG = 0;
  let fiberG: number | undefined;
  let sugarG: number | undefined;

  for (const item of items) {
    carbsG += item.nutrition.carbsG || 0;
    fatG += item.nutrition.fatG || 0;
    proteinG += item.nutrition.proteinG || 0;
    if (typeof item.nutrition.fiberG === "number") fiberG = (fiberG ?? 0) + item.nutrition.fiberG;
    if (typeof item.nutrition.sugarG === "number") sugarG = (sugarG ?? 0) + item.nutrition.sugarG;
  }

  return {
    carbsG,
    fatG,
    proteinG,
    fiberG,
    sugarG,
    cookingMethod: dominantCookingMethod(
      items.map((item) => ({
        cookingMethod: item.cookingMethod,
        grams: item.portion?.grams,
      })),
    ),
  };
};

/**
 * Part B, as stars. Tap-through only — a single plate is not the headline.
 */
export const mealRating = (
  items: MealScoringItem[],
  context: RatingContext,
): ScoreRatingContract | undefined => {
  if (!context.targets || items.length === 0) return undefined;
  try {
    const breakdown = calculateMealScore(
      sumForScoring(items),
      context.targets,
      context.policy.meal,
    );
    if (!breakdown) return undefined;
    return toScoreRating(breakdown.score, "meal", {
      thresholds: toStarThresholds(context.policy),
    });
  } catch {
    return undefined;
  }
};

/**
 * Part C. Returns the breakdown as well as the rating because Part D averages
 * the daily *scores*, and recomputing them from the stars would throw away the
 * precision that makes a weekly average meaningful.
 */
export const dailyScoreFor = (
  meals: MealScoringItem[][],
  context: RatingContext,
  options: { provisional: boolean },
): DailyScoreBreakdown | undefined => {
  if (!context.targets || meals.length === 0) return undefined;
  try {
    return calculateDailyScore(
      meals.map((items) => sumForScoring(items)),
      context.targets,
      toDailyScorePolicy(context.policy),
      { provisional: options.provisional },
    );
  } catch {
    return undefined;
  }
};

export const dailyRating = (
  breakdown: DailyScoreBreakdown | undefined,
  context: RatingContext,
): ScoreRatingContract | undefined => {
  if (!breakdown) return undefined;
  try {
    return toScoreRating(breakdown.score, "daily", {
      provisional: breakdown.provisional,
      thresholds: toStarThresholds(context.policy),
    });
  } catch {
    return undefined;
  }
};

/**
 * Part D. Days with nothing logged are passed as undefined and excluded, never
 * scored zero — a gap in logging is not evidence of poor eating.
 */
export const weeklyRating = (
  dailyScores: (number | undefined)[],
  context: RatingContext,
): ScoreRatingContract | undefined => {
  if (!context.targets) return undefined;
  try {
    const breakdown = calculateWeeklyScore(
      dailyScores.map((score, index) => ({ date: String(index), dailyScore: score })),
      toWeeklyScorePolicy(context.policy),
    );
    if (!breakdown) return undefined;
    return toScoreRating(breakdown.score, "weekly", {
      thresholds: toStarThresholds(context.policy),
    });
  } catch {
    return undefined;
  }
};
