import { describe, expect, it } from "vitest";
import {
  isPrimarySurface,
  scoreToStars,
  toScoreRating,
  type ScoreLevel,
  type ScoreStars,
} from "./score-stars.js";

const LEVELS: ScoreLevel[] = ["meal", "daily", "weekly"];

describe("scoreToStars", () => {
  it("maps the documented buckets", () => {
    expect(scoreToStars(0)).toBe(1);
    expect(scoreToStars(21)).toBe(2);
    expect(scoreToStars(41)).toBe(3);
    expect(scoreToStars(61)).toBe(4);
    expect(scoreToStars(81)).toBe(5);
  });

  it("puts every boundary on the lower band", () => {
    // The spec's buckets are inclusive at the top: 0-20, 21-40, 41-60, 61-80.
    expect(scoreToStars(20)).toBe(1);
    expect(scoreToStars(40)).toBe(2);
    expect(scoreToStars(60)).toBe(3);
    expect(scoreToStars(80)).toBe(4);
    expect(scoreToStars(100)).toBe(5);
  });

  it("never returns anything outside 1..5", () => {
    for (const score of [-50, 0, 33.3, 99.9, 100, 250]) {
      const stars = scoreToStars(score);
      expect(stars).toBeGreaterThanOrEqual(1);
      expect(stars).toBeLessThanOrEqual(5);
    }
  });

  it("falls back to one star rather than crashing on a bad number", () => {
    expect(scoreToStars(Number.NaN)).toBe(1);
  });

  it("is monotonic", () => {
    let previous = 0;
    for (let score = 0; score <= 100; score += 1) {
      const stars = scoreToStars(score);
      expect(stars).toBeGreaterThanOrEqual(previous);
      previous = stars;
    }
  });
});

describe("toScoreRating", () => {
  it("never exposes the numeric score", () => {
    // The whole point of Part E: the number stays internal.
    const rating = toScoreRating(73, "daily");
    expect(Object.keys(rating).sort()).toEqual(["level", "message", "provisional", "stars"]);
    expect(JSON.stringify(rating)).not.toContain("73");
  });

  it("gives every level a distinct message for the same score", () => {
    const meal = toScoreRating(50, "meal").message;
    const daily = toScoreRating(50, "daily").message;
    const weekly = toScoreRating(50, "weekly").message;

    expect(new Set([meal, daily, weekly]).size).toBe(3);
  });

  it("has a non-empty message for every level and star count", () => {
    for (const level of LEVELS) {
      for (const stars of [1, 2, 3, 4, 5] as ScoreStars[]) {
        const score = (stars - 1) * 20 + 1;
        const rating = toScoreRating(score, level);
        expect(rating.stars).toBe(stars);
        expect(rating.message.length).toBeGreaterThan(0);
      }
    }
  });

  it("keeps per-meal copy lighter than daily copy", () => {
    // A single plate should not feel as final as a whole day.
    expect(toScoreRating(10, "meal").message).not.toContain("tomorrow");
    expect(toScoreRating(10, "daily").message).toContain("tomorrow");
  });

  it("carries the provisional flag for a day still in progress", () => {
    expect(toScoreRating(50, "daily", { provisional: true }).provisional).toBe(true);
    expect(toScoreRating(50, "daily").provisional).toBe(false);
  });

  it("never phrases a low rating as a personal failing", () => {
    // Copy should describe the food, not judge the person.
    for (const level of LEVELS) {
      const message = toScoreRating(5, level).message.toLowerCase();
      for (const word of ["bad", "unhealthy", "failed", "wrong", "guilty"]) {
        expect(message).not.toContain(word);
      }
    }
  });
});

describe("isPrimarySurface", () => {
  it("keeps per-meal ratings to tap-through only", () => {
    expect(isPrimarySurface("meal")).toBe(false);
    expect(isPrimarySurface("daily")).toBe(true);
    expect(isPrimarySurface("weekly")).toBe(true);
  });
});
