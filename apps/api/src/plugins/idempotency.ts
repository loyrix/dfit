import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { AppRepository } from "../repositories/app-repository.js";

const mutatingMethods = new Set(["POST", "PATCH", "PUT", "DELETE"]);

export const registerIdempotency = async (
  app: FastifyInstance,
  repository: AppRepository,
): Promise<void> => {
  app.addHook("preHandler", async (request, reply) => {
    if (!mutatingMethods.has(request.method)) return;

    const key = request.headers["idempotency-key"];
    if (!key || Array.isArray(key)) {
      await reply.status(400).send({
        error: "missing_idempotency_key",
        message: "Mutating requests require an Idempotency-Key header.",
      });
      return;
    }

    const cached = await repository.getIdempotent(key);
    if (cached) {
      await reply.status(cached.responseStatus).send(cached.responseBody);
      return;
    }
  });

  app.addHook("onSend", async (request: FastifyRequest, reply: FastifyReply, payload) => {
    if (!mutatingMethods.has(request.method)) return payload;

    const key = request.headers["idempotency-key"];
    if (!key || Array.isArray(key) || reply.statusCode >= 500) return payload;

    try {
      await repository.setIdempotent(key, {
        responseStatus: reply.statusCode,
        responseBody: payload ? JSON.parse(String(payload)) : null,
      });
    } catch {
      await repository.setIdempotent(key, {
        responseStatus: reply.statusCode,
        responseBody: payload,
      });
    }

    return payload;
  });
};
