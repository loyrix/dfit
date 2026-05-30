-- 20260530090228_platform_daily_metrics.down.sql

drop table if exists platform_daily_active_installs;
drop table if exists platform_daily_metrics;

drop index if exists ai_provider_runs_install_idx;
drop index if exists ai_provider_runs_platform_date_idx;

alter table ai_provider_runs
  drop constraint if exists ai_provider_runs_platform_check;

alter table ai_provider_runs
  drop column if exists local_date,
  drop column if exists app_build,
  drop column if exists app_version,
  drop column if exists platform,
  drop column if exists install_id;

drop index if exists scan_sessions_install_idx;
drop index if exists scan_sessions_platform_created_idx;

alter table scan_sessions
  drop constraint if exists scan_sessions_platform_check;

alter table scan_sessions
  drop column if exists app_build,
  drop column if exists app_version,
  drop column if exists platform,
  drop column if exists install_id;

alter table devices
  drop column if exists app_build,
  drop column if exists app_version;
