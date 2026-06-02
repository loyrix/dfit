-- 20260602130649_engagement_analytics_policy.up.sql
-- 20260602130649_engagement_analytics_policy.up.sql
insert into app_runtime_config (key, value, description, updated_by)
values (
  'engagement_policy',
  '{
    "analytics": {
      "enabled": false,
      "firebaseEnabled": false,
      "debugLogging": false,
      "sampleRatePercent": 100,
      "events": {
        "appOpen": true,
        "bootstrapLoaded": true,
        "tabSelected": false,
        "scanStarted": true,
        "scanAnalysisSucceeded": true,
        "scanAnalysisFailed": true,
        "scanConfirmed": true,
        "manualMealSaved": true,
        "mealUpdated": true,
        "mealDeleted": true,
        "rewardedAdStarted": true,
        "rewardedAdEarned": true,
        "rewardedAdFailed": true,
        "accountGateShown": true,
        "accountLinked": true,
        "healthTargetSaved": true
      }
    }
  }'::jsonb,
  'Controls analytics, review prompts, interstitial ads, local notification scenarios, and streak celebrations for mobile clients.',
  'migration'
)
on conflict (key) do update
set
  value = case
    when app_runtime_config.value ? 'analytics' then app_runtime_config.value
    else jsonb_set(
      app_runtime_config.value,
      '{analytics}',
      excluded.value -> 'analytics',
      true
    )
  end,
  description = excluded.description,
  updated_at = now();
