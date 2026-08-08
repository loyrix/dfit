/**
 * How healthy a logged food actually is.
 *
 * This replaces macro-band matching for per-meal ratings, which was the wrong
 * question. That approach scored every item against the user's *whole-day*
 * macro split, so a mandarin orange — 91% of its calories from carbohydrate —
 * scored 0/100 and one star. So did an apple. So did almonds. An orange is 91%
 * carbohydrate because that is what an orange is, not because anything is wrong
 * with it. Balance is a property of a day, never of a single fruit.
 *
 * What this measures instead is nutrient quality per unit of energy, which is
 * the shape of the question people actually mean by "is this healthy":
 *
 * - **Energy density** (kcal per 100g) is the strongest single signal available
 *   from the data we hold. Fruit, vegetables and broth-based food sit at
 *   30–80 kcal/100g; fried and heavily processed food sits at 350–550. It also
 *   needs no ingredient list, which we do not have.
 * - **Fiber and protein per calorie** reward foods that carry something besides
 *   energy.
 * - **Sugar and sodium per calorie** penalise the two things most consistently
 *   over-consumed.
 * - **Cooking method** adjusts for what was done to the food.
 *
 * **Known limits, deliberately not papered over.** Without an ingredient list
 * we cannot separate added sugar from the sugar in whole fruit, and energy
 * density misreads drinks — a sugary soft drink is genuinely low in energy per
 * 100g. Every threshold here is a defensible heuristic, not a clinical
 * instrument, and none of it has been reviewed by a dietitian. That review is
 * already on the open-questions list and this raises its priority.
 */

import type { HealthFocus } from "./plate-warnings.js";
import type { CookingMethodValue } from "./types.js";

/** Points awarded once the measured value reaches `atLeast`, richest first. */
export type QualityTier = { atLeast: number; points: number };

export type FoodQualityPolicy = {
  /** Everything is an adjustment away from this neutral starting point. */
  base: number;
  /** kcal per 100g. Lower is better, so these tiers count *down*. */
  energyDensity: QualityTier[];
  /** g per 100 kcal. */
  fiberDensity: QualityTier[];
  /** g per 100 kcal. */
  proteinDensity: QualityTier[];
  /** g per 100 kcal. Points are negative. */
  sugarDensity: QualityTier[];
  /** mg per 100 kcal. Points are negative. */
  sodiumDensity: QualityTier[];
  cooking: Record<CookingMethodValue, number>;
  /**
   * Catches food that is mostly sugar and nothing else.
   *
   * Energy density alone misreads drinks: a sugary soft drink is genuinely low
   * in calories per 100g because it is mostly water, and would otherwise score
   * like a vegetable. Requiring an absence of fiber is what separates a cola
   * from an orange, which is also mostly sugar and water but carries fiber with
   * it.
   */
  emptyCalories: {
    /** Share of total calories coming from sugar, 0-100. */
    sugarShareOver: number;
    /** Only applies when fiber is this low, in g per 100 kcal. */
    fiberUnder: number;
    points: number;
  };
};

/**
 * Tuned so that whole foods land where a person would expect them, checked
 * against the worked examples in `food-quality.test.ts`. These are starting
 * points and every one is runtime-tunable.
 */
