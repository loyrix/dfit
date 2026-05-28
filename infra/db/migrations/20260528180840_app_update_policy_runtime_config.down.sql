-- 20260528180840_app_update_policy_runtime_config.down.sql
delete from app_runtime_config
where key = 'app_update_policy'
  and updated_by = 'migration';
