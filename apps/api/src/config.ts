import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(currentDir, "../../..");
const apiRoot = path.resolve(currentDir, "..");

for (const envPath of [
  path.join(repoRoot, ".env"),
  path.join(repoRoot, ".env.local"),
  path.join(apiRoot, ".env"),
  path.join(apiRoot, ".env.local"),
]) {
  dotenv.config({ path: envPath });
}

export type ApiConfig = {
  nodeEnv: string;
  host: string;
  port: number;
  aiProvider: "mock" | "openai" | "gemini";
  gemini: {
    apiKey?: string;
    model: string;
    endpoint: string;
    timeoutMs: number;
  };
  storage: {
    s3Endpoint?: string;
    s3Region?: string;
    s3AccessKeyId?: string;
    s3SecretAccessKey?: string;
    mealImagesBucket: string;
  };
};

type ConfigEnv = Record<string, string | undefined>;

const aiProviders = ["mock", "openai", "gemini"] as const;

export const buildApiConfig = (env: ConfigEnv = process.env): ApiConfig => {
  const builtConfig: ApiConfig = {
    nodeEnv: env.NODE_ENV ?? "development",
    host: env.API_HOST ?? "127.0.0.1",
    port: Number(env.PORT ?? 4000),
    aiProvider: parseAiProvider(env.AI_PROVIDER),
    gemini: {
      apiKey: env.GEMINI_API_KEY,
      model: env.GEMINI_MODEL ?? "gemini-2.5-flash",
      endpoint: env.GEMINI_API_ENDPOINT ?? "https://generativelanguage.googleapis.com/v1beta",
      timeoutMs: Number(env.GEMINI_TIMEOUT_MS ?? 25_000),
    },
    storage: {
      s3Endpoint: env.STORAGE_S3_ENDPOINT,
      s3Region: env.STORAGE_S3_REGION,
      s3AccessKeyId: env.STORAGE_S3_ACCESS_KEY_ID,
      s3SecretAccessKey: env.STORAGE_S3_SECRET_ACCESS_KEY,
      mealImagesBucket: env.STORAGE_BUCKET_MEAL_IMAGES ?? "meal-images",
    },
  };

  validateApiConfig(builtConfig);
  return builtConfig;
};

export const validateApiConfig = (candidate: ApiConfig): void => {
  if (candidate.nodeEnv === "production" && candidate.aiProvider === "mock") {
    throw new Error("AI_PROVIDER=mock is not allowed when NODE_ENV=production.");
  }

  if (candidate.aiProvider === "gemini" && !candidate.gemini.apiKey?.trim()) {
    throw new Error("GEMINI_API_KEY is required when AI_PROVIDER=gemini.");
  }
};

const parseAiProvider = (value: string | undefined): ApiConfig["aiProvider"] => {
  const provider = value?.trim() || "mock";
  if (aiProviders.includes(provider as ApiConfig["aiProvider"])) {
    return provider as ApiConfig["aiProvider"];
  }

  throw new Error(`Unsupported AI_PROVIDER "${provider}". Use mock, openai, or gemini.`);
};

export const config = buildApiConfig();
