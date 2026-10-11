import { describe, expect, it } from "vitest";
import {
  applyConditionAdjustment,
  averageQualityScore,
  calculateFoodQuality,
  explainFoodQuality,
  type FoodQualityInput,
} from "./food-quality.js";

const score = (input: Parameters<typeof calculateFoodQuality>[0]) =>
  calculateFoodQuality(input)!.score;

/** Mirrors the shipped star buckets, so the tests read in what users see. */
const stars = (value: number) =>
  value <= 20 ? 1 : value <= 40 ? 2 : value <= 60 ? 3 : value <= 80 ? 4 : 5;

describe("calculateFoodQuality", () => {
  describe("the case that prompted this model", () => {
    it("rates a mandarin orange well, not one star", () => {
      // The previous per-meal score gave this 0/100 and one star, because it
      // measured a single fruit against a whole day's macro split. An orange is
      // 91% carbohydrate because that is what an orange is.
      const asLogged = score({
        calories: 47,
        proteinG: 0.7,
        carbsG: 12,
        fatG: 0.2,
        grams: 88,
      });
      expect(stars(asLogged)).toBeGreaterThanOrEqual(4);

      // With the micronutrients a v9 scan captures, it does better still.
      const full = score({
        calories: 47,
        proteinG: 0.7,
        carbsG: 12,
        fatG: 0.2,
        fiberG: 1.6,
        sugarG: 9.3,
        sodiumMg: 2,
        grams: 88,
      });
      expect(stars(full)).toBe(5);
    });

    it("rates the other whole foods that used to score zero", () => {
      const apple = score({
        calories: 95,
        proteinG: 0.5,
        carbsG: 25,
        fatG: 0.3,
        fiberG: 4.4,
        sugarG: 19,
        sodiumMg: 2,
        grams: 182,
      });
      expect(stars(apple)).toBeGreaterThanOrEqual(4);

      const broccoli = score({
        calories: 51,
        proteinG: 4.3,
        carbsG: 10,
        fatG: 0.6,
        fiberG: 3.9,
        sugarG: 2.5,
        sodiumMg: 50,
        grams: 150,
        cookingMethod: "steamed",
      });
      expect(stars(broccoli)).toBe(5);
    });
  });

  describe("ordering", () => {
    it("ranks a grilled chicken breast above a fried samosa", () => {
      const chicken = score({
        calories: 248,
        proteinG: 46,
        carbsG: 0,
        fatG: 5.4,
        fiberG: 0,
        sugarG: 0,
        sodiumMg: 111,
        grams: 150,
        cookingMethod: "grilled",
      });
      const samosa = score({
        calories: 262,
        proteinG: 3.5,
        carbsG: 24,
        fatG: 17,
        fiberG: 2,
        sugarG: 1,
        sodiumMg: 420,
        grams: 100,
        cookingMethod: "fried",
      });
      expect(chicken).toBeGreaterThan(samosa);
      expect(stars(samosa)).toBeLessThanOrEqual(2);
    });

    it("puts crisps and doughnuts near the bottom", () => {
      const crisps = score({
        calories: 270,
        proteinG: 3,
        carbsG: 25,
        fatG: 18,
        fiberG: 2,
        sugarG: 0.2,
        sodiumMg: 270,
        grams: 50,
        cookingMethod: "fried",
      });
      expect(stars(crisps)).toBeLessThanOrEqual(2);
    });
  });

  describe("empty calories", () => {
    it("marks a sugary drink down despite its low energy density", () => {
      // Cola is mostly water, so energy density alone would score it like a
      // vegetable. This is the rule that stops that.
      const cola = calculateFoodQuality({
        calories: 139,
        proteinG: 0,
        carbsG: 35,
        fatG: 0,
        fiberG: 0,
        sugarG: 35,
        sodiumMg: 15,
        grams: 330,
      })!;
      expect(cola.emptyCaloriePoints).toBeLessThan(0);
      expect(stars(cola.score)).toBeLessThanOrEqual(2);
    });

    it("does not catch whole fruit, which carries fiber with its sugar", () => {
      const orange = calculateFoodQuality({
        calories: 47,
        proteinG: 0.7,
        carbsG: 12,
        fatG: 0.2,
        fiberG: 1.6,
        sugarG: 9.3,
        grams: 88,
      })!;
      expect(orange.emptyCaloriePoints).toBe(0);
    });

    it("never assumes an unmeasured food is sugar water", () => {
      // Most stored meals have no sugar recorded. Absent must not be treated as
      // a measurement.
      const unknown = calculateFoodQuality({
        calories: 139,
        proteinG: 0,
        carbsG: 35,
        fatG: 0,
        grams: 330,
      })!;
      expect(unknown.emptyCaloriePoints).toBe(0);
    });
  });

  describe("missing data", () => {
    it("treats an unrecorded nutrient as contributing nothing", () => {
      const bare = calculateFoodQuality({
        calories: 200,
        proteinG: 5,
        carbsG: 30,
        fatG: 6,
        grams: 150,
      })!;
      expect(bare.fiberPoints).toBe(0);
      expect(bare.sugarPoints).toBe(0);
      expect(bare.sodiumPoints).toBe(0);
    });

    it("judges on nutrients alone when the weight is unknown", () => {
      const noGrams = calculateFoodQuality({
        calories: 200,
        proteinG: 5,
        carbsG: 30,
        fatG: 6,
      })!;
      expect(noGrams.energyDensity).toBeUndefined();
      expect(noGrams.energyPoints).toBe(0);
    });

    it("returns undefined when there is nothing to judge", () => {
      expect(
        calculateFoodQuality({ calories: 0, proteinG: 0, carbsG: 0, fatG: 0 }),
      ).toBeUndefined();
    });
  });

  it("stays inside 0-100 at both extremes", () => {
    const best = score({
      calories: 20,
      proteinG: 4,
      carbsG: 2,
      fatG: 0,
      fiberG: 5,
      sugarG: 0,
      sodiumMg: 0,
      grams: 200,
      cookingMethod: "raw",
    });
    const worst = score({
      calories: 800,
      proteinG: 0,
      carbsG: 60,
      fatG: 60,
      fiberG: 0,
      sugarG: 60,
      sodiumMg: 3000,
      grams: 100,
      cookingMethod: "fried",
    });
    expect(best).toBeLessThanOrEqual(100);
    expect(worst).toBeGreaterThanOrEqual(0);
    expect(best).toBeGreaterThan(worst);
  });
});

