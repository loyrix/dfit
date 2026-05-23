import { GoogleGenAI, type GenerateContentResponse } from "@google/genai";
import { z } from "zod";
import {
  AiProviderError,
  type AiProvider,
  type AnalyzeMealImageInput,
  type AnalyzeMealImageResult,
} from "./ai-provider.js";
import {
  buildFoodPhotoPrompt,
  foodPhotoPromptVersion,
  foodPhotoResponseSchema,
  foodPhotoSchemaVersion,
  mapFoodPhotoAnalysisToScan,
  parseFoodPhotoAnalysisText,
} from "./gemini-ai-provider.js";

type VertexAiProviderOptions = {
  project: string;
  location: string;
  model: string;
  credentialsJson?: string;
  credentialsJsonBase64?: string;
  timeoutMs: number;
  maxOutputTokens: number;
  client?: VertexGenerateClient;
  sleepFn?: (ms: number) => Promise<void>;
};

type VertexGenerateClient = {
  models: {
    generateContent: (params: VertexGenerateContentParams) => Promise<VertexGenerateResponse>;
  };
};

type VertexGenerateContentParams = {
  model: string;
  contents: Array<{
    role: "user";
    parts: Array<
      | { text: string }
      | {
          inlineData: {
            mimeType: string;
            data: string;
          };
        }
    >;
  }>;
  config: {
    abortSignal: AbortSignal;
    temperature: number;
    topP: number;
    candidateCount: number;
    maxOutputTokens: number;
    responseMimeType: "application/json";
    responseSchema: unknown;
    thinkingConfig?: {
      thinkingBudget: number;
    };
  };
};

type VertexGenerateResponse = Pick<GenerateContentResponse, "text" | "usageMetadata">;

const retryDelaysMs = [1_000, 2_000, 4_000] as const;

export class VertexAiProvider implements AiProvider {
  private client?: VertexGenerateClient;
  private readonly sleepFn: (ms: number) => Promise<void>;

  constructor(private readonly options: VertexAiProviderOptions) {
    this.client = options.client;
    this.sleepFn = options.sleepFn ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
  }

  async analyzeMealImage(input: AnalyzeMealImageInput): Promise<AnalyzeMealImageResult> {
    if (!input.image) {
      throw new AiProviderError(
        "invalid_scan_image",
        "A food photo is required for Vertex AI analysis.",
        400,
        false,
      );
    }

    const startedAt = Date.now();

    try {
      const response = await this.generateWithRetries({
        model: this.options.model,
        contents: [
          {
            role: "user",
            parts: [
              { text: buildFoodPhotoPrompt(input.userHint) },
              {
                inlineData: {
                  mimeType: input.image.mimeType,
                  data: input.image.base64,
                },
              },
            ],
          },
        ],
        config: {
          temperature: 0.1,
          topP: 0.8,
          candidateCount: 1,
          maxOutputTokens: this.options.maxOutputTokens,
          responseMimeType: "application/json",
          responseSchema: foodPhotoResponseSchema,
          ...thinkingConfigForModel(this.options.model),
        },
      });

      const text = response.text?.trim() ?? "";
      if (!text) {
        throw new AiProviderError(
          "ai_provider_empty_response",
          "Vertex AI returned an empty analysis.",
          502,
          true,
        );
      }

      let analysis;
      try {
        const vertexAnalysis = parseFoodPhotoAnalysisText(text);
        analysis = mapFoodPhotoAnalysisToScan(input.scanId, vertexAnalysis);
      } catch (error) {
        if (error instanceof z.ZodError || error instanceof SyntaxError) {
          throw new AiProviderError(
            "ai_provider_invalid_response",
            "Vertex AI returned food analysis that did not match the LogMyPlate schema.",
            502,
            true,
            {
              cause: error,
              details: {
                rawTextPreview: previewText(text),
                issues: error instanceof z.ZodError ? error.issues : undefined,
              },
            },
          );
        }
        throw error;
      }

      return {
        analysis,
        providerRun: {
          provider: "vertex-ai",
          model: this.options.model,
          promptVersion: foodPhotoPromptVersion,
          schemaVersion: foodPhotoSchemaVersion,
          latencyMs: Date.now() - startedAt,
          inputTokenEstimate: response.usageMetadata?.promptTokenCount,
          outputTokenEstimate: response.usageMetadata?.candidatesTokenCount,
          rawResponse: response,
        },
      };
    } catch (error) {
      if (error instanceof AiProviderError) throw error;
      if (error instanceof z.ZodError || error instanceof SyntaxError) {
        throw new AiProviderError(
          "ai_provider_invalid_response",
          "Vertex AI returned food analysis that did not match the LogMyPlate schema.",
          502,
          true,
        );
      }
      if (error instanceof Error && error.name === "AbortError") {
        throw new AiProviderError(
          "ai_provider_timeout",
          "Vertex AI analysis timed out.",
          504,
          true,
          { cause: error },
        );
      }
      const upstreamError = toVertexUpstreamProviderError(error);
      if (upstreamError) throw upstreamError;
      throw new AiProviderError("ai_provider_failed", "Vertex AI analysis failed.", 502, true, {
        cause: error,
      });
    }
  }

