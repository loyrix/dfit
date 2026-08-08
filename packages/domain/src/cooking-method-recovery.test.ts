import { describe, expect, it } from "vitest";
import { dominantCookingMethod, recoverCookingMethods } from "./cooking-method-recovery.js";

describe("recoverCookingMethods", () => {
  it("matches on normalised name", () => {
    const recovered = recoverCookingMethods(
      [{ name: "Fried Rice", cookingMethod: "fried" }],
      ["fried rice"],
    );
    expect(recovered).toEqual(["fried"]);
  });

  it("returns undefined for an item the analysis never saw", () => {
    const recovered = recoverCookingMethods(
      [{ name: "rice", cookingMethod: "steamed" }],
      ["grilled chicken"],
    );
    expect(recovered).toEqual([undefined]);
  });

  it("drops unknown rather than storing it", () => {
    // The prompt asks for `unknown` when the technique is unclear, and its
    // modifier is zero. Storing it would make "unsure" indistinguishable from
    // "an older prompt never asked".
    const recovered = recoverCookingMethods([{ name: "soup", cookingMethod: "unknown" }], ["soup"]);
    expect(recovered).toEqual([undefined]);
  });

  it("returns undefined for an analysis that predates v9", () => {
    const recovered = recoverCookingMethods([{ name: "soup" }], ["soup"]);
    expect(recovered).toEqual([undefined]);
  });

  it("does not reuse one analysed item for two confirmed ones", () => {
    const recovered = recoverCookingMethods(
      [
        { name: "egg", cookingMethod: "fried" },
        { name: "egg", cookingMethod: "boiled" as never },
      ],
      ["egg", "egg"],
    );
    expect(recovered[0]).toBe("fried");
    // The second claims the second analysed entry, not the first again.
    expect(recovered[1]).not.toBe("fried");
  });

  it("aligns by index when the user removed an item", () => {
    const recovered = recoverCookingMethods(
      [
        { name: "rice", cookingMethod: "steamed" },
        { name: "chicken", cookingMethod: "grilled" },
      ],
      ["chicken"],
    );
    expect(recovered).toEqual(["grilled"]);
  });
});

describe("dominantCookingMethod", () => {
  it("returns undefined when nothing was recovered", () => {
    expect(dominantCookingMethod([{ grams: 100 }, { grams: 50 }])).toBeUndefined();
  });

  it("weights by grams, so the main dish wins over a side", () => {
    const method = dominantCookingMethod([
      { cookingMethod: "steamed", grams: 30 },
      { cookingMethod: "fried", grams: 250 },
    ]);
    expect(method).toBe("fried");
  });

  it("sums repeated methods rather than taking the largest single item", () => {
    const method = dominantCookingMethod([
      { cookingMethod: "grilled", grams: 90 },
      { cookingMethod: "grilled", grams: 90 },
      { cookingMethod: "fried", grams: 150 },
    ]);
    expect(method).toBe("grilled");
  });

  it("still counts an item with no recorded grams", () => {
    expect(dominantCookingMethod([{ cookingMethod: "raw" }])).toBe("raw");
  });

  it("ignores items with no method", () => {
    const method = dominantCookingMethod([
      { cookingMethod: undefined, grams: 500 },
      { cookingMethod: "baked", grams: 40 },
    ]);
    expect(method).toBe("baked");
  });
});
