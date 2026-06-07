-- 20260607120358_add_admob_test_devices_config.up.sql
update app_runtime_config
set value = jsonb_set(value, '{admob}', '{"testDeviceIds": []}'::jsonb, true)
where key = 'engagement_policy' and not value ? 'admob';

