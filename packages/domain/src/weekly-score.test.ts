import { describe, expect, it } from "vitest";
import { calculateWeeklyScore, type WeeklyScoreDay } from "./weekly-score.js";

/** The worked example's week: 72, 65, 38.5, 80, 55, 90, 61. */
const workedWeek: WeeklyScoreDay[] = [
  { date: "2026-08-03", dailyScore: 72 },
  { date: "2026-08-04", dailyScore: 65 },
  { date: "2026-08-05", dailyScore: 38.5 },
  { date: "2026-08-06", dailyScore: 80 },
  { date: "2026-08-07", dailyScore: 55 },
  { date: "2026-08-08", dailyScore: 90 },
  { date: "2026-08-09", dailyScore: 61 },
];

describe("calculateWeeklyScore", () => {
  it("returns undefined when no day in the window was tracked", () => {
    expect(calculateWeeklyScore([])).toBeUndefined();
    expect(calculateWeeklyScore([{ date: "2026-08-03" }, { date: "2026-08-04" }])).toBeUndefined();
  });

  it("reproduces the worked example exactly", () => {
    const result = calculateWeeklyScore(workedWeek);

    // Average 65.9, five days at or above 61, +5 bonus -> 70.9.
    expect(result?.average).toBe(65.9);
    expect(result?.goodDays).toBe(5);
    expect(result?.consistencyBonus).toBe(5);
    expect(result?.score).toBe(71);
  });

  it("is deterministic", () => {
    expect(calculateWeeklyScore(workedWeek)).toEqual(calculateWeeklyScore(workedWeek));
  });

  describe("D1 excludes untracked days rather than scoring them zero", () => {
    it("ignores days with no meals logged", () => {
      const withGaps: WeeklyScoreDay[] = [
        { date: "2026-08-03", dailyScore: 80 },
        { date: "2026-08-04" },
        { date: "2026-08-05" },
        { date: "2026-08-06", dailyScore: 60 },
      ];
      const result = calculateWeeklyScore(withGaps);

      // A logging gap is not evidence of poor eating.
      expect(result?.average).toBe(70);
      expect(result?.scoredDays).toBe(2);
      expect(result?.untrackedDays).toBe(2);
    });

    it("scores a single tracked day on that day alone", () => {
      const result = calculateWeeklyScore([
        { date: "2026-08-03", dailyScore: 55 },
        { date: "2026-08-04" },
      ]);

      expect(result?.average).toBe(55);
      expect(result?.scoredDays).toBe(1);
    });
  });

  describe("D2 consistency bonus", () => {
    it("rewards steadiness over the same mean reached by extremes", () => {
      const steady = calculateWeeklyScore([
        { date: "1", dailyScore: 65 },
        { date: "2", dailyScore: 65 },
        { date: "3", dailyScore: 65 },
        { date: "4", dailyScore: 65 },
      ]);
      const swingy = calculateWeeklyScore([
        { date: "1", dailyScore: 100 },
        { date: "2", dailyScore: 100 },
        { date: "3", dailyScore: 30 },
        { date: "4", dailyScore: 30 },
      ]);

      expect(steady?.average).toBe(swingy?.average);
      expect(steady?.consistencyBonus).toBeGreaterThan(swingy?.consistencyBonus ?? 0);
      expect(steady?.score).toBeGreaterThan(swingy?.score ?? 0);
    });

    it("counts a day exactly on the threshold as good", () => {
      const result = calculateWeeklyScore([{ date: "1", dailyScore: 61 }]);
      expect(result?.goodDays).toBe(1);
    });

    it("does not count a day just below the threshold", () => {
      const result = calculateWeeklyScore([{ date: "1", dailyScore: 60.9 }]);
      expect(result?.goodDays).toBe(0);
      expect(result?.consistencyBonus).toBe(0);
    });

    it("caps the bonus at 5 however many good days there are", () => {
      const allGood = Array.from({ length: 7 }, (_, index) => ({
        date: String(index),
        dailyScore: 90,
      }));
      expect(calculateWeeklyScore(allGood)?.consistencyBonus).toBe(5);
    });
  });

  it("keeps the score within 0..100 even when the bonus would exceed it", () => {
    const perfect = Array.from({ length: 7 }, (_, index) => ({
      date: String(index),
      dailyScore: 100,
    }));
    expect(calculateWeeklyScore(perfect)?.score).toBe(100);
  });
});
