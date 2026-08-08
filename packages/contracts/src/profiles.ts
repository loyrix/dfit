import { z } from "zod";
import { idSchema } from "./common.js";

/**
 * Optional health focus areas.
 *
 * Launched with four only. Kidney disease, gout, IBS, pregnancy and allergies
 * carry the highest medical risk and the smallest audience, so they are not in
 * v1. These change the wording around a Plate Score, never the number.
 */
export const healthFocusSchema = z.enum(["diabetes", "blood_pressure", "cholesterol", "pcos"]);

export type HealthFocusContract = z.infer<typeof healthFocusSchema>;

export const customMacroSplitSchema = z
  .object({
    carbsPct: z.number().min(0).max(100),
    fatPct: z.number().min(0).max(100),
    proteinPct: z.number().min(0).max(100),
  })
  .refine((split) => Math.abs(split.carbsPct + split.fatPct + split.proteinPct - 100) <= 0.5, {
    message: "Macro split must add up to 100%.",
  });

export type CustomMacroSplitContract = z.infer<typeof customMacroSplitSchema>;

export const profileHealthTargetRequestSchema = z.object({
  heightCm: z.number().min(90).max(250),
  weightKg: z.number().min(25).max(300),
  ageYears: z.number().int().min(18).max(90),
  sex: z.enum(["female", "male", "not_specified"]),
  // "extra_active" is additive: older apps keep sending the original four and
  // stay valid. "active" is the spec's "very active".
  activityLevel: z.enum(["sedentary", "light", "moderate", "active", "extra_active"]),
  goal: z.enum(["maintain", "lose_gently", "gain_gently"]),
  // Defaulted so older app builds that omit it keep validating.
  healthFocus: z.array(healthFocusSchema).max(4).default([]),
  /**
   * Part A9. Optional user-chosen macro split that replaces the computed
   * centres. Only meaningful as a complete set, so it is one object rather than
   * three loose fields, and it must sum to 100.
   */
  customMacroSplit: customMacroSplitSchema.optional(),
});

export const profileHealthTargetSchema = profileHealthTargetRequestSchema.extend({
  profileId: idSchema,
  bmi: z.number().positive(),
  bmiCategory: z.enum(["underweight", "healthy", "overweight", "obese"]),
  bmrCalories: z.number().int().positive(),
  dailyCalorieTarget: z.number().int().positive(),
  formula: z.string().min(1),
  /** Present only when the user set their own split. */
  customMacroSplit: customMacroSplitSchema.optional(),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
});

export const profileHealthTargetResponseSchema = z.object({
  healthTarget: profileHealthTargetSchema.nullable().optional(),
});

export type ProfileHealthTargetRequestContract = z.infer<typeof profileHealthTargetRequestSchema>;
export type ProfileHealthTargetContract = z.infer<typeof profileHealthTargetSchema>;
export type ProfileHealthTargetResponseContract = z.infer<typeof profileHealthTargetResponseSchema>;
