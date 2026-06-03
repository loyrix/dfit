import { z } from "zod";

export const pushProviderSchema = z.enum(["fcm"]);

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
});

export const registerPushTokenResponseSchema = z.object({
  registered: z.literal(true),
});

export type RegisterPushTokenRequestContract = z.infer<typeof registerPushTokenRequestSchema>;
export type RegisterPushTokenResponseContract = z.infer<typeof registerPushTokenResponseSchema>;
