-- 20260824154702_device_install_attribution.up.sql
--
-- Records where an install came from, so acquisition can be broken down in the
-- backoffice instead of only inside the Firebase console.
--
-- Every column is nullable with no default and nothing is backfilled. Devices
-- that installed before this shipped stay null, which reads as "we do not know"
-- rather than being silently folded into organic — a wrong channel number is
-- worse than a missing one.
alter table devices
  add column if not exists install_source text,
  add column if not exists install_medium text,
  add column if not exists install_campaign text,
  add column if not exists install_referrer_raw text,
  add column if not exists attribution_captured_at timestamptz,
  add column if not exists analytics_instance_id text;

comment on column devices.install_source is
  'Acquisition source for this install (utm_source, or a channel label). Null means never captured.';
comment on column devices.install_medium is 'utm_medium for this install, when known.';
comment on column devices.install_campaign is 'utm_campaign for this install, when known.';
comment on column devices.install_referrer_raw is
  'Verbatim Play install referrer / deep-link query, kept so a mis-parse can be re-read later.';
comment on column devices.attribution_captured_at is
  'When attribution was first recorded. Null for installs that predate attribution capture.';
comment on column devices.analytics_instance_id is
  'Firebase Analytics app instance id — the join key between this row and GA4/BigQuery.';

-- Channel rollups scan by source over a date window; partial so the index only
-- carries rows that actually have attribution.
create index if not exists devices_install_source_idx
  on devices (install_source, first_seen_at desc)
  where install_source is not null;
