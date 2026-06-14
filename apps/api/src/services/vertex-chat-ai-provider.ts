import { GoogleGenAI } from "@google/genai";
import {
  ChatAiProviderError,
  type ChatAiProvider,
  type ChatGenerateInput,
  type ChatGenerateResult,
} from "./chat-ai-provider.js";

export type VertexChatAiProviderOptions = {
  project: string;
  location: string;
  model: string;
  credentialsJson?: string;
  credentialsJsonBase64?: string;
  timeoutMs: number;
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

    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), this.options.timeoutMs);

    try {
      const response = await this.client.models.generateContent({
        model,
        contents: chatMessages,
        config: {
          systemInstruction: systemInstruction
            ? { role: "system" as const, parts: [{ text: systemInstruction }] }
            : undefined,
          maxOutputTokens: input.maxOutputTokens,
          temperature: input.temperature,
          abortSignal: abortController.signal,
        },
      });

      const text = response.text ?? "";
      const usage = response.usageMetadata;

      return {
        content: text,
        inputTokens: usage?.promptTokenCount ?? undefined,
        outputTokens: usage?.candidatesTokenCount ?? undefined,
        latencyMs: Date.now() - start,
      };
    } catch (error) {
      if (error instanceof ChatAiProviderError) throw error;
      throw new ChatAiProviderError(
        "chat_ai_provider_error",
        error instanceof Error ? error.message : "Vertex AI chat request failed",
        502,
        true,
      );
    } finally {
      clearTimeout(timeout);
    }
  }
}
