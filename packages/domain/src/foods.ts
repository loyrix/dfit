import type { NutritionPer100g, PortionUnit } from "./types.js";

export type FoodSource = "dfit_seed" | "ifct_pending" | "usda_pending" | "open_food_facts_pending";

export type PortionConversion = {
  unit: PortionUnit;
  grams: number;
  confidence: number;
};

export type FoodRecord = {
  id: string;
  canonicalName: string;
  region: "IN" | "GLOBAL";
  aliases: string[];
  source: FoodSource;
  nutritionPer100g: NutritionPer100g;
  portions: PortionConversion[];
};

export const seedFoods: readonly FoodRecord[] = [
  {
    id: "food_dal",
    canonicalName: "Dal",
    region: "IN",
    aliases: ["lentil curry", "dal tadka", "daal"],
    source: "dfit_seed",
    nutritionPer100g: {
      calories: 100,
      proteinG: 6,
      carbsG: 14,
      fatG: 3,
      fiberG: 4,
      sodiumMg: 250,
    },
    portions: [
      { unit: "katori", grams: 180, confidence: 0.7 },
      { unit: "bowl", grams: 220, confidence: 0.65 },
      { unit: "ladle", grams: 60, confidence: 0.65 },
    ],
  },
  {
    id: "food_cooked_rice",
    canonicalName: "Cooked rice",
    region: "GLOBAL",
    aliases: ["rice", "chawal", "steamed rice", "white rice"],
    source: "dfit_seed",
    nutritionPer100g: {
      calories: 140,
      proteinG: 2.8,
      carbsG: 30.1,
      fatG: 0.5,
      fiberG: 0.4,
      sodiumMg: 3,
    },
    portions: [
      { unit: "bowl", grams: 150, confidence: 0.7 },
      { unit: "cup", grams: 158, confidence: 0.75 },
      { unit: "katori", grams: 130, confidence: 0.68 },
    ],
  },
  {
    id: "food_roti",
    canonicalName: "Roti",
    region: "IN",
    aliases: ["chapati", "phulka", "fulka"],
    source: "dfit_seed",
    nutritionPer100g: {
      calories: 267,
      proteinG: 8.7,
      carbsG: 53.3,
      fatG: 2.7,
      fiberG: 9.7,
      sodiumMg: 317,
    },
    portions: [
      { unit: "piece", grams: 30, confidence: 0.75 },
      { unit: "roti", grams: 30, confidence: 0.78 },
    ],
  },
  {
    id: "food_mixed_sabzi",
    canonicalName: "Mixed vegetable sabzi",
    region: "IN",
    aliases: ["sabzi", "subzi", "vegetable curry", "mixed vegetables"],
    source: "dfit_seed",
    nutritionPer100g: {
      calories: 98,
      proteinG: 2.6,
      carbsG: 13.3,
      fatG: 4.4,
      fiberG: 3.7,
      sodiumMg: 258,
    },
    portions: [
      { unit: "katori", grams: 120, confidence: 0.65 },
      { unit: "bowl", grams: 160, confidence: 0.62 },
      { unit: "serving", grams: 140, confidence: 0.6 },
    ],
  },
  {
    id: "food_curd",
    canonicalName: "Curd",
    region: "IN",
    aliases: ["dahi", "yogurt", "plain yogurt"],
    source: "dfit_seed",
    nutritionPer100g: {
      calories: 61,
      proteinG: 3.5,
      carbsG: 4.7,
      fatG: 3.3,
      fiberG: 0,
      sodiumMg: 46,
    },
    portions: [
      { unit: "katori", grams: 150, confidence: 0.7 },
      { unit: "cup", grams: 245, confidence: 0.75 },
    ],
  },
  {
    id: "food_paneer",
    canonicalName: "Paneer",
    region: "IN",
    aliases: ["cottage cheese", "paneer cubes"],
    source: "dfit_seed",
    nutritionPer100g: {
      calories: 265,
      proteinG: 18.3,
      carbsG: 3.4,
      fatG: 20.8,
      fiberG: 0,
      sodiumMg: 22,
    },
    portions: [
      { unit: "piece", grams: 25, confidence: 0.6 },
      { unit: "serving", grams: 100, confidence: 0.7 },
    ],
  },
  {
    id: "food_idli",
    canonicalName: "Idli",
    region: "IN",
    aliases: ["idly", "rice cake"],
    source: "dfit_seed",
    nutritionPer100g: {
      calories: 146,
      proteinG: 4.5,
      carbsG: 30,
      fatG: 0.7,
      fiberG: 1.6,
      sodiumMg: 140,
    },
    portions: [
      { unit: "piece", grams: 39, confidence: 0.72 },
      { unit: "idli", grams: 39, confidence: 0.75 },
    ],
  },
  {
    id: "food_dosa",
    canonicalName: "Dosa",
    region: "IN",
    aliases: ["plain dosa", "dosai"],
    source: "dfit_seed",
    nutritionPer100g: {
      calories: 168,
      proteinG: 3.9,
      carbsG: 29.6,
      fatG: 3.7,
      fiberG: 1.1,
      sodiumMg: 240,
    },
    portions: [
      { unit: "piece", grams: 90, confidence: 0.65 },
      { unit: "dosa", grams: 90, confidence: 0.68 },
    ],
  },
  {
    id: "food_poha",
    canonicalName: "Poha",
    region: "IN",
    aliases: ["flattened rice poha", "kanda poha"],
    source: "dfit_seed",
    nutritionPer100g: {
      calories: 130,
      proteinG: 2.6,
      carbsG: 23,
      fatG: 3.2,
      fiberG: 1.8,
      sodiumMg: 210,
    },
    portions: [
      { unit: "bowl", grams: 180, confidence: 0.65 },
      { unit: "serving", grams: 200, confidence: 0.62 },
    ],
  },
  {
    id: "food_chicken_breast",
    canonicalName: "Chicken breast, cooked",
    region: "GLOBAL",
    aliases: ["chicken breast", "grilled chicken", "cooked chicken"],
    source: "dfit_seed",
    nutritionPer100g: {
      calories: 165,
      proteinG: 31,
      carbsG: 0,
      fatG: 3.6,
      fiberG: 0,
      sodiumMg: 74,
    },
    portions: [
      { unit: "piece", grams: 120, confidence: 0.55 },
      { unit: "serving", grams: 100, confidence: 0.75 },
    ],
  },
  {
    id: "food_egg",
    canonicalName: "Egg",
    region: "GLOBAL",
    aliases: ["boiled egg", "whole egg", "anda"],
    source: "dfit_seed",
    nutritionPer100g: {
      calories: 143,
      proteinG: 12.6,
      carbsG: 0.7,
      fatG: 9.5,
      fiberG: 0,
      sodiumMg: 142,
    },
    portions: [
      { unit: "piece", grams: 50, confidence: 0.78 },
      { unit: "serving", grams: 50, confidence: 0.74 },
    ],
  },
  {
    id: "food_banana",
    canonicalName: "Banana",
    region: "GLOBAL",
    aliases: ["kela"],
    source: "dfit_seed",
    nutritionPer100g: {
      calories: 89,
      proteinG: 1.1,
      carbsG: 22.8,
      fatG: 0.3,
      fiberG: 2.6,
      sodiumMg: 1,
    },
    portions: [
      { unit: "piece", grams: 118, confidence: 0.7 },
      { unit: "small", grams: 100, confidence: 0.6 },
      { unit: "medium", grams: 118, confidence: 0.68 },
      { unit: "large", grams: 136, confidence: 0.62 },
    ],
  },
];

