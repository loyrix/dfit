# Engagement Growth Controls

This document tracks the backoffice-configurable control layer for LogMyPlate
engagement features. Phase 1 only exposes safe runtime configuration; mobile
behavior is added in later phases.

## Phase 1: Config Foundation

- Status: implemented, pending deployment.
- Runtime config key: `engagement_policy`.
- Default behavior: review prompts, interstitial ads, notifications, streaks,
  and scan rewards are disabled.
- Compatibility rule: old mobile builds ignore the new bootstrap field, and the
  API falls back to disabled defaults when the database row is missing or
  invalid.

## API And Bootstrap Compatibility

- `/v1/app/bootstrap` includes optional `engagementPolicy`.
- Existing bootstrap fields remain unchanged.
- Admin-only endpoints:
  - `GET /admin/engagement-policy`
  - `PUT /admin/engagement-policy`

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

## Next-Phase Readiness

- Phase 5: local notifications read scenarios, quiet hours, copy, and daily cap.
- Phase 6: streaks read milestones and scan reward settings.
