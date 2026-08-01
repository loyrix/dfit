/**
 * Plate Score — a deterministic 0-100 rating of a single meal.
 *
 * Design rules, in order of importance:
 *
 * 1. **Pure arithmetic, never an LLM.** The same meal always scores the same, so
 *    the number is reproducible, free to recompute, and defensible.
 * 2. **Only one axis needs personal data.** Macro balance, protein density and
 *    fiber density describe the food itself; calorie fit needs a daily target.
 *    Users without a health target get the other three renormalised rather than
 *    a score against an invented "average" profile. Nothing is fabricated — the
 *    general tier just answers a narrower question.
 * 3. **Missing means unknown, never zero.** An absent nutrient drops its axis
 *    and the remaining weights renormalise. Scoring a missing fiber value as 0
 *    would make every meal logged before micronutrient recovery look fiber-free.
 * 4. **Read per-item nutrition, never summed totals.** `sumTotals` coerces
 *    absent micronutrients to 0, which would silently defeat rule 3.
 * 5. **Medical conditions never change the number.** They may change the wording
 *    around it. Keeping the score to pure nutrition math is what keeps it out of
 *    medical-claim territory.
 */

import type { MacroTotals } from "./types.js";

export type PlateScoreGoal = "maintain" | "lose_gently" | "gain_gently";
export type PlateScoreMealType = "breakfast" | "lunch" | "snack" | "dinner";

export type PlateScoreTier = "general" | "personal";

export type PlateScoreAxis = "calorie_fit" | "protein" | "macro_balance" | "fiber";

export type PlateScoreBand = "excellent" | "good" | "moderate" | "heavy";

/**
 * Present only for users who have completed the health target form. Bodyweight
 * is deliberately not required: protein is judged by density, so the score never
 * needs it.
 */
export type PlateScoreProfile = {
  dailyCalorieTarget: number;
  goal: PlateScoreGoal;
};

export type PlateScoreInput = {
  /** Per-item nutrition. Never pass summed totals: see rule 4 above. */
  items: MacroTotals[];
  mealType: PlateScoreMealType;
  profile?: PlateScoreProfile;
};

export type PlateScoreAxisResult = {
  axis: PlateScoreAxis;
  /** 0-100 for this axis alone. */
  score: number;
  /** Share of the final score this axis carried, after renormalisation. */
  weight: number;
};

export type PlateScoreResult = {
  score: number;
  band: PlateScoreBand;
  tier: PlateScoreTier;
  axes: PlateScoreAxisResult[];
  /** Axes skipped because the data they need was unavailable. */
  skipped: PlateScoreAxis[];
};

/**
 * Base weights. Inactive axes are dropped and the rest renormalise to 100, so
 * the general tier reuses this table rather than defining its own.
 */
const BASE_WEIGHTS: Record<PlateScoreAxis, number> = {
  calorie_fit: 25,
  protein: 30,
  macro_balance: 25,
  fiber: 20,
};

/** Expected share of the day's calories, used only by the calorie-fit axis. */
const MEAL_SHARE: Record<PlateScoreMealType, number> = {
  breakfast: 0.25,
  lunch: 0.35,
  dinner: 0.3,
  snack: 0.1,
};

/**
 * How far from the expected share still counts as a good fit. Snacks are
 * deliberately loose: a 300 kcal snack is normal, and a tight band would
 * penalise ordinary eating.
 */
const CALORIE_TOLERANCE: Record<PlateScoreMealType, number> = {
  breakfast: 0.35,
  lunch: 0.35,
  dinner: 0.35,
  snack: 0.7,
};

/**
 * Protein g per 1000 kcal considered adequate, by goal.
 *
 * Density rather than absolute grams, deliberately. Judging a meal against a
 * share of a daily gram target punishes small meals: a 95 kcal chai and biscuit
 * would be asked for 20 g of protein and score near zero for a snack nobody
 * thinks is a protein source. Density asks the fair question — "for the calories
 * here, is this a reasonable amount of protein?" — at any portion size.
 *
 * Cutting calories raises the target because protein matters more when energy is
 * scarce; gaining sits between the two since total intake is already higher.
 */
const PROTEIN_DENSITY_TARGET: Record<PlateScoreGoal, number> = {
  maintain: 40,
  lose_gently: 50,
  gain_gently: 45,
};

/** Used when no goal is known. Matches the maintenance target. */
const GENERAL_PROTEIN_DENSITY_TARGET = 40;

/** Fiber g per 1000 kcal; the widely used adequacy guideline is 14. */
const FIBER_DENSITY_TARGET = 14;

const clamp = (value: number, min = 0, max = 100): number => Math.max(min, Math.min(max, value));

const round = (value: number, decimals = 1): number => {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
};

const isUsable = (value: number | undefined): value is number =>
  value !== undefined && Number.isFinite(value) && value >= 0;

/**
 * Sums macros across items while preserving "unknown".
 *
 * A micronutrient counts only when at least one item reported it; if none did,
 * the total stays undefined so the matching axis is skipped rather than scored
 * as zero. Items that omit it are treated as contributing nothing rather than
 * invalidating the whole meal, which is the pragmatic reading when the AI
 * returns fiber for the dal but not the pickle.
 */
