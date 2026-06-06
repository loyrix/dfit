-- 20260606085809_engagement_daily_scan_credit_policy.down.sql
-- 20260606085809_engagement_daily_scan_credit_policy.down.sql
drop index if exists quota_events_ad_suspension_daily_credit_idx;

update app_runtime_config
set
  value = value
    #- '{rewardedAds,adSuspensionDailyCredits}'
    #- '{rewardedAds,enabled}',
  updated_at = now()
where key = 'engagement_policy';

update app_runtime_config
set
  value = value - 'rewardedAds',
  updated_at = now()
where key = 'engagement_policy'
  and value #> '{rewardedAds}' = '{}'::jsonb;
