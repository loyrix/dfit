import type { FastifyRequest } from "fastify";
import { z } from "zod";
import type { SqlClient } from "../db/client.js";
import { currentRequestIdentity } from "../request-context.js";

export type AppPlatform = "ios" | "android";

export type ClientAppBuild = {
  platform?: AppPlatform;
  version?: string;
  buildNumber?: number;
};

export const appUpdatePlatformPolicySchema = z.object({
  latestBuild: z.coerce.number().int().min(0).default(0),
  minSupportedBuild: z.coerce.number().int().min(0).default(0),
  latestVersion: z.string().trim().max(32).nullable().default(null),
  storeUrl: z.string().trim().url().max(500).nullable().default(null),
  optionalTitle: z.string().trim().min(3).max(120).default("Update available"),
  optionalMessage: z
    .string()
    .trim()
    .min(3)
    .max(500)
    .default("A newer LogMyPlate version is available with the latest fixes and improvements."),
  mandatoryTitle: z.string().trim().min(3).max(120).default("Update required"),
  mandatoryMessage: z
    .string()
    .trim()
    .min(3)
    .max(500)
    .default("Please update LogMyPlate to continue. This version is no longer supported."),
});

export const appUpdatePolicyConfigSchema = z.object({
  enabled: z.boolean().default(false),
  ios: appUpdatePlatformPolicySchema.default({}),
  android: appUpdatePlatformPolicySchema.default({}),
});

export type AppUpdatePolicyConfig = z.infer<typeof appUpdatePolicyConfigSchema>;

export type AppUpdatePolicyDecision = {
  status: "current" | "optional" | "mandatory";
  platform?: AppPlatform;
  currentBuild?: number;
  currentVersion?: string;
  latestBuild?: number;
  latestVersion?: string | null;
  minSupportedBuild?: number;
  storeUrl?: string | null;
  title?: string;
  message?: string;
};

type RuntimeConfigRow = {
  value: unknown;
};

export const APP_UPDATE_POLICY_KEY = "app_update_policy";

export const defaultAppUpdatePolicyConfig = (): AppUpdatePolicyConfig =>
  appUpdatePolicyConfigSchema.parse({
    enabled: false,
    ios: {
      latestBuild: 0,
      minSupportedBuild: 0,
      latestVersion: "1.0.0",
      storeUrl: "https://apps.apple.com/app/id6770872606",
    },
    android: {
      latestBuild: 0,
      minSupportedBuild: 0,
      latestVersion: "1.0.0",
      storeUrl: "https://play.google.com/store/apps/details?id=com.logmyplate.app",
    },
  });

export const parseAppUpdatePolicyConfig = (value: unknown): AppUpdatePolicyConfig => {
  const parsed = appUpdatePolicyConfigSchema.safeParse(value);
  return parsed.success ? parsed.data : defaultAppUpdatePolicyConfig();
};

export const loadAppUpdatePolicyConfig = async (
  sql?: SqlClient,
): Promise<AppUpdatePolicyConfig> => {
  if (!sql) return defaultAppUpdatePolicyConfig();
  const [row] = await sql<RuntimeConfigRow[]>`
    select value
    from app_runtime_config
    where key = ${APP_UPDATE_POLICY_KEY}
    limit 1
  `;
  return parseAppUpdatePolicyConfig(row?.value);
};

export const readClientAppBuild = (request: FastifyRequest): ClientAppBuild => {
  const identity = currentRequestIdentity();
  const platform = cleanPlatform(request.headers["x-logmyplate-app-platform"]) ?? identity.platform;
  return {
    platform,
    version: cleanTextHeader(request.headers["x-logmyplate-app-version"], 32),
    buildNumber: cleanIntegerHeader(request.headers["x-logmyplate-app-build"]),
  };
};

export const resolveAppUpdatePolicy = (
  config: AppUpdatePolicyConfig,
  client: ClientAppBuild,
): AppUpdatePolicyDecision => {
  if (!config.enabled || !client.platform || client.buildNumber === undefined) {
    return {
      status: "current",
      platform: client.platform,
      currentBuild: client.buildNumber,
      currentVersion: client.version,
    };
  }

  const platformPolicy = config[client.platform];
  const base = {
    platform: client.platform,
    currentBuild: client.buildNumber,
    currentVersion: client.version,
    latestBuild: platformPolicy.latestBuild,
    latestVersion: platformPolicy.latestVersion,
    minSupportedBuild: platformPolicy.minSupportedBuild,
    storeUrl: platformPolicy.storeUrl,
  };

  if (
    platformPolicy.minSupportedBuild > 0 &&
    client.buildNumber < platformPolicy.minSupportedBuild
  ) {
    return {
      ...base,
      status: "mandatory",
      title: platformPolicy.mandatoryTitle,
      message: platformPolicy.mandatoryMessage,
    };
  }

  if (platformPolicy.latestBuild > 0 && client.buildNumber < platformPolicy.latestBuild) {
    return {
      ...base,
      status: "optional",
      title: platformPolicy.optionalTitle,
      message: platformPolicy.optionalMessage,
    };
  }

  return {
    ...base,
    status: "current",
  };
};

const cleanTextHeader = (value: unknown, maxLength: number): string | undefined => {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== "string") return undefined;
  const trimmed = raw.trim();
  return trimmed ? trimmed.slice(0, maxLength) : undefined;
};

const cleanIntegerHeader = (value: unknown): number | undefined => {
  const text = cleanTextHeader(value, 32);
  if (!text) return undefined;
  const parsed = Number(text);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : undefined;
};

const cleanPlatform = (value: unknown): AppPlatform | undefined => {
  const platform = cleanTextHeader(value, 16);
  return platform === "ios" || platform === "android" ? platform : undefined;
};