export const defaultFoodQualityPolicy: FoodQualityPolicy = {
  base: 50,
  // Descending: the first tier whose threshold is met wins.
  energyDensity: [
    { atLeast: 400, points: -20 },
    { atLeast: 300, points: -14 },
    { atLeast: 220, points: -6 },
    { atLeast: 150, points: 2 },
    { atLeast: 100, points: 10 },
    { atLeast: 60, points: 16 },
    { atLeast: 0, points: 22 },
  ],
  fiberDensity: [
    { atLeast: 3, points: 18 },
    { atLeast: 2, points: 13 },
    { atLeast: 1, points: 7 },
    { atLeast: 0.5, points: 3 },
    { atLeast: 0, points: 0 },
  ],
  proteinDensity: [
    { atLeast: 10, points: 18 },
    { atLeast: 7, points: 13 },
    { atLeast: 4, points: 7 },
    { atLeast: 2, points: 3 },
    { atLeast: 0, points: 0 },
  ],
  sugarDensity: [
    { atLeast: 20, points: -14 },
    { atLeast: 12, points: -8 },
    { atLeast: 6, points: -3 },
    { atLeast: 0, points: 0 },
  ],
  sodiumDensity: [
    { atLeast: 600, points: -12 },
    { atLeast: 350, points: -7 },
    { atLeast: 200, points: -3 },
    { atLeast: 0, points: 0 },
  ],
  // Shared with the per-meal cooking modifiers so the two cannot drift apart.
  cooking: {
    fried: -8,
    sauced_creamy: -5,
    baked: -2,
    grilled: 3,
    steamed: 5,
    raw: 5,
    unknown: 0,
  },
  emptyCalories: { sugarShareOver: 70, fiberUnder: 1, points: -22 },
};

export type FoodQualityInput = {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  /** Absent means unknown, which scores nothing rather than zero. */
  fiberG?: number;
  sugarG?: number;
  sodiumMg?: number;
  /** Total weight. Without it, energy density cannot be judged. */
  grams?: number;
  cookingMethod?: CookingMethodValue;
};

export type FoodQualityBreakdown = {
  /** 0–100, internal only. Users see stars. */
  score: number;
  energyDensity?: number;
  energyPoints: number;
  fiberPoints: number;
  proteinPoints: number;
  sugarPoints: number;
  sodiumPoints: number;
  cookingPoints: number;
  emptyCaloriePoints: number;
};

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

const round1 = (value: number): number => Math.round((value + Number.EPSILON) * 10) / 10;

const isPresent = (value: number | undefined): value is number =>
  value !== undefined && Number.isFinite(value) && value >= 0;

/** First tier whose threshold the value reaches. Tiers are richest-first. */
const pointsFor = (value: number, tiers: QualityTier[]): number => {
  for (const tier of tiers) {
    if (value >= tier.atLeast) return tier.points;
  }
  return 0;
};

/**
 * Scores one logged food, or one meal treated as a single food.
 *
 * Returns undefined when there is nothing to judge, so callers hide the rating
 * rather than render a meaningless zero.
 *
 * Anything not recorded contributes nothing at all — not a penalty and not a
 * bonus. Most stored meals have no fiber or sugar, and treating absent as zero
 * would read a missing measurement as a real one.
 */
export const calculateFoodQuality = (
  input: FoodQualityInput,
  policy: FoodQualityPolicy = defaultFoodQualityPolicy,
): FoodQualityBreakdown | undefined => {
  const calories = input.calories;
  if (!(calories > 0)) return undefined;

  const per100kcal = (value: number) => (value / calories) * 100;

  // Energy density needs a weight. Without one the food is judged on its
  // nutrients alone rather than being assumed dense or sparse.
  const energyDensity =
    isPresent(input.grams) && input.grams > 0 ? (calories / input.grams) * 100 : undefined;
  const energyPoints =
    energyDensity === undefined ? 0 : pointsFor(energyDensity, policy.energyDensity);

  const fiberPoints = isPresent(input.fiberG)
    ? pointsFor(per100kcal(input.fiberG), policy.fiberDensity)
    : 0;

  const proteinPoints = isPresent(input.proteinG)
    ? pointsFor(per100kcal(input.proteinG), policy.proteinDensity)
    : 0;

  const sugarPoints = isPresent(input.sugarG)
    ? pointsFor(per100kcal(input.sugarG), policy.sugarDensity)
    : 0;

  const sodiumPoints = isPresent(input.sodiumMg)
    ? pointsFor(per100kcal(input.sodiumMg), policy.sodiumDensity)
    : 0;

  const cookingPoints = input.cookingMethod === undefined ? 0 : policy.cooking[input.cookingMethod];

  // Only assessable when sugar was actually recorded; an unmeasured food is
  // never assumed to be sugar water.
  let emptyCaloriePoints = 0;
  if (isPresent(input.sugarG)) {
    const sugarShare = ((input.sugarG * 4) / calories) * 100;
    const fiberPer100kcal = isPresent(input.fiberG) ? per100kcal(input.fiberG) : 0;
    if (
      sugarShare > policy.emptyCalories.sugarShareOver &&
      fiberPer100kcal < policy.emptyCalories.fiberUnder
    ) {
      emptyCaloriePoints = policy.emptyCalories.points;
    }
  }

  const score = clamp(
    policy.base +
      energyPoints +
      fiberPoints +
      proteinPoints +
      sugarPoints +
      sodiumPoints +
      cookingPoints +
      emptyCaloriePoints,
    0,
    100,
  );

  return {
    score: Math.round(score),
    energyDensity: energyDensity === undefined ? undefined : round1(energyDensity),
    energyPoints,
    fiberPoints,
    proteinPoints,
    sugarPoints,
    sodiumPoints,
    cookingPoints,
    emptyCaloriePoints,
  };
};

