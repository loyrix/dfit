-- 20260602130649_engagement_analytics_policy.down.sql
-- 20260602130649_engagement_analytics_policy.down.sql
update app_runtime_config
set
  value = value - 'analytics',
  updated_at = now()
where key = 'engagement_policy'
  and value ? 'analytics';
