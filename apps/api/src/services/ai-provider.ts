import type { AnalyzeScanResponseContract } from "@logmyplate/contracts";
import type { ApiConfig } from "../config.js";
import type { SqlClient } from "../db/client.js";
import { GeminiAiProvider } from "./gemini-ai-provider.js";
import { MockAiProvider } from "./mock-ai-provider.js";
import { RuntimeVertexAiProvider } from "./runtime-vertex-ai-provider.js";
import { VertexAiProvider } from "./vertex-ai-provider.js";

export type AnalyzeMealImageInput = {
  scanId: string;
  userHint?: string;
  promptKey?: string;
  locale?: string;
  region?: string;
  timezone?: string;
  image?: {
    mimeType: "image/jpeg" | "image/png" | "image/webp";
    base64: string;
    byteSize: number;
  };
};

export type AiProviderRunMetadata = {
  provider: "mock" | "gemini" | "openai" | "vertex-ai";
  model: string;
  promptVersion: string;
  schemaVersion: string;
  latencyMs?: number;
  inputTokenEstimate?: number;
  outputTokenEstimate?: number;
  estimatedCostUsd?: number;
  rawResponse?: unknown;
};

export type AnalyzeMealImageResult = {
  analysis: AnalyzeScanResponseContract;
  providerRun: AiProviderRunMetadata;
};

export interface AiProvider {
  analyzeMealImage(input: AnalyzeMealImageInput): Promise<AnalyzeMealImageResult>;
}

type AiProviderErrorOptions = ErrorOptions & {
  details?: Record<string, unknown>;
};

export class AiProviderError extends Error {
  public readonly details?: Record<string, unknown>;

  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode = 502,
    public readonly retryable = true,
    options?: AiProviderErrorOptions,
  ) {
    super(message, options);
    this.name = "AiProviderError";
    this.details = options?.details;
  }
}

export const createAiProvider = (config: ApiConfig, sql?: SqlClient): AiProvider => {
  switch (config.aiProvider) {
    case "gemini":
      return new GeminiAiProvider({
        apiKey: config.gemini.apiKey,
        model: config.gemini.model,
        endpoint: config.gemini.endpoint,
        timeoutMs: config.gemini.timeoutMs,
      });
    case "vertex":
      if (sql) {
        return new RuntimeVertexAiProvider(config.vertex, sql);
      }
      return new VertexAiProvider({
        project: config.vertex.project,
        location: config.vertex.location,
        model: config.vertex.model,
        credentialsJson: config.vertex.credentialsJson,
        credentialsJsonBase64: config.vertex.credentialsJsonBase64,
        timeoutMs: config.vertex.timeoutMs,
        maxOutputTokens: config.vertex.maxOutputTokens,
      });
    case "openai":
      throw new AiProviderError(
        "ai_provider_not_implemented",
        "OpenAI provider is not implemented yet.",
        501,
        false,
      );
    case "mock":
      return new MockAiProvider();
    default:
      throw new AiProviderError(
        "ai_provider_not_supported",
        "Configured AI provider is not supported.",
        500,
        false,
      );
  }
};
