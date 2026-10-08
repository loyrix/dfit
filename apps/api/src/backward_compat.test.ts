import { describe, expect, it } from "vitest";
import { buildApp, type BuildAppOptions } from "./app.js";
import { InMemoryStore } from "./repositories/in-memory-store.js";
import { MockBarcodeFoodProvider } from "./services/barcode-food-provider.js";
import { DisabledMealImageStorage as DisabledStorage } from "./services/meal-image-storage.js";
import type { FoodRecord } from "@logmyplate/domain";

const testApp = (options: BuildAppOptions = {}) =>
  buildApp({
    repository: options.repository ?? new InMemoryStore(),
    mealImageStorage: options.mealImageStorage ?? new DisabledStorage(),
    ...options,
  });

describe("Backward Compatibility Verification", () => {
  it("preserves food records and searches without barcode", async () => {
    const store = new InMemoryStore();
    const barcodeProvider = new MockBarcodeFoodProvider();
    const app = await testApp({
      repository: store,
      barcodeFoodProvider: barcodeProvider,
    });

    // 1. Food without barcode (simulating existing database rows from seedFoods)
    const existingFoods = await store.searchFoods("dal");
    expect(existingFoods.length).toBeGreaterThan(0);
    expect(existingFoods[0].barcode).toBeUndefined();

    // Verify lookup by barcode on a food without barcode returns undefined
    const notFoundBarcode = await store.findFoodByBarcode("12345678");
    expect(notFoundBarcode).toBeUndefined();

    // 2. Barcode food saved alongside existing foods
    const barcodeFood: FoodRecord = {
      id: "food_barcode_cereal",
      canonicalName: "Cheerios",
      region: "GLOBAL",
      source: "open_food_facts",
      barcode: "016000275270",
      aliases: ["cheerios", "cereal"],
      portions: [
        {
          unit: "serving",
          grams: 39,
          confidence: 0.9,
        },
      ],
      nutritionPer100g: {
        calories: 380,
        proteinG: 12.0,
        carbsG: 75.0,
        fatG: 6.0,
      },
    };

    await store.saveFoodWithBarcode(barcodeFood);

    // Verify barcode lookup succeeds
    const foundBarcode = await store.findFoodByBarcode("016000275270");
    expect(foundBarcode).toBeDefined();
    expect(foundBarcode?.canonicalName).toBe("Cheerios");

    // 3. Search foods finds both legacy and barcode foods seamlessly
    const cheeriosResults = await store.searchFoods("cheerios");
    expect(cheeriosResults.some((f) => f.id === "food_barcode_cereal")).toBe(true);

    await app.close();
  });

  it("handles legacy scan prepare, photo analyze, and meal confirm without barcode", async () => {
    const store = new InMemoryStore();
    const barcodeProvider = new MockBarcodeFoodProvider();
    const app = await testApp({
      repository: store,
      barcodeFoodProvider: barcodeProvider,
    });

    const headers = {
      "idempotency-key": "legacy-prepare-1",
    };

    // 1. Prepare scan
    const prepareRes = await app.inject({
      method: "POST",
      url: "/v1/scans/prepare",
      headers,
    });

    expect(prepareRes.statusCode).toBe(201);
    const prepareData = prepareRes.json();
    const scanId = prepareData.scanId;
    expect(scanId).toBeDefined();

    // 2. Analyze photo (legacy endpoint /v1/scans/:id/analyze)
    const imageBytes = Buffer.from("plate-image");
    const analyzeRes = await app.inject({
      method: "POST",
      url: `/v1/scans/${scanId}/analyze`,
      headers: {
        "idempotency-key": "legacy-analyze-1",
      },
      payload: {
        hint: "dal rice",
        image: {
          mimeType: "image/jpeg",
          base64: imageBytes.toString("base64"),
          byteSize: imageBytes.byteLength,
        },
      },
    });

    expect(analyzeRes.statusCode).toBe(200);
    const analyzeData = analyzeRes.json();
    expect(analyzeData.status).toBe("ready_for_review");
    expect(analyzeData.items.length).toBeGreaterThan(0);

    // 3. Confirm meal with photo analysis result
    const confirmRes = await app.inject({
      method: "POST",
      url: `/v1/scans/${scanId}/confirm`,
      headers: {
        "idempotency-key": "legacy-confirm-1",
      },
      payload: {
        mealType: "dinner",
        title: "Dal Rice",
        items: analyzeData.items.map((item: any) => ({
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          estimatedGrams: item.estimatedGrams,
          nutrition: item.nutrition,
        })),
      },
    });

    expect(confirmRes.statusCode).toBe(201);
    const confirmData = confirmRes.json();
    expect(confirmData.mealId).toBeDefined();

    await app.close();
  });

  it("handles legacy manual meal logging and food search via API", async () => {
    const store = new InMemoryStore();
    const app = await testApp({ repository: store });

    // 1. Food search endpoint returns legacy food
    const searchRes = await app.inject({
      method: "GET",
      url: "/v1/foods?q=dal",
    });
    expect(searchRes.statusCode).toBe(200);
    const searchData = searchRes.json();
    expect(searchData.results.length).toBeGreaterThan(0);
    expect(searchData.results[0].canonicalName).toBe("Dal");

    // 2. Legacy manual meal creation (no barcode, no scanId)
    const mealRes = await app.inject({
      method: "POST",
      url: "/v1/meals",
      headers: {
        "idempotency-key": "manual-meal-1",
      },
      payload: {
        mealType: "lunch",
        title: "Home Cooked Dal",
        items: [
          {
            displayName: "Dal",
            quantity: 1,
            unit: "katori",
            grams: 180,
            nutrition: {
              calories: 180,
              proteinG: 10.8,
              carbsG: 25.2,
              fatG: 5.4,
            },
          },
        ],
      },
    });

    expect(mealRes.statusCode).toBe(201);
    const mealData = mealRes.json();
    expect(mealData.id).toBeDefined();
    expect(mealData.title).toBe("Home Cooked Dal");

    // 3. Retrieve manual meal by ID
    const getMealRes = await app.inject({
      method: "GET",
      url: `/v1/meals/${mealData.id}`,
    });
    expect(getMealRes.statusCode).toBe(200);
    expect(getMealRes.json().id).toBe(mealData.id);

    await app.close();
  });

  it("verifies scan credits are not deducted when barcode is rejected as non-food, and deducted when valid", async () => {
    const store = new InMemoryStore();
    const barcodeProvider = new MockBarcodeFoodProvider();
    const app = await testApp({
      repository: store,
      barcodeFoodProvider: barcodeProvider,
    });

    // Seed a valid food in mock provider
    barcodeProvider.setProduct("016000275270", {
      id: "food_cheerios",
      canonicalName: "Cheerios",
      region: "GLOBAL",
      source: "open_food_facts",
      barcode: "016000275270",
      aliases: ["cheerios"],
      portions: [{ unit: "serving", grams: 39, confidence: 0.9 }],
      nutritionPer100g: { calories: 380, proteinG: 12.0, carbsG: 75.0, fatG: 6.0 },
    });

    const initialQuota = await store.getQuota();
    const initialFreeRemaining = initialQuota.freeRemaining;

    // 1. Prepare scan for non-food barcode
    const prep1 = await app.inject({
      method: "POST",
      url: "/v1/scans/prepare",
      headers: { "idempotency-key": "prep-non-food" },
    });
    const scanId1 = prep1.json().scanId;

    // Scan an unknown / non-food barcode
    const nonFoodRes = await app.inject({
      method: "POST",
      url: `/v1/scans/${scanId1}/barcode`,
      headers: { "idempotency-key": "scan-non-food" },
      payload: { barcode: "000000000000" },
    });
    expect(nonFoodRes.statusCode).toBe(422);
    expect(nonFoodRes.json().error).toBe("no_food_detected");

    // Quota MUST NOT be deducted
    const quotaAfterFailed = await store.getQuota();
    expect(quotaAfterFailed.freeRemaining).toBe(initialFreeRemaining);

    // 2. Prepare scan for valid food barcode
    const prep2 = await app.inject({
      method: "POST",
      url: "/v1/scans/prepare",
      headers: { "idempotency-key": "prep-valid-food" },
    });
    const scanId2 = prep2.json().scanId;

    const validFoodRes = await app.inject({
      method: "POST",
      url: `/v1/scans/${scanId2}/barcode`,
      headers: { "idempotency-key": "scan-valid-food" },
      payload: { barcode: "016000275270" },
    });
    expect(validFoodRes.statusCode).toBe(200);
    expect(validFoodRes.json().status).toBe("ready_for_review");
    expect(validFoodRes.json().mealName).toBe("Cheerios");

    // Quota MUST be deducted by exactly 1
    const quotaAfterSuccess = await store.getQuota();
    expect(quotaAfterSuccess.freeRemaining).toBe(initialFreeRemaining - 1);

    await app.close();
  });
});
