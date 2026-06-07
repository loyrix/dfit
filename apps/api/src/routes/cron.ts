import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { config } from "../config.js";
import type { SqlClient } from "../db/client.js";
import { loadEngagementPolicy } from "../services/engagement-policy.js";
import {
  ApplePushNotificationSender,
  FirebaseCloudMessagingSender,
  PushNotificationConfigurationError,
  PushNotificationRouter,
} from "../services/push-notifications.js";
import { runScheduledPushReminders } from "../services/push-reminders.js";

const cronQuerySchema = z.object({
  dryRun: z.preprocess(parseBooleanQuery, z.boolean()).default(false),
  limit: z.coerce.number().int().min(1).max(5000).default(500),
});

export const registerCronRoutes = async (app: FastifyInstance, sql?: SqlClient): Promise<void> => {
  app.get("/internal/cron/push-reminders", async (request, reply) => {
    const secret = config.cron.secret?.trim();
    if (!secret) {
      return reply.status(503).send({
        error: "cron_not_configured",
        message: "CRON_SECRET is required before scheduled jobs can run.",
      });
    }

    if (extractBearerToken(request.headers.authorization) !== secret) {
      return reply.status(401).send({ error: "unauthorized" });
    }

    if (!sql) {
      return reply.status(503).send({
        error: "database_unavailable",
        message: "A database connection is required before scheduled jobs can run.",
      });
    }

    const query = cronQuerySchema.parse(request.query ?? {});
    const fcmSender = new FirebaseCloudMessagingSender(config.push);
    const apnsSender = ApplePushNotificationSender.isConfigured(config.push)
      ? new ApplePushNotificationSender(config.push)
      : null;
    const sender = new PushNotificationRouter(fcmSender, apnsSender);
    if (!sender.configured && !query.dryRun) {
      return reply.status(503).send({
        error: "push_provider_not_configured",
        message: "Firebase Cloud Messaging server credentials are not configured.",
      });
    }

    try {
      const policy = await loadEngagementPolicy(sql);
      const reminders = await runScheduledPushReminders({
        sql,
        policy,
        sender,
        dryRun: query.dryRun,
        limit: query.limit,
      });
      return { reminders };
    } catch (error) {
      if (error instanceof PushNotificationConfigurationError) {
        return reply.status(503).send({
          error: "push_provider_not_configured",
          message: error.message,
        });
      }
      throw error;
    }
  });
};

const extractBearerToken = (authorization: string | undefined): string | undefined => {
  if (!authorization?.startsWith("Bearer ")) return undefined;
  return authorization.slice("Bearer ".length).trim();
};

function parseBooleanQuery(value: unknown): boolean {
  if (value === undefined) return false;
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return false;
  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}
