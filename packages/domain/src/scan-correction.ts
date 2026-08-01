/**
 * Diffing an AI scan analysis against what the user actually confirmed.
 *
 * This is the accuracy feedback loop: it tells us which AI suggestions users
 * accepted as-is and which ones they corrected, without asking the client to
 * report anything. Deriving it server-side means every already-installed app
 * build contributes data immediately.
 *
 * Pure and dependency-free so it can be unit tested and reused by both the
 * `meal_items.user_edited` flag and the `user_corrections` audit trail.
 */

export type ScanItemSnapshot = {
  name: string;
  quantity: number;
  unit: string;
  grams: number;
  calories: number;
};

/** Which attributes of a matched item the user changed. */
export type ScanItemField = "quantity" | "unit" | "grams" | "calories";

export type ScanItemChange = {
  before: ScanItemSnapshot;
  after: ScanItemSnapshot;
  fields: ScanItemField[];
};

export type ScanConfirmationDiff = {
  hasChanges: boolean;
  added: ScanItemSnapshot[];
  removed: ScanItemSnapshot[];
  changed: ScanItemChange[];
  /**
   * Parallel to the confirmed items array: true when that item differs from the
   * AI suggestion it was matched to, or had no match at all (user-added).
   */
  confirmedItemEdited: boolean[];
};

/**
 * Portion quantities are small numbers (1 katori, 2 roti) so an absolute
 * epsilon is enough; grams and calories are compared with a wider tolerance
 * because they round-trip through JSON and client-side scaling.
 */
const QUANTITY_EPSILON = 0.01;
const GRAMS_EPSILON = 0.5;
const CALORIES_EPSILON = 0.5;

/** Shared so item matching behaves identically everywhere we pair AI vs confirmed items. */
export const normalizeItemName = (name: string): string =>
  name.trim().toLowerCase().replace(/\s+/g, " ");

const normalizeName = normalizeItemName;

const nearlyEqual = (a: number, b: number, epsilon: number): boolean => Math.abs(a - b) <= epsilon;

const changedFields = (before: ScanItemSnapshot, after: ScanItemSnapshot): ScanItemField[] => {
  const fields: ScanItemField[] = [];
  if (!nearlyEqual(before.quantity, after.quantity, QUANTITY_EPSILON)) fields.push("quantity");
  if (before.unit !== after.unit) fields.push("unit");
  if (!nearlyEqual(before.grams, after.grams, GRAMS_EPSILON)) fields.push("grams");
  if (!nearlyEqual(before.calories, after.calories, CALORIES_EPSILON)) fields.push("calories");
  return fields;
};

/**
 * Matches confirmed items back to analyzed items by normalized name, consuming
 * each analyzed item at most once so duplicates ("2 roti" logged twice) pair up
 * one-to-one instead of both matching the same suggestion.
 *
 * Renames are intentionally treated as remove + add rather than a rename: we
 * cannot tell a rename from a swap, and counting it as both sides keeps the
 * "AI got this item wrong" signal honest.
 */
export const diffScanConfirmation = (
  analyzed: ScanItemSnapshot[],
  confirmed: ScanItemSnapshot[],
): ScanConfirmationDiff => {
  const unmatched = analyzed.map((item, index) => ({ item, index, taken: false }));
  const changed: ScanItemChange[] = [];
  const added: ScanItemSnapshot[] = [];
  const confirmedItemEdited: boolean[] = [];

  for (const confirmedItem of confirmed) {
    const key = normalizeName(confirmedItem.name);
    const match = unmatched.find((entry) => !entry.taken && normalizeName(entry.item.name) === key);

    if (!match) {
      added.push(confirmedItem);
      confirmedItemEdited.push(true);
      continue;
    }

    match.taken = true;
    const fields = changedFields(match.item, confirmedItem);
    if (fields.length > 0) {
      changed.push({ before: match.item, after: confirmedItem, fields });
    }
    confirmedItemEdited.push(fields.length > 0);
  }

  const removed = unmatched.filter((entry) => !entry.taken).map((entry) => entry.item);

  return {
    hasChanges: added.length > 0 || removed.length > 0 || changed.length > 0,
    added,
    removed,
    changed,
    confirmedItemEdited,
  };
};
