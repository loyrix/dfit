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

  it("retries a transient 5xx and returns the successful attempt", async () => {
    let attempts = 0;
    const provider = new GeminiChatAiProvider({
      apiKey: "test-key",
      model: "gemini-test",
      endpoint: "https://example.test/v1beta",
      timeoutMs: 5_000,
      sleepFn: async () => {},
      fetchFn: async () => {
        attempts += 1;
        if (attempts === 1) return new Response("upstream busy", { status: 503 });
        return geminiResponse({
          candidates: [{ content: { parts: [{ text: "recovered" }] }, finishReason: "STOP" }],
        });
      },
    });

    const result = await provider.generateChatResponse({
      messages: [{ role: "user", content: "How's my protein?" }],
      maxOutputTokens: 3_072,
      temperature: 0.7,
    });

    expect(attempts).toBe(2);
    expect(result.content).toBe("recovered");
  });

  it("does not retry a 4xx — a bad request will fail identically every time", async () => {
    let attempts = 0;
    const provider = new GeminiChatAiProvider({
      apiKey: "test-key",
      model: "gemini-test",
      endpoint: "https://example.test/v1beta",
      timeoutMs: 5_000,
      sleepFn: async () => {},
      fetchFn: async () => {
        attempts += 1;
        return new Response("bad request", { status: 400 });
      },
    });

    await expect(
      provider.generateChatResponse({
        messages: [{ role: "user", content: "How's my protein?" }],
        maxOutputTokens: 3_072,
        temperature: 0.7,
      }),
    ).rejects.toThrow();
    expect(attempts).toBe(1);
  });

  it("gives up once the shared budget is spent instead of retrying forever", async () => {
    let attempts = 0;
    const provider = new GeminiChatAiProvider({
      apiKey: "test-key",
      model: "gemini-test",
      endpoint: "https://example.test/v1beta",
      // Budget smaller than the first backoff, so no retry can be afforded.
      timeoutMs: 100,
      sleepFn: async () => {},
      fetchFn: async () => {
        attempts += 1;
        return new Response("upstream busy", { status: 503 });
      },
    });

    await expect(
      provider.generateChatResponse({
        messages: [{ role: "user", content: "How's my protein?" }],
        maxOutputTokens: 3_072,
        temperature: 0.7,
      }),
    ).rejects.toThrow();
    expect(attempts).toBe(1);
  });

  it("stops after exhausting the configured backoff steps", async () => {
    let attempts = 0;
    const provider = new GeminiChatAiProvider({
      apiKey: "test-key",
      model: "gemini-test",
      endpoint: "https://example.test/v1beta",
      timeoutMs: 30_000,
      sleepFn: async () => {},
      fetchFn: async () => {
        attempts += 1;
        return new Response("upstream busy", { status: 503 });
      },
    });

    await expect(
      provider.generateChatResponse({
        messages: [{ role: "user", content: "How's my protein?" }],
        maxOutputTokens: 3_072,
        temperature: 0.7,
      }),
    ).rejects.toThrow();
    // Two backoff delays are configured, so three attempts total.
    expect(attempts).toBe(3);
  });
});
