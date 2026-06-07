import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { engagementPolicyConfigSchema } from "@logmyplate/contracts";
import type { MealImageSummary } from "@logmyplate/domain";
import postgres from "postgres";
import { z } from "zod";
import { config } from "../config.js";
import type { SqlClient } from "../db/client.js";
import type { MealImageStorage } from "../services/meal-image-storage.js";
import {
  APP_UPDATE_POLICY_KEY,
  appUpdatePolicyConfigSchema,
  loadAppUpdatePolicyConfig,
  parseAppUpdatePolicyConfig,
} from "../services/app-update-policy.js";
import {
  ENGAGEMENT_POLICY_KEY,
  loadEngagementPolicy,
  parseEngagementPolicy,
} from "../services/engagement-policy.js";
import {
  ApplePushNotificationSender,
  FirebaseCloudMessagingSender,
  PushNotificationConfigurationError,
  PushNotificationRouter,
  pushNotificationFailureKey,
} from "../services/push-notifications.js";

const usdToInr = Number(process.env.AI_COST_USD_TO_INR ?? 95.4);

type AiCostData = {
  generatedAt: string;
  days: number;
  usdToInr: number;
  pricingSource: string;
  overall: AiCostOverall;
  daily: DailyAiCost[];
  platforms: PlatformAiCost[];
  appBuilds: AppBuildAiCost[];
  models: ModelAiCost[];
  recentRuns: RecentAiRun[];
};

type AiCostOverall = {
  runs: number;
  scans: number;
  successfulRuns: number;
  successfulScans: number;
  failedRuns: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  costUsd: number;
  costInr: number;
  averageRunCostInr: number;
  averageCostInr: number;
  runsPerTenInr: number;
  scansPerTenInr: number;
  averageLatencyMs: number | null;
  averageConfidence: number | null;
};

type DailyAiCost = {
  date: string;
  runs: number;
  scans: number;
  inputTokens: number;
  outputTokens: number;
  costInr: number;
  averageRunCostInr: number;
  averageCostInr: number;
};

type PlatformAiCost = {
  platform: "ios" | "android" | "unknown";
  runs: number;
  scans: number;
  inputTokens: number;
  outputTokens: number;
  costInr: number;
  averageRunCostInr: number;
  averageCostInr: number;
  runsPerTenInr: number;
  scansPerTenInr: number;
};

type AppBuildAiCost = PlatformAiCost & {
  appVersion: string;
  appBuild: number;
};

type ModelAiCost = {
  provider: string;
  model: string;
  runs: number;
  scans: number;
  inputTokens: number;
  outputTokens: number;
  costInr: number;
  averageRunCostInr: number;
  averageCostInr: number;
  runsPerTenInr: number;
  scansPerTenInr: number;
};

type RecentAiRun = {
  createdAt: string;
  platform: "ios" | "android" | "unknown";
  appVersion: string;
  appBuild: number;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costInr: number;
  latencyMs: number | null;
  confidence: number | null;
  success: boolean;
};

type OverallRow = {
  runs: number | string | null;
  scans: number | string | null;
  successful_runs: number | string | null;
  successful_scans: number | string | null;
  failed_runs: number | string | null;
  input_tokens: number | string | null;
  output_tokens: number | string | null;
  cost_usd: number | string | null;
  average_latency_ms: number | string | null;
  average_confidence: number | string | null;
};

type DailyRow = {
  date: string;
  runs: number | string | null;
  scans: number | string | null;
  input_tokens: number | string | null;
  output_tokens: number | string | null;
  cost_usd: number | string | null;
};

type ModelRow = DailyRow & {
  provider: string;
  model: string;
};

type PlatformAiCostRow = DailyRow & {
  platform: string | null;
  app_version?: string | null;
  app_build?: number | string | null;
};

type RecentRunRow = {
  created_at: string;
  platform: string | null;
  app_version: string | null;
  app_build: number | string | null;
  provider: string;
  model: string;
  input_tokens: number | string | null;
  output_tokens: number | string | null;
  cost_usd: number | string | null;
  latency_ms: number | string | null;
  confidence: number | string | null;
  success: boolean;
};

export const registerAdminRoutes = async (
  app: FastifyInstance,
  sql?: SqlClient,
  mealImageStorage?: MealImageStorage,
): Promise<void> => {
  app.get("/admin/session", { preHandler: requireAdmin }, async (request) => ({
    actor: getAdminActor(request),
    enabled: true,
  }));

  app.get("/admin/overview", { preHandler: requireAdmin }, async (_request, reply) => {
    if (!sql) return reply.status(503).send({ error: "database_unavailable" });
    return loadAdminOverview(sql);
  });

  app.get("/admin/ai-cost", { preHandler: requireAdmin }, async (_request, reply) => {
    return reply.type("text/html").send(renderAiCostDashboardHtml());
  });

  app.get("/admin/ai-cost/data", { preHandler: requireAdmin }, async (request, reply) => {
    if (!sql) {
      return reply.status(503).send({ error: "database_unavailable" });
    }

    const query = aiCostQuerySchema.parse(request.query ?? {});
    const days = clampDays(query.days);
    const data = await loadAiCostData(sql, days, query.platform);
    return reply.send(data);
  });

  app.get("/admin/users", { preHandler: requireAdmin }, async (request, reply) => {
    if (!sql) return reply.status(503).send({ error: "database_unavailable" });
    const query = adminUserSearchQuerySchema.parse(request.query ?? {});
    return searchAdminUsers(sql, query);
  });

  app.get("/admin/users/:profileId", { preHandler: requireAdmin }, async (request, reply) => {
    if (!sql) return reply.status(503).send({ error: "database_unavailable" });
    const { profileId } = profileParamsSchema.parse(request.params);
    const user = await loadAdminUser(sql, profileId);
    if (!user) return reply.status(404).send({ error: "profile_not_found" });
    return { user };
  });

  app.get("/admin/conversions", { preHandler: requireAdmin }, async (request, reply) => {
    if (!sql) return reply.status(503).send({ error: "database_unavailable" });
    const query = adminConversionQuerySchema.parse(request.query ?? {});
    return listAdminConversions(sql, query);
  });

  app.post(
    "/admin/users/:profileId/grants",
    { preHandler: requireAdmin },
    async (request, reply) => {
      if (!sql) return reply.status(503).send({ error: "database_unavailable" });
      const { profileId } = profileParamsSchema.parse(request.params);
      const body = grantCreditSchema.parse(request.body ?? {});
      const grant = await grantScanCredits(sql, request, profileId, body);
      if (!grant) return reply.status(404).send({ error: "profile_not_found" });
      return reply.status(201).send({ grant });
    },
  );

  app.patch(
    "/admin/users/:profileId/reactivate",
    { preHandler: requireAdmin },
    async (request, reply) => {
      if (!sql) return reply.status(503).send({ error: "database_unavailable" });
      const { profileId } = profileParamsSchema.parse(request.params);
      const body = reactivateProfileSchema.parse(request.body ?? {});
      const result = await reactivateUserProfile(sql, request, profileId, body);
      if (!result) return reply.status(404).send({ error: "profile_not_found" });
      return result;
    },
  );

  app.post(
    "/admin/users/:profileId/no-food-limit/reset",
    { preHandler: requireAdmin },
    async (request, reply) => {
      if (!sql) return reply.status(503).send({ error: "database_unavailable" });
      const { profileId } = profileParamsSchema.parse(request.params);
      const body = resetNoFoodScanLimitSchema.parse(request.body ?? {});
      const result = await resetNoFoodScanLimit(sql, request, profileId, body);
      if (!result) return reply.status(404).send({ error: "profile_not_found" });
      return reply.status(201).send(result);
    },
  );

  app.get("/admin/scans", { preHandler: requireAdmin }, async (request, reply) => {
    if (!sql) return reply.status(503).send({ error: "database_unavailable" });
    const query = adminScanQuerySchema.parse(request.query ?? {});
    return listAdminScans(sql, query);
  });

  app.get("/admin/scans/:scanId", { preHandler: requireAdmin }, async (request, reply) => {
    if (!sql) return reply.status(503).send({ error: "database_unavailable" });
    const { scanId } = scanParamsSchema.parse(request.params);
    const scan = await loadAdminScan(sql, scanId, mealImageStorage);
    if (!scan) return reply.status(404).send({ error: "scan_not_found" });
    return { scan };
  });

  app.get("/admin/ai/models", { preHandler: requireAdmin }, async (_request, reply) => {
    if (!sql) return reply.status(503).send({ error: "database_unavailable" });
    return { models: await listAiModels(sql) };
  });

  app.put("/admin/ai/models/default", { preHandler: requireAdmin }, async (request, reply) => {
    if (!sql) return reply.status(503).send({ error: "database_unavailable" });
    const body = setDefaultModelSchema.parse(request.body ?? {});
    const model = await setDefaultAiModel(sql, request, body);
    return { model };
  });

  app.patch("/admin/ai/models/:key", { preHandler: requireAdmin }, async (request, reply) => {
    if (!sql) return reply.status(503).send({ error: "database_unavailable" });
    const { key } = modelParamsSchema.parse(request.params);
    const body = updateModelSchema.parse(request.body ?? {});
    const model = await updateAiModel(sql, request, key, body);
    if (!model) return reply.status(404).send({ error: "ai_model_not_found" });
    return { model };
  });

  app.get("/admin/ai/prompts", { preHandler: requireAdmin }, async (_request, reply) => {
    if (!sql) return reply.status(503).send({ error: "database_unavailable" });
    return { prompts: await listAiPrompts(sql) };
  });

  app.post("/admin/ai/prompts", { preHandler: requireAdmin }, async (request, reply) => {
    if (!sql) return reply.status(503).send({ error: "database_unavailable" });
    const body = createPromptSchema.parse(request.body ?? {});
    const prompt = await createPromptVersion(sql, request, body);
    return reply.status(201).send({ prompt });
  });

  app.put("/admin/ai/prompts/active", { preHandler: requireAdmin }, async (request, reply) => {
    if (!sql) return reply.status(503).send({ error: "database_unavailable" });
    const body = activatePromptSchema.parse(request.body ?? {});
    const prompt = await activatePromptVersion(sql, request, body);
    return { prompt };
  });

  app.get("/admin/feature-flags", { preHandler: requireAdmin }, async (_request, reply) => {
    if (!sql) return reply.status(503).send({ error: "database_unavailable" });
    return { flags: await listFeatureFlags(sql) };
  });

  app.put("/admin/feature-flags/:key", { preHandler: requireAdmin }, async (request, reply) => {
    if (!sql) return reply.status(503).send({ error: "database_unavailable" });
    const { key } = flagParamsSchema.parse(request.params);
    const body = updateFeatureFlagSchema.parse(request.body ?? {});
    const flag = await updateFeatureFlag(sql, request, key, body);
    return { flag };
  });

  app.get("/admin/notices", { preHandler: requireAdmin }, async (_request, reply) => {
    if (!sql) return reply.status(503).send({ error: "database_unavailable" });
    return { notices: await listAppNotices(sql) };
  });

  app.post("/admin/notices", { preHandler: requireAdmin }, async (request, reply) => {
    if (!sql) return reply.status(503).send({ error: "database_unavailable" });
    const body = createNoticeSchema.parse(request.body ?? {});
    const notice = await createAppNotice(sql, request, body);
    return reply.status(201).send({ notice });
  });

  app.patch("/admin/notices/:noticeId", { preHandler: requireAdmin }, async (request, reply) => {
    if (!sql) return reply.status(503).send({ error: "database_unavailable" });
    const { noticeId } = noticeParamsSchema.parse(request.params);
    const body = updateNoticeSchema.parse(request.body ?? {});
    const notice = await updateAppNotice(sql, request, noticeId, body);
    if (!notice) return reply.status(404).send({ error: "notice_not_found" });
    return { notice };
  });

  app.get("/admin/app-update-policy", { preHandler: requireAdmin }, async (_request, reply) => {
    if (!sql) return reply.status(503).send({ error: "database_unavailable" });
    return { policy: await loadAppUpdatePolicyConfig(sql) };
  });

  app.put("/admin/app-update-policy", { preHandler: requireAdmin }, async (request, reply) => {
    if (!sql) return reply.status(503).send({ error: "database_unavailable" });
    const body = updateAppUpdatePolicySchema.parse(request.body ?? {});
    const policy = await updateAppUpdatePolicy(sql, request, body);
    return { policy };
  });

  app.get("/admin/engagement-policy", { preHandler: requireAdmin }, async (_request, reply) => {
    if (!sql) return reply.status(503).send({ error: "database_unavailable" });
    return { policy: await loadEngagementPolicy(sql) };
  });

  app.put("/admin/engagement-policy", { preHandler: requireAdmin }, async (request, reply) => {
    if (!sql) return reply.status(503).send({ error: "database_unavailable" });
    const body = updateEngagementPolicySchema.parse(request.body ?? {});
    const policy = await updateEngagementPolicy(sql, request, body);
    return { policy };
  });

  app.post(
    "/admin/push-notifications/send",
    { preHandler: requireAdmin },
    async (request, reply) => {
      if (!sql) return reply.status(503).send({ error: "database_unavailable" });
      const parsed = sendPushNotificationSchema.safeParse(request.body ?? {});
      if (!parsed.success) {
        return reply.status(400).send({
          error: "invalid_push_notification",
          issues: parsed.error.issues,
        });
      }
      const body = parsed.data;
      const fcmSender = new FirebaseCloudMessagingSender(config.push);
      const apnsSender = ApplePushNotificationSender.isConfigured(config.push)
        ? new ApplePushNotificationSender(config.push)
        : null;
      const sender = new PushNotificationRouter(fcmSender, apnsSender);
      if (!sender.configured) {
        return reply.status(503).send({
          error: "push_provider_not_configured",
          message: "Firebase Cloud Messaging server credentials are not configured.",
        });
      }

      const targets = await listPushNotificationTargets(sql, body);
      if (targets.length === 0) {
        return reply.status(404).send({
          error: "push_target_not_found",
          message: "No active push tokens matched this target.",
        });
      }

      try {
        const delivery = await sendPushNotificationToTargets(sql, sender, body, targets);
        await insertAuditLog(sql, request, {
          action: "send_push_notification",
          targetType: "push_notification",
          targetId: body.targetType,
          reason: body.reason,
          before: {
            targetType: body.targetType,
            profileId: body.profileId ?? null,
            installId: body.installId ?? null,
            tokenCount: targets.length,
          },
          after: {
            title: body.title,
            sent: delivery.sent,
            failed: delivery.failed,
            disabledTokens: delivery.disabledTokens,
            failures: delivery.failures,
          },
        });
        return { delivery };
      } catch (error) {
        if (error instanceof PushNotificationConfigurationError) {
          return reply.status(503).send({
            error: "push_provider_not_configured",
            message: error.message,
          });
        }
        throw error;
      }
    },
  );

  app.get("/admin/audit-log", { preHandler: requireAdmin }, async (request, reply) => {
    if (!sql) return reply.status(503).send({ error: "database_unavailable" });
    const query = adminAuditQuerySchema.parse(request.query ?? {});
    return listAuditLog(sql, query);
  });
};

const uuidSchema = z.string().uuid();

const directionSchema = z.enum(["asc", "desc"]).default("desc");
const platformQuerySchema = z.enum(["all", "ios", "android"]).default("all");

const aiCostQuerySchema = z.object({
  days: z.string().optional(),
  platform: platformQuerySchema,
});

const adminPaginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  direction: directionSchema,
});

const adminUserSearchQuerySchema = adminPaginationQuerySchema.extend({
  query: z.string().trim().max(160).optional(),
  status: z.enum(["all", "active", "inactive", "deletion_requested", "deleted"]).default("all"),
  authMethod: z.enum(["all", "anonymous", "email", "google", "apple"]).default("all"),
  risk: z.enum(["all", "failed_scans", "low_quota", "deactivated"]).default("all"),
  sort: z
    .enum([
      "updatedAt",
      "createdAt",
      "displayName",
      "email",
      "authMethod",
      "lastScanAt",
      "scans",
      "failedScans",
      "meals",
      "grants",
    ])
    .default("lastScanAt"),
});

const adminConversionQuerySchema = adminPaginationQuerySchema.extend({
  query: z.string().trim().max(160).optional(),
  platform: platformQuerySchema,
  status: z.enum(["all", "registered", "anonymous"]).default("all"),
  sort: z
    .enum([
      "createdAt",
      "updatedAt",
      "displayName",
      "email",
      "authMethod",
      "platform",
      "scans",
      "meals",
      "linkedAt",
    ])
    .default("updatedAt"),
});

