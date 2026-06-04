export const rewardedAdsPerScan = 1;
export const rewardedDailyScanLimit = 5;

export const calculateRewardedAdState = (input: {
  completedAds: number;
  grantedScans: number;
  dailyScanLimit?: number;
}) => {
  const dailyScanLimit = normalizeRewardedDailyScanLimit(input.dailyScanLimit);
  const earnedScans = Math.floor(input.completedAds / rewardedAdsPerScan);
  const cappedEarnedScans = Math.min(earnedScans, dailyScanLimit);
  const nextThreshold =
    input.grantedScans >= dailyScanLimit
      ? input.completedAds
      : (input.grantedScans + 1) * rewardedAdsPerScan;

  return {
    grantableScans: Math.max(0, cappedEarnedScans - input.grantedScans),
    adsNeededForNextScan:
      input.grantedScans >= dailyScanLimit ? 0 : Math.max(0, nextThreshold - input.completedAds),
  };
};

export const normalizeRewardedDailyScanLimit = (value: unknown) => {
  const parsed = Number(value ?? rewardedDailyScanLimit);
  if (!Number.isFinite(parsed)) return rewardedDailyScanLimit;
  return Math.min(100, Math.max(1, Math.trunc(parsed)));
};
