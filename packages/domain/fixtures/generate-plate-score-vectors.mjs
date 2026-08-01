/**
 * Regenerates plate-score-vectors.json from the TypeScript implementation.
 *
 * The vectors are the shared specification for the Plate Score: the TS suite
 * asserts it still produces them (regression lock) and the Flutter suite asserts
 * its port produces the same (conformance). If the two implementations ever
 * disagree by a single point, both suites go red.
 *
 * Run after any deliberate scoring change:
 *   pnpm --filter @logmyplate/domain build
 *   node packages/domain/fixtures/generate-plate-score-vectors.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { calculatePlateScore } from "../dist/plate-score.js";

const here = path.dirname(fileURLToPath(import.meta.url));

const balanced = [
  { calories: 350, proteinG: 20, carbsG: 45, fatG: 10, fiberG: 7 },
  { calories: 350, proteinG: 18, carbsG: 48, fatG: 9, fiberG: 6 },
];
const noMicros = balanced.map(({ fiberG: _drop, ...rest }) => rest);

const cases = [
  { name: "balanced lunch, no profile", items: balanced, mealType: "lunch" },
  {
    name: "balanced lunch, maintain",
    items: balanced,
    mealType: "lunch",
    profile: { dailyCalorieTarget: 2000, goal: "maintain" },
  },
  {
    name: "balanced lunch, lose gently",
    items: balanced,
    mealType: "lunch",
    profile: { dailyCalorieTarget: 1700, goal: "lose_gently" },
  },
  {
    name: "balanced lunch, gain gently",
    items: balanced,
    mealType: "lunch",
    profile: { dailyCalorieTarget: 2600, goal: "gain_gently" },
  },
  { name: "no micronutrients recorded", items: noMicros, mealType: "lunch" },
  {
    name: "no micronutrients recorded, with profile",
    items: noMicros,
    mealType: "lunch",
    profile: { dailyCalorieTarget: 2000, goal: "maintain" },
  },
  {
    name: "small breakfast is not penalised",
    items: [{ calories: 339, proteinG: 9, carbsG: 63, fatG: 8 }],
    mealType: "breakfast",
    profile: { dailyCalorieTarget: 2000, goal: "maintain" },
  },
  {
    name: "ordinary snack",
    items: [{ calories: 300, proteinG: 12, carbsG: 35, fatG: 10, fiberG: 5 }],
    mealType: "snack",
    profile: { dailyCalorieTarget: 2000, goal: "maintain" },
  },
  {
    name: "oversized dinner",
    items: [{ calories: 1600, proteinG: 40, carbsG: 200, fatG: 50, fiberG: 10 }],
    mealType: "dinner",
    profile: { dailyCalorieTarget: 2000, goal: "maintain" },
  },
  {
    name: "fried, carb dominated",
    items: [{ calories: 900, proteinG: 10, carbsG: 110, fatG: 45 }],
    mealType: "lunch",
    profile: { dailyCalorieTarget: 2000, goal: "maintain" },
  },
  {
    name: "high protein",
    items: [{ calories: 600, proteinG: 45, carbsG: 60, fatG: 15, fiberG: 8 }],
    mealType: "lunch",
    profile: { dailyCalorieTarget: 2000, goal: "maintain" },
  },
  {
    name: "fiber on only one item",
    items: [
      { calories: 350, proteinG: 20, carbsG: 45, fatG: 10, fiberG: 7 },
      { calories: 350, proteinG: 18, carbsG: 48, fatG: 9 },
    ],
    mealType: "lunch",
    profile: { dailyCalorieTarget: 2000, goal: "maintain" },
  },
  {
    name: "family sized portion is scored, not capped",
    items: [{ calories: 2400, proteinG: 90, carbsG: 300, fatG: 80, fiberG: 30 }],
    mealType: "dinner",
    profile: { dailyCalorieTarget: 2000, goal: "maintain" },
  },
  { name: "empty meal", items: [], mealType: "lunch" },
  {
    name: "zero calorie meal",
    items: [{ calories: 0, proteinG: 0, carbsG: 0, fatG: 0 }],
    mealType: "lunch",
  },
];

const vectors = cases.map((testCase) => {
  const { name, ...input } = testCase;
  return { name, input, expected: calculatePlateScore(input) ?? null };
});

const target = path.join(here, "plate-score-vectors.json");
fs.writeFileSync(
  target,
  `${JSON.stringify({ generatedFrom: "packages/domain/src/plate-score.ts", vectors }, null, 2)}\n`,
);
console.log(`wrote ${vectors.length} vectors to ${target}`);
