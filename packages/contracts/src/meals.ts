import { z } from "zod";
import { idSchema, isoDateTimeSchema, macroTotalsSchema, portionUnitSchema } from "./common.js";

export const mealTypeSchema = z.enum(["breakfast", "lunch", "snack", "dinner"]);

export const mealItemSchema = z.object({
  id: idSchema,
  foodId: idSchema.optional(),
  displayName: z.string().min(1),
  quantity: z.number().positive(),
  unit: portionUnitSchema,
  grams: z.number().nonnegative(),
  nutrition: macroTotalsSchema,
  userEdited: z.boolean().default(false),
});

export const mealSchema = z.object({
  id: idSchema,
  profileId: idSchema,
  mealType: mealTypeSchema,
  title: z.string().min(1),
  loggedAt: isoDateTimeSchema,
  items: z.array(mealItemSchema),
  totals: macroTotalsSchema,
});

export const createMealRequestSchema = z.object({
  mealType: mealTypeSchema,
  title: z.string().min(1),
  loggedAt: isoDateTimeSchema.optional(),
  items: z.array(
    mealItemSchema.omit({
      id: true,
    }),
  ),
});

export const todayJournalResponseSchema = z.object({
  date: z.string(),
  timezone: z.string(),
  totals: macroTotalsSchema,
  target: macroTotalsSchema.optional(),
  meals: z.array(mealSchema),
});

export type MealContract = z.infer<typeof mealSchema>;
export type CreateMealRequestContract = z.infer<typeof createMealRequestSchema>;
export type TodayJournalResponseContract = z.infer<typeof todayJournalResponseSchema>;
