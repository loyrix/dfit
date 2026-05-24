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
  aiProvider: "mock" | "openai" | "gemini" | "vertex";
  adMob: {
    rewardedSsvRequired: boolean;
    rewardedSsvPublicKeysUrl: string;
    rewardedSsvKeyCacheTtlMs: number;
  };
  gemini: {
    apiKey?: string;
    model: string;
    endpoint: string;
    timeoutMs: number;
  };
  vertex: {
    project: string;
    location: string;
    model: string;
    credentialsJson?: string;
    credentialsJsonBase64?: string;
    timeoutMs: number;
    maxOutputTokens: number;
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

const aiProviders = ["mock", "openai", "gemini", "vertex"] as const;

export const buildApiConfig = (env: ConfigEnv = process.env): ApiConfig => {
  const builtConfig: ApiConfig = {
    nodeEnv: env.NODE_ENV ?? "development",
    host: env.API_HOST ?? "127.0.0.1",
    port: Number(env.PORT ?? 4000),
    aiProvider: parseAiProvider(env.AI_PROVIDER),
    adMob: {
      rewardedSsvRequired: parseBoolean(env.ADMOB_REWARDED_SSV_REQUIRED, false),
      rewardedSsvPublicKeysUrl:
        env.ADMOB_REWARDED_SSV_PUBLIC_KEYS_URL ??
        "https://www.gstatic.com/admob/reward/verifier-keys.json",
      rewardedSsvKeyCacheTtlMs: Number(env.ADMOB_REWARDED_SSV_KEY_CACHE_TTL_MS ?? 86_400_000),
    },
    gemini: {
      apiKey: env.GEMINI_API_KEY,
      model: env.GEMINI_MODEL ?? "gemini-2.5-flash",
      endpoint: env.GEMINI_API_ENDPOINT ?? "https://generativelanguage.googleapis.com/v1beta",
      timeoutMs: Number(env.GEMINI_TIMEOUT_MS ?? 25_000),
    },
    vertex: {
      project: env.GOOGLE_CLOUD_PROJECT ?? "",
      location: env.GOOGLE_CLOUD_LOCATION ?? "asia-south1",
      model: env.VERTEX_AI_MODEL ?? "gemini-2.5-flash",
      credentialsJson: env.GOOGLE_APPLICATION_CREDENTIALS_JSON,
      credentialsJsonBase64: env.GOOGLE_APPLICATION_CREDENTIALS_JSON_BASE64,
      timeoutMs: Number(env.VERTEX_AI_TIMEOUT_MS ?? 30_000),
      maxOutputTokens: Number(env.VERTEX_AI_MAX_OUTPUT_TOKENS ?? 3_072),
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

  if (candidate.aiProvider === "vertex") {
    if (!candidate.vertex.project.trim()) {
      throw new Error("GOOGLE_CLOUD_PROJECT is required when AI_PROVIDER=vertex.");
    }

    if (!candidate.vertex.location.trim()) {
      throw new Error("GOOGLE_CLOUD_LOCATION is required when AI_PROVIDER=vertex.");
    }

    if (!candidate.vertex.model.trim()) {
      throw new Error("VERTEX_AI_MODEL is required when AI_PROVIDER=vertex.");
    }

    if (
      !candidate.vertex.credentialsJson?.trim() &&
      !candidate.vertex.credentialsJsonBase64?.trim()
    ) {
      throw new Error(
        "GOOGLE_APPLICATION_CREDENTIALS_JSON_BASE64 is required when AI_PROVIDER=vertex.",
      );
    }
  }

  if (!candidate.adMob.rewardedSsvPublicKeysUrl.trim()) {
    throw new Error("ADMOB_REWARDED_SSV_PUBLIC_KEYS_URL cannot be empty.");
  }

  if (
    !Number.isFinite(candidate.adMob.rewardedSsvKeyCacheTtlMs) ||
    candidate.adMob.rewardedSsvKeyCacheTtlMs <= 0
  ) {
    throw new Error("ADMOB_REWARDED_SSV_KEY_CACHE_TTL_MS must be a positive number.");
  }
};

const parseBoolean = (value: string | undefined, fallback: boolean): boolean => {
  if (value === undefined) return fallback;
  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return fallback;
};

const parseAiProvider = (value: string | undefined): ApiConfig["aiProvider"] => {
  const provider = value?.trim() || "mock";
  if (aiProviders.includes(provider as ApiConfig["aiProvider"])) {
    return provider as ApiConfig["aiProvider"];
  }

  throw new Error(`Unsupported AI_PROVIDER "${provider}". Use mock, openai, gemini, or vertex.`);
};

export const config = buildApiConfig();
