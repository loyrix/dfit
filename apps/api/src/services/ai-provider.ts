import type { AnalyzeScanResponseContract } from "@logmyplate/contracts";
import type { ApiConfig } from "../config.js";
import type { SqlClient } from "../db/client.js";
import { GeminiAiProvider } from "./gemini-ai-provider.js";
import { MockAiProvider } from "./mock-ai-provider.js";
import { RuntimeGeminiAiProvider } from "./runtime-gemini-ai-provider.js";
import { RuntimeVertexAiProvider } from "./runtime-vertex-ai-provider.js";
import { VertexAiProvider } from "./vertex-ai-provider.js";

export type AnalyzeMealImageInput = {
  scanId: string;
  userHint?: string;
  promptKey?: string;
  locale?: string;
  region?: string;
  timezone?: string;
  /**
   * Goal and health focus, used only to shape the wording of optional advice.
   * Never used for any calculation: the Plate Score stays deterministic.
   */
  userProfile?: { goal?: string; healthFocus?: string[] };
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
  /**
   * Whether the call actually succeeded. Defaults to true when omitted so
   * existing success paths are unchanged; the failure path sets it false so
   * ai_provider_runs stops recording every run as a success.
   */
  success?: boolean;
  /** Provider error code, recorded only for failed runs. */
  errorCode?: string;
};

export type AnalyzeMealImageResult = {
  analysis: AnalyzeScanResponseContract;
  providerRun: AiProviderRunMetadata;
};

export interface AiProvider {
  analyzeMealImage(input: AnalyzeMealImageInput): Promise<AnalyzeMealImageResult>;
}

export type FailedRunMetadata = {
  provider: AiProviderRunMetadata["provider"];
  model: string;
  promptVersion: string;
  schemaVersion: string;
  latencyMs?: number;
  inputTokenEstimate?: number;
  outputTokenEstimate?: number;
};

type AiProviderErrorOptions = ErrorOptions & {
  details?: Record<string, unknown>;
  /**
   * Which model and prompt the failed call used, so the route can record the
   * run instead of losing it. Without this a failure leaves no row at all and
   * the dashboard reports a 100% success rate by construction.
   */
  run?: FailedRunMetadata;
};

export class AiProviderError extends Error {
  public readonly details?: Record<string, unknown>;
  public readonly run?: FailedRunMetadata;

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
    this.run = options?.run;
  }
}

export const createAiProvider = (config: ApiConfig, sql?: SqlClient): AiProvider => {
  switch (config.aiProvider) {
    case "gemini":
      if (sql) {
        return new RuntimeGeminiAiProvider(config.gemini, sql);
      }
      return new GeminiAiProvider({
        apiKey: config.gemini.apiKey,
        model: config.gemini.model,
        endpoint: config.gemini.endpoint,
        timeoutMs: config.gemini.timeoutMs,
        thinkingBudget: config.gemini.thinkingBudget,
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
