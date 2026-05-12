import type { FastifyInstance } from "fastify";
import { config } from "../config.js";

export const registerConfigRoutes = async (app: FastifyInstance): Promise<void> => {
  app.get("/", async () => ({
    ok: true,
    service: "dfit-api",
    version: "0.0.0",
  }));

  app.get("/health", async () => ({
    ok: true,
    service: "dfit-api",
    version: "0.0.0",
  }));

  app.get("/v1/config", async () => ({
    appName: "DFit",
    scanLimits: {
      freePerDay: 1,
      rewardedCapPerDay: 2,
      launchTotalCapPerDay: 3,
    },
    features: {
      aiProvider: config.aiProvider,
      noImageStorage: true,
      accountLink: false,
      premium: false,
    },
  }));
};
