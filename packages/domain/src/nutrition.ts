import type { MacroTotals, NutritionPer100g } from "./types.js";

const round = (value: number, decimals = 1): number => {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
};

export const emptyTotals = (): MacroTotals => ({
  calories: 0,
  proteinG: 0,
  carbsG: 0,
  fatG: 0,
  fiberG: 0,
  sugarG: 0,
  sodiumMg: 0,
});

export const scaleNutritionByGrams = (per100g: NutritionPer100g, grams: number): MacroTotals => {
  if (!Number.isFinite(grams) || grams < 0) {
    throw new Error("grams must be a non-negative finite number");
  }

  const multiplier = grams / 100;

  return {
    calories: round(per100g.calories * multiplier, 0),
    proteinG: round(per100g.proteinG * multiplier),
    carbsG: round(per100g.carbsG * multiplier),
    fatG: round(per100g.fatG * multiplier),
    fiberG: per100g.fiberG === undefined ? undefined : round(per100g.fiberG * multiplier),
    sugarG: per100g.sugarG === undefined ? undefined : round(per100g.sugarG * multiplier),
    sodiumMg: per100g.sodiumMg === undefined ? undefined : round(per100g.sodiumMg * multiplier, 0),
  };
};

export const sumTotals = (items: readonly MacroTotals[]): MacroTotals =>
  items.reduce((total, item) => {
    total.calories += item.calories;
    total.proteinG = round(total.proteinG + item.proteinG);
    total.carbsG = round(total.carbsG + item.carbsG);
    total.fatG = round(total.fatG + item.fatG);
    total.fiberG = round((total.fiberG ?? 0) + (item.fiberG ?? 0));
    total.sugarG = round((total.sugarG ?? 0) + (item.sugarG ?? 0));
    total.sodiumMg = round((total.sodiumMg ?? 0) + (item.sodiumMg ?? 0), 0);
    return total;
  }, emptyTotals());

export const macroPercent = (macroCalories: number, totalCalories: number): number => {
  if (totalCalories <= 0) return 0;
  return round((macroCalories / totalCalories) * 100, 0);
};
