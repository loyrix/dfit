import type { FoodRecord, PortionConversion } from "./foods.js";
import type { NutritionPer100g } from "./types.js";

export type OpenFoodFactsRawProduct = {
  product_name?: string;
  product_name_en?: string;
  generic_name?: string;
  generic_name_en?: string;
  brands?: string;
  categories?: string;
  categories_tags?: string[];
  serving_size?: string;
  serving_quantity?: number | string;
  nutriments?: {
    "energy-kcal_100g"?: number | string;
    "energy-kcal"?: number | string;
    energy_100g?: number | string;
    proteins_100g?: number | string;
    carbohydrates_100g?: number | string;
    fat_100g?: number | string;
    fiber_100g?: number | string;
    sugars_100g?: number | string;
    sodium_100g?: number | string;
    salt_100g?: number | string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

export type OpenFoodFactsRawResponse = {
  code?: string;
  status?: number;
  status_verbose?: string;
  product?: OpenFoodFactsRawProduct;
};

const nonFoodCategorySubstrings = [
  "cosmetic",
  "beauty",
  "pet food",
  "cat food",
  "dog food",
  "detergent",
  "cleaner",
  "cleaning",
  "shampoo",
  "soap",
  "household",
  "hygiene",
  "clothing",
  "electronics",
  "toy",
  "stationary",
  "tobacco",
  "cigarette",
];

const parseNumber = (val: unknown): number | undefined => {
  if (typeof val === "number" && Number.isFinite(val)) return val;
  if (typeof val === "string") {
    const parsed = Number.parseFloat(val);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
};

export const parseOpenFoodFactsProduct = (
  barcode: string,
  raw: OpenFoodFactsRawResponse,
): FoodRecord | undefined => {
  if (raw.status !== 1 || !raw.product) {
    return undefined;
  }

  const product = raw.product;

  // 1. Identify product name
  const rawName =
    product.product_name?.trim() ||
    product.product_name_en?.trim() ||
    product.generic_name?.trim() ||
    product.generic_name_en?.trim() ||
    "";

  if (!rawName || rawName.length < 2) {
    return undefined;
  }

  // 2. Reject non-food categories
  const categoriesText = (product.categories || "").toLowerCase();
  const categoriesTags = (product.categories_tags || []).map((t) => t.toLowerCase());
  for (const nonFood of nonFoodCategorySubstrings) {
    if (categoriesText.includes(nonFood) || categoriesTags.some((t) => t.includes(nonFood))) {
      return undefined;
    }
  }

  // 3. Extract and validate nutriments
  const nutriments = product.nutriments || {};
  let calories =
    parseNumber(nutriments["energy-kcal_100g"]) ?? parseNumber(nutriments["energy-kcal"]);

  if (calories === undefined) {
    const energyKj = parseNumber(nutriments.energy_100g);
    if (energyKj !== undefined && energyKj > 0) {
      calories = Math.round(energyKj / 4.184);
    }
  }

  // A genuine food product on Open Food Facts must have calorie and macronutrient data
  if (calories === undefined || calories < 0 || calories > 950) {
    return undefined;
  }

  const proteinG = parseNumber(nutriments.proteins_100g) ?? 0;
  const carbsG = parseNumber(nutriments.carbohydrates_100g) ?? 0;
  const fatG = parseNumber(nutriments.fat_100g) ?? 0;

  if (proteinG < 0 || proteinG > 100 || carbsG < 0 || carbsG > 100 || fatG < 0 || fatG > 100) {
    return undefined;
  }

  const fiberG = parseNumber(nutriments.fiber_100g);
  const sugarG = parseNumber(nutriments.sugars_100g);

  let sodiumMg: number | undefined = undefined;
  const sodiumVal = parseNumber(nutriments.sodium_100g);
  if (sodiumVal !== undefined) {
    // Open Food Facts sodium_100g is in grams
    sodiumMg = Math.round(sodiumVal * 1000);
  } else {
    const saltVal = parseNumber(nutriments.salt_100g);
    if (saltVal !== undefined) {
      sodiumMg = Math.round((saltVal / 2.5) * 1000);
    }
  }

  const nutritionPer100g: NutritionPer100g = {
    calories: Math.round(calories * 10) / 10,
    proteinG: Math.round(proteinG * 10) / 10,
    carbsG: Math.round(carbsG * 10) / 10,
    fatG: Math.round(fatG * 10) / 10,
    fiberG: fiberG !== undefined ? Math.round(fiberG * 10) / 10 : undefined,
    sugarG: sugarG !== undefined ? Math.round(sugarG * 10) / 10 : undefined,
    sodiumMg: sodiumMg !== undefined ? Math.min(10000, Math.max(0, sodiumMg)) : undefined,
  };

  // Format canonical name with brand if helpful
  const brand = (product.brands || "").split(",")[0]?.trim();
  let canonicalName = rawName;
  if (brand && !rawName.toLowerCase().includes(brand.toLowerCase())) {
    canonicalName = `${brand} ${rawName}`;
  }

  // Extract serving portions
  const portions: PortionConversion[] = [];
  const servingQuantity = parseNumber(product.serving_quantity);
  if (servingQuantity && servingQuantity > 5 && servingQuantity <= 2000) {
    portions.push({
      unit: "serving",
      grams: Math.round(servingQuantity),
      confidence: 0.95,
    });
  }

  // Also include 100g default portion
  portions.push({
    unit: "serving",
    grams: 100,
    confidence: portions.length === 0 ? 0.9 : 0.75,
  });

  return {
    id: `food_barcode_${barcode}`,
    canonicalName,
    region: "GLOBAL",
    aliases: [rawName],
    source: "open_food_facts",
    barcode,
    nutritionPer100g,
    portions,
  };
};
