import type { FastifyInstance } from "fastify";
import { rewardedAdsPerScan, rewardedDailyScanLimit } from "@logmyplate/domain";
import { config } from "../config.js";
import type { SqlClient } from "../db/client.js";

type RuntimeConfigRow = {
  key: string;
  value: unknown;
};

type FeatureFlagRow = RuntimeConfigRow;

type AppNoticeRow = {
  id: string;
  title: string;
  body: string;
  severity: "info" | "success" | "warning" | "critical";
  cta_label: string | null;
  cta_url: string | null;
};

export const registerConfigRoutes = async (
  app: FastifyInstance,
  sql?: SqlClient,
): Promise<void> => {
  app.get("/", async () => ({
    ok: true,
    service: "logmyplate-api",
    version: "0.0.0",
  }));

  app.get("/health", async () => ({
    ok: true,
    service: "logmyplate-api",
    version: "0.0.0",
  }));

  app.get("/v1/config", async () => {
    const imageStorage = isMealImageStorageConfigured();
    const runtimeConfig = sql ? await loadRuntimeConfig(sql) : new Map<string, unknown>();
    const flags = sql ? await loadFeatureFlags(sql) : new Map<string, unknown>();
    const notices = sql ? await loadActiveNotices(sql) : [];
    const scanLimits = scanLimitsFromRuntime(runtimeConfig.get("scan_limits"));

    return {
      appName: "LogMyPlate",
      scanLimits,
      features: {
        aiProvider: config.aiProvider,
        imageStorage,
        noImageStorage: !imageStorage,
        accountLink: booleanFlag(flags.get("account_link"), true),
        rewardedAds: booleanFlag(flags.get("rewarded_ads"), true),
        premium: booleanFlag(flags.get("premium"), false),
        targetBmiOnboarding: booleanFlag(flags.get("target_bmi_onboarding"), true),
      },
      maintenance: runtimeConfig.get("maintenance") ?? { enabled: false, message: null },
      notices,
    };
  });
};

const isMealImageStorageConfigured = () =>
  Boolean(
    config.storage.s3Endpoint &&
    config.storage.s3Region &&
    config.storage.s3AccessKeyId &&
    config.storage.s3SecretAccessKey,
  );

const loadRuntimeConfig = async (sql: SqlClient) => {
  const rows = await sql<RuntimeConfigRow[]>`
    select key, value
    from app_runtime_config
  `;
  return new Map(rows.map((row) => [row.key, row.value]));
};

const loadFeatureFlags = async (sql: SqlClient) => {
  const rows = await sql<FeatureFlagRow[]>`
    select key, value
    from feature_flags
  `;
  return new Map(rows.map((row) => [row.key, row.value]));
};

const loadActiveNotices = async (sql: SqlClient) => {
  const rows = await sql<AppNoticeRow[]>`
    select
      id::text,
      title,
      body,
      severity,
      cta_label,
      cta_url
    from app_notices
    where active
      and (starts_at is null or starts_at <= now())
      and (ends_at is null or ends_at >= now())
    order by created_at desc
    limit 3
  `;

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    body: row.body,
    severity: row.severity,
    ctaLabel: row.cta_label ?? undefined,
    ctaUrl: row.cta_url ?? undefined,
  }));
};

const booleanFlag = (value: unknown, fallback: boolean) =>
  typeof value === "boolean" ? value : fallback;

const scanLimitsFromRuntime = (value: unknown) => {
  const fallback = {
    freeLifetime: 3,
    rewardedCap: rewardedDailyScanLimit,
    launchTotalCap: 3 + rewardedDailyScanLimit,
    rewardedAdsPerScan,
    rewardedPeriod: "day",
  };

  if (!value || typeof value !== "object") return fallback;
  const candidate = value as Partial<typeof fallback>;
  return {
    freeLifetime: numberOrFallback(candidate.freeLifetime, fallback.freeLifetime),
    rewardedCap: numberOrFallback(candidate.rewardedCap, fallback.rewardedCap),
    launchTotalCap: numberOrFallback(candidate.launchTotalCap, fallback.launchTotalCap),
    rewardedAdsPerScan: numberOrFallback(candidate.rewardedAdsPerScan, fallback.rewardedAdsPerScan),
    rewardedPeriod: candidate.rewardedPeriod === "day" ? "day" : fallback.rewardedPeriod,
  };
};

const numberOrFallback = (value: unknown, fallback: number) => {
  const parsed = Number(value ?? fallback);
  return Number.isFinite(parsed) ? parsed : fallback;
};
