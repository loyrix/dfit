-- 20260824154702_device_install_attribution.down.sql
drop index if exists devices_install_source_idx;

alter table devices
  drop column if exists analytics_instance_id,
  drop column if exists attribution_captured_at,
  drop column if exists install_referrer_raw,
  drop column if exists install_campaign,
  drop column if exists install_medium,
  drop column if exists install_source;
