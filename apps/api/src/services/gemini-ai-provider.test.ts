import { describe, expect, it } from "vitest";
import { AiProviderError } from "./ai-provider.js";
import { GeminiAiProvider } from "./gemini-ai-provider.js";

const buildProvider = (fetchFn: typeof fetch) =>
  new GeminiAiProvider({
    apiKey: "test-key",
    model: "gemini-test",
    endpoint: "https://example.test/v1beta",
    timeoutMs: 1_000,
    fetchFn,
  });

describe("GeminiAiProvider", () => {
  it("maps structured Gemini JSON into the DFit scan contract", async () => {
    let requestBody: unknown;
    const provider = buildProvider(async (_url, init) => {
      requestBody = JSON.parse(init?.body as string) as unknown;

      return new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [
                  {
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
                  },
                ],
              },
            },
          ],
          usageMetadata: {
            promptTokenCount: 100,
            candidatesTokenCount: 50,
          },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
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
    expect(result.analysis.items[0]).toMatchObject({
      name: "Dal",
      unit: "katori",
      estimatedGrams: 180,
    });
    expect(result.analysis.items[0]?.id).toEqual(expect.any(String));
    expect(result.providerRun).toMatchObject({
      provider: "gemini",
      model: "gemini-test",
      promptVersion: "gemini_food_photo_v3",
      inputTokenEstimate: 100,
      outputTokenEstimate: 50,
    });
    expect(requestBody).toMatchObject({
      generationConfig: {
        responseMimeType: "application/json",
      },
    });
    const prompt = (requestBody as { contents: Array<{ parts: Array<{ text?: string }> }> })
      .contents[0]?.parts[0]?.text;
    expect(prompt).toContain('User typed this optional plate hint: "dal rice roti"');
    expect(prompt).toContain("Analyze ONLY food items that are actually visible");
    expect(prompt).toContain("Do NOT invent, hallucinate, or assume food items");
    expect(prompt).toContain("plate geometry");
    expect(prompt).toContain("Count visible pieces/items individually");
    expect(prompt).toContain("return only the required JSON schema");
  });

  it("fails closed when the Gemini API key is missing", async () => {
    const provider = new GeminiAiProvider({
      model: "gemini-test",
      endpoint: "https://example.test/v1beta",
      timeoutMs: 1_000,
      fetchFn: (() => {
        throw new Error("fetch should not be called");
      }) as typeof fetch,
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
      code: "ai_provider_not_configured",
      statusCode: 503,
      retryable: false,
    });
  });
});