const adminScanQuerySchema = adminPaginationQuerySchema.extend({
  profileId: uuidSchema.optional(),
  platform: platformQuerySchema,
  appVersion: z.string().trim().max(32).optional(),
  appBuild: z.coerce.number().int().min(0).optional(),
  status: z
    .enum(["prepared", "analyzing", "ready_for_review", "confirmed", "cancelled", "failed"])
    .optional(),
  query: z.string().trim().max(160).optional(),
  model: z.string().trim().max(120).optional(),
  promptVersion: z.string().trim().max(120).optional(),
  aiState: z.enum(["all", "successful_ai", "failed_ai", "not_analyzed"]).default("all"),
  image: z.enum(["all", "has_image", "no_image"]).default("all"),
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  sort: z
    .enum([
      "createdAt",
      "updatedAt",
      "platform",
      "appVersion",
      "status",
      "model",
      "latencyMs",
      "confidence",
    ])
    .default("createdAt"),
});

const adminAuditQuerySchema = adminPaginationQuerySchema.extend({
  query: z.string().trim().max(160).optional(),
  actor: z.string().trim().max(120).optional(),
  action: z.string().trim().max(120).optional(),
  targetType: z.string().trim().max(120).optional(),
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  sort: z.enum(["createdAt", "actor", "action", "targetType"]).default("createdAt"),
});

type AdminPageInfo = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  sort: string;
  direction: "asc" | "desc";
};

type AdminPaginationInput = {
  limit?: number;
  page?: number;
  pageSize?: number;
  sort?: string;
  direction?: "asc" | "desc";
};

const normalizeAdminPagination = (
  input: AdminPaginationInput,
  defaultPageSize: number,
): AdminPageInfo & { offset: number } => {
  const pageSize = input.pageSize ?? input.limit ?? defaultPageSize;
  const page = input.page ?? 1;
  const total = 0;
  const totalPages = 0;
  return {
    page,
    pageSize,
    offset: (page - 1) * pageSize,
    total,
    totalPages,
    hasPreviousPage: page > 1,
    hasNextPage: false,
    sort: input.sort ?? "createdAt",
    direction: input.direction ?? "desc",
  };
};

const pageInfoFrom = (
  page: number,
  pageSize: number,
  sort: string,
  direction: "asc" | "desc",
  total: number,
): AdminPageInfo => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return {
    page,
    pageSize,
    total,
    totalPages,
    hasPreviousPage: page > 1,
    hasNextPage: page < totalPages,
    sort,
    direction,
  };
};

const profileParamsSchema = z.object({ profileId: uuidSchema });
const scanParamsSchema = z.object({ scanId: uuidSchema });
const modelParamsSchema = z.object({ key: z.string().min(1).max(160) });
const flagParamsSchema = z.object({ key: z.string().min(1).max(160) });
const noticeParamsSchema = z.object({ noticeId: uuidSchema });

const requiredReasonSchema = z.string().trim().min(8).max(500);

const grantCreditSchema = z.object({
  creditType: z.enum(["free", "rewarded", "premium"]),
  amount: z.coerce.number().int().min(1).max(1000),
  reason: requiredReasonSchema,
});

const reactivateProfileSchema = z.object({
  reason: requiredReasonSchema,
});

const resetNoFoodScanLimitSchema = z.object({
  reason: requiredReasonSchema,
});

const setDefaultModelSchema = z.object({
  key: z.string().min(1).max(160),
  reason: requiredReasonSchema,
});

const updateModelSchema = z.object({
  enabled: z.boolean().optional(),
  maxOutputTokens: z.coerce.number().int().min(256).max(8192).optional(),
  temperature: z.coerce.number().min(0).max(2).optional(),
  topP: z.coerce.number().min(0.01).max(1).optional(),
  notes: z.string().trim().max(1000).optional(),
  reason: requiredReasonSchema,
});

const aiPromptKeySchema = z.enum(["food_photo", "food_photo_IN", "food_photo_GLOBAL"]);

const createPromptSchema = z.object({
  key: aiPromptKeySchema.default("food_photo"),
  version: z.string().trim().min(3).max(80),
  title: z.string().trim().min(3).max(160),
  body: z.string().trim().min(100).max(20000),
  reason: requiredReasonSchema,
});

const activatePromptSchema = z.object({
  id: uuidSchema,
  reason: requiredReasonSchema,
});

const updateFeatureFlagSchema = z.object({
  value: z.boolean(),
  description: z.string().trim().max(500).optional(),
  reason: requiredReasonSchema,
});

const createNoticeSchema = z.object({
  title: z.string().trim().min(3).max(120),
  body: z.string().trim().min(3).max(500),
  severity: z.enum(["info", "success", "warning", "critical"]).default("info"),
  active: z.boolean().default(false),
  ctaLabel: z.string().trim().max(80).optional(),
  ctaUrl: z.string().trim().url().max(500).optional(),
  reason: requiredReasonSchema,
});

const updateNoticeSchema = z.object({
  title: z.string().trim().min(3).max(120).optional(),
  body: z.string().trim().min(3).max(500).optional(),
  severity: z.enum(["info", "success", "warning", "critical"]).optional(),
  active: z.boolean().optional(),
  ctaLabel: z.string().trim().max(80).nullable().optional(),
  ctaUrl: z.string().trim().url().max(500).nullable().optional(),
  reason: requiredReasonSchema,
});

const updateAppUpdatePolicySchema = appUpdatePolicyConfigSchema.extend({
  reason: requiredReasonSchema,
});

const updateEngagementPolicySchema = engagementPolicyConfigSchema.extend({
  reason: requiredReasonSchema,
});

const sendPushNotificationSchema = z
  .object({
    targetType: z.enum(["profile", "install", "all_active"]),
    profileId: uuidSchema.optional(),
    installId: z.string().trim().min(3).max(128).optional(),
    title: z.string().trim().min(3).max(120),
    body: z.string().trim().min(3).max(500),
    data: z.record(z.string().trim().max(64), z.string().trim().max(256)).default({}),
    confirmAll: z.string().trim().optional(),
    reason: requiredReasonSchema,
  })
  .superRefine((value, context) => {
    if (value.targetType === "profile" && !value.profileId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["profileId"],
        message: "profileId is required for profile push targets.",
      });
    }
    if (value.targetType === "install" && !value.installId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["installId"],
        message: "installId is required for install push targets.",
      });
    }
    if (value.targetType === "all_active" && value.confirmAll !== "SEND_TO_ALL") {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmAll"],
        message: "Type SEND_TO_ALL to send a broadcast push notification.",
      });
    }
  });

type AdminOverviewRow = {
  profiles: number | string;
  account_profiles: number | string;
  scans: number | string;
  failed_scans: number | string;
  meals: number | string;
  active_notices: number | string;
  installs: number | string;
  new_installs_today: number | string;
  active_installs_24h: number | string;
  active_installs_7d: number | string;
  inactive_installs_30d: number | string;
  scan_active_profiles_today: number | string;
  meal_active_profiles_today: number | string;
};

type AdminDailyActivityRow = {
  local_date: string;
  active_profiles: number | string;
  scans: number | string;
  meal_profiles: number | string;
  meals: number | string;
};

type AdminPlatformOverviewRow = {
  platform: "ios" | "android";
  installs: number | string;
  new_installs_today: number | string;
  active_installs_today: number | string;
  active_installs_24h: number | string;
  active_installs_7d: number | string;
  scans: number | string;
  ai_runs: number | string;
  ai_cost_usd: number | string | null;
};

type AdminDailyPlatformActivityRow = {
  local_date: string;
  platform: "ios" | "android";
  active_installs: number | string;
  installs: number | string;
  scans: number | string;
  ai_runs: number | string;
  ai_cost_usd: number | string | null;
};

type AdminAppBuildOverviewRow = {
  platform: "ios" | "android";
  app_version: string;
  app_build: number | string;
  installs: number | string;
  active_installs_7d: number | string;
  last_seen_at: string | null;
};

const loadAdminOverview = async (sql: SqlClient) => {
  const [row] = await sql<AdminOverviewRow[]>`
    select
      (select count(*) from profiles)::int as profiles,
      (select count(*) from profiles where auth_method <> 'anonymous')::int as account_profiles,
      (select count(*) from scan_sessions)::int as scans,
      (select count(*) from scan_sessions where status = 'failed')::int as failed_scans,
      (select count(*) from meals)::int as meals,
      (select count(*) from app_notices where active)::int as active_notices,
      (select count(*) from devices)::int as installs,
      (
        select count(*)
        from devices
        where (first_seen_at at time zone 'Asia/Kolkata')::date =
          (now() at time zone 'Asia/Kolkata')::date
      )::int as new_installs_today,
      (
        select count(*)
        from devices
        where last_seen_at >= now() - interval '24 hours'
      )::int as active_installs_24h,
      (
        select count(*)
        from devices
        where last_seen_at >= now() - interval '7 days'
      )::int as active_installs_7d,
      (
        select count(*)
        from devices
        where last_seen_at < now() - interval '30 days'
      )::int as inactive_installs_30d,
      (
        select count(distinct profile_id)
        from scan_sessions
        where (created_at at time zone 'Asia/Kolkata')::date =
          (now() at time zone 'Asia/Kolkata')::date
      )::int as scan_active_profiles_today,
      (
        select count(distinct profile_id)
        from meals
        where local_date = (now() at time zone 'Asia/Kolkata')::date
      )::int as meal_active_profiles_today
  `;

  const dailyActivity = await sql<AdminDailyActivityRow[]>`
    with days as (
      select (now() at time zone 'Asia/Kolkata')::date - offsets.day as local_date
      from generate_series(0, 13) as offsets(day)
    ),
    scan_activity as (
      select
        (created_at at time zone 'Asia/Kolkata')::date as local_date,
        count(distinct profile_id)::int as active_profiles,
        count(*)::int as scans
      from scan_sessions
      where created_at >= now() - interval '15 days'
      group by (created_at at time zone 'Asia/Kolkata')::date
    ),
    meal_activity as (
      select
        local_date,
        count(distinct profile_id)::int as meal_profiles,
        count(*)::int as meals
      from meals
      where local_date >= (now() at time zone 'Asia/Kolkata')::date - 13
      group by local_date
    )
    select
      days.local_date::text,
      coalesce(scan_activity.active_profiles, 0)::int as active_profiles,
      coalesce(scan_activity.scans, 0)::int as scans,
      coalesce(meal_activity.meal_profiles, 0)::int as meal_profiles,
      coalesce(meal_activity.meals, 0)::int as meals
    from days
    left join scan_activity on scan_activity.local_date = days.local_date
    left join meal_activity on meal_activity.local_date = days.local_date
    order by days.local_date desc
  `;

  const platformRows = await sql<AdminPlatformOverviewRow[]>`
    with platforms(platform) as (
      values ('ios'::text), ('android'::text)
    ),
    scan_rollup as (
      select
        platform,
        count(*)::int as scans
      from scan_sessions
      where created_at >= now() - interval '30 days'
      group by platform
    ),
    ai_rollup as (
      select
        coalesce(ai_provider_runs.platform, scan_sessions.platform) as platform,
        count(*)::int as ai_runs,
        coalesce(sum(coalesce(
          ai_provider_runs.estimated_cost_usd,
          (
            coalesce(ai_provider_runs.input_token_estimate, 0) * ${inputRateSql(sql)} +
            coalesce(ai_provider_runs.output_token_estimate, 0) * ${outputRateSql(sql)}
          ) / 1000000.0
        )), 0)::numeric as ai_cost_usd
      from ai_provider_runs
      left join scan_sessions on scan_sessions.id = ai_provider_runs.scan_session_id
      where ai_provider_runs.created_at >= now() - interval '30 days'
      group by coalesce(ai_provider_runs.platform, scan_sessions.platform)
    ),
    active_today as (
      select platform, count(distinct install_id)::int as active_installs_today
      from platform_daily_active_installs
      where local_date = (now() at time zone 'Asia/Kolkata')::date
      group by platform
    )
    select
      platforms.platform,
      count(devices.install_id)::int as installs,
      count(devices.install_id) filter (
        where (devices.first_seen_at at time zone 'Asia/Kolkata')::date =
          (now() at time zone 'Asia/Kolkata')::date
      )::int as new_installs_today,
      coalesce(active_today.active_installs_today, 0)::int as active_installs_today,
      count(devices.install_id) filter (
        where devices.last_seen_at >= now() - interval '24 hours'
      )::int as active_installs_24h,
      count(devices.install_id) filter (
        where devices.last_seen_at >= now() - interval '7 days'
      )::int as active_installs_7d,
      coalesce(scan_rollup.scans, 0)::int as scans,
      coalesce(ai_rollup.ai_runs, 0)::int as ai_runs,
      coalesce(ai_rollup.ai_cost_usd, 0)::numeric as ai_cost_usd
    from platforms
    left join devices on devices.platform = platforms.platform
    left join scan_rollup on scan_rollup.platform = platforms.platform
    left join ai_rollup on ai_rollup.platform = platforms.platform
    left join active_today on active_today.platform = platforms.platform
    group by
      platforms.platform,
      active_today.active_installs_today,
      scan_rollup.scans,
      ai_rollup.ai_runs,
      ai_rollup.ai_cost_usd
    order by platforms.platform
  `;

  const dailyPlatformActivity = await sql<AdminDailyPlatformActivityRow[]>`
    with days as (
      select (now() at time zone 'Asia/Kolkata')::date - offsets.day as local_date
      from generate_series(0, 13) as offsets(day)
    ),
    platforms(platform) as (
      values ('ios'::text), ('android'::text)
    ),
    install_rollup as (
      select
        (first_seen_at at time zone 'Asia/Kolkata')::date as local_date,
        platform,
        count(*)::int as installs
      from devices
      where (first_seen_at at time zone 'Asia/Kolkata')::date >=
        (now() at time zone 'Asia/Kolkata')::date - 13
      group by (first_seen_at at time zone 'Asia/Kolkata')::date, platform
    ),
    scan_rollup as (
      select
        (created_at at time zone 'Asia/Kolkata')::date as local_date,
        platform,
        count(*)::int as scans
      from scan_sessions
      where created_at >= now() - interval '15 days'
      group by (created_at at time zone 'Asia/Kolkata')::date, platform
    ),
    ai_rollup as (
      select
        (ai_provider_runs.created_at at time zone 'Asia/Kolkata')::date as local_date,
        coalesce(ai_provider_runs.platform, scan_sessions.platform) as platform,
        count(*)::int as ai_runs,
        coalesce(sum(coalesce(
          ai_provider_runs.estimated_cost_usd,
          (
            coalesce(ai_provider_runs.input_token_estimate, 0) * ${inputRateSql(sql)} +
            coalesce(ai_provider_runs.output_token_estimate, 0) * ${outputRateSql(sql)}
          ) / 1000000.0
        )), 0)::numeric as ai_cost_usd
      from ai_provider_runs
      left join scan_sessions on scan_sessions.id = ai_provider_runs.scan_session_id
      where ai_provider_runs.created_at >= now() - interval '15 days'
      group by
        (ai_provider_runs.created_at at time zone 'Asia/Kolkata')::date,
        coalesce(ai_provider_runs.platform, scan_sessions.platform)
    ),
    active_rollup as (
      select local_date, platform, count(distinct install_id)::int as active_installs
      from platform_daily_active_installs
      where local_date >= (now() at time zone 'Asia/Kolkata')::date - 13
      group by local_date, platform
    )
    select
      days.local_date::text,
      platforms.platform,
      coalesce(active_rollup.active_installs, 0)::int as active_installs,
      coalesce(install_rollup.installs, 0)::int as installs,
      coalesce(scan_rollup.scans, 0)::int as scans,
      coalesce(ai_rollup.ai_runs, 0)::int as ai_runs,
      coalesce(ai_rollup.ai_cost_usd, 0)::numeric as ai_cost_usd
    from days
    cross join platforms
    left join install_rollup
      on install_rollup.local_date = days.local_date
      and install_rollup.platform = platforms.platform
    left join scan_rollup
      on scan_rollup.local_date = days.local_date
      and scan_rollup.platform = platforms.platform
    left join ai_rollup
      on ai_rollup.local_date = days.local_date
      and ai_rollup.platform = platforms.platform
    left join active_rollup
      on active_rollup.local_date = days.local_date
      and active_rollup.platform = platforms.platform
    order by days.local_date desc, platforms.platform
  `;

  const appBuildRows = await sql<AdminAppBuildOverviewRow[]>`
    select
      platform,
      coalesce(nullif(app_version, ''), 'unknown') as app_version,
      coalesce(app_build, 0)::int as app_build,
      count(*)::int as installs,
      count(*) filter (where last_seen_at >= now() - interval '7 days')::int as active_installs_7d,
      max(last_seen_at)::text as last_seen_at
    from devices
    group by platform, coalesce(nullif(app_version, ''), 'unknown'), coalesce(app_build, 0)
    order by active_installs_7d desc, installs desc, last_seen_at desc nulls last
    limit 20
  `;

  return {
    profiles: numberValue(row?.profiles),
    accountProfiles: numberValue(row?.account_profiles),
    scans: numberValue(row?.scans),
    failedScans: numberValue(row?.failed_scans),
    meals: numberValue(row?.meals),
    activeNotices: numberValue(row?.active_notices),
    installs: numberValue(row?.installs),
    newInstallsToday: numberValue(row?.new_installs_today),
    activeInstalls24h: numberValue(row?.active_installs_24h),
    activeInstalls7d: numberValue(row?.active_installs_7d),
    inactiveInstalls30d: numberValue(row?.inactive_installs_30d),
    scanActiveProfilesToday: numberValue(row?.scan_active_profiles_today),
    mealActiveProfilesToday: numberValue(row?.meal_active_profiles_today),
    dailyActivity: dailyActivity.map((day) => ({
      date: day.local_date,
      activeProfiles: numberValue(day.active_profiles),
      scans: numberValue(day.scans),
      mealProfiles: numberValue(day.meal_profiles),
      meals: numberValue(day.meals),
    })),
    platforms: platformRows.map((platform) => ({
      platform: platform.platform,
      installs: numberValue(platform.installs),
      newInstallsToday: numberValue(platform.new_installs_today),
      activeInstallsToday: numberValue(platform.active_installs_today),
      activeInstalls24h: numberValue(platform.active_installs_24h),
      activeInstalls7d: numberValue(platform.active_installs_7d),
      scans: numberValue(platform.scans),
      aiRuns: numberValue(platform.ai_runs),
      aiCostInr: numberValue(platform.ai_cost_usd) * usdToInr,
    })),
    dailyPlatformActivity: dailyPlatformActivity.map((day) => ({
      date: day.local_date,
      platform: day.platform,
      activeInstalls: numberValue(day.active_installs),
      installs: numberValue(day.installs),
      scans: numberValue(day.scans),
      aiRuns: numberValue(day.ai_runs),
      aiCostInr: numberValue(day.ai_cost_usd) * usdToInr,
    })),
    appBuilds: appBuildRows.map((build) => ({
      platform: build.platform,
      appVersion: build.app_version,
      appBuild: numberValue(build.app_build),
      installs: numberValue(build.installs),
      activeInstalls7d: numberValue(build.active_installs_7d),
      lastSeenAt: build.last_seen_at ?? undefined,
    })),
  };
};

