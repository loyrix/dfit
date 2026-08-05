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

/**
 * Why an axis scored what it did.
 *
 * The number alone is not actionable: a portion bar at 0 tells a user nothing
 * about whether they ate too much or too little, or what would change it. The
 * code travels instead of the copy so the wording stays in the app, where it can
 * be adjusted and translated, while the judgement stays here under test.
 */
export type PlateScoreAxisDetail =
  | "on_track"
  | "portion_large"
  | "portion_small"
  | "protein_low"
  | "carb_heavy"
  | "fat_heavy"
  | "fiber_low";

export type PlateScoreAxisResult = {
  axis: PlateScoreAxis;
  /** 0-100 for this axis alone. */
  score: number;
  /** Share of the final score this axis carried, after renormalisation. */
  weight: number;
  detail: PlateScoreAxisDetail;
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
 * Every tunable number in one place.
 *
 * The *shape* of the algorithm is fixed — sum items, score four axes,
 * renormalise weights, weighted average, map to a band — but the numbers are
 * conventions rather than facts. Keeping them in a policy object means the API
 * can serve them from runtime config and the mobile app can compute an
 * identical score locally, so the review screen updates instantly while the
 * values stay tunable from the backend without an app release.
 */
export type PlateScorePolicy = {
  /** Base weights. Inactive axes drop out and the rest renormalise to 100. */
  weights: Record<PlateScoreAxis, number>;
  /** Expected share of the day's calories, used only by the calorie-fit axis. */
  mealShare: Record<PlateScoreMealType, number>;
  /** How far above the expected share still scores above zero. */
  calorieTolerance: Record<PlateScoreMealType, number>;
  /** Protein g per 1000 kcal considered adequate, by goal. */
  proteinDensityTarget: Record<PlateScoreGoal, number>;
  /** Protein target when no goal is known. */
  generalProteinDensityTarget: number;
  /** Fiber g per 1000 kcal; the widely used adequacy guideline is 14. */
  fiberDensityTarget: number;
  /** Acceptable share-of-energy bands, and how hard to punish straying. */
  macroBands: {
    proteinPct: { min: number; max: number };
    carbsPct: { min: number; max: number };
    fatPct: { min: number; max: number };
    penaltyMultiplier: number;
  };
  /** Lower bound of each band. Anything below `moderate` is "heavy". */
  bandCutoffs: { excellent: number; good: number; moderate: number };
};

export const defaultPlateScorePolicy: PlateScorePolicy = {
  weights: { calorie_fit: 25, protein: 30, macro_balance: 25, fiber: 20 },
  mealShare: { breakfast: 0.25, lunch: 0.35, dinner: 0.3, snack: 0.1 },
  // Snacks are deliberately loose: a 300 kcal snack is normal, and a tight band
  // would penalise ordinary eating.
  calorieTolerance: { breakfast: 0.35, lunch: 0.35, dinner: 0.35, snack: 0.7 },
  // Density rather than absolute grams. Judging a meal against a share of a
  // daily gram target punishes small meals: a 95 kcal chai and biscuit would be
  // asked for 20 g of protein. Cutting calories raises the target because
  // protein matters more when energy is scarce.
  proteinDensityTarget: { maintain: 40, lose_gently: 50, gain_gently: 45 },
  generalProteinDensityTarget: 40,
  fiberDensityTarget: 14,
  macroBands: {
    proteinPct: { min: 15, max: 35 },
    carbsPct: { min: 40, max: 65 },
    fatPct: { min: 20, max: 35 },
    penaltyMultiplier: 1.5,
  },
  bandCutoffs: { excellent: 85, good: 70, moderate: 50 },
};

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
  bands: PlateScorePolicy["macroBands"],
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

  const total =
    penalty(proteinPct, bands.proteinPct.min, bands.proteinPct.max) +
    penalty(carbsPct, bands.carbsPct.min, bands.carbsPct.max) +
    penalty(fatPct, bands.fatPct.min, bands.fatPct.max);

  return clamp(100 - total * bands.penaltyMultiplier);
};

