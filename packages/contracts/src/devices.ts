import { z } from "zod";

export const pushProviderSchema = z.enum(["fcm", "apns"]);

export const pushTokenPlatformSchema = z.enum(["ios", "android"]);

export const pushPermissionStatusSchema = z.enum([
  "authorized",
  "provisional",
  "denied",
  "not_determined",
  "unknown",
]);

export const registerPushTokenRequestSchema = z.object({
  provider: pushProviderSchema.default("fcm"),
  token: z.string().trim().min(16).max(4096),
  platform: pushTokenPlatformSchema.optional(),
  permissionStatus: pushPermissionStatusSchema.default("unknown"),
  apnsSandbox: z.boolean().optional(),
});

export const registerPushTokenResponseSchema = z.object({
  registered: z.literal(true),
});

export type RegisterPushTokenRequestContract = z.infer<typeof registerPushTokenRequestSchema>;
export type RegisterPushTokenResponseContract = z.infer<typeof registerPushTokenResponseSchema>;

/**
 * Install attribution — where this install came from.
 *
 * Reported once, on the client's first launch after attribution became
 * available. Every field is nullable because the honest answer is often "we do
 * not know": an organic App Store install carries no campaign at all, and
 * pretending otherwise would put invented channels in the growth numbers.
 */
export const recordInstallAttributionRequestSchema = z.object({
  /** utm_source, or a channel label the client could resolve. */
  source: z.string().trim().min(1).max(100).nullable().default(null),
  medium: z.string().trim().min(1).max(100).nullable().default(null),
  campaign: z.string().trim().min(1).max(200).nullable().default(null),
  /**
   * The verbatim referrer string the platform handed us, kept so a parsing bug
   * can be corrected after the fact rather than losing the install forever.
   */
  referrerRaw: z.string().trim().min(1).max(1000).nullable().default(null),
  /**
   * Firebase Analytics app instance id. This is the join key between our
   * `devices` rows and GA4/BigQuery, and is what makes an in-app funnel
   * splittable by acquisition channel.
   */
  analyticsInstanceId: z.string().trim().min(1).max(64).nullable().default(null),
});

export const recordInstallAttributionResponseSchema = z.object({
  recorded: z.boolean(),
});

export type RecordInstallAttributionRequestContract = z.infer<
  typeof recordInstallAttributionRequestSchema
>;
export type RecordInstallAttributionResponseContract = z.infer<
  typeof recordInstallAttributionResponseSchema
>;
