import { describe, expect, it } from "vitest";
import { findFoodById, searchFoods } from "./foods.js";

describe("food search", () => {
  it("matches Hinglish aliases", () => {
    const results = searchFoods("chawal");

    expect(results[0]?.canonicalName).toBe("Cooked rice");
    expect(results[0]?.matchedAlias).toBe("chawal");
  });

  it("finds Indian foods by canonical name", () => {
    const results = searchFoods("dal");

    expect(results[0]?.id).toBe("food_dal");
  });

  it("returns portion conversions for seeded foods", () => {
    expect(findFoodById("food_roti")?.portions).toContainEqual({
      unit: "roti",
      grams: 30,
      confidence: 0.78,
    });
  });
});
