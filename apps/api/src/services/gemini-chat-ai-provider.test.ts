import { describe, expect, it } from "vitest";
import { GeminiChatAiProvider } from "./gemini-chat-ai-provider.js";

const buildProvider = (fetchFn: typeof fetch) =>
  new GeminiChatAiProvider({
    apiKey: "test-key",
    model: "gemini-test",
    endpoint: "https://example.test/v1beta",
    timeoutMs: 1_000,
    fetchFn,
  });

const geminiResponse = (body: unknown) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });

describe("GeminiChatAiProvider", () => {
  it("forwards the thinking budget so reasoning cannot consume the whole output allowance", async () => {
    let requestBody: { generationConfig?: Record<string, unknown> } = {};
    const provider = buildProvider(async (_url, init) => {
      requestBody = JSON.parse(init?.body as string);
      return geminiResponse({
        candidates: [{ content: { parts: [{ text: "ok" }] }, finishReason: "STOP" }],
      });
    });

    await provider.generateChatResponse({
      messages: [{ role: "user", content: "How's my protein?" }],
      maxOutputTokens: 3_072,
      temperature: 0.7,
      thinkingBudget: 512,
    });

    expect(requestBody.generationConfig?.thinkingConfig).toEqual({ thinkingBudget: 512 });
    expect(requestBody.generationConfig?.maxOutputTokens).toBe(3_072);
  });

  it("omits thinkingConfig entirely when no budget is supplied", async () => {
    let requestBody: { generationConfig?: Record<string, unknown> } = {};
    const provider = buildProvider(async (_url, init) => {
      requestBody = JSON.parse(init?.body as string);
      return geminiResponse({ candidates: [{ content: { parts: [{ text: "ok" }] } }] });
    });

    await provider.generateChatResponse({
      messages: [{ role: "user", content: "How's my protein?" }],
      maxOutputTokens: 3_072,
      temperature: 0.7,
    });

    expect(requestBody.generationConfig).not.toHaveProperty("thinkingConfig");
  });

  it("joins every text part instead of reading only the first", async () => {
    const provider = buildProvider(async () =>
      geminiResponse({
        candidates: [
          {
            content: { parts: [{ text: "First half. " }, { text: "Second half." }] },
            finishReason: "STOP",
          },
        ],
      }),
    );

    const result = await provider.generateChatResponse({
      messages: [{ role: "user", content: "How's my protein?" }],
      maxOutputTokens: 3_072,
      temperature: 0.7,
    });

    expect(result.content).toBe("First half. Second half.");
  });

  it("surfaces the finish reason when a truncated candidate carries no text", async () => {
    const provider = buildProvider(async () =>
      geminiResponse({
        candidates: [{ finishReason: "MAX_TOKENS" }],
        usageMetadata: { promptTokenCount: 964, thoughtsTokenCount: 1_024 },
      }),
    );

    const result = await provider.generateChatResponse({
      messages: [{ role: "user", content: "How do I plan my meals for weight loss?" }],
      maxOutputTokens: 1_024,
      temperature: 0.7,
    });

    expect(result.content).toBe("");
    expect(result.finishReason).toBe("MAX_TOKENS");
    expect(result.outputTokens).toBeUndefined();
  });
});
