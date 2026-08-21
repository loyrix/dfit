import { describe, expect, it } from "vitest";
import { AiProviderError } from "./ai-provider.js";
import { VertexAiProvider } from "./vertex-ai-provider.js";

describe("VertexAiProvider", () => {
  it("maps structured Vertex AI JSON into the LogMyPlate scan contract", async () => {
    let requestBody: unknown;
    const provider = new VertexAiProvider({
      project: "logmyplate-ai",
      location: "asia-south1",
      model: "gemini-2.5-flash",
      credentialsJsonBase64: "unused-by-injected-client",
      timeoutMs: 1_000,
      maxOutputTokens: 3_072,
      client: {
        models: {
          generateContent: async (params) => {
            requestBody = params;
            return {
              text: JSON.stringify({
                mealType: "lunch",
                mealName: "Dal and rice",
                detectedLanguage: "en-IN",
                items: [
                  {
                    name: "Dal",
                    aliases: ["lentil curry"],
                    quantity: 1,
                    unit: "katori",
                    estimatedGrams: 180,
                    preparation: "home",
                    confidence: 0.86,
                    nutrition: {
                      calories: 180,
                      proteinG: 10,
                      carbsG: 25,
                      fatG: 5,
                    },
                  },
                ],
              }),
              usageMetadata: {
                promptTokenCount: 100,
                candidatesTokenCount: 50,
              },
            };
          },
        },
      },
    });

    const result = await provider.analyzeMealImage({
      scanId: "scan-test",
      userHint: "dal rice roti",
      image: {
        mimeType: "image/jpeg",
        base64: "AQID",
        byteSize: 3,
      },
    });

    expect(result.analysis).toMatchObject({
      scanId: "scan-test",
      status: "ready_for_review",
      mealType: "lunch",
      mealName: "Dal and rice",
      detectedLanguage: "en-IN",
      totals: {
        calories: 180,
        proteinG: 10,
        carbsG: 25,
        fatG: 5,
      },
    });
    expect(result.providerRun).toMatchObject({
      provider: "vertex-ai",
      model: "gemini-2.5-flash",
      promptVersion: "gemini_food_photo_v5",
      inputTokenEstimate: 100,
      outputTokenEstimate: 50,
    });
    expect(requestBody).toMatchObject({
      model: "gemini-2.5-flash",
      config: {
        responseMimeType: "application/json",
        maxOutputTokens: 3072,
        responseSchema: expect.any(Object),
        thinkingConfig: { thinkingBudget: 0 },
      },
    });
    const prompt = (requestBody as { contents: Array<{ parts: Array<{ text?: string }> }> })
      .contents[0]?.parts[0]?.text;
    expect(prompt).toContain('User typed this plate note: "dal rice roti"');
    expect(prompt).toContain("Analyze ONLY food items that are actually visible");
    expect(prompt).toContain("Bulk and shared quantities are valid");
    expect(prompt).toContain('return mealName "No food detected" and items []');
  });

  it("retries transient Vertex AI failures", async () => {
    let calls = 0;
    const provider = new VertexAiProvider({
      project: "logmyplate-ai",
      location: "asia-south1",
      model: "gemini-2.5-flash",
      credentialsJsonBase64: "unused-by-injected-client",
      timeoutMs: 1_000,
      maxOutputTokens: 3_072,
      sleepFn: async () => undefined,
      client: {
        models: {
          generateContent: async () => {
            calls += 1;
            if (calls === 1) {
              throw Object.assign(new Error("service unavailable"), { status: 503 });
            }
            return {
              text: JSON.stringify({
                mealType: "snack",
                mealName: "Apple",
                detectedLanguage: "en",
                items: [
                  {
                    name: "Apple",
                    aliases: [],
                    quantity: 1,
                    unit: "piece",
                    estimatedGrams: 120,
                    preparation: "unknown",
                    confidence: 0.9,
                    nutrition: {
                      calories: 80,
                      proteinG: 0,
                      carbsG: 21,
                      fatG: 0,
                    },
                  },
                ],
              }),
              usageMetadata: {},
            };
          },
        },
      },
    });

    await expect(
      provider.analyzeMealImage({
        scanId: "scan-test",
        image: {
          mimeType: "image/jpeg",
          base64: "AQID",
          byteSize: 3,
        },
      }),
    ).resolves.toMatchObject({
      analysis: {
        mealName: "Apple",
      },
    });
    expect(calls).toBe(2);
  });

  it("preserves Vertex AI upstream error details for logs", async () => {
    const upstreamError = Object.assign(new Error("permission denied for Vertex AI"), {
      status: 403,
      code: "PERMISSION_DENIED",
    });
    const provider = new VertexAiProvider({
      project: "logmyplate-ai",
      location: "asia-south1",
      model: "gemini-2.5-flash",
      credentialsJsonBase64: "unused-by-injected-client",
      timeoutMs: 1_000,
      maxOutputTokens: 3_072,
      client: {
        models: {
          generateContent: async () => {
            throw upstreamError;
          },
        },
      },
    });

    await expect(
      provider.analyzeMealImage({
        scanId: "scan-test",
        image: {
          mimeType: "image/jpeg",
          base64: "AQID",
          byteSize: 3,
        },
      }),
    ).rejects.toMatchObject({
      code: "PERMISSION_DENIED",
      statusCode: 502,
      retryable: false,
      cause: upstreamError,
      details: {
        upstreamStatus: 403,
        upstreamMessage: "permission denied for Vertex AI",
      },
    });
  });

  it("includes a raw response preview when Vertex AI returns invalid food JSON", async () => {
    const provider = new VertexAiProvider({
      project: "logmyplate-ai",
      location: "asia-south1",
      model: "gemini-2.5-flash",
      credentialsJsonBase64: "unused-by-injected-client",
      timeoutMs: 1_000,
      maxOutputTokens: 3_072,
      client: {
        models: {
          generateContent: async () => ({
            text: JSON.stringify({
              mealType: "brunch",
              mealName: "Food",
              detectedLanguage: "en",
              items: [],
            }),
            usageMetadata: {},
          }),
        },
      },
    });

    await expect(
      provider.analyzeMealImage({
        scanId: "scan-test",
        image: {
          mimeType: "image/jpeg",
          base64: "AQID",
          byteSize: 3,
        },
      }),
    ).rejects.toMatchObject({
      code: "ai_provider_invalid_response",
      details: {
        rawTextPreview: expect.stringContaining('"mealType":"brunch"'),
        issues: expect.any(Array),
      },
    });
  });

  const failingProvider = (generateContent: () => Promise<never>) =>
    new VertexAiProvider({
      project: "logmyplate-ai",
      location: "asia-south1",
      model: "gemini-2.5-flash",
      credentialsJsonBase64: "unused-by-injected-client",
      timeoutMs: 1_000,
      maxOutputTokens: 3_072,
      promptVersion: "food_photo_IN:gemini_food_photo_v9_india",
      sleepFn: async () => {},
      client: { models: { generateContent } },
    });

  const analyze = (provider: VertexAiProvider) =>
    provider.analyzeMealImage({
      scanId: "scan-1",
      image: { mimeType: "image/jpeg", base64: "aGVsbG8=", byteSize: 5 },
    });

  it("attaches the model and prompt version to a failure so the run can be recorded", async () => {
    const provider = failingProvider(async () => {
      throw Object.assign(new Error("upstream exploded"), { status: 500 });
    });

    const error = await analyze(provider).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(AiProviderError);
    const run = (error as AiProviderError).run;
    // Without this the scan route has nothing to write, and ai_provider_runs
    // keeps reporting a 100% success rate by construction.
    expect(run).toBeDefined();
    expect(run?.provider).toBe("vertex-ai");
    expect(run?.model).toBe("gemini-2.5-flash");
    expect(run?.promptVersion).toBe("food_photo_IN:gemini_food_photo_v9_india");
    expect(run?.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it("attaches run metadata to an empty-response failure too", async () => {
    const provider = failingProvider(async () => ({ text: "" }) as never);

    const error = await analyze(provider).catch((caught: unknown) => caught);

    expect((error as AiProviderError).code).toBe("ai_provider_empty_response");
    expect((error as AiProviderError).run?.model).toBe("gemini-2.5-flash");
  });

  it("attaches run metadata when the model returns off-schema JSON", async () => {
    const provider = failingProvider(async () => ({ text: '{"nope":true}' }) as never);

    const error = await analyze(provider).catch((caught: unknown) => caught);

    expect((error as AiProviderError).code).toBe("ai_provider_invalid_response");
    expect((error as AiProviderError).run?.promptVersion).toBe(
      "food_photo_IN:gemini_food_photo_v9_india",
    );
  });

  it("prices a successful run from its reported token usage", async () => {
    const provider = new VertexAiProvider({
      project: "logmyplate-ai",
      location: "asia-south1",
      model: "gemini-2.5-flash",
      credentialsJsonBase64: "unused-by-injected-client",
      timeoutMs: 1_000,
      maxOutputTokens: 3_072,
      client: {
        models: {
          generateContent: async () =>
            ({
              text: JSON.stringify({
                mealType: "lunch",
                mealName: "Dal",
                detectedLanguage: "en-IN",
                items: [
                  {
                    name: "Dal",
                    aliases: [],
                    quantity: 1,
                    unit: "katori",
                    estimatedGrams: 180,
                    preparation: "home",
                    confidence: 0.9,
                    nutrition: { calories: 180, proteinG: 10, carbsG: 25, fatG: 5 },
                  },
                ],
              }),
              usageMetadata: { promptTokenCount: 3_782, candidatesTokenCount: 345 },
            }) as never,
        },
      },
    });

    const result = await analyze(provider);

    expect(result.providerRun.success).toBe(true);
    expect(result.providerRun.estimatedCostUsd).toBeCloseTo(0.002, 4);
  });
});
