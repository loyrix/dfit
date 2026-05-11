import { describe, expect, it } from "vitest";
import { buildApp } from "./app.js";
import { InMemoryStore } from "./repositories/in-memory-store.js";

const testApp = () => buildApp({ repository: new InMemoryStore() });

describe("DFit API", () => {
  it("serves health", async () => {
    const app = await testApp();
    const response = await app.inject({ method: "GET", url: "/health" });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ ok: true, service: "dfit-api" });
    await app.close();
  });

  it("requires idempotency for mutating endpoints", async () => {
    const app = await testApp();
    const response = await app.inject({ method: "POST", url: "/v1/scans/prepare" });
    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ error: "missing_idempotency_key" });
    await app.close();
  });

  it("prepares a scan when idempotency key is supplied", async () => {
    const app = await testApp();
    const response = await app.inject({
      method: "POST",
      url: "/v1/scans/prepare",
      headers: { "idempotency-key": "test-scan-prepare" },
    });
    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({ status: "prepared" });
    await app.close();
  });

  it("searches seeded Indian foods by Hinglish aliases", async () => {
    const app = await testApp();
    const response = await app.inject({ method: "GET", url: "/v1/foods?q=chawal" });
    expect(response.statusCode).toBe(200);
    expect(response.json().results[0]).toMatchObject({
      id: "food_cooked_rice",
      matchedAlias: "chawal",
    });
    await app.close();
  });

  it("analyzes, confirms, and returns the meal in today journal", async () => {
    const app = await testApp();
    const prepared = await app.inject({
      method: "POST",
      url: "/v1/scans/prepare",
      headers: { "idempotency-key": "flow-prepare" },
    });
    const scanId = prepared.json().scanId as string;

    const analyzed = await app.inject({
      method: "POST",
      url: `/v1/scans/${scanId}/analyze`,
      headers: { "idempotency-key": "flow-analyze" },
    });
    expect(analyzed.statusCode).toBe(200);
    expect(analyzed.json()).toMatchObject({ status: "ready_for_review", mealType: "lunch" });

    const analysis = analyzed.json();
    const confirmed = await app.inject({
      method: "POST",
      url: `/v1/scans/${scanId}/confirm`,
      headers: { "idempotency-key": "flow-confirm" },
      payload: {
        mealType: analysis.mealType,
        title: analysis.mealName,
        items: analysis.items.map(
          (item: {
            name: string;
            quantity: number;
            unit: string;
            estimatedGrams: number;
            nutrition: unknown;
          }) => ({
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
            estimatedGrams: item.estimatedGrams,
            nutrition: item.nutrition,
          }),
        ),
      },
    });
    expect(confirmed.statusCode).toBe(201);

    const today = await app.inject({ method: "GET", url: "/v1/journal/today" });
    expect(today.statusCode).toBe(200);
    expect(today.json().meals[0]).toMatchObject({
      id: confirmed.json().mealId,
      title: "Dal rice, roti and sabzi",
    });
    await app.close();
  });
});
