-- 20260604131801_engagement_rewarded_ads_policy.down.sql
-- 20260604131801_engagement_rewarded_ads_policy.down.sql
update app_runtime_config
set
  value = value - 'rewardedAds',
  updated_at = now()
where key = 'engagement_policy';
