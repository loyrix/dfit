import type { ApiConfig } from "../config.js";
import { GeminiChatAiProvider } from "./gemini-chat-ai-provider.js";
import { MockChatAiProvider } from "./mock-chat-ai-provider.js";
import { VertexChatAiProvider } from "./vertex-chat-ai-provider.js";

export type ChatGenerateInput = {
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  maxOutputTokens: number;
  temperature: number;
  /**
   * Gemini 2.5 thinking budget, in tokens. Thinking is billed against
   * `maxOutputTokens`, so leaving this unset (dynamic thinking) lets a single
   * hard question spend the entire budget on reasoning and return no visible
   * answer at all. Chat therefore caps it: -1 dynamic, 0 off, positive = cap.
   */
  thinkingBudget?: number;
};

export type ChatGenerateResult = {
  content: string;
  inputTokens?: number;
  outputTokens?: number;
  latencyMs: number;
  /**
   * Raw provider finish reason (e.g. "STOP", "MAX_TOKENS", "SAFETY"). Logged by
   * the route so a truncated or empty generation is visible in the logs instead
   * of silently becoming a fallback message.
   */
  finishReason?: string;
};

export interface ChatAiProvider {
  generateChatResponse(input: ChatGenerateInput): Promise<ChatGenerateResult>;
}

export class ChatAiProviderError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode = 502,
    public readonly retryable = true,
  ) {
    super(message);
    this.name = "ChatAiProviderError";
  }
}

export const createChatAiProvider = (config: ApiConfig): ChatAiProvider => {
  switch (config.aiProvider) {
    case "gemini":
      return new GeminiChatAiProvider({
        apiKey: config.gemini.apiKey,
        model: config.gemini.model,
        endpoint: config.gemini.endpoint,
        timeoutMs: config.gemini.timeoutMs,
      });
    case "vertex":
      return new VertexChatAiProvider({
        project: config.vertex.project,
        location: config.vertex.location,
        model: config.vertex.model,
        credentialsJson: config.vertex.credentialsJson,
        credentialsJsonBase64: config.vertex.credentialsJsonBase64,
        timeoutMs: config.vertex.timeoutMs,
      });
    case "openai":
      throw new ChatAiProviderError(
        "ai_provider_not_implemented",
        "OpenAI chat provider is not implemented yet.",
        501,
        false,
      );
    case "mock":
      return new MockChatAiProvider();
    default:
      throw new ChatAiProviderError(
        "ai_provider_not_supported",
        "Configured AI provider is not supported.",
        500,
        false,
      );
  }
};
