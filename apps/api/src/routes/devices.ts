import { registerPushTokenRequestSchema } from "@logmyplate/contracts";
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
};
