import { z } from "zod";

/**
 * The meal health score as users see it — Part E of
 * `docs/meal-health-score-logic.md`.
 *
 * **The numeric score deliberately does not travel.** Parts B, C and D each
 * produce a 0–100 value, but it stays server-side for tuning and analytics. A
 * number implies a precision a macro heuristic does not have and invites anxious
 * optimisation, so the wire carries stars and a sentence instead. There is no
 * `score` field here on purpose: if it is not in the payload, no client can
 * render it by accident.
 *
 * Every response that carries a rating marks it optional. A day with nothing
 * logged, or a meal with nothing scoreable, omits it rather than sending one
 * star — an untracked day is not a bad day.
 */

export const scoreStarsSchema = z.number().int().min(1).max(5);

/** Where the rating came from. Drives the copy, and where it may be shown. */
export const scoreLevelSchema = z.enum(["meal", "daily", "weekly"]);

export const scoreRatingSchema = z.object({
  stars: scoreStarsSchema,
  message: z.string().min(1),
  level: scoreLevelSchema,
  /**
   * True while a day is still in progress. The app uses this to frame the card
   * as live rather than final — a user who has logged only breakfast is not
   * having a one-star day, they are having an incomplete one.
   */
  provisional: z.boolean().default(false),
});

export type ScoreStarsContract = z.infer<typeof scoreStarsSchema>;
export type ScoreLevelContract = z.infer<typeof scoreLevelSchema>;
export type ScoreRatingContract = z.infer<typeof scoreRatingSchema>;

/**
 * A percentage-of-target window. The ceiling is well above 100 on purpose:
 * these are percentages of a daily calorie target, so the upper edge of the
 * full-marks window is 110 by default and eating over target is a normal,
 * representable state rather than an invalid one.
 */
const percentWindowSchema = z.object({
  min: z.number().min(0).max(500),
  max: z.number().min(0).max(500),
});

const cookingModifierSchema = z
  .object({
    fried: z.number().min(-50).max(50).default(-8),
    sauced_creamy: z.number().min(-50).max(50).default(-5),
    baked: z.number().min(-50).max(50).default(-2),
    grilled: z.number().min(-50).max(50).default(3),
    steamed: z.number().min(-50).max(50).default(5),
    raw: z.number().min(-50).max(50).default(5),
    unknown: z.number().min(-50).max(50).default(0),
  })
  .default({});

/**
 * Every tunable constant behind Parts B–E, stored in `app_runtime_config` under
 * `meal_score_policy`.
 *
 * This exists because the shipped defaults are known to be harsh. Measured
 * against real production data: Part B gives a median of 38 with 60% of meals at
 * 1–2 stars, and Part C has 75% of days scoring zero on calorie adherence,
 * because users log roughly two meals a day. Those numbers are the spec as
 * written, and they ship as written — but they need to be correctable from the
 * backend the moment round-one testing says so, without waiting on an app
 * release and a review cycle.
 *
 * Ratings are computed server-side only, so tuning this row is sufficient on its
 * own: nothing has to be pushed to a client for a change to take effect.
 *
 * Every field carries a default matching the shipped value, so an absent row, a
 * partial row, or a row an operator has half-edited all fall back rather than
 * change behaviour.
 */
const qualityTierSchema = z.object({
  atLeast: z.number().min(0).max(100000),
  points: z.number().min(-100).max(100),
});

/**
 * Nutrient-quality tiers, the model behind every per-meal rating.
 *
 * Replaces macro-band matching, which asked the wrong question: it scored each
 * meal against the user's whole-day macro split, so a mandarin orange scored
 * zero for being 91% carbohydrate. These tiers ask how much nutrition a food
 * carries per calorie instead, which is what people mean by "healthy".
 */
