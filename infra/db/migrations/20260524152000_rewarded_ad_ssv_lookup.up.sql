-- 20260524152000_rewarded_ad_ssv_lookup.up.sql

create index rewarded_ad_callbacks_profile_custom_data_idx
  on rewarded_ad_callbacks (profile_id, (raw_query ->> 'custom_data'))
  where verified_at is not null
    and raw_query ? 'custom_data';
