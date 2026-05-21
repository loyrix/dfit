import type { FastifyInstance } from "fastify";
import { profileHealthTargetRequestSchema } from "@logmyplate/contracts";
import { z } from "zod";
import { AccountAuthError, type AppRepository } from "../repositories/app-repository.js";
import { calculateHealthTarget } from "../services/health-targets.js";

const emailAuthSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(6).max(128),
});

export const registerProfileRoutes = async (
  app: FastifyInstance,
  repository: AppRepository,
): Promise<void> => {
  app.post("/v1/auth/anonymous", async () => ({
    profile: await repository.getProfile(),
    accessToken: "dev_anonymous_token",
  }));

  app.get("/v1/profiles/me", async () => ({
    profile: await repository.getProfile(),
  }));

  app.get("/v1/profiles/me/health", async () => ({
    healthTarget: await repository.getHealthTarget(),
  }));

  app.put("/v1/profiles/me/health", async (request, reply) => {
    const parsed = profileHealthTargetRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: "invalid_health_target",
        issues: parsed.error.issues,
      });
    }

    try {
      const healthTarget = await repository.upsertHealthTarget(calculateHealthTarget(parsed.data));
      return { healthTarget };
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

  app.post("/v1/auth/email/signup", async (request, reply) => {
    const parsed = emailAuthSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: "invalid_email_auth",
        issues: parsed.error.issues,
      });
    }

    try {
      return reply.status(201).send(await repository.signUpWithEmail(parsed.data));
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

  app.post("/v1/auth/email/login", async (request, reply) => {
    const parsed = emailAuthSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: "invalid_email_auth",
        issues: parsed.error.issues,
      });
    }

    try {
      return repository.loginWithEmail(parsed.data);
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

  app.post("/v1/auth/logout", async (request, reply) => {
    const authorization = request.headers.authorization;
    const token =
      typeof authorization === "string" && authorization.toLowerCase().startsWith("bearer ")
        ? authorization.slice("bearer ".length).trim()
        : undefined;

    if (token) await repository.revokeSession(token);
    return reply.status(204).send();
  });
};
