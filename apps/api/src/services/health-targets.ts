import {
  calculateMacroTargets,
  type CustomMacroSplit,
  type MacroTargets,
} from "@logmyplate/domain";

export type HealthSex = "female" | "male" | "not_specified";
/** `active` is the spec's "very active"; `extra_active` was added with Part A. */
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "extra_active";
export type HealthGoal = "maintain" | "lose_gently" | "gain_gently";
export type BmiCategory = "underweight" | "healthy" | "overweight" | "obese";

export type HealthTargetInput = {
  heightCm: number;
  weightKg: number;
  ageYears: number;
  sex: HealthSex;
  activityLevel: ActivityLevel;
  goal: HealthGoal;
  /** Part A9. Replaces the computed macro centres when present. */
  customMacroSplit?: CustomMacroSplit;
};

/**
 * `mifflin_st_jeor_v1` used a flat calorie offset per goal (−300 / +250).
 * `v2` uses Part A's multiplicative factors (×0.80 / ×1.10) and adds macro bands.
 *
 * Both values exist in the database on purpose: the tag records which formula
 * produced a row, so the 70 pre-existing `v1` targets stay identifiable and are
 * never silently recomputed. See the backward-compatibility rules in
 * docs/meal-health-score-implementation-plan.md.
 */
export type HealthTargetFormula = "mifflin_st_jeor_v1" | "mifflin_st_jeor_v2";

export type HealthTargetCalculation = HealthTargetInput & {
  bmi: number;
  bmiCategory: BmiCategory;
  bmrCalories: number;
  dailyCalorieTarget: number;
  formula: HealthTargetFormula;
};

/**
 * Computes a stored health target using Part A.
 *
 * Delegates the maths to `packages/domain` so the API, and later the app, agree
 * on one definition. This function only adapts it to the stored row shape and
 * applies the calorie floor, which is a product safety rail rather than part of
 * the spec.
 */
export const calculateHealthTarget = (input: HealthTargetInput): HealthTargetCalculation => {
  const targets = calculateMacroTargets(input);
  const floor = calorieFloor(input.sex);

  return {
    ...input,
    bmi: targets.bmi,
    bmiCategory: bmiCategoryFor(targets.bmi),
    bmrCalories: Math.round(targets.bmrCalories),
    // The floor keeps a very small or very sedentary profile from producing a
    // target nobody should eat to.
    dailyCalorieTarget: Math.max(floor, targets.targetDailyCalories),
    formula: "mifflin_st_jeor_v2",
  };
};

/**
 * The full Part A output, including macro bands.
 *
 * Bands are derived on read rather than stored: the formula is expected to be
 * tuned, and a stored band would go stale against it.
 */
export const macroTargetsFor = (input: HealthTargetInput): MacroTargets =>
  calculateMacroTargets(input);

const calorieFloor = (sex: HealthSex): number => {
  if (sex === "male") return 1500;
  if (sex === "female") return 1200;
  return 1300;
};

const bmiCategoryFor = (bmi: number): BmiCategory => {
  if (bmi < 18.5) return "underweight";
  if (bmi < 25) return "healthy";
  if (bmi < 30) return "overweight";
  return "obese";
};