const sumForScoring = (items: MacroTotals[]) => {
  let calories = 0;
  let proteinG = 0;
  let carbsG = 0;
  let fatG = 0;
  let fiberG: number | undefined;

  for (const item of items) {
    calories += isUsable(item.calories) ? item.calories : 0;
    proteinG += isUsable(item.proteinG) ? item.proteinG : 0;
    carbsG += isUsable(item.carbsG) ? item.carbsG : 0;
    fatG += isUsable(item.fatG) ? item.fatG : 0;
    if (isUsable(item.fiberG)) fiberG = (fiberG ?? 0) + item.fiberG;
  }

  return { calories, proteinG, carbsG, fatG, fiberG };
};

/**
 * One-sided calorie fit: full marks at or below the expected share, declining
 * only above it.
 *
 * Eating less than a nominal meal share is not a fault. People eat a light
 * breakfast and a bigger lunch, and a meal score has no visibility into the rest
 * of the day. Penalising a 339 kcal breakfast the way an oversized one is
 * penalised told users their normal eating was "heavy", which was wrong.
 */
const calorieFitScore = (actual: number, expected: number, tolerance: number): number => {
  if (expected <= 0) return 0;
  if (actual <= expected) return 100;
  const excess = (actual - expected) / expected;
  if (excess >= tolerance) return 0;
  return clamp(100 * (1 - excess / tolerance));
};

/**
 * Rises to 100 at the target and stays there. Used for protein and fiber, where
 * exceeding the target is not a fault and should not cost points.
 */
const adequacyScore = (actual: number, target: number): number => {
  if (target <= 0) return 0;
  return clamp((actual / target) * 100);
};

/**
 * Distance from a healthy macro split, expressed as share of energy.
 *
 * Bands are deliberately wide: this rewards a plate that is not dominated by a
 * single macro, rather than enforcing one diet's ideal ratio.
 */
const macroBalanceScore = (
  calories: number,
  proteinG: number,
  carbsG: number,
  fatG: number,
): number => {
  if (calories <= 0) return 0;

  const proteinPct = ((proteinG * 4) / calories) * 100;
  const carbsPct = ((carbsG * 4) / calories) * 100;
  const fatPct = ((fatG * 9) / calories) * 100;

  const penalty = (pct: number, low: number, high: number): number => {
    if (pct < low) return low - pct;
    if (pct > high) return pct - high;
    return 0;
  };

  const total = penalty(proteinPct, 15, 35) + penalty(carbsPct, 40, 65) + penalty(fatPct, 20, 35);

  return clamp(100 - total * 1.5);
};

const bandFor = (score: number): PlateScoreBand => {
  if (score >= 85) return "excellent";
  if (score >= 70) return "good";
  if (score >= 50) return "moderate";
  return "heavy";
};

/**
 * Scores a meal. Returns undefined only when there is nothing to score at all,
 * so callers can hide the card rather than render a meaningless zero.
 */
export const calculatePlateScore = (input: PlateScoreInput): PlateScoreResult | undefined => {
  const totals = sumForScoring(input.items);
  if (totals.calories <= 0) return undefined;

  const active: Array<{ axis: PlateScoreAxis; score: number }> = [];
  const skipped: PlateScoreAxis[] = [];
  const profile = input.profile;

  // Calorie fit — the only axis that needs personal data.
  if (profile && profile.dailyCalorieTarget > 0) {
    const expected = profile.dailyCalorieTarget * MEAL_SHARE[input.mealType];
    active.push({
      axis: "calorie_fit",
      score: calorieFitScore(totals.calories, expected, CALORIE_TOLERANCE[input.mealType]),
    });
  } else {
    skipped.push("calorie_fit");
  }

  // Protein — density in both tiers, so portion size never distorts it. The
  // goal shifts the target rather than the measure.
  const proteinTarget = profile
    ? PROTEIN_DENSITY_TARGET[profile.goal]
    : GENERAL_PROTEIN_DENSITY_TARGET;
  const proteinPer1000 = (totals.proteinG / totals.calories) * 1000;
  active.push({ axis: "protein", score: adequacyScore(proteinPer1000, proteinTarget) });

  active.push({
    axis: "macro_balance",
    score: macroBalanceScore(totals.calories, totals.proteinG, totals.carbsG, totals.fatG),
  });

  // Fiber — skipped entirely when unknown, never scored as zero.
  if (totals.fiberG !== undefined) {
    const per1000 = (totals.fiberG / totals.calories) * 1000;
    active.push({ axis: "fiber", score: adequacyScore(per1000, FIBER_DENSITY_TARGET) });
  } else {
    skipped.push("fiber");
  }

  const weightSum = active.reduce((sum, entry) => sum + BASE_WEIGHTS[entry.axis], 0);
  if (weightSum <= 0) return undefined;

  const axes: PlateScoreAxisResult[] = active.map((entry) => ({
    axis: entry.axis,
    score: round(entry.score),
    weight: round((BASE_WEIGHTS[entry.axis] / weightSum) * 100),
  }));

  const score = Math.round(
    active.reduce((sum, entry) => sum + entry.score * BASE_WEIGHTS[entry.axis], 0) / weightSum,
  );

  return {
    score,
    band: bandFor(score),
    tier: profile ? "personal" : "general",
    axes,
    skipped,
  };
};
