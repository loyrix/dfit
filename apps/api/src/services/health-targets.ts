export type HealthSex = "female" | "male" | "not_specified";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active";
export type HealthGoal = "maintain" | "lose_gently" | "gain_gently";
export type BmiCategory = "underweight" | "healthy" | "overweight" | "obese";

export type HealthTargetInput = {
  heightCm: number;
  weightKg: number;
  ageYears: number;
  sex: HealthSex;
  activityLevel: ActivityLevel;
  goal: HealthGoal;
};

export type HealthTargetCalculation = HealthTargetInput & {
  bmi: number;
  bmiCategory: BmiCategory;
  bmrCalories: number;
  dailyCalorieTarget: number;
  formula: "mifflin_st_jeor_v1";
};

const activityFactors: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
};

const goalAdjustments: Record<HealthGoal, number> = {
  maintain: 0,
  lose_gently: -300,
  gain_gently: 250,
};

const round = (value: number, decimals = 1): number => {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
};

export const calculateHealthTarget = (input: HealthTargetInput): HealthTargetCalculation => {
  const heightM = input.heightCm / 100;
  const bmi = round(input.weightKg / (heightM * heightM), 1);
  const bmr = calculateBmr(input);
  const maintenance = bmr * activityFactors[input.activityLevel];
  const floor = calorieFloor(input.sex);
  const dailyCalorieTarget = Math.max(floor, Math.round(maintenance + goalAdjustments[input.goal]));

  return {
    ...input,
    bmi,
    bmiCategory: bmiCategoryFor(bmi),
    bmrCalories: Math.round(bmr),
    dailyCalorieTarget,
    formula: "mifflin_st_jeor_v1",
  };
};

const calculateBmr = (input: HealthTargetInput): number => {
  const base = 10 * input.weightKg + 6.25 * input.heightCm - 5 * input.ageYears;
  if (input.sex === "male") return base + 5;
  if (input.sex === "female") return base - 161;
  return base - 78;
};

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
