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

/**
 * How a food was cooked. Distinct from `preparation`
 * (home/restaurant/packaged), which describes provenance rather than technique.
 *
 * Canonical here so the scoring modifiers, the recovery step and the stored meal
 * shape cannot drift apart into three slightly different unions.
 */
export type CookingMethodValue =
  | "fried"
  | "sauced_creamy"
  | "baked"
  | "grilled"
  | "steamed"
  | "raw"
  | "unknown";

export type MealItemNutrition = {
  foodId?: string;
  displayName: string;
  portion: FoodPortion;
  nutrition: MacroTotals;
  /**
   * How the item was cooked, feeding the Part B and Part C cooking modifiers.
   * Absent for every meal logged before prompt v9, and whenever the model was
   * not confident enough to say — absent means unknown, and the modifier is
   * skipped rather than guessed.
   */
  cookingMethod?: CookingMethodValue;
};

export type MealImageSummary = {
  imageId: string;
  bucket: string;
  objectKey: string;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  byteSize: number;
  width?: number;
  height?: number;
  createdAt: string;
};

export type MealSummary = {
  mealId: string;
  mealType: "breakfast" | "lunch" | "snack" | "dinner";
  title: string;
  loggedAt: string;
  items: MealItemNutrition[];
  totals: MacroTotals;
  image?: MealImageSummary;
  /** Model commentary captured at scan time. Absent for manual and older meals. */
  advice?: unknown;
};

export type ScanCreditState = {
  freeRemaining: number;
  rewardedRemaining: number;
  premiumRemaining: number;
};
