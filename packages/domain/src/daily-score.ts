/**
 * Part C — daily score.
 *
 * Implements `docs/meal-health-score-logic.md` Part C. This is the **primary**
 * rating a user sees: a single plate should not be the headline judgement, and a
 * day is where calorie adherence first becomes a meaningful question.
 *
 * Two structural choices worth keeping in mind:
 *
 * 1. **Grams are summed, then scored.** Averaging per-meal scores would let a
 *    great breakfast and a poor lunch cancel out evenly, when what matters is
 *    the day's combined profile — which is what the body actually experiences.
 * 2. **Calorie adherence is blended, not bolted on.** "Did I eat roughly the
 *    right amount today" is a pillar of the answer, not a minor bonus like
 *    fiber, so it gets an explicit 30% rather than becoming another modifier.
 */

import type { MacroTargets } from "./macro-targets.js";
import {
  closeness,
  defaultMealScorePolicy,
  macroCalories,
  type CookingMethod,
  type MealScorePolicy,
} from "./meal-score.js";

/** One logged meal's raw contribution to the day. */
export type DailyScoreMeal = {
  carbsG: number;
  fatG: number;
  proteinG: number;
  fiberG?: number;
  sugarG?: number;
  cookingMethod?: CookingMethod;
  confidence?: number;
};

export type DailyScorePolicy = {
  meal: MealScorePolicy;
  /** C4. Full marks anywhere inside this percentage window of the target. */
  calorieWindow: { min: number; max: number };
  /**
   * C4. Wider than the macro falloff on purpose: daily calorie totals swing more
   * day to day than macro ratios do, so a stricter decay would punish normal
   * variation.
   */
  calorieFalloff: number;
  /** C6. How much of the day is composition versus calorie adherence. */
  blend: { composite: number; calories: number };
};

export const defaultDailyScorePolicy: DailyScorePolicy = {
  meal: defaultMealScorePolicy,
  calorieWindow: { min: 90, max: 110 },
  calorieFalloff: 20,
  blend: { composite: 0.7, calories: 0.3 },
};

export type DailyScoreBreakdown = {
  /** 0–100, internal only. Users see stars (Part E). */
  score: number;
  mealsLogged: number;
  calories: number;
  /** True until the day is over: the rating is live and will move. */
  provisional: boolean;
  percentages: { carbsPct: number; fatPct: number; proteinPct: number };
  closeness: { carbs: number; fat: number; protein: number };
  baseScore: number;
  calorieScore: number;
  /** Day total as a percentage of the target, for copy like "under target". */
  caloriePctOfTarget: number;
  proteinBonus: number;
  skewPenalty: number;
  fiberBonus?: number;
  sugarPenalty?: number;
  cookingModifier?: number;
  composite: number;
};

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

const round1 = (value: number): number => Math.round((value + Number.EPSILON) * 10) / 10;

const isPresent = (value: number | undefined): value is number =>
  value !== undefined && Number.isFinite(value) && value >= 0;

/**
 * Sums a micronutrient across the day while preserving "unknown".
 *
 * Undefined when no meal reported it, so its modifier is skipped rather than
 * treated as zero. Production currently has sugar on almost no rows, so this is
 * the normal case rather than an edge case.
 */
const sumOptional = (
  meals: DailyScoreMeal[],
  pick: (meal: DailyScoreMeal) => number | undefined,
): number | undefined => {
  let total: number | undefined;
  for (const meal of meals) {
    const value = pick(meal);
    if (isPresent(value)) total = (total ?? 0) + value;
  }
  return total;
};

/** Mean confidence across meals that reported one; 1 when none did. */
const averageConfidence = (meals: DailyScoreMeal[]): number => {
  const values = meals.map((meal) => meal.confidence).filter(isPresent);
  if (values.length === 0) return 1;
  return clamp(values.reduce((sum, value) => sum + value, 0) / values.length, 0, 1);
};

/**
 * C5. Calorie-weighted, not a simple average: a large fried dinner should move
 * the day's cooking modifier more than a small steamed side.
 */
const cookingModifierForDay = (
  meals: DailyScoreMeal[],
  policy: DailyScorePolicy,
  confidence: number,
): number | undefined => {
  const withMethod = meals
    .map((meal) => ({ meal, calories: macroCalories(meal).total }))
    .filter((entry) => entry.meal.cookingMethod !== undefined && entry.calories > 0);
  if (withMethod.length === 0) return undefined;

  const totalCalories = withMethod.reduce((sum, entry) => sum + entry.calories, 0);
  if (totalCalories <= 0) return undefined;

  const weighted = withMethod.reduce((sum, entry) => {
    const base = policy.meal.cooking[entry.meal.cookingMethod as CookingMethod];
    return sum + base * (entry.calories / totalCalories);
  }, 0);

  return weighted * confidence;
};

