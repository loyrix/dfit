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

export const config: ApiConfig = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  host: process.env.API_HOST ?? "127.0.0.1",
  port: Number(process.env.PORT ?? 4000),
  aiProvider: (process.env.AI_PROVIDER as ApiConfig["aiProvider"] | undefined) ?? "mock",
  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
    endpoint: process.env.GEMINI_API_ENDPOINT ?? "https://generativelanguage.googleapis.com/v1beta",
    timeoutMs: Number(process.env.GEMINI_TIMEOUT_MS ?? 25_000),
  },
  storage: {
    s3Endpoint: process.env.STORAGE_S3_ENDPOINT,
    s3Region: process.env.STORAGE_S3_REGION,
    s3AccessKeyId: process.env.STORAGE_S3_ACCESS_KEY_ID,
    s3SecretAccessKey: process.env.STORAGE_S3_SECRET_ACCESS_KEY,
    mealImagesBucket: process.env.STORAGE_BUCKET_MEAL_IMAGES ?? "meal-images",
  },
};