  private async generateWithRetries(
    params: Omit<VertexGenerateContentParams, "config"> & {
      config: Omit<VertexGenerateContentParams["config"], "abortSignal">;
    },
  ) {
    for (let attempt = 0; attempt <= retryDelaysMs.length; attempt += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.options.timeoutMs);

      try {
        return await this.getClient().models.generateContent({
          ...params,
          config: {
            ...params.config,
            abortSignal: controller.signal,
          },
        });
      } catch (error) {
        if (attempt >= retryDelaysMs.length || !isRetryableVertexError(error)) {
          throw error;
        }

        await this.sleepFn(retryDelaysMs[attempt]);
      } finally {
        clearTimeout(timeout);
      }
    }

    throw new AiProviderError("ai_provider_failed", "Vertex AI analysis failed.", 502, true);
  }

  private getClient(): VertexGenerateClient {
    if (this.client) return this.client;

    const client = new GoogleGenAI({
      vertexai: true,
      project: this.options.project,
      location: this.options.location,
      apiVersion: "v1",
      googleAuthOptions: {
        credentials: parseServiceAccountCredentials(this.options),
        scopes: ["https://www.googleapis.com/auth/cloud-platform"],
      },
    }) as VertexGenerateClient;

    this.client = client;
    return client;
  }
}

const parseServiceAccountCredentials = (options: VertexAiProviderOptions) => {
  const rawJson = options.credentialsJson?.trim()
    ? options.credentialsJson
    : options.credentialsJsonBase64?.trim()
      ? Buffer.from(options.credentialsJsonBase64, "base64").toString("utf8")
      : undefined;

  if (!rawJson) {
    throw new AiProviderError(
      "ai_provider_not_configured",
      "GOOGLE_APPLICATION_CREDENTIALS_JSON_BASE64 is required when AI_PROVIDER=vertex.",
      503,
      false,
    );
  }

  let credentials: {
    client_email?: string;
    private_key?: string;
  };
  try {
    credentials = JSON.parse(rawJson) as typeof credentials;
  } catch (error) {
    throw new AiProviderError(
      "ai_provider_not_configured",
      "Vertex AI service account credentials JSON is invalid.",
      503,
      false,
      { cause: error },
    );
  }

  if (!credentials.client_email || !credentials.private_key) {
    throw new AiProviderError(
      "ai_provider_not_configured",
      "Vertex AI service account credentials must include client_email and private_key.",
      503,
      false,
    );
  }

  return credentials;
};

const isRetryableVertexError = (error: unknown) => {
  const status = readStatusCode(error);
  if (status !== undefined) return isRetryableVertexStatus(status);

  if (error instanceof Error) {
    return ["ECONNRESET", "ETIMEDOUT", "ENOTFOUND", "EAI_AGAIN"].some((code) =>
      error.message.includes(code),
    );
  }

  return false;
};

const isRetryableVertexStatus = (status: number) =>
  status >= 500 || status === 408 || status === 429;

const toVertexUpstreamProviderError = (error: unknown) => {
  const status = readStatusCode(error);
  if (status === undefined) return undefined;

  return new AiProviderError(
    readErrorCode(error) ?? "ai_provider_http_error",
    "Vertex AI analysis failed.",
    status >= 400 && status < 500 ? 502 : status,
    isRetryableVertexStatus(status),
    {
      cause: error,
      details: {
        upstreamStatus: status,
        upstreamMessage: readErrorMessage(error),
      },
    },
  );
};

const thinkingConfigForModel = (model: string) =>
  model.includes("gemini-2.5-") ? { thinkingConfig: { thinkingBudget: 0 } } : {};

const previewText = (text: string) => text.slice(0, 2_000);

const readStatusCode = (error: unknown) => {
  if (!error || typeof error !== "object") return undefined;
  const candidate = error as {
    status?: unknown;
    statusCode?: unknown;
    code?: unknown;
  };

  for (const value of [candidate.status, candidate.statusCode, candidate.code]) {
    if (typeof value === "number") return value;
  }

  return undefined;
};

const readErrorCode = (error: unknown) => {
  if (!error || typeof error !== "object") return undefined;
  const candidate = error as {
    code?: unknown;
    status?: unknown;
    error?: {
      code?: unknown;
      status?: unknown;
    };
  };

  for (const value of [
    candidate.error?.status,
    candidate.error?.code,
    candidate.status,
    candidate.code,
  ]) {
    if (typeof value === "string") return value;
  }

  return undefined;
};

const readErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  if (!error || typeof error !== "object") return undefined;
  const candidate = error as {
    message?: unknown;
    error?: {
      message?: unknown;
    };
  };

  for (const value of [candidate.error?.message, candidate.message]) {
    if (typeof value === "string") return value;
  }

  return undefined;
};
