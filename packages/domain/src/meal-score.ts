/**
 * Part B — per-meal score.
 *
 * Implements `docs/meal-health-score-logic.md` Part B. Scores a single meal on
 * **composition only**: how its calories are split between carbs, fat and
 * protein, adjusted by fiber, sugar and cooking method.
 *
 * There is deliberately **no calorie or portion axis here.** A single meal's
 * calorie count says almost nothing on its own — someone eating a light
 * breakfast is not doing anything wrong — so calorie adherence belongs at the
 * daily level (Part C) where a target is meaningful. The previous scoring design
 * put portion fit in the per-meal score and produced a bare zero on 29% of real
 * meals with nothing useful to tell the user; removing the axis fixes that
 * structurally rather than by rewording it.
 *
 * Everything here is pure and deterministic. Numbers are internal: users see
 * stars and a message (Part E).
 */

import type { MacroBand, MacroTargets } from "./macro-targets.js";

/**
 * B7 cooking method. Distinct from the existing `preparation` field
 * (home/restaurant/packaged), which describes provenance rather than technique.
 */
export type CookingMethod =
  | "fried"
  | "sauced_creamy"
  | "baked"
  | "grilled"
  | "steamed"
  | "raw"
  | "unknown";

export type MealScoreInput = {
  carbsG: number;
  fatG: number;
  proteinG: number;
  /** Absent means unknown, which contributes nothing rather than zero. */
  fiberG?: number;
  sugarG?: number;
  cookingMethod?: CookingMethod;
  /**
   * 0–1. Scales every less-trusted modifier so a shaky estimate cannot swing the
   * score. The worked example applies one confidence per meal to fiber, sugar
   * and cooking alike, so a single value is all this needs.
   */
  confidence?: number;
};

export type MealScorePolicy = {
  /** B3. Percentage points outside the band at which closeness reaches zero. */
  falloff: number;
  /** B4. Carb imbalance is the most visible driver, so it weighs most. */
  weights: { carbs: number; fat: number; protein: number };
  /** B5. Flat penalty when one macro dominates the meal. */
  skew: { thresholdPct: number; penalty: number };
  /**
   * B6. The spec leaves `scaling_factor` undefined and its worked example implies
   * three different values (1.005, 1.293, 0.795). 1.0 matches its Meal 1 exactly
   * and is the natural reading, so it is the default — and tunable, because this
   * is a guess either way.
   */
  protein: { scalingFactor: number; cap: number };
  /** B7 soft caps. Each modifier is bounded so no single estimate dominates. */
  fiber: { perGram: number; cap: number };
  sugar: { perGram: number; cap: number };
  cooking: Record<CookingMethod, number>;
};

export const defaultMealScorePolicy: MealScorePolicy = {
  falloff: 15,
  weights: { carbs: 0.4, fat: 0.35, protein: 0.25 },
  skew: { thresholdPct: 70, penalty: 15 },
  protein: { scalingFactor: 1, cap: 10 },
  // (fiberG / 10) * 5, capped at 8
  fiber: { perGram: 0.5, cap: 8 },
  // (sugarG / 20) * 10, capped at 12
  sugar: { perGram: 0.5, cap: 12 },
  cooking: {
    fried: -8,
    sauced_creamy: -5,
    baked: -2,
    grilled: 3,
    steamed: 5,
    raw: 5,
    unknown: 0,
  },
};

export type MealScoreBreakdown = {
  /** 0–100, internal only. */
  score: number;
  calories: number;
  percentages: { carbsPct: number; fatPct: number; proteinPct: number };
  /** B3 closeness per macro. */
  closeness: { carbs: number; fat: number; protein: number };
  baseScore: number;
  proteinBonus: number;
  skewPenalty: number;
  /** Undefined when the nutrient was never recorded, rather than 0. */
  fiberBonus?: number;
  sugarPenalty?: number;
  cookingModifier?: number;
};

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

const round1 = (value: number): number => Math.round((value + Number.EPSILON) * 10) / 10;

const isPresent = (value: number | undefined): value is number =>
  value !== undefined && Number.isFinite(value) && value >= 0;

