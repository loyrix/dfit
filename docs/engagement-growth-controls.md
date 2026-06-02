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
- The admin UI is only a control surface in Phase 1; it does not activate mobile
  behavior until later app releases consume the policy.

## Validation And Tests

- Completed checks:
  - `pnpm db:validate`
  - `pnpm --filter @logmyplate/contracts typecheck`
  - `pnpm --filter @logmyplate/contracts build`
  - `pnpm --filter @logmyplate/api test`
  - `pnpm --filter @logmyplate/api typecheck`
  - `pnpm --filter @logmyplate/admin typecheck`

## Next-Phase Readiness

- Phase 2: Firebase Analytics consumes policy and consent gates.
- Phase 3: interstitial ads read placement, caps, cooldown, and ad unit ids.
- Phase 4: native review prompt reads eligibility, copy, cooldown, and store
  URLs.
- Phase 5: local notifications read scenarios, quiet hours, copy, and daily cap.
- Phase 6: streaks read milestones and scan reward settings.
