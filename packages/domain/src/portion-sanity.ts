/**
 * Quality signals for AI nutrition estimates.
 *
 * These exist to measure accuracy, not to restrict it. A large portion is a
 * legitimate answer: a family-size cooking pot, a full packet of biscuits, or a
 * tray prepared for ten people should all be estimated at their real size. We
 * never cap, clamp, or rewrite what the model returned.
 *
 * The signals split into two kinds, and the distinction matters:
 *
 * - `macro_incoherent` is arithmetic, not judgement. Calories that disagree
 *   with the macros meant to produce them are wrong at any portion size, so
 *   this one legitimately lowers confidence.
 * - `large_portion` and `high_calorie` are only "worth a look". They feed the
 *   admin review queue and nothing else: they never change confidence and never
 *   change a value, because the item is frequently correct.
 */

export type PortionSignal =
  /** Calories disagree with the macros that should produce them. Always an error. */
  | "macro_incoherent"
  /** Unusually large amount. Often legitimate (bulk cooking, shared platter). */
  | "large_portion"
  /** Unusually calorie-heavy item. Often legitimate (oils, packaged sweets). */
  | "high_calorie";

export type PortionSignalThresholds = {
  /** Review-queue trigger only. Set high enough that normal bulk cooking is not noise. */
  largePortionGrams: number;
  /** Review-queue trigger only. */
  highCalorieKcal: number;
  /** Allowed relative gap between stated and Atwater-derived calories. */
  macroTolerance: number;
};

export const defaultPortionSignalThresholds: PortionSignalThresholds = {
  largePortionGrams: 1_500,
  highCalorieKcal: 2_000,
  macroTolerance: 0.25,
};

export type PortionSignalInput = {
  estimatedGrams: number;
  nutrition: {
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  };
};

/** Atwater factors: 4 kcal/g protein and carbs, 9 kcal/g fat. */
const atwaterCalories = (nutrition: PortionSignalInput["nutrition"]): number =>
  nutrition.proteinG * 4 + nutrition.carbsG * 4 + nutrition.fatG * 9;

const isPositiveFinite = (value: number): boolean => Number.isFinite(value) && value > 0;

/**
 * Returns the quality signals an item raises, or an empty array when nothing
 * stands out. Non-finite or non-positive values are skipped rather than
 * signalled: missing data is a different problem from implausible data.
 */
export const detectPortionSignals = (
  item: PortionSignalInput,
  thresholds: PortionSignalThresholds = defaultPortionSignalThresholds,
): PortionSignal[] => {
  const signals: PortionSignal[] = [];
  const { calories } = item.nutrition;

  // Only meaningful when the model returned both calories and some macros; an
  // all-zero macro set is missing data, not incoherent data.
  const derived = atwaterCalories(item.nutrition);
  if (isPositiveFinite(calories) && isPositiveFinite(derived)) {
    const gap = Math.abs(calories - derived) / calories;
    if (gap > thresholds.macroTolerance) signals.push("macro_incoherent");
  }

  if (isPositiveFinite(item.estimatedGrams) && item.estimatedGrams > thresholds.largePortionGrams) {
    signals.push("large_portion");
  }

  if (isPositiveFinite(calories) && calories > thresholds.highCalorieKcal) {
    signals.push("high_calorie");
  }

  return signals;
};

/** True when a signal means the numbers are wrong, rather than merely unusual. */
export const isAccuracyDefect = (signal: PortionSignal): boolean => signal === "macro_incoherent";

/**
 * Confidence after accounting for signals.
 *
 * Only genuine defects reduce confidence. An accurately estimated 3 kg pot of
 * sabzi keeps its confidence untouched — penalising size would train the model
 * and the user to distrust correct answers.
 */
export const confidenceAfterSignals = (confidence: number, signals: PortionSignal[]): number => {
  if (!signals.some(isAccuracyDefect)) return confidence;
  const adjusted = confidence * 0.7;
  return Math.max(0, Math.min(1, Number(adjusted.toFixed(4))));
};
