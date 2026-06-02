-- 20260602111717_engagement_policy_runtime_config.down.sql
delete from app_runtime_config
where key = 'engagement_policy'
  and updated_by = 'migration';
