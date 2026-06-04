# Engagement Growth Controls

This document tracks the backoffice-configurable control layer for LogMyPlate
engagement features. Phase 1 only exposes safe runtime configuration; mobile
behavior is added in later phases.

## Phase 1: Config Foundation

- Status: implemented, pending deployment.
- Runtime config key: `engagement_policy`.
- Default behavior: review prompts, interstitial ads, FCM push reminders,
  streaks, and scan rewards are disabled. Rewarded ad scan earning keeps the
  existing default cap of 5 scans per day unless changed in Growth Controls.
- Compatibility rule: old mobile builds ignore the new bootstrap field, and the
  API falls back to disabled defaults when the database row is missing or
  invalid.

## API And Bootstrap Compatibility

- `/v1/app/bootstrap` includes optional `engagementPolicy`.
- Existing bootstrap fields remain unchanged.
- Admin-only endpoints:
  - `GET /admin/engagement-policy`
  - `PUT /admin/engagement-policy`
  - `POST /admin/push-notifications/send`

## Admin Growth Controls

- Admin page: `Growth Controls`.
- Every save requires a reason and writes an audit log entry.
- The admin UI is a control surface. Growth features remain disabled unless
  their own policy toggles and mobile support are both active.

## Phase 2: Firebase Analytics Foundation

- Status: implemented locally, pending deployment and mobile release.
- Runtime policy section: `engagement_policy.analytics`.
- Default behavior: analytics policy, Firebase collection, and debug logging are
  disabled.
- Mobile behavior:
  - Firebase initializes only when dart-define Firebase options are present.
  - Missing Firebase options leave analytics as a no-op.
  - Backoffice policy controls global enablement, Firebase reporting, debug
    logging, sampling, and individual event gates.
  - Logged events are sanitized and avoid raw email, profile id, tokens, meal
    names, food photo data, and free-form user text.
- Core events wired:
  - app open
  - bootstrap loaded
  - tab selected
  - scan started
  - scan analysis succeeded/failed
  - scan confirmed
  - manual meal saved
  - meal updated/deleted
  - rewarded ad started/earned/failed
  - account gate shown
  - account linked
  - health target saved

## Validation And Tests

- Completed checks:
  - `pnpm db:validate`
  - `pnpm --filter @logmyplate/contracts typecheck`
  - `pnpm --filter @logmyplate/contracts build`
  - `pnpm --filter @logmyplate/api test`
  - `pnpm --filter @logmyplate/api typecheck`
  - `pnpm --filter @logmyplate/admin typecheck`

## Phase 3: Review Prompt Mobile Runtime

- Status: implemented and verified, pending mobile release.
- Runtime policy section: `engagement_policy.reviewPrompt`.
- Default behavior: disabled.
- Mobile behavior:
  - Confirmed AI scans are counted locally after successful scan confirmation.
  - Manual meals do not count toward review prompt eligibility.
  - The prompt only appears when the backoffice policy is enabled and local
    eligibility passes confirmed scan count, active day count, cooldown, and
    once-per-app-version gates.
  - Store URLs and prompt copy come from Growth Controls.
  - Missing or invalid store URLs suppress the prompt instead of breaking scan
    confirmation.
  - Legacy bootstrap payloads continue to parse with disabled review prompt
    defaults.

## Phase 4: Interstitial Ads Mobile Runtime

- Status: implemented locally, pending deployment and mobile release.
- Runtime policy section: `engagement_policy.interstitialAds`.
- Default behavior: disabled.
- Mobile behavior:
  - Confirmed AI scans are counted locally after successful scan confirmation.
  - Manual meals do not count toward interstitial placement eligibility.
  - Review prompts take priority; interstitials are skipped on scans where a
    review prompt is shown.
  - The app checks first-ad threshold, scans-between-ads spacing, cooldown,
    daily cap, and premium exclusion before attempting to show an ad.
  - Platform ad unit IDs come from Growth Controls first, then dart defines.
  - Debug/simulator builds can use Google test interstitial IDs.
  - Release builds do not fall back to test interstitial IDs; missing production
    IDs suppress the ad without affecting scan confirmation.
  - Ad load/show failures are diagnostics-only and do not interrupt the saved
    meal flow.

## Phase 4B: Rewarded Scan Unlock Controls

- Status: implemented locally, pending deployment.
- Runtime policy section: `engagement_policy.rewardedAds`.
- Default behavior: signed-in users can earn up to 5 rewarded scan credits per
  day.
- Admin behavior:
  - Growth Controls exposes `Rewarded Unlocks`.
  - `dailyScanLimit` controls the maximum rewarded scan credits granted per
    profile/install local day.
