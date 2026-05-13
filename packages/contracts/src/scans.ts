import { z } from "zod";
import { idSchema, macroTotalsSchema, portionUnitSchema } from "./common.js";
import { mealTypeSchema } from "./meals.js";

export const scanStatusSchema = z.enum([
  "prepared",
  "analyzing",
  "needs_ad",
  "ready_for_review",
  "confirmed",
  "cancelled",
  "failed",
]);

export const prepareScanResponseSchema = z.object({
  scanId: idSchema,
  status: scanStatusSchema,
  quota: z.object({
    freeRemaining: z.number().int().nonnegative(),
    rewardedRemaining: z.number().int().nonnegative(),
    premiumRemaining: z.number().int().nonnegative(),
  }),
});

export const analyzeScanRequestSchema = z
  .object({
    hint: z.string().trim().max(280).optional(),
    image: z
      .object({
        mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
        base64: z.string().min(1).max(8_000_000),
        byteSize: z.number().int().positive().max(6_000_000),
      })
      .optional(),
  })
  .default({});

export const analyzedMealItemSchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  aliases: z.array(z.string()).default([]),
  quantity: z.number().positive(),
  unit: portionUnitSchema,
  estimatedGrams: z.number().nonnegative(),
  preparation: z.enum(["home", "restaurant", "packaged", "unknown"]).default("unknown"),
  confidence: z.number().min(0).max(1),
  nutrition: macroTotalsSchema,
});

export const analyzeScanResponseSchema = z.object({
  scanId: idSchema,
  status: z.literal("ready_for_review"),
  mealType: mealTypeSchema,
  mealName: z.string().min(1),
  detectedLanguage: z.string().default("en"),
  items: z.array(analyzedMealItemSchema),
  totals: macroTotalsSchema,
});

export const confirmScanRequestSchema = z.object({
  mealType: mealTypeSchema,
  title: z.string().min(1),
  items: z.array(
    analyzedMealItemSchema.pick({
      name: true,
      quantity: true,
      unit: true,
      estimatedGrams: true,
      nutrition: true,
    }),
  ),
});

export type PrepareScanResponseContract = z.infer<typeof prepareScanResponseSchema>;
export type AnalyzeScanRequestContract = z.infer<typeof analyzeScanRequestSchema>;
export type AnalyzeScanResponseContract = z.infer<typeof analyzeScanResponseSchema>;
export type ConfirmScanRequestContract = z.infer<typeof confirmScanRequestSchema>;
