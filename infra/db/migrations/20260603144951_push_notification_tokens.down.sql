-- 20260603144951_push_notification_tokens.down.sql
drop index if exists push_notification_tokens_install_idx;
drop index if exists push_notification_tokens_profile_idx;
drop table if exists push_notification_tokens;

update app_runtime_config
set
  description = 'Controls analytics, review prompts, interstitial ads, notification scenarios, and streak celebrations for mobile clients.',
  updated_at = now()
where key = 'engagement_policy';
