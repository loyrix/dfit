import {
  ChatAiProviderError,
  type ChatAiProvider,
  type ChatGenerateInput,
  type ChatGenerateResult,
} from "./chat-ai-provider.js";
import { withChatRetries } from "./chat-retry.js";

type GeminiChatProviderOptions = {
  apiKey?: string;
  model: string;
  endpoint: string;
  timeoutMs: number;
  fetchFn?: typeof fetch;
  sleepFn?: (ms: number) => Promise<void>;
};

type GeminiGenerateContentResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
    finishReason?: string;
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    thoughtsTokenCount?: number;
    totalTokenCount?: number;
  };
  error?: {
    code?: number;
    message?: string;
    status?: string;
  };
};

export class GeminiChatAiProvider implements ChatAiProvider {
  private readonly fetchFn: typeof fetch;

  constructor(private readonly options: GeminiChatProviderOptions) {
    this.fetchFn = options.fetchFn ?? fetch;
  }

  async generateChatResponse(input: ChatGenerateInput): Promise<ChatGenerateResult> {
    const apiKey = this.options.apiKey;
    if (!apiKey) {
      throw new ChatAiProviderError(
        "chat_ai_provider_not_configured",
        "GEMINI_API_KEY is required when AI_PROVIDER=gemini.",
        503,
        false,
      );
    }

    const start = Date.now();

    const systemInstruction = input.messages.find((m) => m.role === "system")?.content;
    const chatMessages = input.messages.filter((m) => m.role !== "system");

    const geminiContents = chatMessages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const requestBody: Record<string, unknown> = {
      contents: geminiContents,
      generationConfig: {
        maxOutputTokens: input.maxOutputTokens,
        temperature: input.temperature,
        // Thinking is billed against maxOutputTokens; leaving it unset lets a
        // hard question spend the whole budget on thoughts and return nothing.
        ...(input.thinkingBudget === undefined
          ? {}
          : { thinkingConfig: { thinkingBudget: input.thinkingBudget } }),
      },
    };

    if (systemInstruction) {
      requestBody.systemInstruction = {
        role: "user",
        parts: [{ text: systemInstruction }],
      };
    }

    const url = `${this.options.endpoint}/models/${this.options.model}:generateContent`;

    try {
      const data = await withChatRetries(
        (remainingMs) => this.postOnce(url, apiKey, requestBody, remainingMs),
        { totalBudgetMs: this.options.timeoutMs, sleepFn: this.options.sleepFn },
      );

      const candidate = data.candidates?.[0];
      // Join every text part rather than reading parts[0] alone: a candidate can
      // legitimately be split across multiple parts.
      const text = (candidate?.content?.parts ?? []).map((part) => part.text ?? "").join("");
      const usage = data.usageMetadata;

      return {
        content: text,
        inputTokens: usage?.promptTokenCount ?? undefined,
        outputTokens: usage?.candidatesTokenCount ?? undefined,
        latencyMs: Date.now() - start,
        finishReason: candidate?.finishReason,
      };
    } catch (error) {
      if (error instanceof ChatAiProviderError) throw error;
      throw new ChatAiProviderError(
        "chat_ai_provider_error",
        error instanceof Error ? error.message : "Gemini chat request failed",
        502,
        true,
      );
    }
  }

  /** One HTTP attempt, aborted at `remainingMs` so the retry budget holds. */
  private async postOnce(
    url: string,
    apiKey: string,
    requestBody: Record<string, unknown>,
    remainingMs: number,
  ): Promise<GeminiGenerateContentResponse> {
    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), remainingMs);

    try {
      const response = await this.fetchFn(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify(requestBody),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        throw new ChatAiProviderError(
          "chat_ai_provider_error",
          `Gemini API returned ${response.status}: ${errorText}`,
          response.status >= 500 ? 502 : 400,
          response.status >= 500,
        );
      }

      const data = (await response.json()) as GeminiGenerateContentResponse;

      if (data.error) {
        throw new ChatAiProviderError(
          "chat_ai_provider_error",
          data.error.message ?? "Gemini API error",
          data.error.code ?? 502,
          (data.error.code ?? 500) >= 500,
        );
      }

      return data;
    } finally {
      clearTimeout(timeout);
    }
  }
}
