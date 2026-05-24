export const rewardedAdsPerScan = 1;
export const rewardedDailyScanLimit = 5;

export const calculateRewardedAdState = (input: { completedAds: number; grantedScans: number }) => {
  const earnedScans = Math.floor(input.completedAds / rewardedAdsPerScan);
  const cappedEarnedScans = Math.min(earnedScans, rewardedDailyScanLimit);
  const nextThreshold =
    input.grantedScans >= rewardedDailyScanLimit
      ? input.completedAds
      : (input.grantedScans + 1) * rewardedAdsPerScan;

  return {
    grantableScans: Math.max(0, cappedEarnedScans - input.grantedScans),
    adsNeededForNextScan:
      input.grantedScans >= rewardedDailyScanLimit
        ? 0
        : Math.max(0, nextThreshold - input.completedAds),
  };
};
