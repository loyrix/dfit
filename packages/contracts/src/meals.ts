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

export const journalRangeQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(31).default(7),
  weekOffset: z.coerce.number().int().min(0).max(104).default(0),
});

export const journalDaySchema = z.object({
  date: z.string(),
  mealCount: z.number().int().nonnegative(),
  totals: macroTotalsSchema,
  meals: z.array(mealSchema),
});

export const journalRangeResponseSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  timezone: z.string(),
  target: macroTotalsSchema.optional(),
  days: z.array(journalDaySchema),
  summary: z.object({
    windowDays: z.number().int().positive(),
    activeDays: z.number().int().nonnegative(),
    mealCount: z.number().int().nonnegative(),
    totals: macroTotalsSchema,
    trackedDayAverage: macroTotalsSchema,
    calendarDayAverage: macroTotalsSchema,
  }),
});

export const journalWeekOptionSchema = z.object({
  weekOffset: z.number().int().nonnegative(),
  startDate: z.string(),
  endDate: z.string(),
  activeDays: z.number().int().nonnegative(),
});

export const journalWeeksResponseSchema = z.object({
  weeks: z.array(journalWeekOptionSchema),
});

export type MealContract = z.infer<typeof mealSchema>;
export type CreateMealRequestContract = z.infer<typeof createMealRequestSchema>;
export type TodayJournalResponseContract = z.infer<typeof todayJournalResponseSchema>;
export type JournalRangeQueryContract = z.infer<typeof journalRangeQuerySchema>;
export type JournalRangeResponseContract = z.infer<typeof journalRangeResponseSchema>;
export type JournalWeekOptionContract = z.infer<typeof journalWeekOptionSchema>;
export type JournalWeeksResponseContract = z.infer<typeof journalWeeksResponseSchema>;
