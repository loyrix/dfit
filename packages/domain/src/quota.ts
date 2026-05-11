import type { ScanCreditState } from "./types.js";

export type QuotaDecision =
  | { allowed: true; reason: "free" | "rewarded" | "premium" }
  | { allowed: false; reason: "needs_rewarded_ad" | "exhausted" };

export const decideScanQuota = (state: ScanCreditState): QuotaDecision => {
  if (state.premiumRemaining > 0) return { allowed: true, reason: "premium" };
  if (state.freeRemaining > 0) return { allowed: true, reason: "free" };
  if (state.rewardedRemaining > 0) return { allowed: true, reason: "rewarded" };
  return { allowed: false, reason: "needs_rewarded_ad" };
};

export const consumeScanCredit = (
  state: ScanCreditState,
  reason: Exclude<QuotaDecision["reason"], "needs_rewarded_ad" | "exhausted">,
): ScanCreditState => {
  if (reason === "premium" && state.premiumRemaining > 0) {
    return { ...state, premiumRemaining: state.premiumRemaining - 1 };
  }
  if (reason === "free" && state.freeRemaining > 0) {
    return { ...state, freeRemaining: state.freeRemaining - 1 };
  }
  if (reason === "rewarded" && state.rewardedRemaining > 0) {
    return { ...state, rewardedRemaining: state.rewardedRemaining - 1 };
  }
  throw new Error(`Cannot consume unavailable ${reason} scan credit`);
};
