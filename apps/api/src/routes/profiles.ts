import type { FastifyInstance, FastifyReply } from "fastify";
import { profileHealthTargetRequestSchema } from "@logmyplate/contracts";
import { z } from "zod";
import { AccountAuthError, type AppRepository } from "../repositories/app-repository.js";
import { calculateHealthTarget } from "../services/health-targets.js";
import type { MealImageStorage } from "../services/meal-image-storage.js";
import {
  OAuthVerificationError,
  type OAuthIdentityVerifier,
} from "../services/oauth-identity-verifier.js";

const emailAuthSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(6).max(128),
});

const oauthAuthSchema = z.object({
  provider: z.enum(["apple", "google"]),
  idToken: z.string().trim().min(20),
  authorizationCode: z.string().trim().min(1).optional(),
  nonce: z.string().trim().min(1).max(256).optional(),
  displayName: z.string().trim().min(1).max(160).optional(),
});

export const registerProfileRoutes = async (
  app: FastifyInstance,
  repository: AppRepository,
  mealImageStorage: MealImageStorage,
  oauthVerifier: OAuthIdentityVerifier,
): Promise<void> => {
  app.post("/v1/auth/anonymous", async () => ({
    profile: await repository.getProfile(),
    accessToken: "dev_anonymous_token",
  }));

  app.get("/v1/profiles/me", async () => ({
    profile: await repository.getProfile(),
  }));

  app.post("/v1/profiles/me/deactivate", async (_request, reply) => {
    try {
      const deactivated = await repository.deactivateProfile();
      if (!deactivated) {
        return reply.status(404).send({
          error: "profile_not_found",
          message: "Profile was not found.",
        });
      }

      return reply.status(204).send();
    } catch (error) {
      if (error instanceof AccountAuthError) return sendAuthError(reply, error);
      throw error;
    }
  });

  app.delete("/v1/profiles/me", async (_request, reply) => {
    try {
      const deletionPlan = await repository.getProfileDeletionPlan();
      if (deletionPlan.storedObjects.length > 0 && !mealImageStorage.enabled) {
        return reply.status(503).send({
          error: "profile_storage_delete_unavailable",
          message: "Stored meal photos cannot be deleted right now. Please try again later.",
        });
      }

      try {
        for (const target of deletionPlan.storedObjects) {
          await mealImageStorage.deleteStoredObject(target);
        }
      } catch (error) {
        app.log.error(
          { err: error, profileId: deletionPlan.profileId },
          "failed to delete stored profile image",
        );
        return reply.status(502).send({
          error: "profile_storage_delete_failed",
          message: "Stored meal photos could not be deleted. Please try again.",
        });
      }

      const deleted = await repository.deleteProfile();
      if (!deleted) {
        return reply.status(404).send({
          error: "profile_not_found",
          message: "Profile was not found.",
        });
      }

      return reply.status(204).send();
    } catch (error) {
      if (error instanceof AccountAuthError) return sendAuthError(reply, error);
      throw error;
    }
  });

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
      return await repository.loginWithEmail(parsed.data);
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

  app.post("/v1/auth/oauth", async (request, reply) => {
    const parsed = oauthAuthSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: "invalid_oauth_auth",
        issues: parsed.error.issues,
      });
    }

    try {
      const identity = await oauthVerifier.verify(parsed.data);
      return await repository.signInWithOAuth(identity);
    } catch (error) {
      if (error instanceof OAuthVerificationError) {
        return reply.status(error.statusCode).send({
          error: error.code,
          message: error.message,
        });
      }
      if (error instanceof AccountAuthError) return sendAuthError(reply, error);
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

const sendAuthError = (reply: FastifyReply, error: AccountAuthError) =>
  reply.status(error.statusCode).send({
    error: error.code,
    message: error.message,
  });
