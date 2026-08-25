import {
  recordInstallAttributionRequestSchema,
  registerPushTokenRequestSchema,
} from "@logmyplate/contracts";
import type { FastifyInstance } from "fastify";
import { AccountAuthError, type AppRepository } from "../repositories/app-repository.js";

export const registerDeviceRoutes = async (
  app: FastifyInstance,
  repository: AppRepository,
): Promise<void> => {
  app.put("/v1/devices/push-token", async (request, reply) => {
    const parsed = registerPushTokenRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: "invalid_push_token",
        message: "Push token registration payload is invalid.",
      });
    }

    try {
      await repository.registerPushToken(parsed.data);
    } catch (error) {
      if (error instanceof AccountAuthError) {
        return reply.status(error.statusCode).send({
          error: error.code,
          message: error.message,
        });
      }
      throw error;
    }

    return { registered: true as const };
  });

  /**
   * Records where an install came from.
   *
   * Clients call this on cold start, so the common case is an organic install
   * with nothing to report — that is a 200 with `recorded: false`, not an error.
   * Purely additive: clients that never call it keep working exactly as before,
   * and their devices rows stay unattributed rather than being guessed at.
   */
  app.post("/v1/devices/attribution", async (request, reply) => {
    const parsed = recordInstallAttributionRequestSchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      return reply.status(400).send({
        error: "invalid_attribution",
        message: "Install attribution payload is invalid.",
      });
    }

    try {
      const recorded = await repository.recordInstallAttribution(parsed.data);
      return { recorded };
    } catch (error) {
      if (error instanceof AccountAuthError) {
        return reply.status(error.statusCode).send({
          error: error.code,
          message: error.message,
        });
      }
      throw error;
    }
  });
};
