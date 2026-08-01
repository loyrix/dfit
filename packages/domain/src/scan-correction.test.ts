import { describe, expect, it } from "vitest";
import { diffScanConfirmation, type ScanItemSnapshot } from "./scan-correction.js";

const item = (overrides: Partial<ScanItemSnapshot> = {}): ScanItemSnapshot => ({
  name: "Dal Tadka",
  quantity: 1,
  unit: "katori",
  grams: 150,
  calories: 180,
  ...overrides,
});

describe("diffScanConfirmation", () => {
  it("reports no changes when the user accepts the AI suggestion as-is", () => {
    const analyzed = [item(), item({ name: "Roti", quantity: 2, unit: "roti", grams: 80 })];
    const diff = diffScanConfirmation(analyzed, [...analyzed]);

    expect(diff.hasChanges).toBe(false);
    expect(diff.confirmedItemEdited).toEqual([false, false]);
    expect(diff.added).toHaveLength(0);
    expect(diff.removed).toHaveLength(0);
    expect(diff.changed).toHaveLength(0);
  });

  it("flags only the item whose portion the user corrected", () => {
    const analyzed = [item(), item({ name: "Roti", quantity: 3, unit: "roti", grams: 120 })];
    const confirmed = [item(), item({ name: "Roti", quantity: 2, unit: "roti", grams: 80 })];
    const diff = diffScanConfirmation(analyzed, confirmed);

    expect(diff.hasChanges).toBe(true);
    expect(diff.confirmedItemEdited).toEqual([false, true]);
    expect(diff.changed).toHaveLength(1);
    expect(diff.changed[0]?.fields).toEqual(["quantity", "grams"]);
  });

  it("treats an item the user deleted as removed", () => {
    const analyzed = [item(), item({ name: "Pickle", grams: 20, calories: 30 })];
    const diff = diffScanConfirmation(analyzed, [item()]);

    expect(diff.removed.map((entry) => entry.name)).toEqual(["Pickle"]);
    expect(diff.confirmedItemEdited).toEqual([false]);
  });

  it("treats an item the user added as added and edited", () => {
    const diff = diffScanConfirmation([item()], [item(), item({ name: "Curd", grams: 100 })]);

    expect(diff.added.map((entry) => entry.name)).toEqual(["Curd"]);
    expect(diff.confirmedItemEdited).toEqual([false, true]);
  });

  it("matches names case-insensitively and ignores extra whitespace", () => {
    const diff = diffScanConfirmation(
      [item({ name: "Dal  Tadka" })],
      [item({ name: "dal tadka" })],
    );

    expect(diff.hasChanges).toBe(false);
    expect(diff.confirmedItemEdited).toEqual([false]);
  });

  it("pairs duplicate names one-to-one instead of matching the same suggestion twice", () => {
    const analyzed = [item({ name: "Idli", quantity: 1 }), item({ name: "Idli", quantity: 1 })];
    const confirmed = [item({ name: "Idli", quantity: 1 }), item({ name: "Idli", quantity: 4 })];
    const diff = diffScanConfirmation(analyzed, confirmed);

    expect(diff.confirmedItemEdited).toEqual([false, true]);
    expect(diff.added).toHaveLength(0);
    expect(diff.removed).toHaveLength(0);
  });

  it("counts a rename as a removal plus an addition", () => {
    const diff = diffScanConfirmation([item({ name: "Raita" })], [item({ name: "Solkadhi" })]);

    expect(diff.added.map((entry) => entry.name)).toEqual(["Solkadhi"]);
    expect(diff.removed.map((entry) => entry.name)).toEqual(["Raita"]);
    expect(diff.confirmedItemEdited).toEqual([true]);
  });

  it("ignores floating point noise from JSON round-tripping", () => {
    const diff = diffScanConfirmation(
      [item({ grams: 150, calories: 180 })],
      [item({ grams: 150.0000001, calories: 180.2 })],
    );

    expect(diff.hasChanges).toBe(false);
  });

  it("handles an empty confirmation as every item removed", () => {
    const diff = diffScanConfirmation([item(), item({ name: "Roti" })], []);

    expect(diff.removed).toHaveLength(2);
    expect(diff.hasChanges).toBe(true);
    expect(diff.confirmedItemEdited).toEqual([]);
  });
});
