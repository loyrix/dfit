-- 20260607120358_add_admob_test_devices_config.down.sql
update app_runtime_config
set value = value - 'admob'
where key = 'engagement_policy';

