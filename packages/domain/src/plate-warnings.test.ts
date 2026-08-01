import { describe, expect, it } from "vitest";
import { detectPlateWarnings } from "./plate-warnings.js";
import type { MacroTotals } from "./types.js";

const base: MacroTotals = { calories: 500, proteinG: 20, carbsG: 60, fatG: 15 };

const codes = (items: MacroTotals[], focus: Parameters<typeof detectPlateWarnings>[1] = []) =>
  detectPlateWarnings(items, focus).map((warning) => warning.code);

describe("detectPlateWarnings", () => {
  it("stays silent when no micronutrients were recorded", () => {
    // Absent means unknown. Saying nothing is correct; implying the meal is low
    // in sodium because we failed to measure it would not be.
    expect(codes([base])).toEqual([]);
  });

  it("stays silent for an empty meal", () => {
    expect(codes([])).toEqual([]);
  });

  it("warns on high sodium when the value is present", () => {
    expect(codes([{ ...base, sodiumMg: 1200 }])).toContain("high_sodium");
  });

  it("does not warn on ordinary sodium", () => {
    expect(codes([{ ...base, sodiumMg: 400 }])).toEqual([]);
  });

  it("never reveals the underlying number", () => {
    const [warning] = detectPlateWarnings([{ ...base, sodiumMg: 1200 }]);
    expect(warning?.text).toBe("Sodium looks high for one meal.");
    expect(warning?.text).not.toMatch(/\d/);
  });

  describe("conditions change the threshold, not the claim", () => {
    it("is more sensitive to sodium for blood pressure", () => {
      const meal = [{ ...base, sodiumMg: 700 }];
      expect(codes(meal)).toEqual([]);
      expect(codes(meal, ["blood_pressure"])).toContain("high_sodium");
    });

    it("is more sensitive to sugar for diabetes", () => {
      const meal = [{ ...base, sugarG: 20 }];
      expect(codes(meal)).toEqual([]);
      expect(codes(meal, ["diabetes"])).toContain("high_sugar");
    });

    it("is more sensitive to sugar for PCOS", () => {
      expect(codes([{ ...base, sugarG: 20 }], ["pcos"])).toContain("high_sugar");
    });

    it("keeps the same wording whether or not a condition is selected", () => {
      const plain = detectPlateWarnings([{ ...base, sodiumMg: 1200 }]);
      const personal = detectPlateWarnings([{ ...base, sodiumMg: 1200 }], ["blood_pressure"]);

      expect(personal[0]?.text).toBe(plain[0]?.text);
      expect(personal[0]?.personalised).toBe(true);
      expect(plain[0]?.personalised).toBe(false);
    });

    it("ignores conditions that do not relate to the nutrient", () => {
      expect(codes([{ ...base, sodiumMg: 700 }], ["cholesterol"])).toEqual([]);
    });
  });

  describe("low fiber", () => {
    it("flags a carb-heavy meal with little fiber", () => {
      expect(codes([{ ...base, carbsG: 90, fiberG: 1 }])).toContain("low_fiber");
    });

    it("does not flag a low-carb meal for having little fiber", () => {
      expect(codes([{ ...base, carbsG: 10, fiberG: 1 }])).toEqual([]);
    });

    it("does not flag when fiber was never recorded", () => {
      expect(codes([{ ...base, carbsG: 90 }])).toEqual([]);
    });
  });

  it("sums a nutrient across items that report it", () => {
    const meal = [
      { ...base, sodiumMg: 500 },
      { ...base, sodiumMg: 500 },
    ];
    expect(codes(meal)).toContain("high_sodium");
  });

  it("counts only items that reported the nutrient", () => {
    // One item at 500 mg is fine; the item with no reading must not be assumed.
    const meal = [{ ...base, sodiumMg: 500 }, { ...base }];
    expect(codes(meal)).toEqual([]);
  });

  it("can raise several warnings at once", () => {
    const meal = [{ ...base, carbsG: 90, sodiumMg: 1500, sugarG: 40, fiberG: 1 }];
    expect(codes(meal).sort()).toEqual(["high_sodium", "high_sugar", "low_fiber"]);
  });
});