/**
 * The average of several scores, for a day or a week.
 *
 * A plain mean, deliberately. Weighting by calories would let one large meal
 * define the whole day, which is the same mistake as letting one plate define
 * the rating — and it would quietly punish anyone whose big meal is their
 * healthiest one.
 *
 * Returns undefined for an empty list so an untracked day shows nothing rather
 * than a zero.
 */
export const averageQualityScore = (scores: number[]): number | undefined => {
  const valid = scores.filter((score) => Number.isFinite(score));
  if (valid.length === 0) return undefined;
  return Math.round(valid.reduce((sum, score) => sum + score, 0) / valid.length);
};

/**
 * How a selected health condition shifts what counts as a good choice.
 *
 * **The stored score stays universal.** `calculateFoodQuality` measures the
 * food and nothing else, so it is comparable across users, re-tunable, and
 * still correct if someone changes or removes a condition later. This function
 * is a view applied on the way out — the same orange is one number in the data
 * and possibly a different number on two different screens.
 *
 * That split matters: a condition is a fact about the person, not the food.
 * Baking it into the stored value would mean every historical score silently
 * became wrong the moment a user ticked a new box.
 *
 * Adjustments only ever subtract. A condition can make a food look worse for
 * that person; it can never make a poor food look better than it is.
 */
export type ConditionAdjustmentPolicy = {
  /**
   * Extra weight on the sugar penalty, as a multiplier of the base penalty.
   * 2 means the sugar penalty counts double.
   */
  sugarMultiplier: number;
  sodiumMultiplier: number;
  /**
   * Refined carbohydrate: a high share of calories from carbs with little
   * fiber alongside. Applied only when fiber was actually measured — absent
   * means unknown, and whole fruit must not be punished for a missing value.
   */
  refinedCarb: { carbShareOver: number; fiberUnder: number; points: number };
  /** Saturated fat is not in the data; frying and a high fat share stand in. */
  fried: number;
  highFat: { fatShareOver: number; points: number };
};

export const defaultConditionAdjustments: Record<HealthFocus, ConditionAdjustmentPolicy> = {
  diabetes: {
    sugarMultiplier: 2,
    sodiumMultiplier: 1,
    refinedCarb: { carbShareOver: 60, fiberUnder: 1, points: -10 },
    fried: 0,
    highFat: { fatShareOver: 100, points: 0 },
  },
  // Managed as insulin resistance, so it tracks diabetes rather than sitting
  // on its own — the same grouping the sugar warnings already use.
  pcos: {
    sugarMultiplier: 2,
    sodiumMultiplier: 1,
    refinedCarb: { carbShareOver: 60, fiberUnder: 1, points: -8 },
    fried: 0,
    highFat: { fatShareOver: 100, points: 0 },
  },
  blood_pressure: {
    sugarMultiplier: 1,
    sodiumMultiplier: 2,
    refinedCarb: { carbShareOver: 100, fiberUnder: 0, points: 0 },
    fried: -4,
    highFat: { fatShareOver: 100, points: 0 },
  },
  cholesterol: {
    sugarMultiplier: 1,
    sodiumMultiplier: 1,
    refinedCarb: { carbShareOver: 100, fiberUnder: 0, points: 0 },
    fried: -8,
    highFat: { fatShareOver: 45, points: -8 },
  },
};

