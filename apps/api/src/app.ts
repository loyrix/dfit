import cors from "@fastify/cors";
import Fastify from "fastify";
import { createSqlClient, type SqlClient } from "./db/client.js";
import { registerIdempotency } from "./plugins/idempotency.js";
import { registerRequestContext } from "./request-context.js";
import type { AppRepository } from "./repositories/app-repository.js";
import { InMemoryStore } from "./repositories/in-memory-store.js";
import { PostgresStore } from "./repositories/postgres-store.js";
import { registerConfigRoutes } from "./routes/config.js";
import { registerFoodRoutes } from "./routes/foods.js";
import { registerJournalRoutes } from "./routes/journal.js";
import { registerProfileRoutes } from "./routes/profiles.js";
import { registerScanRoutes } from "./routes/scans.js";
import { config } from "./config.js";
import { createAiProvider, type AiProvider } from "./services/ai-provider.js";
import { MockAiProvider } from "./services/mock-ai-provider.js";
import { registerBootstrapRoutes } from "./routes/bootstrap.js";
import {
  createMealImageStorage,
  type MealImageStorage,
} from "./services/meal-image-storage.js";

export type BuildAppOptions = {
  repository?: AppRepository;
  sql?: SqlClient;
  aiProvider?: AiProvider;
  mealImageStorage?: MealImageStorage;
};

export const buildApp = async (options: BuildAppOptions = {}) => {
  const app = Fastify({
    bodyLimit: Number(process.env.API_BODY_LIMIT_BYTES ?? 6_000_000),
    logger: {
      level: process.env.LOG_LEVEL ?? "info",
    },
  });

  const sql =
    options.sql ??
    (process.env.DATABASE_URL && process.env.NODE_ENV !== "test"
      ? createSqlClient(process.env.DATABASE_URL)
      : undefined);

  const repository = options.repository ?? (sql ? new PostgresStore(sql) : new InMemoryStore());
  const aiProvider =
    options.aiProvider ??
    (config.nodeEnv === "test" ? new MockAiProvider() : createAiProvider(config));
  const mealImageStorage = options.mealImageStorage ?? createMealImageStorage(config);

  if (sql) {
    app.addHook("onClose", async () => {
      await sql.end({ timeout: 5 });
    });
  }

  await app.register(cors, {
    origin: true,
  });

  await registerRequestContext(app);
  await registerIdempotency(app, repository);
  await registerConfigRoutes(app);
  await registerFoodRoutes(app, repository);
  await registerProfileRoutes(app, repository);
  await registerBootstrapRoutes(app, repository, mealImageStorage);
  await registerJournalRoutes(app, repository, mealImageStorage);
  await registerScanRoutes(app, repository, mealImageStorage, aiProvider);

  return app;
};