/** Names the macro furthest outside its band, so the copy can be specific. */
const macroBalanceDetail = (
  calories: number,
  proteinG: number,
  carbsG: number,
  fatG: number,
  bands: PlateScorePolicy["macroBands"],
): PlateScoreAxisDetail => {
  if (calories <= 0) return "on_track";

  const carbsOver = ((carbsG * 4) / calories) * 100 - bands.carbsPct.max;
  const fatOver = ((fatG * 9) / calories) * 100 - bands.fatPct.max;
  const proteinUnder = bands.proteinPct.min - ((proteinG * 4) / calories) * 100;

  const worst = Math.max(carbsOver, fatOver, proteinUnder);
  if (worst <= 0) return "on_track";
  if (worst === fatOver) return "fat_heavy";
  if (worst === carbsOver) return "carb_heavy";
  return "protein_low";
};

const bandFor = (score: number, cutoffs: PlateScorePolicy["bandCutoffs"]): PlateScoreBand => {
  if (score >= cutoffs.excellent) return "excellent";
  if (score >= cutoffs.good) return "good";
  if (score >= cutoffs.moderate) return "moderate";
  return "heavy";
};

/**
 * Scores a meal. Returns undefined only when there is nothing to score at all,
 * so callers can hide the card rather than render a meaningless zero.
 */
export const calculatePlateScore = (
  input: PlateScoreInput,
  policy: PlateScorePolicy = defaultPlateScorePolicy,
): PlateScoreResult | undefined => {
  const totals = sumForScoring(input.items);
  if (totals.calories <= 0) return undefined;

  const active: Array<{ axis: PlateScoreAxis; score: number; detail: PlateScoreAxisDetail }> = [];
  const skipped: PlateScoreAxis[] = [];
  const profile = input.profile;

  // Calorie fit — the only axis that needs personal data.
  if (profile && profile.dailyCalorieTarget > 0) {
    const expected = profile.dailyCalorieTarget * policy.mealShare[input.mealType];
    const score = calorieFitScore(
      totals.calories,
      expected,
      policy.calorieTolerance[input.mealType],
    );
    // "Small" is never a penalty, so it is reported only to explain the bar,
    // never to suggest the user should have eaten more.
    const detail: PlateScoreAxisDetail =
      totals.calories > expected
        ? "portion_large"
        : totals.calories < expected * 0.6
          ? "portion_small"
          : "on_track";
    active.push({ axis: "calorie_fit", score, detail });
  } else {
    skipped.push("calorie_fit");
  }

  // Protein — density in both tiers, so portion size never distorts it. The
  // goal shifts the target rather than the measure.
  const proteinTarget = profile
    ? policy.proteinDensityTarget[profile.goal]
    : policy.generalProteinDensityTarget;
  const proteinPer1000 = (totals.proteinG / totals.calories) * 1000;
  const proteinScore = adequacyScore(proteinPer1000, proteinTarget);
  active.push({
    axis: "protein",
    score: proteinScore,
    detail: proteinScore >= 80 ? "on_track" : "protein_low",
  });

  active.push({
    axis: "macro_balance",
    score: macroBalanceScore(
      totals.calories,
      totals.proteinG,
      totals.carbsG,
      totals.fatG,
      policy.macroBands,
    ),
    detail: macroBalanceDetail(
      totals.calories,
      totals.proteinG,
      totals.carbsG,
      totals.fatG,
      policy.macroBands,
    ),
  });

  // Fiber — skipped entirely when unknown, never scored as zero.
  if (totals.fiberG !== undefined) {
    const per1000 = (totals.fiberG / totals.calories) * 1000;
    const fiberScore = adequacyScore(per1000, policy.fiberDensityTarget);
    active.push({
      axis: "fiber",
      score: fiberScore,
      detail: fiberScore >= 80 ? "on_track" : "fiber_low",
    });
  } else {
    skipped.push("fiber");
  }

  const weightSum = active.reduce((sum, entry) => sum + policy.weights[entry.axis], 0);
  if (weightSum <= 0) return undefined;

  const axes: PlateScoreAxisResult[] = active.map((entry) => ({
    axis: entry.axis,
    score: round(entry.score),
    weight: round((policy.weights[entry.axis] / weightSum) * 100),
    detail: entry.detail,
  }));

  const score = Math.round(
    active.reduce((sum, entry) => sum + entry.score * policy.weights[entry.axis], 0) / weightSum,
  );

  return {
    score,
    band: bandFor(score, policy.bandCutoffs),
    tier: profile ? "personal" : "general",
    axes,
    skipped,
  };
};
