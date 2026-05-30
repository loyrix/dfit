import { describe, expect, it } from "vitest";
import {
  foodPhotoPromptKey,
  globalFoodPhotoPromptKey,
  indiaFoodPhotoPromptKey,
  resolveFoodPhotoPromptKey,
} from "./food-photo-prompt-routing.js";

describe("resolveFoodPhotoPromptKey", () => {
  it("uses the India prompt for Indian region or locale", () => {
    expect(resolveFoodPhotoPromptKey({ region: "IN", locale: "en-US" })).toBe(
      indiaFoodPhotoPromptKey,
    );
    expect(resolveFoodPhotoPromptKey({ locale: "hi-IN" })).toBe(indiaFoodPhotoPromptKey);
  });

  it("uses the global prompt for non-Indian regions", () => {
    expect(resolveFoodPhotoPromptKey({ region: "US", locale: "en-US" })).toBe(
      globalFoodPhotoPromptKey,
    );
    expect(resolveFoodPhotoPromptKey({ region: "GB" })).toBe(globalFoodPhotoPromptKey);
  });

  it("falls back to the legacy prompt when no locale signal exists", () => {
    expect(resolveFoodPhotoPromptKey({})).toBe(foodPhotoPromptKey);
  });
});
