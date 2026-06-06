import type { FastifyInstance } from "fastify";
import {
  subscriptionStatusResponseSchema,
  syncRevenueCatSubscriptionRequestSchema,
} from "@logmyplate/contracts";
import type { ApiConfig } from "../config.js";
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
      return reply.status(401).send({ error: "invalid_revenuecat_webhook_auth" });
    }

    const event = parseRevenueCatWebhookEvent(request.body, revenueCatConfig.entitlementId);
    if (!event?.appUserId) {
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
    }

    return { received: true };
  });
};

const hasValidWebhookAuth = (
  authorizationHeader: string | undefined,
  expectedToken: string | undefined,
): boolean => {
  if (!expectedToken) return true;
  const header = authorizationHeader?.trim();
  if (!header) return false;
  if (header === expectedToken) return true;
  return header === `Bearer ${expectedToken}`;
};