const foodQualitySchema = z
  .object({
    base: z.number().min(0).max(100).default(50),
    energyDensity: z.array(qualityTierSchema).default([
      { atLeast: 400, points: -20 },
      { atLeast: 300, points: -14 },
      { atLeast: 220, points: -6 },
      { atLeast: 150, points: 2 },
      { atLeast: 100, points: 10 },
      { atLeast: 60, points: 16 },
      { atLeast: 0, points: 22 },
    ]),
    fiberDensity: z.array(qualityTierSchema).default([
      { atLeast: 3, points: 18 },
      { atLeast: 2, points: 13 },
      { atLeast: 1, points: 7 },
      { atLeast: 0.5, points: 3 },
      { atLeast: 0, points: 0 },
    ]),
    proteinDensity: z.array(qualityTierSchema).default([
      { atLeast: 10, points: 18 },
      { atLeast: 7, points: 13 },
      { atLeast: 4, points: 7 },
      { atLeast: 2, points: 3 },
      { atLeast: 0, points: 0 },
    ]),
    sugarDensity: z.array(qualityTierSchema).default([
      { atLeast: 20, points: -14 },
      { atLeast: 12, points: -8 },
      { atLeast: 6, points: -3 },
      { atLeast: 0, points: 0 },
    ]),
    sodiumDensity: z.array(qualityTierSchema).default([
      { atLeast: 600, points: -12 },
      { atLeast: 350, points: -7 },
      { atLeast: 200, points: -3 },
      { atLeast: 0, points: 0 },
    ]),
    cooking: cookingModifierSchema,
    emptyCalories: z
      .object({
        sugarShareOver: z.number().min(0).max(100).default(70),
        fiberUnder: z.number().min(0).max(100).default(1),
        points: z.number().min(-100).max(0).default(-22),
      })
      .default({}),
  })
  .default({});

export const mealScorePolicySchema = z.object({
  /** The model behind every per-meal rating. */
  quality: foodQualitySchema,
  meal: z
    .object({
      falloff: z.number().min(1).max(100).default(15),
      weights: z
        .object({
          carbs: z.number().min(0).max(1).default(0.4),
          fat: z.number().min(0).max(1).default(0.35),
          protein: z.number().min(0).max(1).default(0.25),
        })
        .default({}),
      skew: z
        .object({
          thresholdPct: z.number().min(0).max(100).default(70),
          penalty: z.number().min(0).max(100).default(15),
        })
        .default({}),
      protein: z
        .object({
          scalingFactor: z.number().min(0).max(10).default(1),
          cap: z.number().min(0).max(100).default(10),
        })
        .default({}),
      fiber: z
        .object({
          perGram: z.number().min(0).max(10).default(0.5),
          cap: z.number().min(0).max(100).default(8),
        })
        .default({}),
      sugar: z
        .object({
          perGram: z.number().min(0).max(10).default(0.5),
          cap: z.number().min(0).max(100).default(12),
        })
        .default({}),
      cooking: cookingModifierSchema,
    })
    .default({}),
  daily: z
    .object({
      calorieWindow: percentWindowSchema.default({ min: 90, max: 110 }),
      calorieFalloff: z.number().min(1).max(100).default(20),
      blend: z
        .object({
          composite: z.number().min(0).max(1).default(0.7),
          calories: z.number().min(0).max(1).default(0.3),
        })
        .default({}),
    })
    .default({}),
  weekly: z
    .object({
      goodDayThreshold: z.number().min(0).max(100).default(61),
      consistencyPerDay: z.number().min(0).max(100).default(1),
      consistencyCap: z.number().min(0).max(100).default(5),
    })
    .default({}),
  /**
   * E1 star cutoffs, as upper bounds: a score at or below `oneStar` reads one
   * star, and anything above `fourStar` reads five. The first thing to reach for
   * if the real distribution turns out to cluster in one bucket.
   */
  stars: z
    .object({
      oneStar: z.number().min(0).max(100).default(20),
      twoStar: z.number().min(0).max(100).default(40),
      threeStar: z.number().min(0).max(100).default(60),
      fourStar: z.number().min(0).max(100).default(80),
    })
    .default({}),
});

export type MealScorePolicyContract = z.infer<typeof mealScorePolicySchema>;

export const defaultMealScorePolicyConfig = (): MealScorePolicyContract =>
  mealScorePolicySchema.parse({});
