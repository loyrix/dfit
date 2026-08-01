import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { calculatePlateScore, type PlateScoreInput, type PlateScoreResult } from "./plate-score.js";

/**
 * Conformance suite for the shared Plate Score specification.
 *
 * The same fixture is asserted by the Flutter port in
 * apps/mobile/test/plate_score_test.dart. Keeping both implementations pinned to
 * one set of vectors is what makes it safe to compute the score locally on the
 * review screen (for an instant update while editing) while the API stays
 * authoritative for saved meals.
 *
 * Regenerate after a deliberate scoring change:
 *   pnpm --filter @logmyplate/domain build
 *   node packages/domain/fixtures/generate-plate-score-vectors.mjs
 */
type Vector = {
  name: string;
  input: PlateScoreInput;
  expected: PlateScoreResult | null;
};

const fixturePath = fileURLToPath(new URL("../fixtures/plate-score-vectors.json", import.meta.url));
const { vectors } = JSON.parse(readFileSync(fixturePath, "utf8")) as { vectors: Vector[] };

describe("plate score shared vectors", () => {
  it("ships a non-trivial fixture", () => {
    expect(vectors.length).toBeGreaterThanOrEqual(10);
  });

  for (const vector of vectors) {
    it(`matches: ${vector.name}`, () => {
      expect(calculatePlateScore(vector.input) ?? null).toEqual(vector.expected);
    });
  }
});
