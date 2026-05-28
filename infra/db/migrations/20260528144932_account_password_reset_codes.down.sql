-- 20260528144932_account_password_reset_codes.down.sql

drop index if exists account_password_reset_codes_profile_idx;
drop index if exists account_password_reset_codes_email_idx;
drop table if exists account_password_reset_codes;
