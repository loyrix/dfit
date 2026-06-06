import type { FastifyInstance } from "fastify";
import { completeRewardedAdRequestSchema } from "@logmyplate/contracts";
import type { SqlClient } from "../db/client.js";
import type { AppRepository } from "../repositories/app-repository.js";
import { currentRequestIdentity } from "../request-context.js";
import { AdMobSsvVerificationError, type AdMobRewardedAdVerifier } from "../services/admob-ssv.js";
import { loadEngagementPolicy } from "../services/engagement-policy.js";

export type AdRouteOptions = {
  rewardedAdVerifier: AdMobRewardedAdVerifier;
  requireRewardedAdServerVerification: boolean;
};

export const registerAdRoutes = async (
  app: FastifyInstance,
  repository: AppRepository,
  options: AdRouteOptions,
  sql?: SqlClient,
): Promise<void> => {
  app.get("/v1/ads/rewarded/ssv", async (request, reply) => {
    try {
      const callback = await options.rewardedAdVerifier.verifyCallbackUrl(request.url);
      await repository.recordRewardedAdServerVerification({
        provider: "admob",
        transactionId: callback.transactionId,
        profileId: callback.userId,
        adUnitId: callback.adUnitId,
        customData: callback.customData,
        rewardType: callback.rewardType,
        rewardAmount: callback.rewardAmount,
        signatureKeyId: callback.keyId,
        rawQuery: callback.rawQuery,
      });
      return { ok: true };
    } catch (error) {
      request.log.warn({ error }, "AdMob rewarded SSV callback rejected");
      const statusCode = error instanceof AdMobSsvVerificationError ? 400 : 503;
      return reply.status(statusCode).send({ ok: false });
    }
  });

  app.post("/v1/ads/rewarded/complete", async (request, reply) => {
    const profile = await repository.getProfile();
    if (!currentRequestIdentity().sessionToken || profile.authMethod === "anonymous") {
      return reply.status(401).send({
        error: "account_required",
        message: "Create or sign in to an account before unlocking scans with ads.",
      });
    }

    const parsed = completeRewardedAdRequestSchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      return reply.status(400).send({
        error: "invalid_rewarded_ad_completion",
        issues: parsed.error.issues,
      });
    }

    const engagementPolicy = await loadEngagementPolicy(sql);
    if (!engagementPolicy.rewardedAds.enabled) {
      return reply.status(403).send({
        error: "rewarded_ads_disabled",
        message: "Rewarded ad scan unlocks are currently disabled.",
      });
    }

    const input = { ...parsed.data };
    if (input.verificationToken) {
      const verification = await repository.findRewardedAdServerVerification({
        profileId: profile.id,
        customData: input.verificationToken,
      });

      if (verification) {
        input.transactionId = input.transactionId ?? verification.transactionId;
        input.adUnitId = input.adUnitId ?? verification.adUnitId;
        input.rewardType = input.rewardType ?? verification.rewardType;
        input.rewardAmount = input.rewardAmount ?? verification.rewardAmount;
      } else if (options.requireRewardedAdServerVerification) {
        return reply.status(409).send({
          error: "rewarded_ad_verification_pending",
          message: "Rewarded ad verification has not arrived yet. Please try again in a moment.",
        });
      }
    } else if (options.requireRewardedAdServerVerification) {
      return reply.status(400).send({
        error: "rewarded_ad_verification_required",
        message: "Rewarded ad completions require AdMob server-side verification.",
      });
    }

    return repository.completeRewardedAd(input, engagementPolicy.rewardedAds.dailyScanLimit);
  });
};