describe("averageQualityScore", () => {
  it("averages the scores it is given", () => {
    expect(averageQualityScore([80, 60, 40])).toBe(60);
  });

  it("returns undefined for an empty day rather than zero", () => {
    // An untracked day is not a bad day.
    expect(averageQualityScore([])).toBeUndefined();
  });

  it("is a plain mean, so one large meal cannot define the day", () => {
    // Calorie weighting would let a single big meal dominate, and would punish
    // anyone whose largest meal is their healthiest.
    expect(averageQualityScore([90, 30])).toBe(60);
  });
});

describe("applyConditionAdjustment", () => {
  const orange = {
    calories: 47,
    proteinG: 0.7,
    carbsG: 12,
    fatG: 0.2,
    fiberG: 1.6,
    sugarG: 9.3,
    sodiumMg: 2,
    grams: 88,
  };
  const rice = {
    calories: 195,
    proteinG: 4,
    carbsG: 45,
    fatG: 0.4,
    fiberG: 0.6,
    sugarG: 0.1,
    sodiumMg: 2,
    grams: 150,
  };
  const cola = {
    calories: 139,
    proteinG: 0,
    carbsG: 35,
    fatG: 0,
    fiberG: 0,
    sugarG: 35,
    sodiumMg: 15,
    grams: 330,
  };
  const samosa = {
    calories: 262,
    proteinG: 3.5,
    carbsG: 24,
    fatG: 17,
    fiberG: 2,
    sugarG: 1,
    sodiumMg: 420,
    grams: 100,
    cookingMethod: "fried" as const,
  };

  const adjust = (
    food: Parameters<typeof calculateFoodQuality>[0],
    conditions: never[] | string[],
  ) =>
    applyConditionAdjustment(
      calculateFoodQuality(food)!,
      food,
      conditions as Parameters<typeof applyConditionAdjustment>[2],
    );

  it("leaves the score untouched when no condition is selected", () => {
    const result = adjust(orange, []);
    expect(result.score).toBe(result.baseScore);
    expect(result.adjustment).toBe(0);
    expect(result.appliedTo).toEqual([]);
  });

  it("always preserves the universal score alongside the adjusted one", () => {
    // The stored value must stay comparable across users and survive someone
    // adding or removing a condition later.
    const plain = adjust(cola, []);
    const diabetic = adjust(cola, ["diabetes"]);
    expect(diabetic.baseScore).toBe(plain.baseScore);
    expect(diabetic.score).toBeLessThan(diabetic.baseScore);
  });

  it("marks a sugary drink down hard for diabetes", () => {
    expect(adjust(cola, ["diabetes"]).score).toBeLessThan(adjust(cola, []).score - 10);
  });

  it("only nudges whole fruit, which brings fiber with its sugar", () => {
    const plain = adjust(orange, []);
    const diabetic = adjust(orange, ["diabetes"]);
    expect(diabetic.score).toBeLessThan(plain.score);
    // An orange is still a good thing for a diabetic to eat.
    expect(diabetic.score).toBeGreaterThan(60);
  });

  it("marks refined carbohydrate down for diabetes", () => {
    expect(adjust(rice, ["diabetes"]).score).toBeLessThan(adjust(rice, []).score);
  });

  it("never penalises refined carbohydrate on unmeasured fiber", () => {
    // Absent means unknown. Whole fruit logged without micronutrients must not
    // be treated as though it had been measured and found fiber-free.
    const bare = { calories: 47, proteinG: 0.7, carbsG: 12, fatG: 0.2, grams: 88 };
    expect(adjust(bare, ["diabetes"]).score).toBe(adjust(bare, []).score);
  });

  it("targets sodium for blood pressure and fat for cholesterol", () => {
    const plain = adjust(samosa, []).score;
    expect(adjust(samosa, ["blood_pressure"]).score).toBeLessThan(plain);
    expect(adjust(samosa, ["cholesterol"]).score).toBeLessThan(plain);
  });

  it("leaves a food untouched when the condition has nothing to grip", () => {
    const chicken = {
      calories: 248,
      proteinG: 46,
      carbsG: 0,
      fatG: 5.4,
      fiberG: 0,
      sugarG: 0,
      sodiumMg: 111,
      grams: 150,
      cookingMethod: "grilled" as const,
    };
    expect(adjust(chicken, ["diabetes"]).score).toBe(adjust(chicken, []).score);
  });

  it("does not stack two conditions onto the same nutrient", () => {
    // Someone with diabetes and high blood pressure must not be charged twice
    // for one gram of sugar.
    const both = adjust(cola, ["diabetes", "blood_pressure"]);
    const diabetesOnly = adjust(cola, ["diabetes"]);
    expect(both.score).toBe(diabetesOnly.score);
  });

  it("can only ever subtract", () => {
    for (const food of [orange, rice, cola, samosa]) {
      for (const condition of ["diabetes", "pcos", "blood_pressure", "cholesterol"]) {
        const result = adjust(food, [condition]);
        expect(result.score).toBeLessThanOrEqual(result.baseScore);
        expect(result.score).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

describe("explainFoodQuality", () => {
  const explain = (
    food: FoodQualityInput,
    options: { conditions?: Parameters<typeof applyConditionAdjustment>[2]; missed?: boolean } = {},
  ) => {
    const breakdown = calculateFoodQuality(food)!;
    return explainFoodQuality(breakdown, food, {
      adjusted: applyConditionAdjustment(breakdown, food, options.conditions ?? []),
      includeMissed: options.missed ?? false,
    });
  };
  const codes = (reasons: ReturnType<typeof explain>) => reasons.map((reason) => reason.code);

  const grilledChicken: FoodQualityInput = {
    calories: 248,
    proteinG: 46,
    carbsG: 0,
    fatG: 5.4,
    fiberG: 0,
    sugarG: 0,
    sodiumMg: 111,
    grams: 150,
    cookingMethod: "grilled",
  };
  const cola: FoodQualityInput = {
    calories: 140,
    proteinG: 0,
    carbsG: 39,
    fatG: 0,
    fiberG: 0,
    sugarG: 39,
    sodiumMg: 45,
    grams: 355,
  };
  const friedSnack: FoodQualityInput = {
    calories: 540,
    proteinG: 6,
    carbsG: 52,
    fatG: 34,
    fiberG: 2,
    sugarG: 3,
    // Sodium is judged per 100 kcal, so a dense snack needs a lot to count.
    sodiumMg: 2200,
    grams: 100,
    cookingMethod: "fried",
  };

  it("names what lifted a good food", () => {
    const reasons = explain(grilledChicken);
    expect(codes(reasons)).toContain("good_protein");
    expect(codes(reasons)).toContain("light_cooking");
    expect(reasons.every((reason) => reason.tone === "good")).toBe(true);
  });

  it("names what held a poor food back", () => {
    const reasons = explain(friedSnack, { missed: true });
    expect(codes(reasons)).toEqual(
      expect.arrayContaining(["dense_energy", "high_sodium", "heavy_cooking"]),
    );
  });

  it("calls sugar with nothing alongside it what it is, once", () => {
    const reasons = codes(explain(cola, { missed: true }));
    expect(reasons).toContain("empty_calories");
    // The same sugar must not be reported as two separate problems.
    expect(reasons).not.toContain("high_sugar");
  });

  it("never quotes a number", () => {
    for (const food of [grilledChicken, cola, friedSnack]) {
      for (const reason of explain(food, { missed: true, conditions: ["diabetes"] })) {
        expect(reason.text).not.toMatch(/\d/);
      }
    }
  });

  it("only mentions what a food lacks when asked to", () => {
    const orange: FoodQualityInput = {
      calories: 47,
      proteinG: 0.7,
      carbsG: 12,
      fatG: 0.2,
      grams: 88,
    };
    // A top-rated fruit is not helped by "not much protein".
    expect(codes(explain(orange))).not.toContain("low_protein");
    expect(codes(explain(orange, { missed: true }))).toContain("low_protein");
  });

  it("does not call an unmeasured food low in fiber", () => {
    const unmeasured: FoodQualityInput = { calories: 300, proteinG: 5, carbsG: 60, fatG: 4 };
    expect(codes(explain(unmeasured, { missed: true }))).not.toContain("low_fiber");
  });

  it("says so when the user's health focus lowered the rating", () => {
    const withFocus = explain(cola, { conditions: ["diabetes"] });
    const focus = withFocus.find((reason) => reason.code === "health_focus");
    expect(focus).toMatchObject({ tone: "watch", personalised: true });
    expect(focus?.text).toContain("diabetes or prediabetes");

    expect(codes(explain(cola))).not.toContain("health_focus");
    // A condition that did not move this food's score is not mentioned.
    expect(codes(explain(grilledChicken, { conditions: ["diabetes"] }))).not.toContain(
      "health_focus",
    );
  });
});
