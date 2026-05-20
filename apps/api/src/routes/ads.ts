import type { FastifyInstance } from "fastify";
import { completeRewardedAdRequestSchema } from "@logmyplate/contracts";
import type { AppRepository } from "../repositories/app-repository.js";
import { currentRequestIdentity } from "../request-context.js";

export const registerAdRoutes = async (
  app: FastifyInstance,
  repository: AppRepository,
): Promise<void> => {
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

    return repository.completeRewardedAd(parsed.data);
  });
};
