/**
 * Recovers the cooking method from the stored analysis at confirm time.
 *
 * The model returns `cookingMethod` per item from prompt v9 onward, but no app
 * build sends it back: `confirmScanRequest` carries name, portion and nutrition
 * only. Without this the field would be captured and then thrown away at the
 * confirm boundary, leaving the Part B and Part C cooking modifiers permanently
 * inert on every stored meal — the same failure the micronutrient recovery in
 * [[micronutrient-merge]] was written to fix.
 *
 * Matching mirrors that module: normalised name, first unclaimed match wins.
 * Portion scaling is deliberately absent — a technique is not a quantity, so
 * halving the serving of a fried item leaves it fried.
 *
 * `"unknown"` is dropped rather than stored. The prompt tells the model to say
 * `unknown` when the technique is not visually clear, and its modifier is zero,
 * so persisting it would only be a wordier way of storing nothing while making
 * "the model was unsure" indistinguishable from "an older prompt never asked".
 */

import { normalizeItemName } from "./scan-correction.js";
import type { CookingMethodValue } from "./types.js";

export type AnalyzedCookingItem = {
  name: string;
  cookingMethod?: CookingMethodValue;
};

/**
 * Returns one cooking method per confirmed item, aligned by index.
 *
 * An entry is undefined when the item had no match, when the analysis predates
 * v9, or when the model answered `unknown`.
 */
export const recoverCookingMethods = (
  analyzed: AnalyzedCookingItem[],
  confirmedNames: string[],
): (CookingMethodValue | undefined)[] => {
  const pool = analyzed.map((item) => ({ item, taken: false }));

  return confirmedNames.map((name) => {
    const key = normalizeItemName(name);
    const match = pool.find((entry) => !entry.taken && normalizeItemName(entry.item.name) === key);
    if (!match) return undefined;
    match.taken = true;

    const method = match.item.cookingMethod;
    return method === undefined || method === "unknown" ? undefined : method;
  });
};

/**
 * The single method that best represents a meal, for scoring it as one plate.
 *
 * Weighted by grams: a large fried main should define the meal more than a small
 * steamed side. Ties break toward the method that appears first, which is the
 * order the model listed the items in — its own sense of what the plate is.
 *
 * Returns undefined when nothing was recovered, so the modifier is skipped
 * rather than guessed at.
 */
export const dominantCookingMethod = (
  items: { cookingMethod?: CookingMethodValue; grams?: number }[],
): CookingMethodValue | undefined => {
  const weights = new Map<CookingMethodValue, number>();

  for (const item of items) {
    if (!item.cookingMethod) continue;
    // A zero or missing weight still counts as a vote, just the smallest one, so
    // an item with no recorded grams cannot silently erase its own method.
    const grams = Number.isFinite(item.grams) && (item.grams ?? 0) > 0 ? (item.grams as number) : 1;
    weights.set(item.cookingMethod, (weights.get(item.cookingMethod) ?? 0) + grams);
  }

  let best: CookingMethodValue | undefined;
  let bestWeight = 0;
  for (const [method, weight] of weights) {
    if (weight > bestWeight) {
      best = method;
      bestWeight = weight;
    }
  }
  return best;
};
