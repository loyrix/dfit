import type { FastifyInstance } from "fastify";
import type { AppRepository } from "../repositories/app-repository.js";

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
};
