-- 20260520151406_isolate_account_scan_credits.up.sql
-- Move any account-owned credits that were previously attached to an install
-- into the lifetime profile quota row, then clear install-only rewards so
-- logout cannot expose signed-in ad rewards to anonymous usage.
insert into scan_credits (
  profile_id,
  local_date,
  free_remaining,
  rewarded_remaining,
  premium_remaining
)
select
  install_scan_credits.profile_id,
  date '1970-01-01',
  install_scan_credits.free_remaining,
  install_scan_credits.rewarded_remaining,
  install_scan_credits.premium_remaining
from install_scan_credits
inner join profiles on profiles.id = install_scan_credits.profile_id
where profiles.auth_method <> 'anonymous'
on conflict (profile_id, local_date) do update
set
  free_remaining = least(scan_credits.free_remaining, excluded.free_remaining),
  rewarded_remaining = scan_credits.rewarded_remaining + excluded.rewarded_remaining,
  premium_remaining = greatest(scan_credits.premium_remaining, excluded.premium_remaining),
  updated_at = now();

update install_scan_credits
set
  profile_id = null,
  free_remaining = 0,
  rewarded_remaining = 0,
  premium_remaining = 0,
  updated_at = now()
from profiles
where profiles.id = install_scan_credits.profile_id
  and profiles.auth_method <> 'anonymous';
