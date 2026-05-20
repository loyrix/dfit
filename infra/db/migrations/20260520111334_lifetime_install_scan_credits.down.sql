-- 20260520111334_lifetime_install_scan_credits.down.sql

drop table if exists install_scan_credits;

drop index if exists quota_events_install_id_idx;

alter table quota_events
  drop column if exists install_id;

alter table scan_credits
  alter column free_remaining set default 1,
  alter column rewarded_remaining set default 0;
