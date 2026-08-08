/**
 * Regenerates macro-target-vectors.json from the TypeScript implementation.
 *
 * These vectors are the shared specification for Part A. The TS suite asserts
 * `calculateMacroTargets` still produces them, and the Flutter suite asserts the
 * target screen's local preview agrees. That preview exists so the calorie
 * number moves as the user drags a slider, without a request per frame — which
 * only works if it matches what the server will actually store.
 *
 * It did not, for a while: the app kept the old flat -300/+250 goal offsets
 * after the server moved to multiplicative factors, and quietly showed people a
 * target that was up to ~200 kcal from the one being saved. This fixture exists
 * so that cannot happen silently again.
 *
 * Run after any deliberate change to Part A:
 *   pnpm --filter @logmyplate/domain build
 *   node packages/domain/fixtures/generate-macro-target-vectors.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { calculateMacroTargets } from "../dist/macro-targets.js";

const here = path.dirname(fileURLToPath(import.meta.url));

const bodies = [
  { name: "female, mid-range BMI", heightCm: 165, weightKg: 65, ageYears: 28, sex: "female" },
  { name: "male, mid-range BMI", heightCm: 175, weightKg: 70, ageYears: 30, sex: "male" },
  { name: "unspecified sex", heightCm: 170, weightKg: 68, ageYears: 35, sex: "not_specified" },
  // Crosses the BMI 30 nudge.
  { name: "male, high BMI", heightCm: 170, weightKg: 95, ageYears: 45, sex: "male" },
  // Crosses the BMI 18.5 nudge.
  { name: "female, low BMI", heightCm: 172, weightKg: 50, ageYears: 22, sex: "female" },
];

const activityLevels = ["sedentary", "light", "moderate", "active", "extra_active"];
const goals = ["lose_gently", "maintain", "gain_gently"];

const cases = [];
for (const body of bodies) {
  for (const activityLevel of activityLevels) {
    for (const goal of goals) {
      const { name, ...input } = body;
      cases.push({
        name: `${name} / ${activityLevel} / ${goal}`,
        input: { ...input, activityLevel, goal },
      });
    }
  }
}

// A9: an explicit split replaces the computed centres outright.
cases.push({
  name: "custom split overrides computed centres",
  input: {
    heightCm: 175,
    weightKg: 70,
    ageYears: 30,
    sex: "male",
    activityLevel: "moderate",
    goal: "maintain",
    customMacroSplit: { carbsPct: 30, fatPct: 25, proteinPct: 45 },
  },
});

const vectors = cases.map((testCase) => ({
  ...testCase,
  expected: calculateMacroTargets(testCase.input),
}));

fs.writeFileSync(
  path.join(here, "macro-target-vectors.json"),
  `${JSON.stringify({ vectors }, null, 2)}\n`,
);

console.log(`wrote ${vectors.length} macro target vectors`);