- API behavior:
  - `/v1/app/bootstrap` reports the configured cap in `rewardedAdProgress`.
  - `/v1/ads/rewarded/complete` enforces the configured cap server-side.
  - Missing legacy policy config falls back to 5.

## Phase 5: FCM Push Notification Runtime

- Status: implemented and manually verified; scheduled runner implemented
  locally, pending deployment and scheduler activation.
- Runtime policy section: `engagement_policy.notifications`.
- Default behavior: disabled.
- Mobile behavior:
  - The app does not schedule local reminders.
  - When `notifications.enabled` is true and Firebase options are present, the
    app requests push permission and registers its FCM token with
    `PUT /v1/devices/push-token`.
  - When `notifications.enabled` is false, the app does not request push
    permission or register tokens.
  - Token registration is diagnostics-only and does not affect bootstrap,
    journal loading, meal confirmation, or target save flows.
  - Android declares `POST_NOTIFICATIONS` for Android 13+ runtime permission.
  - iOS declares an APNs entitlement through `$(APS_ENVIRONMENT)` with Debug as
    development and Release/Profile as production.
- Backend behavior:
  - Push tokens are stored in `push_notification_tokens`.
  - Scheduled reminder attempts are tracked in `push_reminder_runs` and
    `push_reminder_deliveries`.
  - Raw tokens are treated as sensitive and are not returned through bootstrap.
  - Manual admin sends use `POST /admin/push-notifications/send`.
  - Broadcast sends require `confirmAll = SEND_TO_ALL`.
  - Firebase server credentials are optional at boot; sends return
    `push_provider_not_configured` until configured.
  - Scheduled sends use `GET /internal/cron/push-reminders` with
    `Authorization: Bearer <CRON_SECRET>`.
  - The runner reads Growth Controls notification scenario timing, quiet hours,
    daily cap, target requirements, target-reached suppression, and message
    copy.
  - Each scenario is sent at most once per user local day.
  - Target setup can use a primary and secondary window, allowing up to two
    target setup reminders per user local day when the user has not set a
    target.
  - Invalid/unregistered FCM tokens are disabled after failed delivery.
  - Scheduler run and delivery history is retained for 14 days, then cleaned up
    by the runner.
- Scheduler operations:
  - Required API env: `CRON_SECRET`, `FIREBASE_PROJECT_ID`, and
    `FIREBASE_SERVICE_ACCOUNT_JSON_BASE64` or `FIREBASE_SERVICE_ACCOUNT_JSON`.
  - Recommended free scheduler: GitHub Actions workflow
    `.github/workflows/push-reminders.yml`, running every 15 minutes.
  - Required GitHub secret: `LOGMYPLATE_CRON_SECRET`, with the same value as the
    API `CRON_SECRET`.
  - Optional GitHub variable: `LOGMYPLATE_API_URL`; defaults to
    `https://logmyplate-api.vercel.app`.
  - Dry run:

    ```sh
    curl -H "Authorization: Bearer $CRON_SECRET" \
      "https://logmyplate-api.vercel.app/internal/cron/push-reminders?dryRun=1&limit=50"
    ```

  - Live run:

    ```sh
    curl -H "Authorization: Bearer $CRON_SECRET" \
      "https://logmyplate-api.vercel.app/internal/cron/push-reminders?limit=500"
    ```

  - Run from a scheduler every 10-15 minutes. If using Vercel Cron is not
    available on the current plan, use an external HTTPS scheduler with the same
    bearer header.

- Verification:
  - `pnpm db:validate`
  - `pnpm --filter @logmyplate/api test`
  - `pnpm --filter @logmyplate/api typecheck`

## Phase 6: Streak Runtime Summary And Today UI

- Status: implemented locally, pending deployment and mobile release.
- Runtime policy section: `engagement_policy.streaks`.
- Default behavior: disabled.
- Backend behavior:
  - `/v1/app/bootstrap` now includes `streakSummary`.
  - Streaks are computed from existing meal dates; no new migration is required.
  - Current streak stays alive from yesterday until the user has a chance to log
    today.
  - Longest streak, achieved milestone, next milestone, and next configured scan
    reward amount are returned as read-only summary data.
  - Scan rewards are not auto-granted in this phase; granting requires a future
    idempotent reward ledger.
- Mobile behavior:
  - Old bootstrap payloads parse with disabled streak defaults.
  - When backoffice streaks are disabled, the existing weekly rhythm card keeps
    its previous behavior.
  - When enabled and the user has logging history, Today shows a compact
    `Streak & rhythm` card with current streak, weekly segments, best streak,
    next milestone, and configured next reward.
  - The card uses existing LogMyPlate light/dark theme tokens.

## Next-Phase Readiness

- Phase 7: idempotent streak scan reward ledger and milestone celebration sheet.
