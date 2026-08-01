import { describe, expect, it } from "vitest";
import { calculatePlateScore, type PlateScoreProfile } from "./plate-score.js";

const profile: PlateScoreProfile = {
  dailyCalorieTarget: 2000,
  goal: "maintain",
};

/** A balanced lunch: ~700 kcal, good protein, decent fiber. */
const balancedLunch = [
  { calories: 350, proteinG: 20, carbsG: 45, fatG: 10, fiberG: 7 },
  { calories: 350, proteinG: 18, carbsG: 48, fatG: 9, fiberG: 6 },
];

describe("calculatePlateScore", () => {
  it("returns undefined when there is nothing to score", () => {
    expect(calculatePlateScore({ items: [], mealType: "lunch" })).toBeUndefined();
    expect(
      calculatePlateScore({
        items: [{ calories: 0, proteinG: 0, carbsG: 0, fatG: 0 }],
        mealType: "lunch",
      }),
    ).toBeUndefined();
  });

  it("is deterministic", () => {
    const a = calculatePlateScore({ items: balancedLunch, mealType: "lunch", profile });
    const b = calculatePlateScore({ items: balancedLunch, mealType: "lunch", profile });

    expect(a).toEqual(b);
  });

  it("scores a balanced lunch well for a matching profile", () => {
    const result = calculatePlateScore({ items: balancedLunch, mealType: "lunch", profile });

    expect(result?.score).toBeGreaterThanOrEqual(70);
    expect(["excellent", "good"]).toContain(result?.band);
  });

  describe("tiers", () => {
    it("scores without a profile using the general tier", () => {
      const result = calculatePlateScore({ items: balancedLunch, mealType: "lunch" });

      expect(result?.tier).toBe("general");
      expect(result?.skipped).toContain("calorie_fit");
      expect(result?.axes.map((axis) => axis.axis)).not.toContain("calorie_fit");
    });

    it("uses the personal tier when a profile is supplied", () => {
      const result = calculatePlateScore({ items: balancedLunch, mealType: "lunch", profile });

      expect(result?.tier).toBe("personal");
      expect(result?.skipped).not.toContain("calorie_fit");
      expect(result?.axes.map((axis) => axis.axis)).toContain("calorie_fit");
    });

    it("renormalises weights to 100 in both tiers", () => {
      const general = calculatePlateScore({ items: balancedLunch, mealType: "lunch" });
      const personal = calculatePlateScore({ items: balancedLunch, mealType: "lunch", profile });

      const sum = (result: typeof general) =>
        Math.round(result?.axes.reduce((total, axis) => total + axis.weight, 0) ?? 0);

      expect(sum(general)).toBe(100);
      expect(sum(personal)).toBe(100);
    });
  });

  describe("missing nutrients are unknown, not zero", () => {
    it("skips the fiber axis when no item reports fiber", () => {
      const noFiber = balancedLunch.map(({ fiberG: _fiberG, ...rest }) => rest);
      const result = calculatePlateScore({ items: noFiber, mealType: "lunch", profile });

      expect(result?.skipped).toContain("fiber");
      expect(result?.axes.map((axis) => axis.axis)).not.toContain("fiber");
    });

    it("does not punish a meal for having no fiber data", () => {
      const noFiber = balancedLunch.map(({ fiberG: _fiberG, ...rest }) => rest);
      const withFiber = calculatePlateScore({ items: balancedLunch, mealType: "lunch", profile });
      const without = calculatePlateScore({ items: noFiber, mealType: "lunch", profile });

      // A historical meal with no micronutrients must not score worse than the
      // same meal that happens to have fiber recorded.
      expect(without?.score).toBeGreaterThanOrEqual((withFiber?.score ?? 0) - 5);
    });

    it("counts fiber when only some items report it", () => {
      const partial = [
        { calories: 350, proteinG: 20, carbsG: 45, fatG: 10, fiberG: 7 },
        { calories: 350, proteinG: 18, carbsG: 48, fatG: 9 },
      ];
      const result = calculatePlateScore({ items: partial, mealType: "lunch", profile });

      expect(result?.skipped).not.toContain("fiber");
    });
  });

  describe("calorie fit", () => {
    it("scores an on-target lunch above an oversized one", () => {
      const oversized = [{ calories: 1600, proteinG: 40, carbsG: 200, fatG: 50, fiberG: 10 }];
      const onTarget = calculatePlateScore({ items: balancedLunch, mealType: "lunch", profile });
      const tooMuch = calculatePlateScore({ items: oversized, mealType: "lunch", profile });

      expect(onTarget?.score).toBeGreaterThan(tooMuch?.score ?? 0);
    });

    it("does not penalise a normal snack", () => {
      // 300 kcal is an ordinary snack; a tight band would score it as a failure.
      const snack = [{ calories: 300, proteinG: 12, carbsG: 35, fatG: 10, fiberG: 5 }];
      const result = calculatePlateScore({ items: snack, mealType: "snack", profile });

      expect(result?.score).toBeGreaterThanOrEqual(50);
    });
  });

  describe("protein", () => {
    it("rates a high-protein meal above a low-protein one of equal calories", () => {
      const highProtein = [{ calories: 600, proteinG: 45, carbsG: 60, fatG: 15, fiberG: 8 }];
      const lowProtein = [{ calories: 600, proteinG: 8, carbsG: 100, fatG: 18, fiberG: 8 }];

      const high = calculatePlateScore({ items: highProtein, mealType: "lunch", profile });
      const low = calculatePlateScore({ items: lowProtein, mealType: "lunch", profile });

      expect(high?.score).toBeGreaterThan(low?.score ?? 0);
    });

    it("does not penalise exceeding the protein target", () => {
      const atTarget = [{ calories: 600, proteinG: 29, carbsG: 70, fatG: 18, fiberG: 8 }];
      const overTarget = [{ calories: 600, proteinG: 60, carbsG: 70, fatG: 18, fiberG: 8 }];

      const at = calculatePlateScore({ items: atTarget, mealType: "lunch", profile });
      const over = calculatePlateScore({ items: overTarget, mealType: "lunch", profile });

      const proteinAxis = (result: typeof at) =>
        result?.axes.find((axis) => axis.axis === "protein")?.score ?? 0;

      expect(proteinAxis(over)).toBeGreaterThanOrEqual(proteinAxis(at));
    });

    it("scores protein in the general tier too", () => {
      const result = calculatePlateScore({ items: balancedLunch, mealType: "lunch" });

      expect(result?.axes.map((axis) => axis.axis)).toContain("protein");
    });
  });

  describe("goal", () => {
    it("asks more protein of a weight-loss profile than a maintenance one", () => {
      const items = [{ calories: 600, proteinG: 15, carbsG: 70, fatG: 18, fiberG: 8 }];
      const maintain = calculatePlateScore({ items, mealType: "lunch", profile });
      const gain = calculatePlateScore({
        items,
        mealType: "lunch",
        profile: { ...profile, goal: "lose_gently" },
      });

      const proteinAxis = (result: typeof maintain) =>
        result?.axes.find((axis) => axis.axis === "protein")?.score ?? 0;

      expect(proteinAxis(gain)).toBeLessThan(proteinAxis(maintain));
    });
  });

  describe("bands", () => {
    it("maps scores to bands consistently", () => {
      const result = calculatePlateScore({ items: balancedLunch, mealType: "lunch", profile });
      const score = result?.score ?? 0;
      const expected =
        score >= 85 ? "excellent" : score >= 70 ? "good" : score >= 50 ? "moderate" : "heavy";

      expect(result?.band).toBe(expected);
    });

    it("rates a fried, carb-dominated plate below a balanced one", () => {
      const fried = [{ calories: 900, proteinG: 10, carbsG: 110, fatG: 45 }];
      const balanced = calculatePlateScore({ items: balancedLunch, mealType: "lunch", profile });
      const poor = calculatePlateScore({ items: fried, mealType: "lunch", profile });

      expect(poor?.score).toBeLessThan(balanced?.score ?? 0);
    });
  });

  it("keeps the score within 0..100", () => {
    const extreme = [{ calories: 5000, proteinG: 0, carbsG: 900, fatG: 200 }];
    const result = calculatePlateScore({ items: extreme, mealType: "snack", profile });

    expect(result?.score).toBeGreaterThanOrEqual(0);
    expect(result?.score).toBeLessThanOrEqual(100);
  });
});
