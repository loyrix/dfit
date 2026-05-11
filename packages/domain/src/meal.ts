import type { MealItemNutrition, MealSummary } from "./types.js";
import { sumTotals } from "./nutrition.js";

export const createMealSummary = (
  meal: Omit<MealSummary, "totals"> & { items: MealItemNutrition[] },
): MealSummary => ({
  ...meal,
  totals: sumTotals(meal.items.map((item) => item.nutrition)),
});