type AdminUserRow = {
  id: string;
  auth_method: string;
  email: string | null;
  display_name: string | null;
  identity_provider: string | null;
  provider_subject: string | null;
  timezone: string;
  device_timezone: string | null;
  device_region: string | null;
  device_locale: string | null;
  device_platform: string | null;
  device_app_version: string | null;
  device_app_build: number | string | null;
  device_last_seen_at: string | null;
  linked_at: string | null;
  deletion_requested_at: string | null;
  deactivated_at: string | null;
  deleted_at: string | null;
  lifecycle_event_id: string | null;
  lifecycle_event_type: string | null;
  lifecycle_actor: string | null;
  lifecycle_reason: string | null;
  created_at: string;
  updated_at: string;
  last_scan_at: string | null;
  free_remaining: number | null;
  rewarded_remaining: number | null;
  premium_remaining: number | null;
  meals: number | string;
  scans: number | string;
  failed_scans: number | string;
  grants: number | string;
};

type AdminUserListRow = AdminUserRow & {
  total_count: number | string;
};

type AdminGrantRow = {
  id: string;
  profile_id: string;
  credit_type: "free" | "rewarded" | "premium";
  amount: number;
  reason: string;
  actor: string;
  created_at: string;
};

type AdminNoFoodScanLimitStateRow = {
  attempts_last_24h: number | string;
  latest_reset_id: string | null;
  latest_reset_reason: string | null;
  latest_reset_actor: string | null;
  latest_reset_at: string | null;
};

type AdminNoFoodScanLimitResetRow = {
  id: string;
  profile_id: string;
  reason: string;
  actor: string;
  reset_at: string;
  created_at: string;
};

type AdminLifecycleEventRow = {
  id: string;
  profile_id: string;
  event_type: "deactivated" | "deleted";
  actor_type: string;
  actor: string;
  reason: string | null;
  auth_method: string | null;
  email: string | null;
  display_name: string | null;
  identity_provider: string | null;
  provider_subject: string | null;
  profile_timezone: string | null;
  install_id: string | null;
  platform: string | null;
  app_version: string | null;
  app_build: number | string | null;
  device_timezone: string | null;
  device_region: string | null;
  device_locale: string | null;
  scan_count: number | string;
  failed_scan_count: number | string;
  meal_count: number | string;
  profile_created_at: string | null;
  profile_updated_at: string | null;
  created_at: string;
};

const searchAdminUsers = async (
  sql: SqlClient,
  query: z.infer<typeof adminUserSearchQuerySchema>,
) => {
  const normalized = query.query?.trim() || "";
  const pattern = `%${normalized}%`;
  const { page, pageSize, offset, sort, direction } = normalizeAdminPagination(query, 25);
  const rows = await sql<AdminUserListRow[]>`
	    with active_user_rows as (
	      select
	        profiles.id::text,
	        profiles.auth_method::text,
	        coalesce(identity.email, profiles.email) as email,
	        identity.display_name,
	        identity.identity_provider,
	        profiles.provider_subject,
	        profiles.timezone,
	        latest_device.timezone as device_timezone,
	        latest_device.region as device_region,
	        latest_device.locale as device_locale,
	        latest_device.platform as device_platform,
	        latest_device.app_version as device_app_version,
	        latest_device.app_build as device_app_build,
	        latest_device.last_seen_at::text as device_last_seen_at,
		      profiles.linked_at::text,
	        profiles.deletion_requested_at::text,
	        profiles.deactivated_at::text,
          null::text as deleted_at,
          null::text as lifecycle_event_id,
          null::text as lifecycle_event_type,
          null::text as lifecycle_actor,
          null::text as lifecycle_reason,
	        profiles.created_at as created_at_sort,
	        profiles.updated_at as updated_at_sort,
	        max(scan_sessions.created_at) as last_scan_at_sort,
	        profiles.created_at::text,
	        profiles.updated_at::text,
	        max(scan_sessions.created_at)::text as last_scan_at,
          coalesce(scan_credits.free_remaining, 0)::int as free_remaining,
          coalesce(scan_credits.rewarded_remaining, 0)::int as rewarded_remaining,
          coalesce(scan_credits.premium_remaining, 0)::int as premium_remaining,
          count(distinct meals.id)::int as meals,
          count(distinct scan_sessions.id)::int as scans,
          count(distinct scan_sessions.id) filter (where scan_sessions.status = 'failed')::int as failed_scans,
          count(distinct admin_scan_credit_grants.id)::int as grants
	      from profiles
	      left join lateral (
	        select
	          account_identities.email,
	          account_identities.display_name,
	          account_identities.provider::text as identity_provider
	        from account_identities
	        where account_identities.profile_id = profiles.id
	        order by account_identities.updated_at desc, account_identities.created_at desc
	        limit 1
	      ) identity on true
	      left join lateral (
	        select
	          devices.timezone,
	          devices.region,
	          devices.locale,
	          devices.platform,
	          devices.app_version,
	          devices.app_build,
	          devices.last_seen_at
	        from devices
	        where devices.profile_id = profiles.id
	        order by devices.last_seen_at desc
	        limit 1
	      ) latest_device on true
	      left join scan_credits
	        on scan_credits.profile_id = profiles.id
	        and scan_credits.local_date = date '1970-01-01'
	      left join meals on meals.profile_id = profiles.id
	      left join scan_sessions on scan_sessions.profile_id = profiles.id
	      left join admin_scan_credit_grants on admin_scan_credit_grants.profile_id = profiles.id
	      group by
	        profiles.id,
	        identity.email,
	        identity.display_name,
	        identity.identity_provider,
	        latest_device.timezone,
	        latest_device.region,
	        latest_device.locale,
	        latest_device.platform,
	        latest_device.app_version,
	        latest_device.app_build,
	        latest_device.last_seen_at,
	        scan_credits.free_remaining,
	        scan_credits.rewarded_remaining,
	        scan_credits.premium_remaining
	    ),
      deleted_user_rows as (
        select
          lifecycle.profile_id::text as id,
          coalesce(lifecycle.auth_method, 'unknown') as auth_method,
          lifecycle.email,
          lifecycle.display_name,
          lifecycle.identity_provider,
          lifecycle.provider_subject,
          coalesce(lifecycle.profile_timezone, 'Asia/Kolkata') as timezone,
          lifecycle.device_timezone,
          lifecycle.device_region,
          lifecycle.device_locale,
          lifecycle.platform as device_platform,
          lifecycle.app_version as device_app_version,
          lifecycle.app_build as device_app_build,
          lifecycle.created_at::text as device_last_seen_at,
          null::text as linked_at,
          null::text as deletion_requested_at,
          null::text as deactivated_at,
          lifecycle.created_at::text as deleted_at,
          lifecycle.id::text as lifecycle_event_id,
          lifecycle.event_type::text as lifecycle_event_type,
          lifecycle.actor as lifecycle_actor,
          lifecycle.reason as lifecycle_reason,
          coalesce(lifecycle.profile_created_at, lifecycle.created_at) as created_at_sort,
          lifecycle.created_at as updated_at_sort,
          null::timestamptz as last_scan_at_sort,
          coalesce(lifecycle.profile_created_at, lifecycle.created_at)::text as created_at,
          coalesce(lifecycle.profile_updated_at, lifecycle.created_at)::text as updated_at,
          null::text as last_scan_at,
          0::int as free_remaining,
          0::int as rewarded_remaining,
          0::int as premium_remaining,
          lifecycle.meal_count::int as meals,
          lifecycle.scan_count::int as scans,
          lifecycle.failed_scan_count::int as failed_scans,
          0::int as grants
        from (
          select distinct on (profile_id) *
          from profile_lifecycle_events
          where event_type = 'deleted'
          order by profile_id, created_at desc
        ) lifecycle
      ),
      user_rollup as (
        select * from active_user_rows
        union all
        select * from deleted_user_rows
      )
	    select *, count(*) over()::int as total_count
	    from user_rollup
    where
      (
	        ${normalized} = ''
	        or id = ${normalized}
	        or email ilike ${pattern}
	        or display_name ilike ${pattern}
	        or provider_subject ilike ${pattern}
	        or device_timezone ilike ${pattern}
	        or device_region ilike ${pattern}
		        or device_locale ilike ${pattern}
            or lifecycle_actor ilike ${pattern}
	      )
      and (
        ${query.status} = 'all'
        or (${query.status} = 'active' and deleted_at is null and deactivated_at is null)
        or (${query.status} = 'inactive' and deleted_at is null and deactivated_at is not null)
        or (${query.status} = 'deletion_requested' and deleted_at is null and deletion_requested_at is not null)
        or (${query.status} = 'deleted' and deleted_at is not null)
      )
      and (${query.authMethod} = 'all' or auth_method = ${query.authMethod})
      and (
        ${query.risk} = 'all'
        or (${query.risk} = 'failed_scans' and failed_scans > 0)
        or (${query.risk} = 'low_quota' and (free_remaining + rewarded_remaining + premium_remaining) <= 0)
        or (${query.risk} = 'deactivated' and deactivated_at is not null)
      )
    order by
	      case when ${sort} = 'email' and ${direction} = 'asc' then email end asc nulls last,
	      case when ${sort} = 'email' and ${direction} = 'desc' then email end desc nulls last,
	      case when ${sort} = 'displayName' and ${direction} = 'asc' then display_name end asc nulls last,
	      case when ${sort} = 'displayName' and ${direction} = 'desc' then display_name end desc nulls last,
	      case when ${sort} = 'authMethod' and ${direction} = 'asc' then auth_method end asc nulls last,
	      case when ${sort} = 'authMethod' and ${direction} = 'desc' then auth_method end desc nulls last,
	      case when ${sort} = 'createdAt' and ${direction} = 'asc' then created_at_sort end asc nulls last,
	      case when ${sort} = 'createdAt' and ${direction} = 'desc' then created_at_sort end desc nulls last,
	      case when ${sort} = 'updatedAt' and ${direction} = 'asc' then updated_at_sort end asc nulls last,
	      case when ${sort} = 'updatedAt' and ${direction} = 'desc' then updated_at_sort end desc nulls last,
	      case when ${sort} = 'lastScanAt' and ${direction} = 'asc' then last_scan_at_sort end asc nulls last,
	      case when ${sort} = 'lastScanAt' and ${direction} = 'desc' then last_scan_at_sort end desc nulls last,
      case when ${sort} = 'scans' and ${direction} = 'asc' then scans end asc nulls last,
      case when ${sort} = 'scans' and ${direction} = 'desc' then scans end desc nulls last,
      case when ${sort} = 'failedScans' and ${direction} = 'asc' then failed_scans end asc nulls last,
      case when ${sort} = 'failedScans' and ${direction} = 'desc' then failed_scans end desc nulls last,
      case when ${sort} = 'meals' and ${direction} = 'asc' then meals end asc nulls last,
      case when ${sort} = 'meals' and ${direction} = 'desc' then meals end desc nulls last,
      case when ${sort} = 'grants' and ${direction} = 'asc' then grants end asc nulls last,
      case when ${sort} = 'grants' and ${direction} = 'desc' then grants end desc nulls last,
	      last_scan_at_sort desc nulls last,
	      updated_at_sort desc
    limit ${pageSize}
    offset ${offset}
  `;

  const total = numberValue(rows[0]?.total_count ?? 0);
  return {
    users: rows.map(mapAdminUserRow),
    pageInfo: pageInfoFrom(page, pageSize, sort, direction, total),
  };
};

const loadAdminUser = async (sql: SqlClient, profileId: string) => {
  const [userRow] = await sql<AdminUserRow[]>`
	    select
	      profiles.id::text,
	      profiles.auth_method::text,
	      coalesce(identity.email, profiles.email) as email,
	      identity.display_name,
	      identity.identity_provider,
	      profiles.provider_subject,
	      profiles.timezone,
	      latest_device.timezone as device_timezone,
	      latest_device.region as device_region,
	      latest_device.locale as device_locale,
	      latest_device.platform as device_platform,
	      latest_device.app_version as device_app_version,
	      latest_device.app_build as device_app_build,
	      latest_device.last_seen_at::text as device_last_seen_at,
	      profiles.linked_at::text,
      profiles.deletion_requested_at::text,
      profiles.deactivated_at::text,
      null::text as deleted_at,
      null::text as lifecycle_event_id,
      null::text as lifecycle_event_type,
      null::text as lifecycle_actor,
      null::text as lifecycle_reason,
      profiles.created_at::text,
      profiles.updated_at::text,
      max(scan_sessions.created_at)::text as last_scan_at,
      scan_credits.free_remaining,
      scan_credits.rewarded_remaining,
      scan_credits.premium_remaining,
      count(distinct meals.id)::int as meals,
      count(distinct scan_sessions.id)::int as scans,
      count(distinct scan_sessions.id) filter (where scan_sessions.status = 'failed')::int as failed_scans,
      count(distinct admin_scan_credit_grants.id)::int as grants
	    from profiles
	    left join lateral (
	      select
	        account_identities.email,
	        account_identities.display_name,
	        account_identities.provider::text as identity_provider
	      from account_identities
	      where account_identities.profile_id = profiles.id
	      order by account_identities.updated_at desc, account_identities.created_at desc
	      limit 1
	    ) identity on true
	    left join lateral (
	      select
	        devices.timezone,
	        devices.region,
	        devices.locale,
	        devices.platform,
	        devices.app_version,
	        devices.app_build,
	        devices.last_seen_at
	      from devices
	      where devices.profile_id = profiles.id
	      order by devices.last_seen_at desc
	      limit 1
	    ) latest_device on true
	    left join scan_credits
	      on scan_credits.profile_id = profiles.id
	      and scan_credits.local_date = date '1970-01-01'
	    left join meals on meals.profile_id = profiles.id
	    left join scan_sessions on scan_sessions.profile_id = profiles.id
	    left join admin_scan_credit_grants on admin_scan_credit_grants.profile_id = profiles.id
	    where profiles.id = ${profileId}
	    group by
	      profiles.id,
	      identity.email,
	      identity.display_name,
	      identity.identity_provider,
	      latest_device.timezone,
	      latest_device.region,
	      latest_device.locale,
	      latest_device.platform,
	      latest_device.app_version,
	      latest_device.app_build,
	      latest_device.last_seen_at,
	      scan_credits.free_remaining,
	      scan_credits.rewarded_remaining,
	      scan_credits.premium_remaining
	    limit 1
	  `;

  if (!userRow) return loadDeletedAdminUser(sql, profileId);

  const grants = await sql<AdminGrantRow[]>`
    select
      id::text,
      profile_id::text,
      credit_type,
      amount,
      reason,
      actor,
      created_at::text
    from admin_scan_credit_grants
    where profile_id = ${profileId}
    order by created_at desc
    limit 20
  `;

  const scans = await listAdminScans(sql, { profileId, limit: 20 });
  const lifecycleEvents = await loadProfileLifecycleEvents(sql, profileId);
  const noFoodLimit = await loadNoFoodScanLimitState(sql, profileId);

  return {
    ...mapAdminUserRow(userRow),
    grants: grants.map(mapAdminGrantRow),
    recentScans: scans.scans,
    lifecycleEvents: lifecycleEvents.map(mapAdminLifecycleEventRow),
    noFoodLimit,
  };
};

