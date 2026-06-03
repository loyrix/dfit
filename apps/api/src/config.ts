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
  auth: {
    googleClientIds: string[];
    appleClientIds: string[];
    appleTeamId?: string;
    appleKeyId?: string;
    applePrivateKey?: string;
    appleJwksUrl: string;
  };
  aiProvider: "mock" | "openai" | "gemini" | "vertex";
  adMob: {
    rewardedSsvRequired: boolean;
    rewardedSsvPublicKeysUrl: string;
    rewardedSsvKeyCacheTtlMs: number;
  };
  email: {
    resendApiKey?: string;
    passwordResetFrom: string;
  };
  push: {
    firebaseProjectId?: string;
    firebaseCredentialsJson?: string;
    firebaseCredentialsJsonBase64?: string;
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
    auth: {
      googleClientIds: parseList(env.AUTH_GOOGLE_CLIENT_IDS),
      appleClientIds: parseList(env.AUTH_APPLE_CLIENT_IDS),
      appleTeamId: emptyToUndefined(env.AUTH_APPLE_TEAM_ID),
      appleKeyId: emptyToUndefined(env.AUTH_APPLE_KEY_ID),
      applePrivateKey:
        emptyToUndefined(env.AUTH_APPLE_PRIVATE_KEY) ??
        decodeBase64Value(env.AUTH_APPLE_PRIVATE_KEY_BASE64),
      appleJwksUrl: env.AUTH_APPLE_JWKS_URL ?? "https://appleid.apple.com/auth/keys",
    },
    aiProvider: parseAiProvider(env.AI_PROVIDER),
    adMob: {
      rewardedSsvRequired: parseBoolean(env.ADMOB_REWARDED_SSV_REQUIRED, false),
      rewardedSsvPublicKeysUrl:
        env.ADMOB_REWARDED_SSV_PUBLIC_KEYS_URL ??
        "https://www.gstatic.com/admob/reward/verifier-keys.json",
      rewardedSsvKeyCacheTtlMs: Number(env.ADMOB_REWARDED_SSV_KEY_CACHE_TTL_MS ?? 86_400_000),
    },
    email: {
      resendApiKey: emptyToUndefined(env.RESEND_API_KEY),
      passwordResetFrom:
        emptyToUndefined(env.PASSWORD_RESET_EMAIL_FROM) ?? "LogMyPlate <no-reply@logmyplate.com>",
    },
    push: {
      firebaseProjectId:
        emptyToUndefined(env.FIREBASE_PROJECT_ID) ??
        emptyToUndefined(env.LOGMYPLATE_FIREBASE_PROJECT_ID) ??
        emptyToUndefined(env.GOOGLE_CLOUD_PROJECT),
      firebaseCredentialsJson:
        emptyToUndefined(env.FIREBASE_SERVICE_ACCOUNT_JSON) ??
        emptyToUndefined(env.GOOGLE_APPLICATION_CREDENTIALS_JSON),
      firebaseCredentialsJsonBase64:
        emptyToUndefined(env.FIREBASE_SERVICE_ACCOUNT_JSON_BASE64) ??
        emptyToUndefined(env.GOOGLE_APPLICATION_CREDENTIALS_JSON_BASE64),
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

  if (!candidate.email.passwordResetFrom.trim()) {
    throw new Error("PASSWORD_RESET_EMAIL_FROM cannot be empty.");
  }

  if (candidate.nodeEnv === "production" && !candidate.email.resendApiKey?.trim()) {
    throw new Error("RESEND_API_KEY is required when NODE_ENV=production.");
  }

  for (const clientId of candidate.auth.googleClientIds) {
    if (!clientId.endsWith(".apps.googleusercontent.com")) {
      throw new Error("AUTH_GOOGLE_CLIENT_IDS must contain Google OAuth client IDs.");
    }
  }

  if (!candidate.auth.appleJwksUrl.trim()) {
    throw new Error("AUTH_APPLE_JWKS_URL cannot be empty.");
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

const parseList = (value: string | undefined): string[] =>
  value
    ?.split(",")
    .map((item) => item.trim())
    .filter(Boolean) ?? [];

const emptyToUndefined = (value: string | undefined): string | undefined => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
};

const decodeBase64Value = (value: string | undefined): string | undefined => {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  return Buffer.from(trimmed, "base64").toString("utf8");
};

export const config = buildApiConfig();
