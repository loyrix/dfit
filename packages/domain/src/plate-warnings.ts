/**
 * Qualitative warnings about a meal.
 *
 * This is the only place micronutrients reach the user, and they reach it as
 * words, never numbers. Fiber, sugar and sodium are estimates the model returns
 * only when it is reasonably confident, so stating "412 mg sodium" would imply a
 * precision we do not have. "Sodium looks high for one meal" says the useful
 * part without the false precision.
 *
 * Two rules keep this safe:
 *
 * 1. **A warning only fires when the value is actually present.** An absent
 *    nutrient means unknown, so it produces silence rather than reassurance. We
 *    never tell someone a meal is low in sodium because we failed to measure it.
 * 2. **Health conditions change the threshold, not the claim.** Selecting
 *    "blood pressure" makes the sodium warning more sensitive; it does not
 *    produce a different, condition-specific assertion about that person's
 *    health. The wording stays the same educational statement either way.
 */

import type { MacroTotals } from "./types.js";

export type HealthFocus = "diabetes" | "blood_pressure" | "cholesterol" | "pcos";

export type PlateWarningCode = "high_sodium" | "high_sugar" | "low_fiber";

export type PlateWarning = {
  code: PlateWarningCode;
  text: string;
  /** True when a selected condition made this warning more sensitive. */
  personalised: boolean;
};

export type PlateWarningThresholds = {
  /** Sodium in mg for a single meal. */
  sodiumMg: number;
  /** Sodium threshold when blood pressure is a focus area. */
  sodiumMgSensitive: number;
  /** Sugar in g for a single meal. */
  sugarG: number;
  /** Sugar threshold when diabetes or PCOS is a focus area. */
  sugarGSensitive: number;
  /** Below this fiber, with at least `lowFiberCarbsG` of carbs, reads as light. */
  lowFiberG: number;
  lowFiberCarbsG: number;
};

export const defaultPlateWarningThresholds: PlateWarningThresholds = {
  sodiumMg: 800,
  sodiumMgSensitive: 600,
  sugarG: 25,
  sugarGSensitive: 15,
  lowFiberG: 3,
  lowFiberCarbsG: 45,
};

const isPresent = (value: number | undefined): value is number =>
  value !== undefined && Number.isFinite(value) && value >= 0;

/**
 * Sums a micronutrient across items, preserving "unknown".
 *
 * Returns undefined when no item reported it, so the caller stays silent rather
 * than treating a gap in the data as a low value.
 */
const sumOptional = (
  items: MacroTotals[],
  pick: (item: MacroTotals) => number | undefined,
): number | undefined => {
  let total: number | undefined;
  for (const item of items) {
    const value = pick(item);
    if (isPresent(value)) total = (total ?? 0) + value;
  }
  return total;
};

const sumRequired = (items: MacroTotals[], pick: (item: MacroTotals) => number): number =>
  items.reduce((sum, item) => {
    const value = pick(item);
    return sum + (Number.isFinite(value) ? value : 0);
  }, 0);

export const detectPlateWarnings = (
  items: MacroTotals[],
  healthFocus: HealthFocus[] = [],
  thresholds: PlateWarningThresholds = defaultPlateWarningThresholds,
): PlateWarning[] => {
  const warnings: PlateWarning[] = [];
  if (items.length === 0) return warnings;

  const watchesSodium = healthFocus.includes("blood_pressure");
  const watchesSugar = healthFocus.includes("diabetes") || healthFocus.includes("pcos");

  const sodiumMg = sumOptional(items, (item) => item.sodiumMg);
  if (isPresent(sodiumMg)) {
    const limit = watchesSodium ? thresholds.sodiumMgSensitive : thresholds.sodiumMg;
    if (sodiumMg > limit) {
      warnings.push({
        code: "high_sodium",
        text: "Sodium looks high for one meal.",
        personalised: watchesSodium,
      });
    }
  }

  const sugarG = sumOptional(items, (item) => item.sugarG);
  if (isPresent(sugarG)) {
    const limit = watchesSugar ? thresholds.sugarGSensitive : thresholds.sugarG;
    if (sugarG > limit) {
      warnings.push({
        code: "high_sugar",
        text: "Sugar looks high for one meal.",
        personalised: watchesSugar,
      });
    }
  }

  // Only meaningful alongside a carb-heavy meal: a low-carb plate is not
  // expected to carry much fiber, and flagging it would be noise.
  const fiberG = sumOptional(items, (item) => item.fiberG);
  if (isPresent(fiberG)) {
    const carbsG = sumRequired(items, (item) => item.carbsG);
    if (fiberG < thresholds.lowFiberG && carbsG > thresholds.lowFiberCarbsG) {
      warnings.push({
        code: "low_fiber",
        text: "Light on fiber for the carbs here.",
        personalised: false,
      });
    }
  }

  return warnings;
};
