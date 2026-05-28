-- 20260528180840_app_update_policy_runtime_config.up.sql
insert into app_runtime_config (key, value, description, updated_by)
values (
  'app_update_policy',
  '{
    "enabled": false,
    "ios": {
      "latestBuild": 0,
      "minSupportedBuild": 0,
      "latestVersion": "1.0.0",
      "storeUrl": "https://apps.apple.com/app/id6770872606",
      "optionalTitle": "Update available",
      "optionalMessage": "A newer LogMyPlate version is available with the latest fixes and improvements.",
      "mandatoryTitle": "Update required",
      "mandatoryMessage": "Please update LogMyPlate to continue. This version is no longer supported."
    },
    "android": {
      "latestBuild": 0,
      "minSupportedBuild": 0,
      "latestVersion": "1.0.0",
      "storeUrl": "https://play.google.com/store/apps/details?id=com.logmyplate.app",
      "optionalTitle": "Update available",
      "optionalMessage": "A newer LogMyPlate version is available with the latest fixes and improvements.",
      "mandatoryTitle": "Update required",
      "mandatoryMessage": "Please update LogMyPlate to continue. This version is no longer supported."
    }
  }'::jsonb,
  'Controls optional and mandatory mobile update prompts by platform build number.',
  'migration'
)
on conflict (key) do nothing;
