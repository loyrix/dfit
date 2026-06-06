-- 20260606085809_engagement_daily_scan_credit_policy.up.sql
-- 20260606085809_engagement_daily_scan_credit_policy.up.sql
insert into app_runtime_config (key, value, description, updated_by)
values (
  'engagement_policy',
  '{
    "rewardedAds": {
      "dailyScanLimit": 5,
      "adSuspensionDailyCredits": {
        "enabled": false,
        "freeScansPerDay": 5,
        "platformFreeScansPerDay": {
          "ios": 5,
          "android": 3
        },
        "startsAt": null,
        "endsAt": null
      }
    }
  }'::jsonb,
  'Controls analytics, review prompts, interstitial ads, rewarded scan unlocks, temporary ad-suspension scan credits, FCM push reminder scenarios, and streak celebrations for mobile clients.',
  'migration'
)
on conflict (key) do update
set
  value = jsonb_set(
    jsonb_set(
      app_runtime_config.value,
      '{rewardedAds}',
      coalesce(app_runtime_config.value -> 'rewardedAds', '{}'::jsonb),
      true
    ),
    '{rewardedAds,adSuspensionDailyCredits}',
    coalesce(excluded.value #> '{rewardedAds,adSuspensionDailyCredits}', '{}'::jsonb)
      || coalesce(app_runtime_config.value #> '{rewardedAds,adSuspensionDailyCredits}', '{}'::jsonb),
    true
  ),
  description = excluded.description,
  updated_at = now();

create index if not exists quota_events_ad_suspension_daily_credit_idx
  on quota_events (profile_id, install_id, local_date)
  where event_type = 'grant'
    and reason = 'ad_suspension_daily_free';
