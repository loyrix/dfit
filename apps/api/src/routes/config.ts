import type { FastifyInstance } from "fastify";

export const registerConfigRoutes = async (app: FastifyInstance): Promise<void> => {
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
      aiProvider: "mock",
      noImageStorage: true,
      accountLink: false,
      premium: false,
    },
  }));
};
