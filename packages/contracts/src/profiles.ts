import { z } from "zod";
import { idSchema } from "./common.js";

export const profileHealthTargetRequestSchema = z.object({
  heightCm: z.number().min(90).max(250),
  weightKg: z.number().min(25).max(300),
  ageYears: z.number().int().min(18).max(90),
  sex: z.enum(["female", "male", "not_specified"]),
  activityLevel: z.enum(["sedentary", "light", "moderate", "active"]),
  goal: z.enum(["maintain", "lose_gently", "gain_gently"]),
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