export type ConditionAdjustedScore = {
  /** The food's own score, identical for everyone. */
  baseScore: number;
  /** What this user sees. Equal to `baseScore` when no condition applies. */
  score: number;
  /** Total points removed, for explaining the difference. */
  adjustment: number;
  /** Which conditions actually moved the number. */
  appliedTo: HealthFocus[];
};

/**
 * Applies the strongest adjustment from each axis rather than stacking them.
 *
 * Someone with both diabetes and high blood pressure should not be penalised
 * twice over for the same gram of sugar. Taking the maximum per axis keeps a
 * long condition list from driving every food to one star.
 */
export const applyConditionAdjustment = (
  breakdown: FoodQualityBreakdown,
  input: FoodQualityInput,
  conditions: HealthFocus[] = [],
  policy: Record<HealthFocus, ConditionAdjustmentPolicy> = defaultConditionAdjustments,
): ConditionAdjustedScore => {
  const base = breakdown.score;
  if (conditions.length === 0) {
    return { baseScore: base, score: base, adjustment: 0, appliedTo: [] };
  }

  const calories = input.calories;
  if (!(calories > 0)) {
    return { baseScore: base, score: base, adjustment: 0, appliedTo: [] };
  }

  const share = (grams: number, kcalPerGram: number) => ((grams * kcalPerGram) / calories) * 100;
  const carbShare = share(input.carbsG || 0, 4);
  const fatShare = share(input.fatG || 0, 9);
  const fiberPer100kcal = isPresent(input.fiberG) ? (input.fiberG / calories) * 100 : undefined;

  let sugarExtra = 0;
  let sodiumExtra = 0;
  let refinedExtra = 0;
  let friedExtra = 0;
  let fatExtra = 0;
  const appliedTo: HealthFocus[] = [];

  for (const condition of conditions) {
    const rules = policy[condition];
    if (!rules) continue;

    // Base penalties are already negative, so scaling past 1 deepens them.
    const sugar = breakdown.sugarPoints * (rules.sugarMultiplier - 1);
    const sodium = breakdown.sodiumPoints * (rules.sodiumMultiplier - 1);

    const refined =
      fiberPer100kcal !== undefined &&
      carbShare > rules.refinedCarb.carbShareOver &&
      fiberPer100kcal < rules.refinedCarb.fiberUnder
        ? rules.refinedCarb.points
        : 0;

    const fried = input.cookingMethod === "fried" ? rules.fried : 0;
    const fat = fatShare > rules.highFat.fatShareOver ? rules.highFat.points : 0;

    if (sugar < 0 || sodium < 0 || refined < 0 || fried < 0 || fat < 0) {
      appliedTo.push(condition);
    }

    sugarExtra = Math.min(sugarExtra, sugar);
    sodiumExtra = Math.min(sodiumExtra, sodium);
    refinedExtra = Math.min(refinedExtra, refined);
    friedExtra = Math.min(friedExtra, fried);
    fatExtra = Math.min(fatExtra, fat);
  }

  const adjustment = sugarExtra + sodiumExtra + refinedExtra + friedExtra + fatExtra;
  return {
    baseScore: base,
    score: clamp(base + adjustment, 0, 100),
    adjustment: Math.round(adjustment),
    appliedTo,
  };
};
