import { describe, expect, it } from "vitest";
import { analyzeScanRequestSchema } from "./scans.js";

const image = { mimeType: "image/jpeg" as const, base64: "AQID", byteSize: 3 };
const words = (count: number) => Array.from({ length: count }, () => "roti").join(" ");

describe("analyzeScanRequestSchema", () => {
  it("accepts a short note alongside a photo", () => {
    expect(analyzeScanRequestSchema.safeParse({ hint: "dal rice roti", image }).success).toBe(true);
  });

  it("accepts a described meal with no photo", () => {
    const parsed = analyzeScanRequestSchema.safeParse({
      hint: "2 rotis, 1 bowl dal, small bowl of rice and a cucumber salad",
    });
    expect(parsed.success).toBe(true);
  });

  it("still requires some text, since a request with neither is not a meal", () => {
    expect(analyzeScanRequestSchema.safeParse({}).success).toBe(false);
    expect(analyzeScanRequestSchema.safeParse({ hint: "   " }).success).toBe(false);
  });

  // A build already in users' hands sends a note with every photo, so the
  // limits it was built against must not move.
  it("keeps the photo note at 280 characters and 50 words", () => {
    expect(analyzeScanRequestSchema.safeParse({ hint: "a".repeat(280), image }).success).toBe(true);
    expect(analyzeScanRequestSchema.safeParse({ hint: "a".repeat(281), image }).success).toBe(
      false,
    );
    expect(analyzeScanRequestSchema.safeParse({ hint: words(50), image }).success).toBe(true);
    expect(analyzeScanRequestSchema.safeParse({ hint: words(51), image }).success).toBe(false);
  });

  it("gives a described meal room for a whole plate", () => {
    expect(analyzeScanRequestSchema.safeParse({ hint: "a".repeat(600) }).success).toBe(true);
    expect(analyzeScanRequestSchema.safeParse({ hint: "a".repeat(601) }).success).toBe(false);
    expect(analyzeScanRequestSchema.safeParse({ hint: words(120) }).success).toBe(true);
    expect(analyzeScanRequestSchema.safeParse({ hint: words(121) }).success).toBe(false);
  });
});
