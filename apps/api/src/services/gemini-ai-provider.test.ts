import { describe, expect, it } from "vitest";
import { AiProviderError } from "./ai-provider.js";
import { buildFoodPhotoPrompt, GeminiAiProvider } from "./gemini-ai-provider.js";

const buildProvider = (fetchFn: typeof fetch) =>
  new GeminiAiProvider({
    apiKey: "test-key",
    model: "gemini-test",
    endpoint: "https://example.test/v1beta",
    timeoutMs: 1_000,
    fetchFn,
  });

describe("GeminiAiProvider", () => {
  it("maps structured Gemini JSON into the LogMyPlate scan contract", async () => {
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
      promptVersion: "gemini_food_photo_v5",
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
    expect(prompt).toContain('User typed this plate note: "dal rice roti"');
    expect(prompt).toContain("Analyze ONLY food items that are actually visible");
    expect(prompt).toContain("Do NOT invent, hallucinate, or assume food items");
    expect(prompt).toContain('return mealName "No food detected" and items []');
    expect(prompt).toContain("Reject screenshots, people, pets, documents");
    expect(prompt).toContain("Use the user's locale and plate context only");
    expect(prompt).toContain("plate geometry");
    expect(prompt).toContain("Count visible pieces/items individually");
    expect(prompt).toContain("return only the required JSON schema");
  });

  it("keeps the default prompt cuisine-neutral so non-India regions are not skewed", async () => {
    const prompt = buildFoodPhotoPrompt();

    // India-specific guidance belongs to the food_photo_IN prompt only. The
    // default backs the base key, which serves users whose region is unknown.
    expect(prompt).not.toContain("Indian");
    expect(prompt).not.toContain("Hinglish");
    expect(prompt).not.toContain("Solkadhi");
    expect(prompt).toContain("cuisine-neutral and globally aware");
  });

  it("tells the model to estimate real portions rather than shrink them", async () => {
    const prompt = buildFoodPhotoPrompt();

    expect(prompt).toContain("Never cap, clamp");
    expect(prompt).toContain("Bulk and shared quantities are valid");
    // A packet of biscuits must be loggable; v5 wrongly rejected packaging-only photos.
    expect(prompt).toContain("Packaged and labelled food IS valid food");
  });

  it("asks for micronutrients only when confident, never as a guessed zero", async () => {
    const prompt = buildFoodPhotoPrompt();

    expect(prompt).toContain("Omit a field entirely rather than guessing or");
    expect(prompt).toContain("(4 x proteinG) + (4 x carbsG) + (9 x fatG)");
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
