/**
 * Part A — personalised macro targets and daily calorie target.
 *
 * Implements `docs/meal-health-score-logic.md` Part A. Computed from the profile
 * a user already fills in, then used as the yardstick by every scoring level
 * (meal, day, week) so "balanced" means one thing throughout.
 *
 * Two deliberate departures from the spec document:
 *
 * 1. **Goal names keep their existing wire values.** The spec calls them fat
 *    loss / muscle gain / maintenance; the API and 70 stored rows already use
 *    `lose_gently` / `gain_gently` / `maintain`. Renaming would break the
 *    contract and the data for no benefit, so the mapping lives here instead.
 * 2. **`meal-health-score-worked-example.md` is not used as the source of
 *    truth.** Its BMR line (1,346 for a 65kg/165cm/28y female) does not follow
 *    Mifflin-St Jeor, which gives 1,380.25, and the error cascades into its TDEE
 *    and calorie target. The formulas here follow Part A as written.
 */

/** `active` is the spec's "very active"; `extra_active` is new. */
export type MacroActivityLevel = "sedentary" | "light" | "moderate" | "active" | "extra_active";

/** Existing wire values. Maps to the spec's fat loss / muscle gain / maintenance. */
export type MacroGoal = "lose_gently" | "gain_gently" | "maintain";

export type MacroSex = "female" | "male" | "not_specified";

export type CustomMacroSplit = { carbsPct: number; fatPct: number; proteinPct: number };

export type MacroTargetInput = {
  heightCm: number;
  weightKg: number;
  ageYears: number;
  sex: MacroSex;
  activityLevel: MacroActivityLevel;
  goal: MacroGoal;
  /**
   * A9 manual override. When all three are present they replace the computed
   * centres outright rather than blending: an explicit choice is a stronger
   * signal of intent than an algorithmic estimate.
   */
  customMacroSplit?: CustomMacroSplit;
};

export type MacroBand = { min: number; max: number };

export type MacroTargets = {
  bmi: number;
  bmrCalories: number;
  tdeeCalories: number;
  targetDailyCalories: number;
  /** Centres before the tolerance band is applied, after any BMI nudge. */
  centers: { carbsPct: number; fatPct: number; proteinPct: number };
  bands: { carbsPct: MacroBand; fatPct: MacroBand; proteinPct: MacroBand };
  tolerance: number;
  /** True when a manual split replaced the computed centres. */
  customSplitApplied: boolean;
};

/** A3. `active` is the spec's "very active". */
const ACTIVITY_FACTOR: Record<MacroActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  extra_active: 1.9,
};

/**
 * A4. Multiplicative, not a flat calorie offset: a deficit should scale with the
 * person's actual needs rather than take the same 300 kcal off everyone.
 */
const GOAL_FACTOR: Record<MacroGoal, number> = {
  lose_gently: 0.8,
  maintain: 1.0,
  gain_gently: 1.1,
};

/** A7. Goal-driven users get a tighter band; maintenance tolerates more drift. */
const TOLERANCE: Record<MacroGoal, number> = {
  lose_gently: 5,
  gain_gently: 5,
  maintain: 8,
};

/**
 * A5 buckets activity into two groups rather than five, because the macro centre
 * only needs to know "mostly still" from "training".
 */
const isHigherActivity = (level: MacroActivityLevel): boolean =>
  level === "moderate" || level === "active" || level === "extra_active";

type Centers = { carbsPct: number; fatPct: number; proteinPct: number };

/** A5. Goal × activity drives composition; see the doc for why not BMI. */
const macroCenters = (goal: MacroGoal, activityLevel: MacroActivityLevel): Centers => {
  const higher = isHigherActivity(activityLevel);

  switch (goal) {
    case "lose_gently":
      return higher
        ? { carbsPct: 35, fatPct: 25, proteinPct: 40 }
        : { carbsPct: 30, fatPct: 30, proteinPct: 40 };
    case "gain_gently":
      return higher
        ? { carbsPct: 45, fatPct: 25, proteinPct: 30 }
        : { carbsPct: 40, fatPct: 25, proteinPct: 35 };
    case "maintain":
      return higher
        ? { carbsPct: 50, fatPct: 25, proteinPct: 25 }
        : { carbsPct: 45, fatPct: 30, proteinPct: 25 };
  }
};

/**
 * A6. A small additive nudge, never an override: BMI describes body status while
 * goal and activity describe intent, and intent should stay in charge.
 */
const applyBmiNudge = (centers: Centers, bmi: number): Centers => {
  if (bmi >= 30) {
    return {
      carbsPct: centers.carbsPct - 5,
      fatPct: centers.fatPct,
      proteinPct: centers.proteinPct + 5,
    };
  }
  if (bmi < 18.5) {
    return {
      carbsPct: centers.carbsPct + 5,
      fatPct: centers.fatPct + 3,
      proteinPct: centers.proteinPct - 3,
    };
  }
  return centers;
};

const round1 = (value: number): number => Math.round((value + Number.EPSILON) * 10) / 10;

/** A2. Mifflin-St Jeor. "not_specified" averages the two, per the spec. */
export const calculateBmr = (input: {
  heightCm: number;
  weightKg: number;
  ageYears: number;
  sex: MacroSex;
}): number => {
  const base = 10 * input.weightKg + 6.25 * input.heightCm - 5 * input.ageYears;
  if (input.sex === "male") return base + 5;
  if (input.sex === "female") return base - 161;
  return base + (5 + -161) / 2;
};

const band = (center: number, tolerance: number): MacroBand => ({
  min: round1(center - tolerance),
  max: round1(center + tolerance),
});

/**
 * Computes every target the scoring system measures against.
 *
 * Pure and cheap, so callers recompute rather than cache: a stale band is far
 * worse than the arithmetic cost.
 */
export const calculateMacroTargets = (input: MacroTargetInput): MacroTargets => {
  const heightM = input.heightCm / 100;
  const bmi = round1(input.weightKg / (heightM * heightM));

  const bmrCalories = calculateBmr(input);
  const tdeeCalories = bmrCalories * ACTIVITY_FACTOR[input.activityLevel];
  const targetDailyCalories = Math.round(tdeeCalories * GOAL_FACTOR[input.goal]);

  const custom = input.customMacroSplit;
  const customSplitApplied = custom !== undefined;

  // A9 replaces the centres entirely and fixes tolerance at 5.
  const centers = customSplitApplied
    ? { carbsPct: custom.carbsPct, fatPct: custom.fatPct, proteinPct: custom.proteinPct }
    : applyBmiNudge(macroCenters(input.goal, input.activityLevel), bmi);
  const tolerance = customSplitApplied ? 5 : TOLERANCE[input.goal];

  return {
    bmi,
    bmrCalories: round1(bmrCalories),
    tdeeCalories: round1(tdeeCalories),
    targetDailyCalories,
    centers,
    bands: {
      carbsPct: band(centers.carbsPct, tolerance),
      fatPct: band(centers.fatPct, tolerance),
      proteinPct: band(centers.proteinPct, tolerance),
    },
    tolerance,
    customSplitApplied,
  };
};
