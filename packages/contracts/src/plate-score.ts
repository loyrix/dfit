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

export type PlateScoreAxisNameContract = z.infer<typeof plateScoreAxisNameSchema>;
export type PlateScoreBandContract = z.infer<typeof plateScoreBandSchema>;
export type PlateScoreTierContract = z.infer<typeof plateScoreTierSchema>;
export type PlateScoreAxisContract = z.infer<typeof plateScoreAxisSchema>;
export type PlateScoreContract = z.infer<typeof plateScoreSchema>;
