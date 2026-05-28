# App Update Policy

LogMyPlate controls optional and mandatory mobile update prompts from the admin backoffice.

## Runtime Flow

1. The mobile app sends installed build metadata on API requests:
   - `x-logmyplate-platform`
   - `x-logmyplate-app-version`
   - `x-logmyplate-app-build`
2. `/v1/app/bootstrap` reads `app_runtime_config.app_update_policy`.
3. The API compares the current build to the platform policy and returns `updatePolicy`.
4. The mobile app shows:
   - no prompt when `status` is `current`
   - a dismissible prompt when `status` is `optional`
   - a blocking prompt when `status` is `mandatory`

## Admin Fields

For each platform:

- `latestBuild`: Builds below this value receive an optional update prompt.
- `minSupportedBuild`: Builds below this value receive a mandatory blocking prompt.
- `latestVersion`: Display-only version label.
- `storeUrl`: App Store or Play Store URL opened by the update button.

Set `enabled` to `false` to disable prompts without changing the saved version rules.

## Release Guidance

Ship the app update-policy client first. Older builds that do not send build metadata are treated as current so they are not accidentally blocked by a feature they cannot understand.

After enough users have upgraded, set `latestBuild` for optional nudges. Only raise `minSupportedBuild` when a backend or data-contract change truly breaks older app behavior.