/**
 * Scores a day from the meals logged so far.
 *
 * Returns undefined when nothing has been logged, so the caller shows an empty
 * state rather than a zero — an untracked day is not a bad day.
 *
 * `provisional` is true while the day is still in progress. The rating is shown
 * from the very first meal by product decision: immediate feedback beats waiting
 * for a data threshold, and the framing carries the caveat.
 */
export const calculateDailyScore = (
  meals: DailyScoreMeal[],
  targets: Pick<MacroTargets, "bands" | "targetDailyCalories">,
  policy: DailyScorePolicy = defaultDailyScorePolicy,
  options: { provisional?: boolean } = {},
): DailyScoreBreakdown | undefined => {
  if (meals.length === 0) return undefined;

  // C1. Sum grams first, then score the total.
  const dayCarbsG = meals.reduce((sum, meal) => sum + (meal.carbsG || 0), 0);
  const dayFatG = meals.reduce((sum, meal) => sum + (meal.fatG || 0), 0);
  const dayProteinG = meals.reduce((sum, meal) => sum + (meal.proteinG || 0), 0);

  // C2
  const calories = macroCalories({ carbsG: dayCarbsG, fatG: dayFatG, proteinG: dayProteinG });
  if (!(calories.total > 0)) return undefined;

  const carbsPct = (calories.carbs / calories.total) * 100;
  const fatPct = (calories.fat / calories.total) * 100;
  const proteinPct = (calories.protein / calories.total) * 100;

  // C3. Same closeness and same bands as a single meal, so "balanced" means one
  // thing at every level; only the input data changes.
  const closenessCarbs = closeness(carbsPct, targets.bands.carbsPct, policy.meal.falloff);
  const closenessFat = closeness(fatPct, targets.bands.fatPct, policy.meal.falloff);
  const closenessProtein = closeness(proteinPct, targets.bands.proteinPct, policy.meal.falloff);

  const baseScore =
    policy.meal.weights.carbs * closenessCarbs +
    policy.meal.weights.fat * closenessFat +
    policy.meal.weights.protein * closenessProtein;

  // C4. The question a single meal cannot answer.
  const caloriePctOfTarget =
    targets.targetDailyCalories > 0 ? (calories.total / targets.targetDailyCalories) * 100 : 0;
  const calorieScore = closeness(caloriePctOfTarget, policy.calorieWindow, policy.calorieFalloff);

  // C5
  const dominant = Math.max(carbsPct, fatPct, proteinPct);
  const skewPenalty = dominant > policy.meal.skew.thresholdPct ? policy.meal.skew.penalty : 0;

  const proteinDensity = (dayProteinG / calories.total) * 100;
  const proteinBonus = Math.min(
    policy.meal.protein.cap,
    Math.max(0, proteinDensity * policy.meal.protein.scalingFactor),
  );

  const confidence = averageConfidence(meals);

  const dayFiberG = sumOptional(meals, (meal) => meal.fiberG);
  const fiberBonus = isPresent(dayFiberG)
    ? clamp(dayFiberG * policy.meal.fiber.perGram, 0, policy.meal.fiber.cap) * confidence
    : undefined;

  const daySugarG = sumOptional(meals, (meal) => meal.sugarG);
  const sugarPenalty = isPresent(daySugarG)
    ? clamp(daySugarG * policy.meal.sugar.perGram, 0, policy.meal.sugar.cap) * confidence
    : undefined;

  const cookingModifier = cookingModifierForDay(meals, policy, confidence);

  // C6
  const composite =
    baseScore +
    proteinBonus -
    skewPenalty +
    (fiberBonus ?? 0) -
    (sugarPenalty ?? 0) +
    (cookingModifier ?? 0);

  const score = clamp(
    policy.blend.composite * composite + policy.blend.calories * calorieScore,
    0,
    100,
  );

  return {
    score: Math.round(score),
    mealsLogged: meals.length,
    calories: Math.round(calories.total),
    provisional: options.provisional ?? true,
    percentages: {
      carbsPct: round1(carbsPct),
      fatPct: round1(fatPct),
      proteinPct: round1(proteinPct),
    },
    closeness: {
      carbs: round1(closenessCarbs),
      fat: round1(closenessFat),
      protein: round1(closenessProtein),
    },
    baseScore: round1(baseScore),
    calorieScore: round1(calorieScore),
    caloriePctOfTarget: round1(caloriePctOfTarget),
    proteinBonus: round1(proteinBonus),
    skewPenalty,
    fiberBonus: fiberBonus === undefined ? undefined : round1(fiberBonus),
    sugarPenalty: sugarPenalty === undefined ? undefined : round1(sugarPenalty),
    cookingModifier: cookingModifier === undefined ? undefined : round1(cookingModifier),
    composite: round1(composite),
  };
};
