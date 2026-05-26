-- 20260526124141_admin_backoffice.down.sql

drop table if exists app_notices;
drop table if exists admin_scan_credit_grants;
drop index if exists ai_prompt_versions_one_active_key_idx;
drop table if exists ai_prompt_versions;
drop index if exists ai_model_configs_single_default_idx;
drop table if exists ai_model_configs;
drop table if exists app_runtime_config;
drop index if exists admin_audit_log_target_idx;
drop index if exists admin_audit_log_created_idx;
drop table if exists admin_audit_log;

alter table feature_flags
  drop column if exists updated_by;