const loadDeletedAdminUser = async (sql: SqlClient, profileId: string) => {
  const [row] = await sql<AdminUserRow[]>`
    select
      lifecycle.profile_id::text as id,
      coalesce(lifecycle.auth_method, 'unknown') as auth_method,
      lifecycle.email,
      lifecycle.display_name,
      lifecycle.identity_provider,
      lifecycle.provider_subject,
      coalesce(lifecycle.profile_timezone, 'Asia/Kolkata') as timezone,
      lifecycle.device_timezone,
      lifecycle.device_region,
      lifecycle.device_locale,
      lifecycle.platform as device_platform,
      lifecycle.app_version as device_app_version,
      lifecycle.app_build as device_app_build,
      lifecycle.created_at::text as device_last_seen_at,
      null::text as linked_at,
      null::text as deletion_requested_at,
      null::text as deactivated_at,
      lifecycle.created_at::text as deleted_at,
      lifecycle.id::text as lifecycle_event_id,
      lifecycle.event_type::text as lifecycle_event_type,
      lifecycle.actor as lifecycle_actor,
      lifecycle.reason as lifecycle_reason,
      coalesce(lifecycle.profile_created_at, lifecycle.created_at)::text as created_at,
      coalesce(lifecycle.profile_updated_at, lifecycle.created_at)::text as updated_at,
      null::text as last_scan_at,
      0::int as free_remaining,
      0::int as rewarded_remaining,
      0::int as premium_remaining,
      lifecycle.meal_count::int as meals,
      lifecycle.scan_count::int as scans,
      lifecycle.failed_scan_count::int as failed_scans,
      0::int as grants
    from (
      select distinct on (profile_id) *
      from profile_lifecycle_events
      where profile_id = ${profileId}
        and event_type = 'deleted'
      order by profile_id, created_at desc
    ) lifecycle
  `;

  if (!row) return undefined;
  const lifecycleEvents = await loadProfileLifecycleEvents(sql, profileId);
  return {
    ...mapAdminUserRow(row),
    grants: [],
    recentScans: [],
    lifecycleEvents: lifecycleEvents.map(mapAdminLifecycleEventRow),
  };
};

const mapAdminUserRow = (row: AdminUserRow) => ({
  id: row.id,
  authMethod: row.auth_method,
  email: row.email ?? undefined,
  displayName: row.display_name ?? undefined,
  identityProvider: row.identity_provider ?? undefined,
  providerSubject: row.provider_subject ?? undefined,
  timezone: row.timezone,
  device: mapAdminDeviceRow(row),
  linkedAt: row.linked_at ?? undefined,
  deletionRequestedAt: row.deletion_requested_at ?? undefined,
  deactivatedAt: row.deactivated_at ?? undefined,
  deletedAt: row.deleted_at ?? undefined,
  lifecycleEventId: row.lifecycle_event_id ?? undefined,
  lifecycleEventType: row.lifecycle_event_type ?? undefined,
  lifecycleActor: row.lifecycle_actor ?? undefined,
  lifecycleReason: row.lifecycle_reason ?? undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  lastScanAt: row.last_scan_at ?? undefined,
  quota: {
    freeRemaining: row.free_remaining ?? 0,
    rewardedRemaining: row.rewarded_remaining ?? 0,
    premiumRemaining: row.premium_remaining ?? 0,
  },
  stats: {
    meals: numberValue(row.meals),
    scans: numberValue(row.scans),
    failedScans: numberValue(row.failed_scans),
    grants: numberValue(row.grants),
  },
});

const mapAdminDeviceRow = (row: {
  device_timezone?: string | null;
  device_region?: string | null;
  device_locale?: string | null;
  device_platform?: string | null;
  device_app_version?: string | null;
  device_app_build?: number | string | null;
  device_last_seen_at?: string | null;
}) => {
  const device = {
    timezone: row.device_timezone ?? undefined,
    region: row.device_region ?? undefined,
    locale: row.device_locale ?? undefined,
    platform: row.device_platform ?? undefined,
    appVersion: row.device_app_version ?? undefined,
    appBuild: nullableNumberValue(row.device_app_build) ?? undefined,
    lastSeenAt: row.device_last_seen_at ?? undefined,
  };

  return Object.values(device).some((value) => value !== undefined) ? device : undefined;
};

const mapAdminGrantRow = (row: AdminGrantRow) => ({
  id: row.id,
  profileId: row.profile_id,
  creditType: row.credit_type,
  amount: row.amount,
  reason: row.reason,
  actor: row.actor,
  createdAt: row.created_at,
});

const loadNoFoodScanLimitState = async (
  sql: SqlClient | postgres.TransactionSql,
  profileId: string,
) => {
  const [state] = await sql<AdminNoFoodScanLimitStateRow[]>`
    with latest_reset as (
      select id, reason, actor, reset_at
      from no_food_scan_limit_resets
      where profile_id = ${profileId}
      order by reset_at desc
      limit 1
    ),
    effective_window as (
      select greatest(
        now() - interval '24 hours',
        coalesce((select reset_at from latest_reset), now() - interval '24 hours')
      ) as since
    )
    select
      (
        select count(*)::integer
        from scan_sessions
        inner join lateral (
          select raw_ai_json
          from ai_predictions
          where ai_predictions.scan_session_id = scan_sessions.id
          order by ai_predictions.created_at desc
          limit 1
        ) ai_predictions on true
        where scan_sessions.profile_id = ${profileId}
          and scan_sessions.created_at >= (select since from effective_window)
          and jsonb_array_length(
            case
              when jsonb_typeof(ai_predictions.raw_ai_json -> 'analysis' -> 'items') = 'array'
                then ai_predictions.raw_ai_json -> 'analysis' -> 'items'
              when jsonb_typeof(ai_predictions.raw_ai_json -> 'items') = 'array'
                then ai_predictions.raw_ai_json -> 'items'
              else '[]'::jsonb
            end
          ) = 0
      ) as attempts_last_24h,
      (select id::text from latest_reset) as latest_reset_id,
      (select reason from latest_reset) as latest_reset_reason,
      (select actor from latest_reset) as latest_reset_actor,
      (select reset_at::text from latest_reset) as latest_reset_at
  `;

  const resets = await sql<AdminNoFoodScanLimitResetRow[]>`
    select
      id::text,
      profile_id::text,
      reason,
      actor,
      reset_at::text,
      created_at::text
    from no_food_scan_limit_resets
    where profile_id = ${profileId}
    order by reset_at desc
    limit 10
  `;

  return {
    attemptsLast24h: numberValue(state?.attempts_last_24h),
    latestResetId: state?.latest_reset_id ?? undefined,
    latestResetReason: state?.latest_reset_reason ?? undefined,
    latestResetActor: state?.latest_reset_actor ?? undefined,
    latestResetAt: state?.latest_reset_at ?? undefined,
    resets: resets.map(mapNoFoodScanLimitResetRow),
  };
};

const mapNoFoodScanLimitResetRow = (row: AdminNoFoodScanLimitResetRow) => ({
  id: row.id,
  profileId: row.profile_id,
  reason: row.reason,
  actor: row.actor,
  resetAt: row.reset_at,
  createdAt: row.created_at,
});

const loadProfileLifecycleEvents = async (sql: SqlClient, profileId: string) =>
  sql<AdminLifecycleEventRow[]>`
    select
      id::text,
      profile_id::text,
      event_type,
      actor_type,
      actor,
      reason,
      auth_method,
      email,
      display_name,
      identity_provider,
      provider_subject,
      profile_timezone,
      install_id,
      platform,
      app_version,
      app_build,
      device_timezone,
      device_region,
      device_locale,
      scan_count,
      failed_scan_count,
      meal_count,
      profile_created_at::text,
      profile_updated_at::text,
      created_at::text
    from profile_lifecycle_events
    where profile_id = ${profileId}
    order by created_at desc
    limit 20
  `;

const mapAdminLifecycleEventRow = (row: AdminLifecycleEventRow) => ({
  id: row.id,
  profileId: row.profile_id,
  eventType: row.event_type,
  actorType: row.actor_type,
  actor: row.actor,
  reason: row.reason ?? undefined,
  authMethod: row.auth_method ?? undefined,
  email: row.email ?? undefined,
  displayName: row.display_name ?? undefined,
  identityProvider: row.identity_provider ?? undefined,
  providerSubject: row.provider_subject ?? undefined,
  profileTimezone: row.profile_timezone ?? undefined,
  installId: row.install_id ?? undefined,
  platform: row.platform ?? undefined,
  appVersion: row.app_version ?? undefined,
  appBuild: nullableNumberValue(row.app_build) ?? undefined,
  deviceTimezone: row.device_timezone ?? undefined,
  deviceRegion: row.device_region ?? undefined,
  deviceLocale: row.device_locale ?? undefined,
  scanCount: numberValue(row.scan_count),
  failedScanCount: numberValue(row.failed_scan_count),
  mealCount: numberValue(row.meal_count),
  profileCreatedAt: row.profile_created_at ?? undefined,
  profileUpdatedAt: row.profile_updated_at ?? undefined,
  createdAt: row.created_at,
});

type AdminConversionSummaryRow = {
  total_installs: number | string;
  registered_installs: number | string;
  anonymous_installs: number | string;
};

type AdminConversionRow = {
  install_id: string;
  platform: string;
  app_version: string | null;
  app_build: number | string | null;
  profile_id: string | null;
  auth_method: string | null;
  email: string | null;
  display_name: string | null;
  identity_provider: string | null;
  linked_at: string | null;
  profile_created_at: string | null;
  profile_updated_at: string | null;
  profile_timezone: string | null;
  device_timezone: string | null;
  device_region: string | null;
  device_locale: string | null;
  created_at: string;
  updated_at: string;
  scans: number | string;
  failed_scans: number | string;
  meals: number | string;
  total_count: number | string;
};

const listAdminConversions = async (
  sql: SqlClient,
  query: z.infer<typeof adminConversionQuerySchema>,
) => {
  const normalized = query.query?.trim() || "";
  const pattern = `%${normalized}%`;
  const { page, pageSize, offset, sort, direction } = normalizeAdminPagination(query, 50);

  const [summary] = await sql<AdminConversionSummaryRow[]>`
    select
      count(*)::int as total_installs,
      count(*) filter (where profiles.auth_method <> 'anonymous')::int as registered_installs,
      count(*) filter (where profiles.auth_method = 'anonymous')::int as anonymous_installs
    from devices
    left join profiles on profiles.id = devices.profile_id
  `;

  const rows = await sql<AdminConversionRow[]>`
    with conversion_rollup as (
      select
        devices.install_id,
        devices.platform,
        devices.app_version,
        devices.app_build,
        devices.first_seen_at as created_at_sort,
        devices.last_seen_at as updated_at_sort,
        devices.first_seen_at::text as created_at,
        devices.last_seen_at::text as updated_at,
        profiles.id::text as profile_id,
        profiles.auth_method::text as auth_method,
        coalesce(identity.email, profiles.email) as email,
        identity.display_name,
        identity.identity_provider,
        profiles.linked_at as linked_at_sort,
        profiles.linked_at::text as linked_at,
        profiles.created_at::text as profile_created_at,
        profiles.updated_at::text as profile_updated_at,
        profiles.timezone as profile_timezone,
        devices.timezone as device_timezone,
        devices.region as device_region,
        devices.locale as device_locale,
        count(distinct scan_sessions.id)::int as scans,
        count(distinct scan_sessions.id) filter (where scan_sessions.status = 'failed')::int as failed_scans,
        count(distinct meals.id)::int as meals
      from devices
      left join profiles on profiles.id = devices.profile_id
      left join lateral (
        select
          account_identities.email,
          account_identities.display_name,
          account_identities.provider::text as identity_provider
        from account_identities
        where account_identities.profile_id = profiles.id
        order by account_identities.updated_at desc, account_identities.created_at desc
        limit 1
      ) identity on true
      left join scan_sessions on scan_sessions.install_id = devices.install_id
      left join meals on meals.profile_id = profiles.id
      group by
        devices.id,
        profiles.id,
        identity.email,
        identity.display_name,
        identity.identity_provider
    )
    select *, count(*) over()::int as total_count
    from conversion_rollup
    where
      (${query.platform} = 'all' or platform = ${query.platform})
      and (
        ${query.status} = 'all'
        or (${query.status} = 'registered' and auth_method <> 'anonymous')
        or (${query.status} = 'anonymous' and auth_method = 'anonymous')
      )
      and (
        ${normalized} = ''
        or install_id = ${normalized}
        or profile_id = ${normalized}
        or email ilike ${pattern}
        or display_name ilike ${pattern}
        or app_version ilike ${pattern}
        or profile_timezone ilike ${pattern}
        or device_timezone ilike ${pattern}
        or device_region ilike ${pattern}
        or device_locale ilike ${pattern}
      )
    order by
      case when ${sort} = 'createdAt' and ${direction} = 'asc' then created_at_sort end asc nulls last,
      case when ${sort} = 'createdAt' and ${direction} = 'desc' then created_at_sort end desc nulls last,
      case when ${sort} = 'updatedAt' and ${direction} = 'asc' then updated_at_sort end asc nulls last,
      case when ${sort} = 'updatedAt' and ${direction} = 'desc' then updated_at_sort end desc nulls last,
      case when ${sort} = 'displayName' and ${direction} = 'asc' then display_name end asc nulls last,
      case when ${sort} = 'displayName' and ${direction} = 'desc' then display_name end desc nulls last,
      case when ${sort} = 'email' and ${direction} = 'asc' then email end asc nulls last,
      case when ${sort} = 'email' and ${direction} = 'desc' then email end desc nulls last,
      case when ${sort} = 'authMethod' and ${direction} = 'asc' then auth_method end asc nulls last,
      case when ${sort} = 'authMethod' and ${direction} = 'desc' then auth_method end desc nulls last,
      case when ${sort} = 'platform' and ${direction} = 'asc' then platform end asc nulls last,
      case when ${sort} = 'platform' and ${direction} = 'desc' then platform end desc nulls last,
      case when ${sort} = 'linkedAt' and ${direction} = 'asc' then linked_at_sort end asc nulls last,
      case when ${sort} = 'linkedAt' and ${direction} = 'desc' then linked_at_sort end desc nulls last,
      case when ${sort} = 'scans' and ${direction} = 'asc' then scans end asc nulls last,
      case when ${sort} = 'scans' and ${direction} = 'desc' then scans end desc nulls last,
      case when ${sort} = 'meals' and ${direction} = 'asc' then meals end asc nulls last,
      case when ${sort} = 'meals' and ${direction} = 'desc' then meals end desc nulls last,
      updated_at_sort desc
    limit ${pageSize}
    offset ${offset}
  `;

  const total = numberValue(rows[0]?.total_count ?? 0);
  const totalInstalls = numberValue(summary?.total_installs);
  const registeredInstalls = numberValue(summary?.registered_installs);
  return {
    summary: {
      totalInstalls,
      registeredInstalls,
      anonymousInstalls: numberValue(summary?.anonymous_installs),
      registrationRate:
        totalInstalls > 0 ? Math.round((registeredInstalls / totalInstalls) * 10000) / 100 : 0,
    },
    installs: rows.map(mapAdminConversionRow),
    pageInfo: pageInfoFrom(page, pageSize, sort, direction, total),
  };
};

const mapAdminConversionRow = (row: AdminConversionRow) => ({
  installId: row.install_id,
  platform: row.platform,
  appVersion: row.app_version ?? undefined,
  appBuild: nullableNumberValue(row.app_build) ?? undefined,
  profileId: row.profile_id ?? undefined,
  authMethod: row.auth_method ?? undefined,
  email: row.email ?? undefined,
  displayName: row.display_name ?? undefined,
  identityProvider: row.identity_provider ?? undefined,
  linkedAt: row.linked_at ?? undefined,
  profileCreatedAt: row.profile_created_at ?? undefined,
  profileUpdatedAt: row.profile_updated_at ?? undefined,
  profileTimezone: row.profile_timezone ?? undefined,
  deviceTimezone: row.device_timezone ?? undefined,
  deviceRegion: row.device_region ?? undefined,
  deviceLocale: row.device_locale ?? undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  stats: {
    scans: numberValue(row.scans),
    failedScans: numberValue(row.failed_scans),
    meals: numberValue(row.meals),
  },
});

