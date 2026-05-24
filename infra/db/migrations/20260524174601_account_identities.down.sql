-- 20260524174601_account_identities.down.sql

drop index if exists account_identities_profile_idx;
drop table if exists account_identities;
