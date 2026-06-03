-- 20260603190324_push_reminder_deliveries.down.sql
drop index if exists push_reminder_deliveries_once_idx;
drop index if exists push_reminder_deliveries_profile_date_idx;
drop index if exists push_reminder_deliveries_created_at_idx;
drop index if exists push_reminder_runs_started_at_idx;
drop table if exists push_reminder_deliveries;
drop table if exists push_reminder_runs;
