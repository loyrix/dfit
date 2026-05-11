import { describe, expect, it } from "vitest";
import { scaleNutritionByGrams, sumTotals } from "./nutrition.js";

describe("nutrition calculations", () => {
  it("scales nutrition from a 100g source", () => {
    const dalPer100g = {
      calories: 100,
      proteinG: 6,
      carbsG: 14,
      fatG: 3,
      fiberG: 4,
      sugarG: 1,
      sodiumMg: 250,
    };

    expect(scaleNutritionByGrams(dalPer100g, 180)).toEqual({
      calories: 180,
      proteinG: 10.8,
      carbsG: 25.2,
      fatG: 5.4,
      fiberG: 7.2,
      sugarG: 1.8,
      sodiumMg: 450,
    });
  });

  it("sums meal totals with stable numeric rounding", () => {
    expect(
      sumTotals([
        { calories: 180, proteinG: 10.8, carbsG: 25.2, fatG: 5.4 },
        { calories: 210, proteinG: 4.2, carbsG: 45.1, fatG: 0.7 },
      ]),
    ).toMatchObject({
      calories: 390,
      proteinG: 15,
      carbsG: 70.3,
      fatG: 6.1,
    });
  });
});
