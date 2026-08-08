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
  /**
   * Which commit is actually serving traffic.
   *
   * Vercel reports a skipped build as a successful deployment, so a push whose
   * last commit touches only the app silently leaves the API on older code with
   * nothing anywhere reporting a problem. That happened across four commits and
   * cost an afternoon of debugging a feature that was never deployed.
   *
   * `commit` answers "is my change live?" in one curl, with no dashboard and no
   * guessing. Undefined outside Vercel, where the question does not arise.
   */
  const buildInfo = () => ({
    ok: true,
    service: "logmyplate-api",
    version: "0.0.0",
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7),
  });

  app.get("/", async () => buildInfo());

  app.get("/health", async () => buildInfo());

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