export type FoodSearchResult = FoodRecord & {
  matchedAlias?: string;
  score: number;
};

export const searchFoods = (
  query: string,
  foods: readonly FoodRecord[] = seedFoods,
): FoodSearchResult[] => {
  const normalizedQuery = normalizeFoodText(query);
  if (normalizedQuery.length === 0) return [];

  return foods
    .map((food) => scoreFood(food, normalizedQuery))
    .filter((result): result is FoodSearchResult => result !== undefined)
    .sort((a, b) => b.score - a.score || a.canonicalName.localeCompare(b.canonicalName))
    .slice(0, 20);
};

export const findFoodById = (
  foodId: string,
  foods: readonly FoodRecord[] = seedFoods,
): FoodRecord | undefined => foods.find((food) => food.id === foodId);

const scoreFood = (food: FoodRecord, normalizedQuery: string): FoodSearchResult | undefined => {
  const names = [food.canonicalName, ...food.aliases];
  let bestScore = 0;
  let matchedAlias: string | undefined;

  for (const name of names) {
    const normalizedName = normalizeFoodText(name);
    let score = 0;
    if (normalizedName === normalizedQuery) score = 100;
    else if (normalizedName.startsWith(normalizedQuery)) score = 80;
    else if (normalizedName.includes(normalizedQuery)) score = 60;
    else if (normalizedQuery.includes(normalizedName)) score = 45;

    if (score > bestScore) {
      bestScore = score;
      matchedAlias = name === food.canonicalName ? undefined : name;
    }
  }

  if (bestScore === 0) return undefined;
  return { ...food, matchedAlias, score: bestScore };
};

export const normalizeFoodText = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
