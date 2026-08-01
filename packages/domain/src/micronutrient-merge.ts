/**
 * Recovers micronutrients the client dropped on the way back to the server.
 *
 * The AI returns fiber (and sometimes sugar and sodium) per item, but app builds
 * before the 7-field `MacroTotals` change parse only calories/protein/carbs/fat,
 * so the confirm request silently loses the rest and the API persists nulls.
 * Rather than wait for every install to update, the confirm route re-attaches
 * these values from the analysis it already stored.
 *
 * Two rules keep this honest:
 *
 * - Values the client did send always win. A newer app that let the user edit
 *   nutrition must not be overwritten by the original AI guess.
 * - Recovered values are scaled by how much the portion changed. If the user
 *   halved the serving, the fiber recovered for it is halved too; otherwise we
 *   would persist a nutrient for a portion the user rejected.
 *
 * Anything the AI did not return stays undefined. Absent means unknown, never
 * zero — a fabricated 0 would read as a real "low sodium" measurement.
 */

import { normalizeItemName } from "./scan-correction.js";

export type MicronutrientValues = {
  fiberG?: number;
  sugarG?: number;
  sodiumMg?: number;
};

export type MicronutrientItem = {
  name: string;
  grams: number;
  nutrition: MicronutrientValues;
};

/** Portion changes beyond this ratio suggest a different food, not a resize. */
const MAX_SCALE_FACTOR = 10;

const scaleValue = (value: number | undefined, factor: number): number | undefined => {
  if (value === undefined || !Number.isFinite(value)) return undefined;
  if (factor === 1) return value;
  return Number((value * factor).toFixed(4));
};

/**
 * How much the confirmed portion differs from the analyzed one. Falls back to 1
 * when either weight is missing, which keeps the AI's own values rather than
 * inventing a scale from nothing.
 */
const portionScale = (analyzedGrams: number, confirmedGrams: number): number => {
  if (!Number.isFinite(analyzedGrams) || !Number.isFinite(confirmedGrams)) return 1;
  if (analyzedGrams <= 0 || confirmedGrams <= 0) return 1;
  const factor = confirmedGrams / analyzedGrams;
  if (factor > MAX_SCALE_FACTOR || factor < 1 / MAX_SCALE_FACTOR) return 1;
  return factor;
};

/**
 * Returns the confirmed items with any missing micronutrients filled in from the
 * matching analyzed item. Items with no match, or whose values the client
 * already supplied, come back untouched.
 */
export const mergeAnalysisMicronutrients = <T extends MicronutrientItem>(
  analyzed: MicronutrientItem[],
  confirmed: T[],
): T[] => {
  const pool = analyzed.map((item) => ({ item, taken: false }));

  return confirmed.map((confirmedItem) => {
    const key = normalizeItemName(confirmedItem.name);
    const match = pool.find((entry) => !entry.taken && normalizeItemName(entry.item.name) === key);
    if (!match) return confirmedItem;
    match.taken = true;

    const source = match.item.nutrition;
    const target = confirmedItem.nutrition;
    const factor = portionScale(match.item.grams, confirmedItem.grams);

    const recovered: MicronutrientValues = {
      fiberG: target.fiberG ?? scaleValue(source.fiberG, factor),
      sugarG: target.sugarG ?? scaleValue(source.sugarG, factor),
      sodiumMg: target.sodiumMg ?? scaleValue(source.sodiumMg, factor),
    };

    const changed =
      recovered.fiberG !== target.fiberG ||
      recovered.sugarG !== target.sugarG ||
      recovered.sodiumMg !== target.sodiumMg;
    if (!changed) return confirmedItem;

    // Undefined keys are dropped so an unknown nutrient is never written as null.
    const nutrition = { ...target };
    if (recovered.fiberG !== undefined) nutrition.fiberG = recovered.fiberG;
    if (recovered.sugarG !== undefined) nutrition.sugarG = recovered.sugarG;
    if (recovered.sodiumMg !== undefined) nutrition.sodiumMg = recovered.sodiumMg;

    return { ...confirmedItem, nutrition };
  });
};
