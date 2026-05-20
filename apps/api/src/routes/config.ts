import type { FastifyInstance } from "fastify";
import { config } from "../config.js";

export const registerConfigRoutes = async (app: FastifyInstance): Promise<void> => {
  app.get("/", async () => ({
    ok: true,
    service: "logmyplate-api",
    version: "0.0.0",
  }));

  app.get("/health", async () => ({
    ok: true,
    service: "logmyplate-api",
    version: "0.0.0",
  }));

  app.get("/v1/config", async () => {
    const imageStorage = isMealImageStorageConfigured();

    return {
      appName: "LogMyPlate",
      scanLimits: {
        freeLifetime: 3,
        rewardedCap: 0,
        launchTotalCap: 3,
      },
      features: {
        aiProvider: config.aiProvider,
        imageStorage,
        noImageStorage: !imageStorage,
        accountLink: true,
        premium: false,
      },
    };
  });
};

const isMealImageStorageConfigured = () =>
  Boolean(
    config.storage.s3Endpoint &&
    config.storage.s3Region &&
    config.storage.s3AccessKeyId &&
    config.storage.s3SecretAccessKey,
  );
