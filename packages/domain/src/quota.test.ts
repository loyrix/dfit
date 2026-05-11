import { describe, expect, it } from "vitest";
import { consumeScanCredit, decideScanQuota } from "./quota.js";

describe("scan quota", () => {
  it("uses free credit before rewarded credit", () => {
    expect(
      decideScanQuota({ freeRemaining: 1, rewardedRemaining: 2, premiumRemaining: 0 }),
    ).toEqual({
      allowed: true,
      reason: "free",
    });
  });

  it("can consume the selected credit bucket", () => {
    expect(
      consumeScanCredit({ freeRemaining: 1, rewardedRemaining: 2, premiumRemaining: 0 }, "free"),
    ).toEqual({ freeRemaining: 0, rewardedRemaining: 2, premiumRemaining: 0 });
  });

  it("asks for rewarded ad when no credits remain", () => {
    expect(
      decideScanQuota({ freeRemaining: 0, rewardedRemaining: 0, premiumRemaining: 0 }),
    ).toEqual({
      allowed: false,
      reason: "needs_rewarded_ad",
    });
  });
});
