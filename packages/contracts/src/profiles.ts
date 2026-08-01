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

export const profileHealthTargetRequestSchema = z.object({
  heightCm: z.number().min(90).max(250),
  weightKg: z.number().min(25).max(300),
  ageYears: z.number().int().min(18).max(90),
  sex: z.enum(["female", "male", "not_specified"]),
  activityLevel: z.enum(["sedentary", "light", "moderate", "active"]),
  goal: z.enum(["maintain", "lose_gently", "gain_gently"]),
  // Defaulted so older app builds that omit it keep validating.
  healthFocus: z.array(healthFocusSchema).max(4).default([]),
});

export const profileHealthTargetSchema = profileHealthTargetRequestSchema.extend({
  profileId: idSchema,
  bmi: z.number().positive(),
  bmiCategory: z.enum(["underweight", "healthy", "overweight", "obese"]),
  bmrCalories: z.number().int().positive(),
  dailyCalorieTarget: z.number().int().positive(),
  formula: z.string().min(1),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
});

export const profileHealthTargetResponseSchema = z.object({
  healthTarget: profileHealthTargetSchema.nullable().optional(),
});

export type ProfileHealthTargetRequestContract = z.infer<typeof profileHealthTargetRequestSchema>;
export type ProfileHealthTargetContract = z.infer<typeof profileHealthTargetSchema>;
export type ProfileHealthTargetResponseContract = z.infer<typeof profileHealthTargetResponseSchema>;
