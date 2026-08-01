import { describe, expect, it } from "vitest";
import { mergeAnalysisMicronutrients, type MicronutrientItem } from "./micronutrient-merge.js";

const analyzed = (overrides: Partial<MicronutrientItem> = {}): MicronutrientItem => ({
  name: "Dal Tadka",
  grams: 150,
  nutrition: { fiberG: 6, sugarG: 2, sodiumMg: 400 },
  ...overrides,
});

const confirmed = (overrides: Partial<MicronutrientItem> = {}): MicronutrientItem => ({
  name: "Dal Tadka",
  grams: 150,
  nutrition: {},
  ...overrides,
});

describe("mergeAnalysisMicronutrients", () => {
  it("recovers micronutrients the client dropped", () => {
    const [merged] = mergeAnalysisMicronutrients([analyzed()], [confirmed()]);

    expect(merged?.nutrition).toEqual({ fiberG: 6, sugarG: 2, sodiumMg: 400 });
  });

  it("never overwrites a value the client supplied", () => {
    const withClientValue = confirmed({ nutrition: { fiberG: 99 } });
    const [merged] = mergeAnalysisMicronutrients([analyzed()], [withClientValue]);

    expect(merged?.nutrition.fiberG).toBe(99);
    expect(merged?.nutrition.sugarG).toBe(2);
  });

  it("scales recovered values when the user changed the portion", () => {
    const halved = confirmed({ grams: 75 });
    const [merged] = mergeAnalysisMicronutrients([analyzed()], [halved]);

    expect(merged?.nutrition).toEqual({ fiberG: 3, sugarG: 1, sodiumMg: 200 });
  });

  it("leaves unmatched items untouched", () => {
    const other = confirmed({ name: "Paneer Tikka" });
    const [merged] = mergeAnalysisMicronutrients([analyzed()], [other]);

    expect(merged?.nutrition).toEqual({});
  });

  it("omits nutrients the AI never returned instead of writing zero", () => {
    const partial = analyzed({ nutrition: { fiberG: 5 } });
    const [merged] = mergeAnalysisMicronutrients([partial], [confirmed()]);

    expect(merged?.nutrition.fiberG).toBe(5);
    expect(merged?.nutrition).not.toHaveProperty("sugarG");
    expect(merged?.nutrition).not.toHaveProperty("sodiumMg");
  });

  it("never invents values when the analysis had none", () => {
    const empty = analyzed({ nutrition: {} });
    const [merged] = mergeAnalysisMicronutrients([empty], [confirmed()]);

    expect(merged?.nutrition).toEqual({});
  });

  it("pairs duplicate names one-to-one", () => {
    const source = [
      analyzed({ name: "Roti", nutrition: { fiberG: 2 } }),
      analyzed({ name: "Roti", nutrition: { fiberG: 2 } }),
    ];
    const target = [confirmed({ name: "Roti" }), confirmed({ name: "Roti", grams: 300 })];
    const merged = mergeAnalysisMicronutrients(source, target);

    expect(merged[0]?.nutrition.fiberG).toBe(2);
    expect(merged[1]?.nutrition.fiberG).toBe(4);
  });

  it("matches names case-insensitively", () => {
    const [merged] = mergeAnalysisMicronutrients(
      [analyzed({ name: "Dal  Tadka" })],
      [confirmed({ name: "dal tadka" })],
    );

    expect(merged?.nutrition.fiberG).toBe(6);
  });

  it("does not scale when a portion change looks like a different food", () => {
    // 150g -> 6000g is a 40x jump; keep the AI's own values rather than multiply.
    const absurd = confirmed({ grams: 6_000 });
    const [merged] = mergeAnalysisMicronutrients([analyzed()], [absurd]);

    expect(merged?.nutrition.fiberG).toBe(6);
  });

  it("does not scale when either weight is missing", () => {
    const [merged] = mergeAnalysisMicronutrients(
      [analyzed({ grams: 0 })],
      [confirmed({ grams: 150 })],
    );

    expect(merged?.nutrition.fiberG).toBe(6);
  });

  it("preserves every other field on the confirmed item", () => {
    type Extended = MicronutrientItem & { quantity: number; unit: string };
    const item: Extended = {
      name: "Dal Tadka",
      grams: 150,
      quantity: 1,
      unit: "katori",
      nutrition: {},
    };
    const [merged] = mergeAnalysisMicronutrients([analyzed()], [item]);

    expect(merged?.quantity).toBe(1);
    expect(merged?.unit).toBe("katori");
  });

  it("returns the same number of items in the same order", () => {
    const source = [analyzed({ name: "A" }), analyzed({ name: "B" })];
    const target = [confirmed({ name: "B" }), confirmed({ name: "C" }), confirmed({ name: "A" })];
    const merged = mergeAnalysisMicronutrients(source, target);

    expect(merged.map((entry) => entry.name)).toEqual(["B", "C", "A"]);
  });
});