const grantScanCredits = async (
  sql: SqlClient,
  request: FastifyRequest,
  profileId: string,
  input: z.infer<typeof grantCreditSchema>,
) =>
  sql.begin(async (tx) => {
    const [profile] = await tx<{ id: string }[]>`
      select id::text
      from profiles
      where id = ${profileId}
      limit 1
    `;
    if (!profile) return undefined;

    const [before] = await tx<QuotaSnapshotRow[]>`
      select free_remaining, rewarded_remaining, premium_remaining
      from scan_credits
      where profile_id = ${profileId}
        and local_date = date '1970-01-01'
      limit 1
    `;

    const freeInsertAmount = input.creditType === "free" ? input.amount : 0;
    const rewardedInsertAmount = input.creditType === "rewarded" ? input.amount : 0;
    const premiumInsertAmount = input.creditType === "premium" ? input.amount : 0;
    const [quota] = await tx<QuotaSnapshotRow[]>`
      insert into scan_credits (
        profile_id,
        local_date,
        free_remaining,
        rewarded_remaining,
        premium_remaining
      )
      values (${profileId}, date '1970-01-01', ${freeInsertAmount}, ${rewardedInsertAmount}, ${premiumInsertAmount})
      on conflict (profile_id, local_date) do update
      set
        free_remaining = scan_credits.free_remaining + ${freeInsertAmount},
        rewarded_remaining = scan_credits.rewarded_remaining + ${rewardedInsertAmount},
        premium_remaining = scan_credits.premium_remaining + ${premiumInsertAmount},
        updated_at = now()
      returning free_remaining, rewarded_remaining, premium_remaining
    `;

    const auditLogId = await insertAuditLog(tx, request, {
      action: "grant_scan_credits",
      targetType: "profile",
      targetId: profileId,
      reason: input.reason,
      before: before ? mapQuotaSnapshot(before) : null,
      after: mapQuotaSnapshot(quota),
    });

    const [grant] = await tx<AdminGrantRow[]>`
      insert into admin_scan_credit_grants (
        profile_id,
        credit_type,
        amount,
        reason,
        actor,
        audit_log_id
      )
      values (
        ${profileId},
        ${input.creditType},
        ${input.amount},
        ${input.reason},
        ${getAdminActor(request) ?? "unknown"},
        ${auditLogId}
      )
      returning id::text, profile_id::text, credit_type, amount, reason, actor, created_at::text
    `;

    await tx`
      insert into quota_events (profile_id, event_type, reason, delta, local_date)
      values (${profileId}, 'grant', ${`admin_${input.creditType}`}, ${input.amount}, current_date)
    `;

    return mapAdminGrantRow(grant);
  });

type QuotaSnapshotRow = {
  free_remaining: number;
  rewarded_remaining: number;
  premium_remaining: number;
};

const mapQuotaSnapshot = (row: QuotaSnapshotRow) => ({
  freeRemaining: row.free_remaining,
  rewardedRemaining: row.rewarded_remaining,
  premiumRemaining: row.premium_remaining,
});

type AdminProfileLifecycleRow = {
  id: string;
  auth_method: string;
  email: string | null;
  deletion_requested_at: string | null;
  deactivated_at: string | null;
  updated_at: string;
};

const reactivateUserProfile = async (
  sql: SqlClient,
  request: FastifyRequest,
  profileId: string,
  input: z.infer<typeof reactivateProfileSchema>,
) => {
  const result = await sql.begin(async (tx) => {
    const [before] = await tx<AdminProfileLifecycleRow[]>`
      select
        id::text,
        auth_method::text,
        email,
        deletion_requested_at::text,
        deactivated_at::text,
        updated_at::text
      from profiles
      where id = ${profileId}
      limit 1
      for update
    `;
    if (!before) return undefined;
    if (!before.deactivated_at) return { reactivated: false };

    const [after] = await tx<AdminProfileLifecycleRow[]>`
      update profiles
      set
        deactivated_at = null,
        deletion_requested_at = null,
        updated_at = now()
      where id = ${profileId}
      returning
        id::text,
        auth_method::text,
        email,
        deletion_requested_at::text,
        deactivated_at::text,
        updated_at::text
    `;

    await insertAuditLog(tx, request, {
      action: "reactivate_profile",
      targetType: "profile",
      targetId: profileId,
      reason: input.reason,
      before: mapProfileLifecycleSnapshot(before),
      after: mapProfileLifecycleSnapshot(after),
    });

    return { reactivated: true };
  });

  if (!result) return undefined;
  const user = await loadAdminUser(sql, profileId);
  return user ? { user, reactivated: result.reactivated } : undefined;
};

const resetNoFoodScanLimit = async (
  sql: SqlClient,
  request: FastifyRequest,
  profileId: string,
  input: z.infer<typeof resetNoFoodScanLimitSchema>,
) =>
  sql.begin(async (tx) => {
    const [profile] = await tx<{ id: string; auth_method: string; email: string | null }[]>`
      select id::text, auth_method::text, email
      from profiles
      where id = ${profileId}
      limit 1
      for update
    `;
    if (!profile) return undefined;

    const before = await loadNoFoodScanLimitState(tx, profileId);
    const [reset] = await tx<AdminNoFoodScanLimitResetRow[]>`
      insert into no_food_scan_limit_resets (
        profile_id,
        reason,
        actor
      )
      values (
        ${profileId},
        ${input.reason},
        ${getAdminActor(request) ?? "unknown"}
      )
      returning
        id::text,
        profile_id::text,
        reason,
        actor,
        reset_at::text,
        created_at::text
    `;
    const after = await loadNoFoodScanLimitState(tx, profileId);
    const auditLogId = await insertAuditLog(tx, request, {
      action: "reset_no_food_scan_limit",
      targetType: "profile",
      targetId: profileId,
      reason: input.reason,
      before,
      after,
    });

    await tx`
      update no_food_scan_limit_resets
      set audit_log_id = ${auditLogId}
      where id = ${reset.id}
    `;

    return {
      reset: mapNoFoodScanLimitResetRow(reset),
      noFoodLimit: after,
    };
  });

const mapProfileLifecycleSnapshot = (row: AdminProfileLifecycleRow) => ({
  id: row.id,
  authMethod: row.auth_method,
  email: row.email ?? undefined,
  deletionRequestedAt: row.deletion_requested_at ?? undefined,
  deactivatedAt: row.deactivated_at ?? undefined,
  updatedAt: row.updated_at,
});

type AdminScanRow = {
  id: string;
  profile_id: string | null;
  install_id: string | null;
  platform: string | null;
  app_version: string | null;
  app_build: number | string | null;
  profile_email: string | null;
  profile_display_name: string | null;
  profile_auth_method: string | null;
  profile_timezone: string | null;
  device_timezone: string | null;
  device_region: string | null;
  device_locale: string | null;
  status: string;
  consumed_credit_reason: string | null;
  user_hint: string | null;
  image_mime_type: string | null;
  image_byte_size: number | null;
  image_bucket: string | null;
  image_object_key: string | null;
  created_at: string;
  updated_at: string;
  provider: string | null;
  model: string | null;
  prompt_version: string | null;
  latency_ms: number | null;
  success: boolean | null;
  error_code: string | null;
  total_confidence: number | string | null;
  meal_id: string | null;
  meal_title: string | null;
};

type AdminScanListRow = AdminScanRow & {
  total_count: number | string;
};

const listAdminScans = async (
  sql: SqlClient,
  query:
    | z.infer<typeof adminScanQuerySchema>
    | { profileId?: string; limit: number; status?: string },
) => {
  const profileId = "profileId" in query ? query.profileId : undefined;
  const status = "status" in query ? query.status : undefined;
  const platform = "platform" in query ? query.platform : "all";
  const appVersion = "appVersion" in query ? (query.appVersion?.trim() ?? "") : "";
  const appBuild = "appBuild" in query ? query.appBuild : undefined;
  const normalized = "query" in query ? (query.query?.trim() ?? "") : "";
  const pattern = `%${normalized}%`;
  const model = "model" in query ? (query.model?.trim() ?? "") : "";
  const modelPattern = `%${model}%`;
  const promptVersion = "promptVersion" in query ? (query.promptVersion?.trim() ?? "") : "";
  const promptPattern = `%${promptVersion}%`;
  const aiState = "aiState" in query ? query.aiState : "all";
  const image = "image" in query ? query.image : "all";
  const from = "from" in query ? query.from : undefined;
  const to = "to" in query ? query.to : undefined;
  const { page, pageSize, offset, sort, direction } = normalizeAdminPagination(query, 50);
  const rows = await sql<AdminScanListRow[]>`
    with scan_rollup as (
      select
        scan_sessions.id::text,
        scan_sessions.profile_id::text,
        scan_sessions.install_id,
        scan_sessions.platform,
        scan_sessions.app_version,
        scan_sessions.app_build,
	        coalesce(identity.email, profiles.email) as profile_email,
	        identity.display_name as profile_display_name,
	        profiles.auth_method::text as profile_auth_method,
	        profiles.timezone as profile_timezone,
	        devices.timezone as device_timezone,
	        devices.region as device_region,
	        devices.locale as device_locale,
	        scan_sessions.status::text,
        scan_sessions.consumed_credit_reason,
        scan_sessions.user_hint,
	        scan_sessions.image_mime_type,
	        scan_sessions.image_byte_size,
	        scan_sessions.image_bucket,
	        scan_sessions.image_object_key,
	        scan_sessions.created_at as created_at_sort,
	        scan_sessions.updated_at as updated_at_sort,
	        scan_sessions.created_at::text,
	        scan_sessions.updated_at::text,
	        provider_run.provider,
        provider_run.model,
        provider_run.prompt_version,
        provider_run.latency_ms,
        provider_run.success,
        provider_run.error_code,
        prediction.total_confidence,
        meals.id::text as meal_id,
        meals.title as meal_title
      from scan_sessions
		      left join profiles on profiles.id = scan_sessions.profile_id
		      left join devices on devices.install_id = scan_sessions.install_id
		      left join lateral (
		        select
		          account_identities.email,
		          account_identities.display_name
		        from account_identities
		        where account_identities.profile_id = profiles.id
		        order by account_identities.updated_at desc, account_identities.created_at desc
		        limit 1
		      ) identity on true
	      left join lateral (
	        select id, provider, model, prompt_version, latency_ms, success, error_code
	        from ai_provider_runs
	        where ai_provider_runs.scan_session_id = scan_sessions.id
	        order by created_at desc
        limit 1
      ) provider_run on true
	      left join lateral (
	        select total_confidence
	        from ai_predictions
	        where ai_predictions.provider_run_id = provider_run.id
	        order by created_at desc
	        limit 1
      ) prediction on true
      left join meals on meals.scan_session_id = scan_sessions.id
    )
    select *, count(*) over()::int as total_count
    from scan_rollup
    where (${profileId ?? null}::uuid is null or profile_id = ${profileId ?? null})
      and (${status ?? null}::text is null or status = ${status ?? null})
      and (${platform} = 'all' or platform = ${platform})
      and (${appVersion} = '' or app_version = ${appVersion})
      and (${appBuild ?? null}::int is null or app_build = ${appBuild ?? null})
      and (
        ${normalized} = ''
        or id = ${normalized}
	        or profile_id = ${normalized}
	        or install_id = ${normalized}
	        or profile_email ilike ${pattern}
	        or profile_display_name ilike ${pattern}
	        or profile_timezone ilike ${pattern}
	        or device_timezone ilike ${pattern}
	        or device_region ilike ${pattern}
	        or device_locale ilike ${pattern}
	        or user_hint ilike ${pattern}
        or meal_title ilike ${pattern}
      )
      and (${model} = '' or model ilike ${modelPattern})
      and (${promptVersion} = '' or prompt_version ilike ${promptPattern})
      and (
        ${aiState} = 'all'
        or (${aiState} = 'successful_ai' and success is true)
        or (${aiState} = 'failed_ai' and success is false)
        or (${aiState} = 'not_analyzed' and model is null)
      )
      and (
        ${image} = 'all'
        or (${image} = 'has_image' and image_object_key is not null)
        or (${image} = 'no_image' and image_object_key is null)
      )
	      and (
	        ${from ?? null}::date is null
	        or (created_at_sort at time zone 'Asia/Kolkata')::date >= ${from ?? null}::date
	      )
	      and (
	        ${to ?? null}::date is null
	        or (created_at_sort at time zone 'Asia/Kolkata')::date <= ${to ?? null}::date
	      )
	    order by
	      case when ${sort} = 'createdAt' and ${direction} = 'asc' then created_at_sort end asc nulls last,
	      case when ${sort} = 'createdAt' and ${direction} = 'desc' then created_at_sort end desc nulls last,
	      case when ${sort} = 'updatedAt' and ${direction} = 'asc' then updated_at_sort end asc nulls last,
	      case when ${sort} = 'updatedAt' and ${direction} = 'desc' then updated_at_sort end desc nulls last,
      case when ${sort} = 'platform' and ${direction} = 'asc' then platform end asc nulls last,
      case when ${sort} = 'platform' and ${direction} = 'desc' then platform end desc nulls last,
      case when ${sort} = 'appVersion' and ${direction} = 'asc' then app_version end asc nulls last,
      case when ${sort} = 'appVersion' and ${direction} = 'desc' then app_version end desc nulls last,
      case when ${sort} = 'status' and ${direction} = 'asc' then status end asc nulls last,
      case when ${sort} = 'status' and ${direction} = 'desc' then status end desc nulls last,
      case when ${sort} = 'model' and ${direction} = 'asc' then model end asc nulls last,
      case when ${sort} = 'model' and ${direction} = 'desc' then model end desc nulls last,
      case when ${sort} = 'latencyMs' and ${direction} = 'asc' then latency_ms end asc nulls last,
      case when ${sort} = 'latencyMs' and ${direction} = 'desc' then latency_ms end desc nulls last,
      case when ${sort} = 'confidence' and ${direction} = 'asc' then total_confidence end asc nulls last,
      case when ${sort} = 'confidence' and ${direction} = 'desc' then total_confidence end desc nulls last,
	      created_at_sort desc
    limit ${pageSize}
    offset ${offset}
  `;

  const total = numberValue(rows[0]?.total_count ?? 0);
  return {
    scans: rows.map(mapAdminScanRow),
    pageInfo: pageInfoFrom(page, pageSize, sort, direction, total),
  };
};

const loadAdminScan = async (
  sql: SqlClient,
  scanId: string,
  mealImageStorage?: MealImageStorage,
) => {
  const [row] = await sql<(AdminScanRow & { raw_ai_json: unknown })[]>`
    select
      scan_sessions.id::text,
      scan_sessions.profile_id::text,
      scan_sessions.install_id,
      scan_sessions.platform,
      scan_sessions.app_version,
      scan_sessions.app_build,
	      coalesce(identity.email, profiles.email) as profile_email,
	      identity.display_name as profile_display_name,
	      profiles.auth_method::text as profile_auth_method,
	      profiles.timezone as profile_timezone,
	      devices.timezone as device_timezone,
	      devices.region as device_region,
	      devices.locale as device_locale,
	      scan_sessions.status::text,
      scan_sessions.consumed_credit_reason,
      scan_sessions.user_hint,
	      scan_sessions.image_mime_type,
	      scan_sessions.image_byte_size,
	      scan_sessions.image_bucket,
      scan_sessions.image_object_key,
      scan_sessions.created_at::text,
      scan_sessions.updated_at::text,
      provider_run.provider,
      provider_run.model,
      provider_run.prompt_version,
      provider_run.latency_ms,
      provider_run.success,
      provider_run.error_code,
      prediction.total_confidence,
      prediction.raw_ai_json,
      meals.id::text as meal_id,
      meals.title as meal_title
    from scan_sessions
		    left join profiles on profiles.id = scan_sessions.profile_id
		    left join devices on devices.install_id = scan_sessions.install_id
		    left join lateral (
		      select
		        account_identities.email,
		        account_identities.display_name
		      from account_identities
		      where account_identities.profile_id = profiles.id
		      order by account_identities.updated_at desc, account_identities.created_at desc
		      limit 1
		    ) identity on true
	    left join lateral (
	      select id, provider, model, prompt_version, latency_ms, success, error_code
	      from ai_provider_runs
	      where ai_provider_runs.scan_session_id = scan_sessions.id
      order by created_at desc
      limit 1
    ) provider_run on true
	    left join lateral (
	      select raw_ai_json, total_confidence
	      from ai_predictions
	      where ai_predictions.provider_run_id = provider_run.id
	      order by created_at desc
      limit 1
    ) prediction on true
    left join meals on meals.scan_session_id = scan_sessions.id
    where scan_sessions.id = ${scanId}
    limit 1
  `;

  if (!row) {
    return undefined;
  }

  const scan = mapAdminScanRow(row);
  const imageUrl = await createAdminScanImageUrl(row, mealImageStorage);
  return {
    ...scan,
    image: scan.image && imageUrl ? { ...scan.image, url: imageUrl } : scan.image,
    rawAiJson: row.raw_ai_json,
  };
};

