import { z } from "zod";

/**
 * Plate Score, a deterministic 0-100 rating of a single meal.
 *
 * Always optional on the responses that carry it. A meal with nothing scoreable
 * omits it entirely rather than sending a zero, and older app builds ignore the
 * field, so adding it breaks nothing in either direction.
 */

export const plateScoreAxisNameSchema = z.enum([
  "calorie_fit",
  "protein",
  "macro_balance",
  "fiber",
]);

export const plateScoreBandSchema = z.enum(["excellent", "good", "moderate", "heavy"]);

/**
 * `general` uses only the axes that describe the food itself, for users who have
 * not set a health target. `personal` adds calorie fit against their daily
 * target and a goal-shifted protein target.
 */
export const plateScoreTierSchema = z.enum(["general", "personal"]);

export const plateScoreAxisSchema = z.object({
  axis: plateScoreAxisNameSchema,
  score: z.number().min(0).max(100),
  /** Share of the final score this axis carried, after renormalisation. */
  weight: z.number().min(0).max(100),
});

export const plateScoreSchema = z.object({
  score: z.number().int().min(0).max(100),
  band: plateScoreBandSchema,
  tier: plateScoreTierSchema,
  axes: z.array(plateScoreAxisSchema),
  /**
   * Axes left out because the data they need was unavailable. A `calorie_fit`
   * entry is what the client uses to offer "add your details to personalise
   * this"; a `fiber` entry simply means the nutrient was never recorded.
   */
  skipped: z.array(plateScoreAxisNameSchema),
});

const rangeSchema = z.object({
  min: z.number().min(0).max(100),
  max: z.number().min(0).max(100),
});

/**
 * The tunable numbers behind the score, served in bootstrap so the mobile app
 * can compute an identical score locally.
 *
 * That local copy is what lets the review screen update instantly while the user
 * edits portions, without a network round-trip per keystroke. The shape of the
 * algorithm lives in code on both sides and is pinned by shared test vectors;
 * only these constants travel, so they stay tunable from the backend without an
 * app release.
 *
 * Every field has a default matching the shipped values, so a partial or absent
 * config falls back rather than breaking scoring.
 */
export const plateScorePolicySchema = z.object({
  weights: z
    .object({
      calorie_fit: z.number().min(0).max(100).default(25),
      protein: z.number().min(0).max(100).default(30),
      macro_balance: z.number().min(0).max(100).default(25),
      fiber: z.number().min(0).max(100).default(20),
    })
    .default({}),
  mealShare: z
    .object({
      breakfast: z.number().min(0).max(1).default(0.25),
      lunch: z.number().min(0).max(1).default(0.35),
      dinner: z.number().min(0).max(1).default(0.3),
      snack: z.number().min(0).max(1).default(0.1),
    })
    .default({}),
  calorieTolerance: z
    .object({
      breakfast: z.number().min(0.05).max(5).default(0.35),
      lunch: z.number().min(0.05).max(5).default(0.35),
      dinner: z.number().min(0.05).max(5).default(0.35),
      snack: z.number().min(0.05).max(5).default(0.7),
    })
    .default({}),
  proteinDensityTarget: z
    .object({
      maintain: z.number().min(1).max(200).default(40),
      lose_gently: z.number().min(1).max(200).default(50),
      gain_gently: z.number().min(1).max(200).default(45),
    })
    .default({}),
  generalProteinDensityTarget: z.number().min(1).max(200).default(40),
  fiberDensityTarget: z.number().min(1).max(100).default(14),
  macroBands: z
    .object({
      proteinPct: rangeSchema.default({ min: 15, max: 35 }),
      carbsPct: rangeSchema.default({ min: 40, max: 65 }),
      fatPct: rangeSchema.default({ min: 20, max: 35 }),
      penaltyMultiplier: z.number().min(0).max(10).default(1.5),
    })
    .default({}),
  bandCutoffs: z
    .object({
      excellent: z.number().min(0).max(100).default(85),
      good: z.number().min(0).max(100).default(70),
      moderate: z.number().min(0).max(100).default(50),
    })
    .default({}),
});

export type PlateScorePolicyContract = z.infer<typeof plateScorePolicySchema>;

export const defaultPlateScorePolicyConfig = (): PlateScorePolicyContract =>
  plateScorePolicySchema.parse({});

export type PlateScoreAxisNameContract = z.infer<typeof plateScoreAxisNameSchema>;
export type PlateScoreBandContract = z.infer<typeof plateScoreBandSchema>;
export type PlateScoreTierContract = z.infer<typeof plateScoreTierSchema>;
export type PlateScoreAxisContract = z.infer<typeof plateScoreAxisSchema>;
export type PlateScoreContract = z.infer<typeof plateScoreSchema>;
