-- 20260604131801_engagement_rewarded_ads_policy.up.sql
-- 20260604131801_engagement_rewarded_ads_policy.up.sql
insert into app_runtime_config (key, value, description, updated_by)
values (
  'engagement_policy',
  '{
    "rewardedAds": {
      "dailyScanLimit": 5
    }
  }'::jsonb,
  'Controls analytics, review prompts, interstitial ads, rewarded scan unlocks, FCM push reminder scenarios, and streak celebrations for mobile clients.',
  'migration'
)
on conflict (key) do update
set
  value = case
    when app_runtime_config.value ? 'rewardedAds' then app_runtime_config.value
    else jsonb_set(
      app_runtime_config.value,
      '{rewardedAds}',
      excluded.value -> 'rewardedAds',
      true
    )
  end,
  description = excluded.description,
  updated_at = now();
