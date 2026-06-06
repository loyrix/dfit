import { z } from "zod";

export const subscriptionStatusSchema = z.enum([
  "active",
  "inactive",
  "expired",
  "cancelled",
  "billing_issue",
  "unknown",
]);

export const subscriptionStoreSchema = z.enum([
  "app_store",
  "play_store",
  "stripe",
  "promotional",
  "unknown",
]);

export const subscriptionUsageSchema = z.object({
  monthlyLimit: z.number().int().positive(),
  dailyLimit: z.number().int().positive(),
  usedThisPeriod: z.number().int().nonnegative(),
  usedToday: z.number().int().nonnegative(),
  remainingThisPeriod: z.number().int().nonnegative(),
  remainingToday: z.number().int().nonnegative(),
  premiumRemaining: z.number().int().nonnegative(),
});

export const subscriptionStatusResponseSchema = z.object({
  appUserId: z.string().min(1),
  entitlementId: z.string().min(1),
  active: z.boolean(),
  status: subscriptionStatusSchema,
  store: subscriptionStoreSchema.optional(),
  productId: z.string().min(1).optional(),
  currentPeriodStart: z.string().datetime().optional(),
  currentPeriodEnd: z.string().datetime().optional(),
  willRenew: z.boolean().optional(),
  usage: subscriptionUsageSchema,
});

export const syncRevenueCatSubscriptionRequestSchema = z.object({
  appUserId: z.string().trim().min(1).max(160).optional(),
});

export type SubscriptionStatusContract = z.infer<typeof subscriptionStatusResponseSchema>;
export type SyncRevenueCatSubscriptionRequestContract = z.infer<
  typeof syncRevenueCatSubscriptionRequestSchema
>;