const mapAdminScanRow = (row: AdminScanRow) => ({
  id: row.id,
  profileId: row.profile_id ?? undefined,
  installId: row.install_id ?? undefined,
  platform: row.platform ?? undefined,
  appVersion: row.app_version ?? undefined,
  appBuild: nullableNumberValue(row.app_build) ?? undefined,
  profileEmail: row.profile_email ?? undefined,
  profileDisplayName: row.profile_display_name ?? undefined,
  profileAuthMethod: row.profile_auth_method ?? undefined,
  profileTimezone: row.profile_timezone ?? undefined,
  deviceTimezone: row.device_timezone ?? undefined,
  deviceRegion: row.device_region ?? undefined,
  deviceLocale: row.device_locale ?? undefined,
  status: row.status,
  creditReason: row.consumed_credit_reason ?? undefined,
  userHint: row.user_hint ?? undefined,
  image: row.image_object_key
    ? {
        mimeType: row.image_mime_type ?? undefined,
        byteSize: row.image_byte_size ?? undefined,
        bucket: row.image_bucket ?? undefined,
        objectKey: row.image_object_key,
      }
    : undefined,
  ai: row.model
    ? {
        provider: row.provider ?? undefined,
        model: row.model,
        promptVersion: row.prompt_version ?? undefined,
        latencyMs: row.latency_ms ?? undefined,
        success: row.success ?? undefined,
        errorCode: row.error_code ?? undefined,
        confidence: nullableNumberValue(row.total_confidence),
      }
    : undefined,
  meal: row.meal_id ? { id: row.meal_id, title: row.meal_title ?? undefined } : undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const supportedScanImageMimeTypes = new Set<MealImageSummary["mimeType"]>([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const createAdminScanImageUrl = async (
  row: AdminScanRow,
  mealImageStorage?: MealImageStorage,
): Promise<string | undefined> => {
  const byteSize = nullableNumberValue(row.image_byte_size);
  if (
    !mealImageStorage?.enabled ||
    !row.image_bucket ||
    !row.image_object_key ||
    byteSize === null ||
    !isSupportedScanImageMimeType(row.image_mime_type)
  ) {
    return undefined;
  }

  return mealImageStorage.createSignedReadUrl({
    imageId: row.id,
    bucket: row.image_bucket,
    objectKey: row.image_object_key,
    mimeType: row.image_mime_type,
    byteSize,
    createdAt: row.created_at,
  });
};

const isSupportedScanImageMimeType = (
  mimeType: string | null,
): mimeType is MealImageSummary["mimeType"] =>
  supportedScanImageMimeTypes.has(mimeType as MealImageSummary["mimeType"]);

type AiModelRow = {
  key: string;
  platform: string;
  model_family: string;
  model: string;
  display_name: string;
  enabled: boolean;
  is_default: boolean;
  fallback_key: string | null;
  max_output_tokens: number | string;
  temperature: number | string;
  top_p: number | string;
  pricing_json: unknown;
  notes: string | null;
  updated_by: string | null;
  updated_at: string;
};

const listAiModels = async (sql: SqlClient) => {
  const rows = await sql<AiModelRow[]>`
    select
      key,
      platform,
      model_family,
      model,
      display_name,
      enabled,
      is_default,
      fallback_key,
      max_output_tokens,
      temperature,
      top_p,
      pricing_json,
      notes,
      updated_by,
      updated_at::text
    from ai_model_configs
    order by is_default desc, enabled desc, display_name
  `;
  return rows.map(mapAiModelRow);
};

const mapAiModelRow = (row: AiModelRow) => ({
  key: row.key,
  platform: row.platform,
  modelFamily: row.model_family,
  model: row.model,
  displayName: row.display_name,
  enabled: row.enabled,
  isDefault: row.is_default,
  fallbackKey: row.fallback_key ?? undefined,
  maxOutputTokens: numberValue(row.max_output_tokens),
  temperature: numberValue(row.temperature),
  topP: numberValue(row.top_p),
  pricing: row.pricing_json,
  notes: row.notes ?? undefined,
  updatedBy: row.updated_by ?? undefined,
  updatedAt: row.updated_at,
});

const setDefaultAiModel = async (
  sql: SqlClient,
  request: FastifyRequest,
  input: z.infer<typeof setDefaultModelSchema>,
) =>
  sql.begin(async (tx) => {
    const actor = getAdminActor(request) ?? "unknown";
    const [before] = await tx<AiModelRow[]>`
      select *
      from ai_model_configs
      where is_default
      limit 1
    `;
    const [candidate] = await tx<AiModelRow[]>`
      select *
      from ai_model_configs
      where key = ${input.key}
        and enabled
      limit 1
    `;
    if (!candidate) throw new Error("ai_model_not_found");
    if (candidate.model_family !== "gemini") {
      throw new Error(
        "Only Vertex Gemini model family can be set as default until the backend adapter is added.",
      );
    }

    await tx`update ai_model_configs set is_default = false, updated_at = now() where is_default`;
    const [updated] = await tx<AiModelRow[]>`
      update ai_model_configs
      set is_default = true, updated_by = ${actor}, updated_at = now()
      where key = ${input.key}
      returning *
    `;

    await insertAuditLog(tx, request, {
      action: "set_default_ai_model",
      targetType: "ai_model",
      targetId: input.key,
      reason: input.reason,
      before: before ? mapAiModelRow(before) : null,
      after: mapAiModelRow(updated),
    });

    return mapAiModelRow(updated);
  });

const updateAiModel = async (
  sql: SqlClient,
  request: FastifyRequest,
  key: string,
  input: z.infer<typeof updateModelSchema>,
) =>
  sql.begin(async (tx) => {
    const actor = getAdminActor(request) ?? "unknown";
    const [before] = await tx<AiModelRow[]>`
      select *
      from ai_model_configs
      where key = ${key}
      limit 1
    `;
    if (!before) return undefined;

    const [updated] = await tx<AiModelRow[]>`
      update ai_model_configs
      set
        enabled = ${input.enabled ?? before.enabled},
        max_output_tokens = ${input.maxOutputTokens ?? before.max_output_tokens},
        temperature = ${input.temperature ?? before.temperature},
        top_p = ${input.topP ?? before.top_p},
        notes = ${input.notes ?? before.notes},
        updated_by = ${actor},
        updated_at = now()
      where key = ${key}
      returning *
    `;

    await insertAuditLog(tx, request, {
      action: "update_ai_model",
      targetType: "ai_model",
      targetId: key,
      reason: input.reason,
      before: mapAiModelRow(before),
      after: mapAiModelRow(updated),
    });

    return mapAiModelRow(updated);
  });

type AiPromptRow = {
  id: string;
  key: string;
  version: string;
  model_family: string;
  title: string;
  body: string;
  status: string;
  is_active: boolean;
  updated_by: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

const listAiPrompts = async (sql: SqlClient) => {
  const rows = await sql<AiPromptRow[]>`
    select
      id::text,
      key,
      version,
      model_family,
      title,
      body,
      status,
      is_active,
      updated_by,
      published_at::text,
      created_at::text,
      updated_at::text
    from ai_prompt_versions
    order by is_active desc, updated_at desc
  `;
  return rows.map(mapAiPromptRow);
};

const mapAiPromptRow = (row: AiPromptRow) => ({
  id: row.id,
  key: row.key,
  version: row.version,
  modelFamily: row.model_family,
  title: row.title,
  body: row.body,
  status: row.status,
  isActive: row.is_active,
  updatedBy: row.updated_by ?? undefined,
  publishedAt: row.published_at ?? undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const createPromptVersion = async (
  sql: SqlClient,
  request: FastifyRequest,
  input: z.infer<typeof createPromptSchema>,
) =>
  sql.begin(async (tx) => {
    const actor = getAdminActor(request) ?? "unknown";
    const [prompt] = await tx<AiPromptRow[]>`
      insert into ai_prompt_versions (
        key,
        version,
        model_family,
        title,
        body,
        status,
        created_by,
        updated_by
      )
      values (
        ${input.key},
        ${input.version},
        'gemini',
        ${input.title},
        ${input.body},
        'draft',
        ${actor},
        ${actor}
      )
      returning id::text, key, version, model_family, title, body, status, is_active, updated_by, published_at::text, created_at::text, updated_at::text
    `;

    await insertAuditLog(tx, request, {
      action: "create_ai_prompt_version",
      targetType: "ai_prompt",
      targetId: prompt.id,
      reason: input.reason,
      before: null,
      after: mapAiPromptRow(prompt),
    });

    return mapAiPromptRow(prompt);
  });

const activatePromptVersion = async (
  sql: SqlClient,
  request: FastifyRequest,
  input: z.infer<typeof activatePromptSchema>,
) =>
  sql.begin(async (tx) => {
    const actor = getAdminActor(request) ?? "unknown";
    const [before] = await tx<AiPromptRow[]>`
      select
        id::text,
        key,
        version,
        model_family,
        title,
        body,
        status,
        is_active,
        updated_by,
        published_at::text,
        created_at::text,
        updated_at::text
      from ai_prompt_versions
      where id = ${input.id}
      limit 1
    `;
    if (!before) throw new Error("ai_prompt_not_found");

    await tx`
      update ai_prompt_versions
      set is_active = false, updated_at = now()
      where key = ${before.key}
    `;

    const [updated] = await tx<AiPromptRow[]>`
      update ai_prompt_versions
      set
        status = 'published',
        is_active = true,
        published_at = coalesce(published_at, now()),
        updated_by = ${actor},
        updated_at = now()
      where id = ${input.id}
      returning id::text, key, version, model_family, title, body, status, is_active, updated_by, published_at::text, created_at::text, updated_at::text
    `;

    await insertAuditLog(tx, request, {
      action: "activate_ai_prompt_version",
      targetType: "ai_prompt",
      targetId: input.id,
      reason: input.reason,
      before: mapAiPromptRow(before),
      after: mapAiPromptRow(updated),
    });

    return mapAiPromptRow(updated);
  });

type FeatureFlagRow = {
  key: string;
  value: unknown;
  description: string | null;
  updated_by: string | null;
  updated_at: string;
};

type AppRuntimeConfigRow = FeatureFlagRow;

const listFeatureFlags = async (sql: SqlClient) => {
  const rows = await sql<FeatureFlagRow[]>`
    select key, value, description, updated_by, updated_at::text
    from feature_flags
    order by key
  `;
  return rows.map(mapFeatureFlagRow);
};

const mapFeatureFlagRow = (row: FeatureFlagRow) => ({
  key: row.key,
  value: row.value,
  description: row.description ?? undefined,
  updatedBy: row.updated_by ?? undefined,
  updatedAt: row.updated_at,
});

const mapAppRuntimeConfigRow = (row: AppRuntimeConfigRow) => ({
  key: row.key,
  value: row.value,
  description: row.description ?? undefined,
  updatedBy: row.updated_by ?? undefined,
  updatedAt: row.updated_at,
});

const updateAppUpdatePolicy = async (
  sql: SqlClient,
  request: FastifyRequest,
  input: z.infer<typeof updateAppUpdatePolicySchema>,
) =>
  sql.begin(async (tx) => {
    const actor = getAdminActor(request) ?? "unknown";
    const { reason, ...policyInput } = input;
    const nextPolicy = appUpdatePolicyConfigSchema.parse(policyInput);
    const [before] = await tx<AppRuntimeConfigRow[]>`
      select key, value, description, updated_by, updated_at::text
      from app_runtime_config
      where key = ${APP_UPDATE_POLICY_KEY}
      limit 1
    `;

    const [row] = await tx<AppRuntimeConfigRow[]>`
      insert into app_runtime_config (key, value, description, updated_by)
      values (
        ${APP_UPDATE_POLICY_KEY},
        ${tx.json(nextPolicy)},
        'Controls optional and mandatory mobile update prompts by platform build number.',
        ${actor}
      )
      on conflict (key) do update
      set
        value = excluded.value,
        description = excluded.description,
        updated_by = excluded.updated_by,
        updated_at = now()
      returning key, value, description, updated_by, updated_at::text
    `;

    await insertAuditLog(tx, request, {
      action: "update_app_update_policy",
      targetType: "app_runtime_config",
      targetId: APP_UPDATE_POLICY_KEY,
      reason,
      before: before
        ? { ...mapAppRuntimeConfigRow(before), value: parseAppUpdatePolicyConfig(before.value) }
        : null,
      after: { ...mapAppRuntimeConfigRow(row), value: parseAppUpdatePolicyConfig(row.value) },
    });

    return parseAppUpdatePolicyConfig(row.value);
  });

const updateEngagementPolicy = async (
  sql: SqlClient,
  request: FastifyRequest,
  input: z.infer<typeof updateEngagementPolicySchema>,
) =>
  sql.begin(async (tx) => {
    const actor = getAdminActor(request) ?? "unknown";
    const { reason, ...policyInput } = input;
    const nextPolicy = engagementPolicyConfigSchema.parse(policyInput);
    const [before] = await tx<AppRuntimeConfigRow[]>`
      select key, value, description, updated_by, updated_at::text
      from app_runtime_config
      where key = ${ENGAGEMENT_POLICY_KEY}
      limit 1
    `;

    const [row] = await tx<AppRuntimeConfigRow[]>`
      insert into app_runtime_config (key, value, description, updated_by)
      values (
        ${ENGAGEMENT_POLICY_KEY},
        ${tx.json(nextPolicy)},
        'Controls review prompts, interstitial ads, FCM push reminder scenarios, and streak celebrations for mobile clients.',
        ${actor}
      )
      on conflict (key) do update
      set
        value = excluded.value,
        description = excluded.description,
        updated_by = excluded.updated_by,
        updated_at = now()
      returning key, value, description, updated_by, updated_at::text
    `;

    await insertAuditLog(tx, request, {
      action: "update_engagement_policy",
      targetType: "app_runtime_config",
      targetId: ENGAGEMENT_POLICY_KEY,
      reason,
      before: before
        ? { ...mapAppRuntimeConfigRow(before), value: parseEngagementPolicy(before.value) }
        : null,
      after: { ...mapAppRuntimeConfigRow(row), value: parseEngagementPolicy(row.value) },
    });

    return parseEngagementPolicy(row.value);
  });

const updateFeatureFlag = async (
  sql: SqlClient,
  request: FastifyRequest,
  key: string,
  input: z.infer<typeof updateFeatureFlagSchema>,
) =>
  sql.begin(async (tx) => {
    const actor = getAdminActor(request) ?? "unknown";
    const [before] = await tx<FeatureFlagRow[]>`
      select key, value, description, updated_by, updated_at::text
      from feature_flags
      where key = ${key}
      limit 1
    `;

    const [flag] = await tx<FeatureFlagRow[]>`
      insert into feature_flags (key, value, description, updated_by)
      values (${key}, ${tx.json(input.value)}, ${input.description ?? before?.description ?? null}, ${actor})
      on conflict (key) do update
      set
        value = excluded.value,
        description = excluded.description,
        updated_by = excluded.updated_by,
        updated_at = now()
      returning key, value, description, updated_by, updated_at::text
    `;

    await insertAuditLog(tx, request, {
      action: "update_feature_flag",
      targetType: "feature_flag",
      targetId: key,
      reason: input.reason,
      before: before ? mapFeatureFlagRow(before) : null,
      after: mapFeatureFlagRow(flag),
    });

    return mapFeatureFlagRow(flag);
  });

type AppNoticeRow = {
  id: string;
  title: string;
  body: string;
  severity: string;
  active: boolean;
  cta_label: string | null;
  cta_url: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

const listAppNotices = async (sql: SqlClient) => {
  const rows = await sql<AppNoticeRow[]>`
    select
      id::text,
      title,
      body,
      severity,
      active,
      cta_label,
      cta_url,
      created_by,
      updated_by,
      created_at::text,
      updated_at::text
    from app_notices
    order by active desc, updated_at desc
  `;
  return rows.map(mapAppNoticeRow);
};

const mapAppNoticeRow = (row: AppNoticeRow) => ({
  id: row.id,
  title: row.title,
  body: row.body,
  severity: row.severity,
  active: row.active,
  ctaLabel: row.cta_label ?? undefined,
  ctaUrl: row.cta_url ?? undefined,
  createdBy: row.created_by ?? undefined,
  updatedBy: row.updated_by ?? undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const createAppNotice = async (
  sql: SqlClient,
  request: FastifyRequest,
  input: z.infer<typeof createNoticeSchema>,
) =>
  sql.begin(async (tx) => {
    const actor = getAdminActor(request) ?? "unknown";
    const [notice] = await tx<AppNoticeRow[]>`
      insert into app_notices (
        title,
        body,
        severity,
        active,
        cta_label,
        cta_url,
        created_by,
        updated_by
      )
      values (
        ${input.title},
        ${input.body},
        ${input.severity},
        ${input.active},
        ${input.ctaLabel ?? null},
        ${input.ctaUrl ?? null},
        ${actor},
        ${actor}
      )
      returning id::text, title, body, severity, active, cta_label, cta_url, created_by, updated_by, created_at::text, updated_at::text
    `;

    await insertAuditLog(tx, request, {
      action: "create_app_notice",
      targetType: "app_notice",
      targetId: notice.id,
      reason: input.reason,
      before: null,
      after: mapAppNoticeRow(notice),
    });

    return mapAppNoticeRow(notice);
  });

const updateAppNotice = async (
  sql: SqlClient,
  request: FastifyRequest,
  noticeId: string,
  input: z.infer<typeof updateNoticeSchema>,
) =>
  sql.begin(async (tx) => {
    const actor = getAdminActor(request) ?? "unknown";
    const [before] = await tx<AppNoticeRow[]>`
      select
        id::text,
        title,
        body,
        severity,
        active,
        cta_label,
        cta_url,
        created_by,
        updated_by,
        created_at::text,
        updated_at::text
      from app_notices
      where id = ${noticeId}
      limit 1
    `;
    if (!before) return undefined;

    const [notice] = await tx<AppNoticeRow[]>`
      update app_notices
      set
        title = ${input.title ?? before.title},
        body = ${input.body ?? before.body},
        severity = ${input.severity ?? before.severity},
        active = ${input.active ?? before.active},
        cta_label = ${input.ctaLabel === undefined ? before.cta_label : input.ctaLabel},
        cta_url = ${input.ctaUrl === undefined ? before.cta_url : input.ctaUrl},
        updated_by = ${actor},
        updated_at = now()
      where id = ${noticeId}
      returning id::text, title, body, severity, active, cta_label, cta_url, created_by, updated_by, created_at::text, updated_at::text
    `;

    await insertAuditLog(tx, request, {
      action: "update_app_notice",
      targetType: "app_notice",
      targetId: noticeId,
      reason: input.reason,
      before: mapAppNoticeRow(before),
      after: mapAppNoticeRow(notice),
    });

    return mapAppNoticeRow(notice);
  });

type AuditLogRow = {
  id: string;
  actor: string;
  action: string;
  target_type: string;
  target_id: string | null;
  reason: string | null;
  before_json: unknown;
  after_json: unknown;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
};

type PushNotificationTargetRow = {
  id: string;
  token: string;
  token_hash: string;
  provider: "fcm" | "apns";
  apns_sandbox: boolean | null;
};

type PushNotificationDelivery = {
  attempted: number;
  sent: number;
  failed: number;
  disabledTokens: number;
  failures: Record<string, number>;
};

const listPushNotificationTargets = async (
  sql: SqlClient,
  input: z.infer<typeof sendPushNotificationSchema>,
) => {
  const targetProfileId = input.targetType === "profile" ? input.profileId : undefined;
  const targetInstallId = input.targetType === "install" ? input.installId : undefined;
  return sql<PushNotificationTargetRow[]>`
    select id::text, token, token_hash, provider, apns_sandbox
    from push_notification_tokens
    where enabled = true
      and permission_status in ('authorized', 'provisional')
      and (${targetProfileId ?? null}::uuid is null or profile_id = ${targetProfileId ?? null})
      and (${targetInstallId ?? null}::text is null or install_id = ${targetInstallId ?? null})
    order by last_seen_at desc
    limit 1000
  `;
};

const sendPushNotificationToTargets = async (
  sql: SqlClient,
  sender: PushNotificationRouter,
  input: z.infer<typeof sendPushNotificationSchema>,
  targets: PushNotificationTargetRow[],
): Promise<PushNotificationDelivery> => {
  let sent = 0;
  let failed = 0;
  const failures: Record<string, number> = {};
  const disabledHashes: string[] = [];
  const data = sanitizePushData({
    ...input.data,
    source: "admin_manual",
  });

  for (const target of targets) {
    const result = await sender.send({
      token: target.token,
      title: input.title,
      body: input.body,
      data,
      provider: target.provider,
      apnsSandbox: target.apns_sandbox,
    });
    if (result.success) {
      sent += 1;
      continue;
    }

    failed += 1;
    const key = pushNotificationFailureKey(result);
    failures[key] = (failures[key] ?? 0) + 1;
    if (
      result.status === 404 ||
      result.errorCode === "NOT_FOUND" ||
      result.errorCode === "UNREGISTERED"
    ) {
      disabledHashes.push(target.token_hash);
    }
  }

  for (const tokenHash of disabledHashes) {
    await sql`
      update push_notification_tokens
      set
        enabled = false,
        disabled_at = now(),
        updated_at = now()
      where token_hash = ${tokenHash}
    `;
  }

  return {
    attempted: targets.length,
    sent,
    failed,
    disabledTokens: disabledHashes.length,
    failures,
  };
};

const sanitizePushData = (data: Record<string, string>): Record<string, string> =>
  Object.fromEntries(
    Object.entries(data)
      .map(([key, value]) => [
        key
          .trim()
          .replace(/[^a-zA-Z0-9_]/g, "_")
          .slice(0, 64),
        value.trim().slice(0, 256),
      ])
      .filter(([key, value]) => key && value),
  );

type AuditLogListRow = AuditLogRow & {
  total_count: number | string;
};

const listAuditLog = async (sql: SqlClient, query: z.infer<typeof adminAuditQuerySchema>) => {
  const normalized = query.query?.trim() || "";
  const pattern = `%${normalized}%`;
  const actor = query.actor?.trim() || "";
  const actorPattern = `%${actor}%`;
  const action = query.action?.trim() || "";
  const actionPattern = `%${action}%`;
  const targetType = query.targetType?.trim() || "";
  const targetPattern = `%${targetType}%`;
  const { page, pageSize, offset, sort, direction } = normalizeAdminPagination(query, 50);
  const rows = await sql<AuditLogListRow[]>`
    select
      id::text,
      actor,
      action,
      target_type,
      target_id,
      reason,
      before_json,
      after_json,
      ip_address,
      user_agent,
      created_at::text,
      count(*) over()::int as total_count
    from admin_audit_log
    where
      (
        ${normalized} = ''
        or id::text = ${normalized}
        or actor ilike ${pattern}
        or action ilike ${pattern}
        or target_type ilike ${pattern}
        or target_id ilike ${pattern}
        or reason ilike ${pattern}
      )
      and (${actor} = '' or actor ilike ${actorPattern})
      and (${action} = '' or action ilike ${actionPattern})
      and (${targetType} = '' or target_type ilike ${targetPattern})
	      and (
	        ${query.from ?? null}::date is null
	        or (created_at at time zone 'Asia/Kolkata')::date >= ${query.from ?? null}::date
	      )
	      and (
	        ${query.to ?? null}::date is null
	        or (created_at at time zone 'Asia/Kolkata')::date <= ${query.to ?? null}::date
	      )
    order by
      case when ${sort} = 'createdAt' and ${direction} = 'asc' then created_at end asc nulls last,
      case when ${sort} = 'createdAt' and ${direction} = 'desc' then created_at end desc nulls last,
      case when ${sort} = 'actor' and ${direction} = 'asc' then actor end asc nulls last,
      case when ${sort} = 'actor' and ${direction} = 'desc' then actor end desc nulls last,
      case when ${sort} = 'action' and ${direction} = 'asc' then action end asc nulls last,
      case when ${sort} = 'action' and ${direction} = 'desc' then action end desc nulls last,
      case when ${sort} = 'targetType' and ${direction} = 'asc' then target_type end asc nulls last,
      case when ${sort} = 'targetType' and ${direction} = 'desc' then target_type end desc nulls last,
      created_at desc
    limit ${pageSize}
    offset ${offset}
  `;
  const total = numberValue(rows[0]?.total_count ?? 0);
  return {
    entries: rows.map(mapAuditLogRow),
    pageInfo: pageInfoFrom(page, pageSize, sort, direction, total),
  };
};

const mapAuditLogRow = (row: AuditLogRow) => ({
  id: row.id,
  actor: row.actor,
  action: row.action,
  targetType: row.target_type,
  targetId: row.target_id ?? undefined,
  reason: row.reason ?? undefined,
  before: row.before_json,
  after: row.after_json,
  ipAddress: row.ip_address ?? undefined,
  userAgent: row.user_agent ?? undefined,
  createdAt: row.created_at,
});

const insertAuditLog = async (
  sql: SqlClient | postgres.TransactionSql,
  request: FastifyRequest,
  input: {
    action: string;
    targetType: string;
    targetId?: string;
    reason?: string;
    before?: unknown;
    after?: unknown;
  },
) => {
  const [row] = await sql<{ id: string }[]>`
    insert into admin_audit_log (
      actor,
      action,
      target_type,
      target_id,
      reason,
      before_json,
      after_json,
      ip_address,
      user_agent
    )
    values (
      ${getAdminActor(request) ?? "unknown"},
      ${input.action},
      ${input.targetType},
      ${input.targetId ?? null},
      ${input.reason ?? null},
      ${input.before === undefined ? null : sql.json(toJsonValue(input.before))},
      ${input.after === undefined ? null : sql.json(toJsonValue(input.after))},
      ${request.ip},
      ${request.headers["user-agent"] ?? null}
    )
    returning id::text
  `;
  return row.id;
};

const toJsonValue = (value: unknown): postgres.JSONValue =>
  JSON.parse(JSON.stringify(value ?? null)) as postgres.JSONValue;

const requireAdmin = async (request: FastifyRequest, reply: FastifyReply) => {
  const credentials = getAdminCredentials();
  if (!credentials) {
    return reply.status(404).send({ error: "admin_dashboard_disabled" });
  }

  const requestCredentials = extractBasicCredentials(request.headers.authorization);
  if (
    requestCredentials?.username !== credentials.username ||
    requestCredentials.password !== credentials.password
  ) {
    reply.header("www-authenticate", 'Basic realm="LogMyPlate Admin"');
    return reply.status(401).send({ error: "admin_required" });
  }
};

const getAdminActor = (request: FastifyRequest): string | undefined =>
  extractBasicCredentials(request.headers.authorization)?.username;

const getAdminCredentials = (): { username: string; password: string } | undefined => {
  const username = process.env.ADMIN_DASHBOARD_USERNAME?.trim();
  const password = process.env.ADMIN_DASHBOARD_PASSWORD?.trim();
  if (!username || !password) return undefined;
  return { username, password };
};

const extractBasicCredentials = (
  authorization: string | undefined,
): { username: string; password: string } | undefined => {
  if (!authorization) return undefined;
  const [scheme, credentials] = authorization.split(" ");
  if (!scheme || !credentials) return undefined;
  if (scheme.toLowerCase() !== "basic") return undefined;

  const decoded = Buffer.from(credentials, "base64").toString("utf8");
  const separatorIndex = decoded.indexOf(":");
  if (separatorIndex === -1) return undefined;

  return {
    username: decoded.slice(0, separatorIndex),
    password: decoded.slice(separatorIndex + 1),
  };
};

const clampDays = (value: string | undefined): number => {
  const parsed = Number(value ?? 30);
  if (!Number.isFinite(parsed)) return 30;
  return Math.max(1, Math.min(366, Math.floor(parsed)));
};

const loadAiCostData = async (
  sql: SqlClient,
  days: number,
  platformFilter: z.infer<typeof platformQuerySchema> = "all",
): Promise<AiCostData> => {
  const [overall] = await sql<OverallRow[]>`
    with priced_runs as (
      select
        run.*,
        coalesce(run.platform, scan_sessions.platform) as resolved_platform,
        coalesce(prediction.total_confidence, null) as confidence,
        coalesce(
          run.estimated_cost_usd,
          (
            coalesce(run.input_token_estimate, 0) * ${inputRateSql(sql)} +
            coalesce(run.output_token_estimate, 0) * ${outputRateSql(sql)}
          ) / 1000000.0
        ) as calculated_cost_usd
      from ai_provider_runs run
      left join scan_sessions on scan_sessions.id = run.scan_session_id
      left join lateral (
        select total_confidence
        from ai_predictions
        where ai_predictions.provider_run_id = run.id
        order by ai_predictions.created_at desc
        limit 1
      ) prediction on true
      where run.created_at >= now() - (${days}::int * interval '1 day')
        and (
          ${platformFilter} = 'all'
          or coalesce(run.platform, scan_sessions.platform) = ${platformFilter}
        )
	    )
	    select
	      count(*)::int as runs,
	      count(distinct scan_session_id)::int as scans,
	      count(*) filter (where success)::int as successful_runs,
	      count(distinct scan_session_id) filter (where success)::int as successful_scans,
	      count(*) filter (where not success)::int as failed_runs,
	      coalesce(sum(input_token_estimate), 0)::bigint as input_tokens,
      coalesce(sum(output_token_estimate), 0)::bigint as output_tokens,
      coalesce(sum(calculated_cost_usd), 0)::numeric as cost_usd,
      avg(latency_ms)::numeric as average_latency_ms,
      avg(confidence)::numeric as average_confidence
    from priced_runs
  `;

  const dailyRows = await sql<DailyRow[]>`
    with priced_runs as (
	      select
	        (run.created_at at time zone 'Asia/Kolkata')::date as date,
	        run.scan_session_id,
	        run.input_token_estimate,
        run.output_token_estimate,
        coalesce(
          run.estimated_cost_usd,
          (
            coalesce(run.input_token_estimate, 0) * ${inputRateSql(sql)} +
            coalesce(run.output_token_estimate, 0) * ${outputRateSql(sql)}
          ) / 1000000.0
        ) as calculated_cost_usd
      from ai_provider_runs run
      left join scan_sessions on scan_sessions.id = run.scan_session_id
      where run.created_at >= now() - (${days}::int * interval '1 day')
        and (
          ${platformFilter} = 'all'
          or coalesce(run.platform, scan_sessions.platform) = ${platformFilter}
        )
    )
	    select
	      date::text,
	      count(*)::int as runs,
	      count(distinct scan_session_id)::int as scans,
	      coalesce(sum(input_token_estimate), 0)::bigint as input_tokens,
      coalesce(sum(output_token_estimate), 0)::bigint as output_tokens,
      coalesce(sum(calculated_cost_usd), 0)::numeric as cost_usd
    from priced_runs
    group by date
    order by date
  `;

  const modelRows = await sql<ModelRow[]>`
    with priced_runs as (
	      select
	        run.provider,
	        run.model,
	        run.scan_session_id,
	        run.input_token_estimate,
        run.output_token_estimate,
        coalesce(
          run.estimated_cost_usd,
          (
            coalesce(run.input_token_estimate, 0) * ${inputRateSql(sql)} +
            coalesce(run.output_token_estimate, 0) * ${outputRateSql(sql)}
          ) / 1000000.0
        ) as calculated_cost_usd
      from ai_provider_runs run
      left join scan_sessions on scan_sessions.id = run.scan_session_id
      where run.created_at >= now() - (${days}::int * interval '1 day')
        and (
          ${platformFilter} = 'all'
          or coalesce(run.platform, scan_sessions.platform) = ${platformFilter}
        )
    )
	    select
	      provider,
	      model,
	      count(*)::int as runs,
	      count(distinct scan_session_id)::int as scans,
	      coalesce(sum(input_token_estimate), 0)::bigint as input_tokens,
      coalesce(sum(output_token_estimate), 0)::bigint as output_tokens,
      coalesce(sum(calculated_cost_usd), 0)::numeric as cost_usd,
      current_date::text as date
    from priced_runs
    group by provider, model
    order by cost_usd desc
  `;

  const platformRows = await sql<PlatformAiCostRow[]>`
    with priced_runs as (
	      select
	        coalesce(run.platform, scan_sessions.platform, 'unknown') as platform,
	        run.scan_session_id,
	        run.input_token_estimate,
        run.output_token_estimate,
        coalesce(
          run.estimated_cost_usd,
          (
            coalesce(run.input_token_estimate, 0) * ${inputRateSql(sql)} +
            coalesce(run.output_token_estimate, 0) * ${outputRateSql(sql)}
          ) / 1000000.0
        ) as calculated_cost_usd
      from ai_provider_runs run
      left join scan_sessions on scan_sessions.id = run.scan_session_id
      where run.created_at >= now() - (${days}::int * interval '1 day')
        and (
          ${platformFilter} = 'all'
          or coalesce(run.platform, scan_sessions.platform) = ${platformFilter}
        )
    )
	    select
	      platform,
	      count(*)::int as runs,
	      count(distinct scan_session_id)::int as scans,
	      coalesce(sum(input_token_estimate), 0)::bigint as input_tokens,
      coalesce(sum(output_token_estimate), 0)::bigint as output_tokens,
      coalesce(sum(calculated_cost_usd), 0)::numeric as cost_usd,
      current_date::text as date
    from priced_runs
    group by platform
    order by cost_usd desc
  `;

  const appBuildRows = await sql<PlatformAiCostRow[]>`
    with priced_runs as (
      select
        coalesce(run.platform, scan_sessions.platform, 'unknown') as platform,
	        coalesce(nullif(run.app_version, ''), nullif(scan_sessions.app_version, ''), 'unknown')
	          as app_version,
	        coalesce(run.app_build, scan_sessions.app_build, 0) as app_build,
	        run.scan_session_id,
	        run.input_token_estimate,
        run.output_token_estimate,
        coalesce(
          run.estimated_cost_usd,
          (
            coalesce(run.input_token_estimate, 0) * ${inputRateSql(sql)} +
            coalesce(run.output_token_estimate, 0) * ${outputRateSql(sql)}
          ) / 1000000.0
        ) as calculated_cost_usd
      from ai_provider_runs run
      left join scan_sessions on scan_sessions.id = run.scan_session_id
      where run.created_at >= now() - (${days}::int * interval '1 day')
        and (
          ${platformFilter} = 'all'
          or coalesce(run.platform, scan_sessions.platform) = ${platformFilter}
        )
    )
	    select
	      platform,
	      app_version,
	      app_build,
	      count(*)::int as runs,
	      count(distinct scan_session_id)::int as scans,
	      coalesce(sum(input_token_estimate), 0)::bigint as input_tokens,
      coalesce(sum(output_token_estimate), 0)::bigint as output_tokens,
      coalesce(sum(calculated_cost_usd), 0)::numeric as cost_usd,
      current_date::text as date
    from priced_runs
    group by platform, app_version, app_build
	    order by cost_usd desc, runs desc
    limit 20
  `;

  const recentRows = await sql<RecentRunRow[]>`
    select
      run.created_at::text,
      coalesce(run.platform, scan_sessions.platform, 'unknown') as platform,
      coalesce(nullif(run.app_version, ''), nullif(scan_sessions.app_version, ''), 'unknown')
        as app_version,
      coalesce(run.app_build, scan_sessions.app_build, 0)::int as app_build,
      run.provider,
      run.model,
      coalesce(run.input_token_estimate, 0)::bigint as input_tokens,
      coalesce(run.output_token_estimate, 0)::bigint as output_tokens,
      coalesce(
        run.estimated_cost_usd,
        (
          coalesce(run.input_token_estimate, 0) * ${inputRateSql(sql)} +
          coalesce(run.output_token_estimate, 0) * ${outputRateSql(sql)}
        ) / 1000000.0
      )::numeric as cost_usd,
      run.latency_ms,
      prediction.total_confidence as confidence,
      run.success
    from ai_provider_runs run
    left join scan_sessions on scan_sessions.id = run.scan_session_id
    left join lateral (
      select total_confidence
      from ai_predictions
      where ai_predictions.provider_run_id = run.id
      order by ai_predictions.created_at desc
      limit 1
    ) prediction on true
	    where (
	      ${platformFilter} = 'all'
	      or coalesce(run.platform, scan_sessions.platform) = ${platformFilter}
	    )
	      and run.created_at >= now() - (${days}::int * interval '1 day')
	    order by run.created_at desc
    limit 20
  `;

  const mappedOverall = mapOverall(overall);

  return {
    generatedAt: new Date().toISOString(),
    days,
    usdToInr,
    pricingSource:
      "Gemini token pricing catalog in API route, falling back to stored estimated_cost_usd when present.",
    overall: mappedOverall,
    daily: dailyRows.map(mapDailyRow),
    platforms: platformRows.map(mapPlatformAiCostRow),
    appBuilds: appBuildRows.map(mapAppBuildAiCostRow),
    models: modelRows.map(mapModelRow),
    recentRuns: recentRows.map(mapRecentRunRow),
  };
};

const inputRateSql = (sql: SqlClient) => sql`
  case
    when model = 'gemini-2.5-flash-lite' then 0.10
    when model = 'gemini-2.5-flash' then 0.30
    when model = 'gemini-2.5-pro' then 1.25
    else 0
  end
`;

const outputRateSql = (sql: SqlClient) => sql`
  case
    when model = 'gemini-2.5-flash-lite' then 0.40
    when model = 'gemini-2.5-flash' then 2.50
    when model = 'gemini-2.5-pro' then 10.00
    else 0
  end
`;

const mapOverall = (row: OverallRow | undefined): AiCostOverall => {
  const runs = numberValue(row?.runs);
  const scans = numberValue(row?.scans);
  const costUsd = numberValue(row?.cost_usd);
  const inputTokens = numberValue(row?.input_tokens);
  const outputTokens = numberValue(row?.output_tokens);
  const costInr = costUsd * usdToInr;
  const averageRunCostInr = runs === 0 ? 0 : costInr / runs;

  return {
    runs,
    scans,
    successfulRuns: numberValue(row?.successful_runs),
    successfulScans: numberValue(row?.successful_scans),
    failedRuns: numberValue(row?.failed_runs),
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
    costUsd,
    costInr,
    averageRunCostInr,
    averageCostInr: averageRunCostInr,
    runsPerTenInr: averageRunCostInr === 0 ? 0 : 10 / averageRunCostInr,
    scansPerTenInr: averageRunCostInr === 0 ? 0 : 10 / averageRunCostInr,
    averageLatencyMs: nullableNumberValue(row?.average_latency_ms),
    averageConfidence: nullableNumberValue(row?.average_confidence),
  };
};

const mapDailyRow = (row: DailyRow): DailyAiCost => {
  const runs = numberValue(row.runs);
  const scans = numberValue(row.scans);
  const costInr = numberValue(row.cost_usd) * usdToInr;
  const averageRunCostInr = runs === 0 ? 0 : costInr / runs;
  return {
    date: row.date,
    runs,
    scans,
    inputTokens: numberValue(row.input_tokens),
    outputTokens: numberValue(row.output_tokens),
    costInr,
    averageRunCostInr,
    averageCostInr: averageRunCostInr,
  };
};

const mapPlatformAiCostRow = (row: PlatformAiCostRow): PlatformAiCost => {
  const runs = numberValue(row.runs);
  const scans = numberValue(row.scans);
  const costInr = numberValue(row.cost_usd) * usdToInr;
  const averageRunCostInr = runs === 0 ? 0 : costInr / runs;
  const platform = row.platform === "ios" || row.platform === "android" ? row.platform : "unknown";
  return {
    platform,
    runs,
    scans,
    inputTokens: numberValue(row.input_tokens),
    outputTokens: numberValue(row.output_tokens),
    costInr,
    averageRunCostInr,
    averageCostInr: averageRunCostInr,
    runsPerTenInr: averageRunCostInr === 0 ? 0 : 10 / averageRunCostInr,
    scansPerTenInr: averageRunCostInr === 0 ? 0 : 10 / averageRunCostInr,
  };
};

const mapAppBuildAiCostRow = (row: PlatformAiCostRow): AppBuildAiCost => ({
  ...mapPlatformAiCostRow(row),
  appVersion: row.app_version ?? "unknown",
  appBuild: numberValue(row.app_build),
});

const mapModelRow = (row: ModelRow): ModelAiCost => {
  const runs = numberValue(row.runs);
  const scans = numberValue(row.scans);
  const costInr = numberValue(row.cost_usd) * usdToInr;
  const averageRunCostInr = runs === 0 ? 0 : costInr / runs;
  return {
    provider: row.provider,
    model: row.model,
    runs,
    scans,
    inputTokens: numberValue(row.input_tokens),
    outputTokens: numberValue(row.output_tokens),
    costInr,
    averageRunCostInr,
    averageCostInr: averageRunCostInr,
    runsPerTenInr: averageRunCostInr === 0 ? 0 : 10 / averageRunCostInr,
    scansPerTenInr: averageRunCostInr === 0 ? 0 : 10 / averageRunCostInr,
  };
};

const mapRecentRunRow = (row: RecentRunRow): RecentAiRun => ({
  createdAt: row.created_at,
  platform: row.platform === "ios" || row.platform === "android" ? row.platform : "unknown",
  appVersion: row.app_version ?? "unknown",
  appBuild: numberValue(row.app_build),
  provider: row.provider,
  model: row.model,
  inputTokens: numberValue(row.input_tokens),
  outputTokens: numberValue(row.output_tokens),
  costInr: numberValue(row.cost_usd) * usdToInr,
  latencyMs: nullableNumberValue(row.latency_ms),
  confidence: nullableNumberValue(row.confidence),
  success: row.success,
});

const numberValue = (value: number | string | null | undefined): number => Number(value ?? 0);

const nullableNumberValue = (value: number | string | null | undefined): number | null => {
  if (value === null || value === undefined) return null;
  return Number(value);
};

const renderAiCostDashboardHtml = () => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>LogMyPlate AI Cost Dashboard</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f7f5ef;
        --panel: #fffdf8;
        --ink: #20201d;
        --muted: #6f6a60;
        --line: #ded7ca;
        --accent: #23c273;
        --accent-ink: #07391f;
        --warn: #b45309;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: var(--bg);
        color: var(--ink);
        font: 14px/1.45 Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      main { max-width: 1180px; margin: 0 auto; padding: 28px 20px 48px; }
      header {
        display: flex;
        align-items: end;
        justify-content: space-between;
        gap: 18px;
        margin-bottom: 22px;
      }
      h1 { margin: 0; font-size: 26px; letter-spacing: 0; }
      p { margin: 4px 0 0; color: var(--muted); }
      select {
        min-width: 150px;
        padding: 10px 12px;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: var(--panel);
        color: var(--ink);
        font: inherit;
      }
      .grid { display: grid; gap: 14px; }
      .metrics { grid-template-columns: repeat(4, minmax(0, 1fr)); }
      .card {
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: 8px;
        padding: 16px;
      }
      .label { color: var(--muted); font-size: 12px; text-transform: uppercase; letter-spacing: .08em; }
      .value { margin-top: 8px; font-size: 26px; font-weight: 750; }
      .sub { margin-top: 4px; color: var(--muted); }
      .split { grid-template-columns: minmax(0, 1.4fr) minmax(320px, .8fr); margin-top: 14px; }
      canvas { width: 100%; height: 280px; display: block; }
      table { width: 100%; border-collapse: collapse; }
      th, td { padding: 11px 8px; border-bottom: 1px solid var(--line); text-align: left; white-space: nowrap; }
      th { color: var(--muted); font-size: 12px; font-weight: 650; }
      td:last-child, th:last-child { text-align: right; }
      .ok { color: #047857; }
      .bad { color: var(--warn); }
      .section-title { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom: 10px; }
      .section-title h2 { margin: 0; font-size: 17px; }
      .note { color: var(--muted); font-size: 12px; }
      @media (max-width: 860px) {
        header { align-items: stretch; flex-direction: column; }
        .metrics, .split { grid-template-columns: 1fr; }
        table { font-size: 12px; }
      }
    </style>
  </head>
  <body>
    <main>
      <header>
        <div>
          <h1>AI Cost Dashboard</h1>
          <p>Token spend, INR cost, scan count, and scans purchasable per ₹10.</p>
        </div>
        <select id="days">
          <option value="7">Last 7 days</option>
          <option value="30" selected>Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="365">Last 365 days</option>
        </select>
      </header>

      <section class="grid metrics" id="metrics"></section>

      <section class="grid split">
        <div class="card">
          <div class="section-title">
            <h2>Daily Spend</h2>
            <span class="note" id="chartNote"></span>
          </div>
          <canvas id="costChart" width="900" height="280"></canvas>
        </div>
        <div class="card">
          <div class="section-title">
            <h2>Model Mix</h2>
            <span class="note">by INR cost</span>
          </div>
          <div id="models"></div>
        </div>
      </section>

      <section class="card" style="margin-top:14px">
        <div class="section-title">
          <h2>Recent Runs</h2>
          <span class="note" id="generatedAt"></span>
        </div>
        <div id="recentRuns"></div>
      </section>
    </main>

    <script>
      const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });
      const whole = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
      const decimal = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });

      const formatPercent = (value) => value == null ? "—" : decimal.format(value * 100) + "%";
      const formatMs = (value) => value == null ? "—" : whole.format(value) + " ms";

      async function load() {
        const days = document.getElementById("days").value;
        const response = await fetch("/admin/ai-cost/data?days=" + encodeURIComponent(days));
        if (!response.ok) {
          document.getElementById("metrics").innerHTML =
            '<div class="card"><div class="value bad">Unable to load</div><div class="sub">Status ' + response.status + '</div></div>';
          return;
        }
        const data = await response.json();
        renderMetrics(data);
        renderChart(data.daily);
        renderModels(data.models);
        renderRecentRuns(data.recentRuns);
        document.getElementById("chartNote").textContent = data.days + " days · ₹" + data.usdToInr + " / $";
        document.getElementById("generatedAt").textContent = "Updated " + new Date(data.generatedAt).toLocaleString();
      }

      function renderMetrics(data) {
        const m = data.overall;
        const cards = [
          ["Total AI Cost", inr.format(m.costInr), "$" + decimal.format(m.costUsd)],
	          ["Avg Cost / Run", inr.format(m.averageRunCostInr), whole.format(m.runs) + " runs · " + whole.format(m.scans) + " scans"],
	          ["Runs in ₹10", decimal.format(m.runsPerTenInr), "at current avg cost"],
          ["Tokens Used", whole.format(m.totalTokens), whole.format(m.inputTokens) + " in · " + whole.format(m.outputTokens) + " out"],
	          ["Success", whole.format(m.successfulRuns), whole.format(m.failedRuns) + " failed runs"],
          ["Avg Confidence", formatPercent(m.averageConfidence), "AI prediction score"],
          ["Avg Latency", formatMs(m.averageLatencyMs), "provider response time"],
          ["Daily Avg Cost", inr.format(m.costInr / Math.max(data.days, 1)), "selected window"],
        ];
        document.getElementById("metrics").innerHTML = cards.map(([label, value, sub]) =>
          '<div class="card"><div class="label">' + label + '</div><div class="value">' + value + '</div><div class="sub">' + sub + '</div></div>'
        ).join("");
      }

      function renderChart(rows) {
        const canvas = document.getElementById("costChart");
        const ctx = canvas.getContext("2d");
        const width = canvas.width;
        const height = canvas.height;
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = "#fffdf8";
        ctx.fillRect(0, 0, width, height);

        if (rows.length === 0) {
          ctx.fillStyle = "#6f6a60";
          ctx.font = "16px system-ui";
          ctx.fillText("No AI runs in this period", 24, 42);
          return;
        }

        const pad = 34;
        const maxCost = Math.max(...rows.map((row) => row.costInr), 1);
        const barWidth = Math.max(4, (width - pad * 2) / rows.length - 4);
        ctx.strokeStyle = "#ded7ca";
        ctx.beginPath();
        ctx.moveTo(pad, height - pad);
        ctx.lineTo(width - pad, height - pad);
        ctx.stroke();

        rows.forEach((row, index) => {
          const x = pad + index * ((width - pad * 2) / rows.length) + 2;
          const barHeight = (row.costInr / maxCost) * (height - pad * 2);
          const y = height - pad - barHeight;
          ctx.fillStyle = "#23c273";
          ctx.fillRect(x, y, barWidth, barHeight);
        });

        ctx.fillStyle = "#6f6a60";
        ctx.font = "13px system-ui";
        ctx.fillText("₹" + decimal.format(maxCost), pad, 18);
        ctx.fillText(rows[0].date, pad, height - 8);
        ctx.textAlign = "right";
        ctx.fillText(rows[rows.length - 1].date, width - pad, height - 8);
        ctx.textAlign = "left";
      }

      function renderModels(rows) {
        if (rows.length === 0) {
          document.getElementById("models").innerHTML = '<p>No model usage yet.</p>';
          return;
        }
        document.getElementById("models").innerHTML =
          '<table><thead><tr><th>Model</th><th>Runs</th><th>Avg</th><th>₹10</th></tr></thead><tbody>' +
          rows.map((row) =>
	            '<tr><td>' + row.model + '<div class="note">' + row.provider + '</div></td><td>' + whole.format(row.runs) +
	            '<div class="note">' + whole.format(row.scans) + ' scans</div></td><td>' + inr.format(row.averageRunCostInr) +
	            '</td><td>' + decimal.format(row.runsPerTenInr) + '</td></tr>'
          ).join("") +
          '</tbody></table>';
      }

      function renderRecentRuns(rows) {
        if (rows.length === 0) {
          document.getElementById("recentRuns").innerHTML = '<p>No recent AI runs.</p>';
          return;
        }
        document.getElementById("recentRuns").innerHTML =
          '<table><thead><tr><th>Time</th><th>Model</th><th>Tokens</th><th>Confidence</th><th>Latency</th><th>Cost</th></tr></thead><tbody>' +
          rows.map((row) =>
            '<tr><td>' + new Date(row.createdAt).toLocaleString() + '</td><td>' + row.model +
            '<div class="note ' + (row.success ? "ok" : "bad") + '">' + (row.success ? "success" : "failed") + '</div></td><td>' +
            whole.format(row.inputTokens + row.outputTokens) + '<div class="note">' + whole.format(row.inputTokens) + ' in · ' + whole.format(row.outputTokens) +
            ' out</div></td><td>' + formatPercent(row.confidence) + '</td><td>' + formatMs(row.latencyMs) + '</td><td>' + inr.format(row.costInr) + '</td></tr>'
          ).join("") +
          '</tbody></table>';
      }

      document.getElementById("days").addEventListener("change", load);
      load();
    </script>
  </body>
</html>`;