/**
 * B3. 100 inside the band, decaying smoothly outside it.
 *
 * Smooth rather than a cliff so 55% and 56% carbs do not score wildly
 * differently. Reused unchanged by Part C so "balanced" means the same thing for
 * a meal and for a day.
 */
export const closeness = (value: number, band: MacroBand, falloff: number): number => {
  if (falloff <= 0) return value >= band.min && value <= band.max ? 100 : 0;
  if (value >= band.min && value <= band.max) return 100;
  const distance = value < band.min ? band.min - value : value - band.max;
  return Math.max(0, 100 - (distance / falloff) * 100);
};

/** B1. Standard energy values, so all three macros are comparable. */
export const macroCalories = (input: {
  carbsG: number;
  fatG: number;
  proteinG: number;
}): { carbs: number; fat: number; protein: number; total: number } => {
  const carbs = input.carbsG * 4;
  const fat = input.fatG * 9;
  const protein = input.proteinG * 4;
  return { carbs, fat, protein, total: carbs + fat + protein };
};

/**
 * Scores one meal against the user's target bands.
 *
 * Returns undefined when there is nothing to score, so callers hide the rating
 * rather than render a meaningless zero.
 */
export const calculateMealScore = (
  input: MealScoreInput,
  targets: Pick<MacroTargets, "bands">,
  policy: MealScorePolicy = defaultMealScorePolicy,
): MealScoreBreakdown | undefined => {
  const calories = macroCalories(input);
  if (!(calories.total > 0)) return undefined;

  // B2
  const carbsPct = (calories.carbs / calories.total) * 100;
  const fatPct = (calories.fat / calories.total) * 100;
  const proteinPct = (calories.protein / calories.total) * 100;

  // B3
  const closenessCarbs = closeness(carbsPct, targets.bands.carbsPct, policy.falloff);
  const closenessFat = closeness(fatPct, targets.bands.fatPct, policy.falloff);
  const closenessProtein = closeness(proteinPct, targets.bands.proteinPct, policy.falloff);

  // B4
  const baseScore =
    policy.weights.carbs * closenessCarbs +
    policy.weights.fat * closenessFat +
    policy.weights.protein * closenessProtein;

  // B5. A catch-all: closeness scores each macro independently, so a meal can
  // look acceptable on two of them while still being wildly lopsided.
  const dominant = Math.max(carbsPct, fatPct, proteinPct);
  const skewPenalty = dominant > policy.skew.thresholdPct ? policy.skew.penalty : 0;

  // B6. Protein per calorie, as a proxy for nutrient density over empty calories.
  const proteinDensity = (input.proteinG / calories.total) * 100;
  const proteinBonus = Math.min(
    policy.protein.cap,
    Math.max(0, proteinDensity * policy.protein.scalingFactor),
  );

  // B7. Confidence-scaled and hard-capped, so an uncertain estimate contributes
  // signal without being able to dominate. Absent nutrients stay absent.
  const confidence = isPresent(input.confidence) ? clamp(input.confidence, 0, 1) : 1;

  const fiberBonus = isPresent(input.fiberG)
    ? clamp(input.fiberG * policy.fiber.perGram, 0, policy.fiber.cap) * confidence
    : undefined;

  const sugarPenalty = isPresent(input.sugarG)
    ? clamp(input.sugarG * policy.sugar.perGram, 0, policy.sugar.cap) * confidence
    : undefined;

  const cookingModifier =
    input.cookingMethod === undefined
      ? undefined
      : policy.cooking[input.cookingMethod] * confidence;

  // B8
  const score = clamp(
    baseScore +
      proteinBonus -
      skewPenalty +
      (fiberBonus ?? 0) -
      (sugarPenalty ?? 0) +
      (cookingModifier ?? 0),
    0,
    100,
  );

  return {
    score: Math.round(score),
    calories: Math.round(calories.total),
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
    proteinBonus: round1(proteinBonus),
    skewPenalty,
    fiberBonus: fiberBonus === undefined ? undefined : round1(fiberBonus),
    sugarPenalty: sugarPenalty === undefined ? undefined : round1(sugarPenalty),
    cookingModifier: cookingModifier === undefined ? undefined : round1(cookingModifier),
  };
};
