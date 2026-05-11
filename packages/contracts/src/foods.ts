import { z } from "zod";
import { idSchema, macroTotalsSchema, portionUnitSchema } from "./common.js";

export const portionConversionSchema = z.object({
  unit: portionUnitSchema,
  grams: z.number().nonnegative(),
  confidence: z.number().min(0).max(1),
});

export const foodSchema = z.object({
  id: idSchema,
  canonicalName: z.string().min(1),
  region: z.enum(["IN", "GLOBAL"]),
  aliases: z.array(z.string()),
  source: z.string(),
  nutritionPer100g: macroTotalsSchema,
  portions: z.array(portionConversionSchema),
});

export const foodSearchResponseSchema = z.object({
  query: z.string(),
  results: z.array(
    foodSchema.extend({
      matchedAlias: z.string().optional(),
      score: z.number(),
    }),
  ),
});

export const foodUnitsResponseSchema = z.object({
  foodId: idSchema,
  portions: z.array(portionConversionSchema),
});

export type FoodContract = z.infer<typeof foodSchema>;
export type FoodSearchResponseContract = z.infer<typeof foodSearchResponseSchema>;
export type FoodUnitsResponseContract = z.infer<typeof foodUnitsResponseSchema>;
