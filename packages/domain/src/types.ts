export type MacroTotals = {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG?: number;
  sugarG?: number;
  sodiumMg?: number;
};

export type NutritionPer100g = MacroTotals;

export type PortionUnit =
  | "gram"
  | "ml"
  | "piece"
  | "serving"
  | "bowl"
  | "katori"
  | "cup"
  | "tablespoon"
  | "teaspoon"
  | "ladle"
  | "roti"
  | "idli"
  | "dosa"
  | "slice"
  | "scoop"
  | "small"
  | "medium"
  | "large";

export type FoodPortion = {
  quantity: number;
  unit: PortionUnit;
  grams: number;
};

export type MealItemNutrition = {
  foodId: string;
  displayName: string;
  portion: FoodPortion;
  nutrition: MacroTotals;
};

export type MealSummary = {
  mealId: string;
  mealType: "breakfast" | "lunch" | "snack" | "dinner";
  title: string;
  loggedAt: string;
  items: MealItemNutrition[];
  totals: MacroTotals;
};

export type ScanCreditState = {
  freeRemaining: number;
  rewardedRemaining: number;
  premiumRemaining: number;
};
