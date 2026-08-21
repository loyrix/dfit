import { GoogleGenAI } from "@google/genai";
import {
  ChatAiProviderError,
  type ChatAiProvider,
  type ChatGenerateInput,
  type ChatGenerateResult,
} from "./chat-ai-provider.js";
import { withChatRetries } from "./chat-retry.js";

export type VertexChatAiProviderOptions = {
  project: string;
  location: string;
  model: string;
  credentialsJson?: string;
  credentialsJsonBase64?: string;
  timeoutMs: number;
  sleepFn?: (ms: number) => Promise<void>;
};

export class VertexChatAiProvider implements ChatAiProvider {
  private client?: GoogleGenAI;

  constructor(private readonly options: VertexChatAiProviderOptions) {
    const rawJson = this.options.credentialsJson?.trim()
      ? this.options.credentialsJson
      : this.options.credentialsJsonBase64?.trim()
        ? Buffer.from(this.options.credentialsJsonBase64, "base64").toString("utf8")
        : undefined;

    if (rawJson) {
      this.client = new GoogleGenAI({
        vertexai: true,
        project: this.options.project,
        location: this.options.location,
        apiVersion: "v1",
        googleAuthOptions: {
          credentials: JSON.parse(rawJson),
          scopes: ["https://www.googleapis.com/auth/cloud-platform"],
        },
      });
    }
  }

  async generateChatResponse(input: ChatGenerateInput): Promise<ChatGenerateResult> {
    if (!this.client) {
      throw new ChatAiProviderError(
        "chat_ai_provider_not_configured",
        "Vertex AI credentials are not configured.",
        503,
        false,
      );
    }

    const start = Date.now();
    const model = `projects/${this.options.project}/locations/${this.options.location}/publishers/google/models/${this.options.model}`;

    const systemInstruction = input.messages.find((m) => m.role === "system")?.content;
    const chatMessages = input.messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "assistant" ? ("model" as const) : ("user" as const),
        parts: [{ text: m.content }],
      }));

    try {
      const response = await withChatRetries(
        (remainingMs) =>
          this.generateOnce(model, chatMessages, systemInstruction, input, remainingMs),
        { totalBudgetMs: this.options.timeoutMs, sleepFn: this.options.sleepFn },
      );

      const text = response.text ?? "";
      const usage = response.usageMetadata;

      return {
        content: text,
        inputTokens: usage?.promptTokenCount ?? undefined,
        outputTokens: usage?.candidatesTokenCount ?? undefined,
        latencyMs: Date.now() - start,
        finishReason: response.candidates?.[0]?.finishReason ?? undefined,
      };
    } catch (error) {
      if (error instanceof ChatAiProviderError) throw error;
      throw new ChatAiProviderError(
        "chat_ai_provider_error",
        error instanceof Error ? error.message : "Vertex AI chat request failed",
        502,
        true,
      );
    }
  }

  /** One attempt, aborted at `remainingMs` so the retry budget is never exceeded. */
  private async generateOnce(
    model: string,
    chatMessages: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }>,
    systemInstruction: string | undefined,
    input: ChatGenerateInput,
    remainingMs: number,
  ) {
    const client = this.client;
    if (!client) {
      throw new ChatAiProviderError(
        "chat_ai_provider_not_configured",
        "Vertex AI credentials are not configured.",
        503,
        false,
      );
    }

    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), remainingMs);

    try {
      return await client.models.generateContent({
        model,
        contents: chatMessages,
        config: {
          systemInstruction: systemInstruction
            ? { role: "system" as const, parts: [{ text: systemInstruction }] }
            : undefined,
          maxOutputTokens: input.maxOutputTokens,
          temperature: input.temperature,
          // Thinking is billed against maxOutputTokens; leaving it unset lets a
          // hard question spend the whole budget on thoughts and return nothing.
          ...(input.thinkingBudget === undefined
            ? {}
            : { thinkingConfig: { thinkingBudget: input.thinkingBudget } }),
          abortSignal: abortController.signal,
        },
      });
    } finally {
      clearTimeout(timeout);
    }
  }
}
