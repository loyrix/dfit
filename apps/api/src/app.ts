import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import Fastify, { type FastifyInstance } from "fastify";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createSqlClient, type SqlClient } from "./db/client.js";
import { registerIdempotency } from "./plugins/idempotency.js";
import { registerRequestContext } from "./request-context.js";
import type { AppRepository } from "./repositories/app-repository.js";
import { InMemoryStore } from "./repositories/in-memory-store.js";
import { PostgresStore } from "./repositories/postgres-store.js";
import { registerConfigRoutes } from "./routes/config.js";
import { registerDeviceRoutes } from "./routes/devices.js";
import { registerAdRoutes } from "./routes/ads.js";
import { registerFoodRoutes } from "./routes/foods.js";
import { registerJournalRoutes } from "./routes/journal.js";
import { registerProfileRoutes } from "./routes/profiles.js";
import { registerScanRoutes } from "./routes/scans.js";
import { registerSubscriptionRoutes } from "./routes/subscriptions.js";
import { registerAdminRoutes } from "./routes/admin.js";
import { registerCronRoutes } from "./routes/cron.js";
import { config } from "./config.js";
import { createAiProvider, type AiProvider } from "./services/ai-provider.js";
import {
  GoogleAdMobRewardedAdVerifier,
  type AdMobRewardedAdVerifier,
} from "./services/admob-ssv.js";
import {
  ConfiguredOAuthIdentityVerifier,
  type OAuthIdentityVerifier,
} from "./services/oauth-identity-verifier.js";
import { MockAiProvider } from "./services/mock-ai-provider.js";
import { registerBootstrapRoutes } from "./routes/bootstrap.js";
import { createMealImageStorage, type MealImageStorage } from "./services/meal-image-storage.js";
import {
  createPasswordResetEmailSender,
  type PasswordResetEmailSender,
} from "./services/password-reset-email.js";

export type BuildAppOptions = {
  repository?: AppRepository;
  sql?: SqlClient;
  aiProvider?: AiProvider;
  rewardedAdVerifier?: AdMobRewardedAdVerifier;
  requireRewardedAdServerVerification?: boolean;
  oauthVerifier?: OAuthIdentityVerifier;
  mealImageStorage?: MealImageStorage;
  passwordResetEmailSender?: PasswordResetEmailSender;
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
    (config.nodeEnv === "test" ? new MockAiProvider() : createAiProvider(config, sql));
  const mealImageStorage = options.mealImageStorage ?? createMealImageStorage(config);
  const oauthVerifier = options.oauthVerifier ?? new ConfiguredOAuthIdentityVerifier(config.auth);
  const passwordResetEmailSender =
    options.passwordResetEmailSender ?? createPasswordResetEmailSender(config);
  const rewardedAdVerifier =
    options.rewardedAdVerifier ??
    new GoogleAdMobRewardedAdVerifier({
      publicKeysUrl: config.adMob.rewardedSsvPublicKeysUrl,
      keyCacheTtlMs: config.adMob.rewardedSsvKeyCacheTtlMs,
    });

  if (sql) {
    app.addHook("onClose", async () => {
      await sql.end({ timeout: 5 });
    });
  }

  await app.register(cors, {
    origin: true,
  });
  await registerApiDocumentation(app);

  await registerRequestContext(app);
  await registerIdempotency(app, repository);
  await registerConfigRoutes(app, sql);
  await registerAdRoutes(
    app,
    repository,
    {
      rewardedAdVerifier,
      requireRewardedAdServerVerification:
        options.requireRewardedAdServerVerification ?? config.adMob.rewardedSsvRequired,
    },
    sql,
  );
  await registerFoodRoutes(app, repository);
  await registerDeviceRoutes(app, repository);
  await registerProfileRoutes(
    app,
    repository,
    mealImageStorage,
    oauthVerifier,
    passwordResetEmailSender,
  );
  await registerSubscriptionRoutes(app, repository, config.revenueCat);
  await registerBootstrapRoutes(app, repository, mealImageStorage, sql);
  await registerJournalRoutes(app, repository, mealImageStorage);
  await registerScanRoutes(app, repository, mealImageStorage, aiProvider);
  await registerAdminRoutes(app, sql, mealImageStorage);
  await registerCronRoutes(app, sql);

  return app;
};

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(currentDir, "../../..");
const openApiSpecPath = path.join(repoRoot, "docs/openapi.yaml");

const registerApiDocumentation = async (app: FastifyInstance) => {
  app.get("/openapi.yaml", async (_request, reply) => {
    const specification = await readFile(openApiSpecPath, "utf8");
    return reply.type("application/yaml").send(specification);
  });

  if (!isInteractiveApiDocumentationEnabled()) {
    return;
  }

  await app.register(swagger, {
    mode: "static",
    specification: {
      path: openApiSpecPath,
      baseDir: path.dirname(openApiSpecPath),
    },
  });

  await app.register(swaggerUi, {
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "list",
      deepLinking: true,
    },
    staticCSP: true,
  });
};

const isInteractiveApiDocumentationEnabled = () => {
  const configured = process.env.API_DOCS_ENABLED?.trim().toLowerCase();
  if (configured) {
    return ["1", "true", "yes", "on"].includes(configured);
  }

  return process.env.NODE_ENV !== "production";
};
