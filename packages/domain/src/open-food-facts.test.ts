import { describe, expect, it } from "vitest";
import { parseOpenFoodFactsProduct } from "./open-food-facts.js";

describe("parseOpenFoodFactsProduct", () => {
  it("parses valid food product with per-100g nutrients and serving size", () => {
    const raw = {
      status: 1,
      code: "8901058852393",
      product: {
        product_name: "2-Minute Noodles Masala",
        brands: "Maggi, Nestle",
        categories: "Noodles, Cereals",
        serving_quantity: 70,
        nutriments: {
          "energy-kcal_100g": 427,
          proteins_100g: 8,
          carbohydrates_100g: 63.5,
          fat_100g: 15.7,
          fiber_100g: 3.6,
          sugars_100g: 2.2,
          sodium_100g: 1.16,
        },
      },
    };

    const parsed = parseOpenFoodFactsProduct("8901058852393", raw);
    expect(parsed).toBeDefined();
    expect(parsed?.canonicalName).toBe("Maggi 2-Minute Noodles Masala");
    expect(parsed?.source).toBe("open_food_facts");
    expect(parsed?.barcode).toBe("8901058852393");
    expect(parsed?.nutritionPer100g.calories).toBe(427);
    expect(parsed?.nutritionPer100g.proteinG).toBe(8);
    expect(parsed?.nutritionPer100g.carbsG).toBe(63.5);
    expect(parsed?.nutritionPer100g.fatG).toBe(15.7);
    expect(parsed?.nutritionPer100g.sodiumMg).toBe(1160);
    expect(parsed?.portions).toEqual([
      { unit: "serving", grams: 70, confidence: 0.95 },
      { unit: "serving", grams: 100, confidence: 0.75 },
    ]);
  });

  it("converts energy_100g from kJ if kcal is not directly provided", () => {
    const raw = {
      status: 1,
      product: {
        product_name: "Greek Yogurt",
        categories: "Dairy",
        nutriments: {
          energy_100g: 418.4,
          proteins_100g: 10,
          carbohydrates_100g: 4,
          fat_100g: 5,
        },
      },
    };

    const parsed = parseOpenFoodFactsProduct("123456789", raw);
    expect(parsed).toBeDefined();
    expect(parsed?.nutritionPer100g.calories).toBe(100);
  });

  it("converts salt to sodium when sodium is missing", () => {
    const raw = {
      status: 1,
      product: {
        product_name: "Salted Butter",
        categories: "Dairy",
        nutriments: {
          "energy-kcal_100g": 720,
          proteins_100g: 1,
          carbohydrates_100g: 1,
          fat_100g: 80,
          salt_100g: 1.5,
        },
      },
    };

    const parsed = parseOpenFoodFactsProduct("987654321", raw);
    expect(parsed).toBeDefined();
    expect(parsed?.nutritionPer100g.sodiumMg).toBe(600); // 1.5 / 2.5 * 1000 = 600
  });

  it("returns undefined if status is not 1 (product not found)", () => {
    const raw = { status: 0, status_verbose: "product not found" };
    expect(parseOpenFoodFactsProduct("00000000", raw)).toBeUndefined();
  });

  it("returns undefined if non-food category detected", () => {
    const raw = {
      status: 1,
      product: {
        product_name: "Moisturizing Shampoo",
        categories: "Beauty, Hair Care, Shampoos",
        nutriments: {
          "energy-kcal_100g": 10,
          proteins_100g: 0,
          carbohydrates_100g: 0,
          fat_100g: 0,
        },
      },
    };
    expect(parseOpenFoodFactsProduct("11112222", raw)).toBeUndefined();
  });

  it("returns undefined if calories are missing or negative", () => {
    const raw = {
      status: 1,
      product: {
        product_name: "Mysterious Item",
        nutriments: {
          proteins_100g: 5,
        },
      },
    };
    expect(parseOpenFoodFactsProduct("33334444", raw)).toBeUndefined();
  });
});
