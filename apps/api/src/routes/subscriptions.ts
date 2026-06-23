import { timingSafeEqual } from "node:crypto";
import type { FastifyInstance } from "fastify";
import {
  subscriptionStatusResponseSchema,
  syncRevenueCatSubscriptionRequestSchema,
} from "@logmyplate/contracts";
import type { ApiConfig } from "../config.js";
import { AccountAuthError } from "../repositories/app-repository.js";
import type { AppRepository } from "../repositories/app-repository.js";
import {
  parseRevenueCatWebhookEvent,
  RevenueCatClient,
  webhookStatus,
} from "../services/revenuecat.js";

export const registerSubscriptionRoutes = async (
  app: FastifyInstance,
  repository: AppRepository,
  revenueCatConfig: ApiConfig["revenueCat"],
): Promise<void> => {
  const revenueCatClient = new RevenueCatClient(revenueCatConfig);

  app.get("/v1/subscription", async () =>
    subscriptionStatusResponseSchema.parse(await repository.getSubscriptionStatus()),
  );

  app.post("/v1/subscription/revenuecat/sync", async (request, reply) => {
    const input = syncRevenueCatSubscriptionRequestSchema.parse(request.body ?? {});
    const profile = await repository.getProfile();
    const appUserId = input.appUserId ?? profile.id;
    if (appUserId !== profile.id) {
      return reply.status(403).send({ error: "subscription_profile_mismatch" });
    }
    const entitlement = await revenueCatClient.fetchEntitlement(appUserId);
    if (entitlement) {
      return subscriptionStatusResponseSchema.parse(
        await repository.upsertSubscriptionEntitlement(entitlement),
      );
    }

    return subscriptionStatusResponseSchema.parse(await repository.getSubscriptionStatus());
  });

  app.post("/v1/subscription/revenuecat/webhook", async (request, reply) => {
    if (!hasValidWebhookAuth(request.headers.authorization, revenueCatConfig.webhookAuthToken)) {
      request.log.warn("revenuecat_webhook_auth_failed");
      return reply.status(401).send({ error: "invalid_revenuecat_webhook_auth" });
    }

    const event = parseRevenueCatWebhookEvent(request.body, revenueCatConfig.entitlementId);
    if (!event?.appUserId) {
      request.log.warn("revenuecat_webhook_invalid_event");
      return reply.status(400).send({ error: "invalid_revenuecat_webhook_event" });
    }

    await repository.recordSubscriptionEvent({
      eventId: event.id,
      appUserId: event.appUserId,
      entitlementId: event.entitlementIds[0],
      eventType: event.type,
      productId: event.productId,
      store: event.store,
      environment: event.environment,
      purchasedAt: event.purchasedAt,
      expirationAt: event.expirationAt,
      rawPayload: event.rawPayload,
    });

    if (event.entitlementIds.includes(revenueCatConfig.entitlementId)) {
      try {
        await repository.upsertSubscriptionEntitlement({
          appUserId: event.appUserId,
          entitlementId: revenueCatConfig.entitlementId,
          status: webhookStatus(event.type, event.expirationAt),
          store: event.store,
          productId: event.productId,
          currentPeriodStart: event.purchasedAt,
          currentPeriodEnd: event.expirationAt,
          willRenew: event.willRenew,
          environment: event.environment,
          latestEventId: event.id,
          rawPayload: event.rawPayload,
        });
      } catch (error) {
        if (error instanceof AccountAuthError && error.code === "profile_not_found") {
          request.log.warn(
            { eventId: event.id, eventType: event.type, appUserId: event.appUserId },
            "revenuecat_webhook_orphan_event_profile_not_found",
          );
        } else {
          throw error;
        }
      }
    }

    request.log.info(
      {
        eventId: event.id,
        eventType: event.type,
        appUserId: event.appUserId,
        entitlementIds: event.entitlementIds,
        environment: event.environment,
      },
      "revenuecat_webhook_processed",
    );

    return { received: true };
  });
};

const safeEquals = (a: string, b: string): boolean => {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);
  if (aBuffer.length !== bBuffer.length) return false;
  return timingSafeEqual(aBuffer, bBuffer);
};

const hasValidWebhookAuth = (
  authorizationHeader: string | undefined,
  expectedToken: string | undefined,
): boolean => {
  if (!expectedToken) return false; // fail closed: never accept unauthenticated webhooks
  const header = authorizationHeader?.trim();
  if (!header) return false;
  if (safeEquals(header, expectedToken)) return true;
  return safeEquals(header, `Bearer ${expectedToken}`);
};
