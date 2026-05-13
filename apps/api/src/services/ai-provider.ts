import type { AnalyzeScanResponseContract } from "@dfit/contracts";
import type { ApiConfig } from "../config.js";
import { GeminiAiProvider } from "./gemini-ai-provider.js";
import { MockAiProvider } from "./mock-ai-provider.js";

export type AnalyzeMealImageInput = {
  scanId: string;
  userHint?: string;
  image?: {
    mimeType: "image/jpeg" | "image/png" | "image/webp";
    base64: string;
    byteSize: number;
  };
};

export type AiProviderRunMetadata = {
  provider: "mock" | "gemini" | "openai";
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

export class AiProviderError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode = 502,
    public readonly retryable = true,
  ) {
    super(message);
    this.name = "AiProviderError";
  }
}

export const createAiProvider = (config: ApiConfig): AiProvider => {
  switch (config.aiProvider) {
    case "gemini":
      return new GeminiAiProvider({
        apiKey: config.gemini.apiKey,
        model: config.gemini.model,
        endpoint: config.gemini.endpoint,
        timeoutMs: config.gemini.timeoutMs,
      });
    case "openai":
      throw new AiProviderError(
        "ai_provider_not_implemented",
        "OpenAI provider is not implemented yet.",
        501,
        false,
      );
    case "mock":
    default:
      return new MockAiProvider();
  }
};
