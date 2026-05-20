# LogMyPlate Production Readiness Roadmap

Date: 2026-05-19

This document captures the current production-readiness decisions so we can execute them phase by phase without losing context.

## Current Decisions

- App icon and logo will be handled at the very last stage.
- Android release readiness will wait until after the iOS launch path is stable.
- Apple and Google login buttons should become functional, not hidden permanently.
- Auth session tokens must move from plain shared preferences to secure device storage.
- Account deletion must delete the user account and all related user data.
- Privacy policy, terms, disclaimers, and legal copy need to be created before launch.
- Backend rate limiting is required, but the exact limits need product discussion before implementation.
- Pre-AI image validation is required to reduce bad UX and avoid wasting Gemini calls.
- Mobile API client needs production-grade timeout/retry handling.
- Vercel production domain/env validation remains part of release readiness.
- Subscriptions and ads are not implemented yet and need their own product/backend/store design discussion.
- Current launch scan quota is lifetime-based, not daily: 3 free scan credits per install/profile, no automatic daily reset, no rewarded ad credits yet.

## Phase 1: Auth Hardening

Goal: make the existing email auth flow safer before expanding provider auth.

Work:

- Replace `SharedPreferences` auth token storage with secure storage.
- Add migration logic so existing local sessions can be moved or cleared safely.
- Keep device identity storage separate because anonymous install identity does not need the same security treatment as auth tokens.
- Add mobile tests for session save/load/clear behavior.

Acceptance:

- Email login still works.
- Logout clears secure session.
- App does not keep access tokens in plain shared preferences.

## Phase 2: Account Deletion

Goal: provide an in-app deletion flow that removes the account and user data.

Work:

- Add backend delete-account endpoint.
- Delete profile-owned meals, meal items, nutrition rows, scan sessions, scan credits, idempotency records, account sessions, password credentials, identity links, and stored meal images.
- Add a profile screen action with clear confirmation copy.
- Make deletion idempotent where possible.
- Add API and mobile tests.

Acceptance:

- A signed-in user can delete the account from the app.
- Related DB rows and meal images are removed.
- Local auth session is cleared after deletion.

## Phase 3: Apple And Google Sign-In

Goal: make the visible provider login buttons real.

Recommended approach:

- Keep the current backend-owned account/profile model.
- Mobile obtains Apple/Google identity token.
- Backend verifies the provider token, links or creates a LogMyPlate profile, and returns the same app session shape used by email auth.

Apple prerequisites:

- Apple Developer account access.
- Confirm final iOS bundle ID, currently `com.logmyplate.app`.
- Enable Sign in with Apple capability for the app identifier.
- Xcode signing/capability setup.
- Backend verification against Apple identity token audience.

Google prerequisites:

- Google Cloud or Firebase project.
- OAuth consent screen configured.
- iOS OAuth client for bundle ID `com.logmyplate.app`.
- Reversed client ID added to iOS URL schemes.
- Web client ID if backend verification flow needs it.
- Android OAuth client can wait until Android launch work.

Acceptance:

- Apple login works on iOS device.
- Google login works on iOS device.
- Existing anonymous meals link to the signed-in profile.
- Existing email auth remains functional.

## Phase 4: Privacy, Terms, And Legal Copy

Goal: produce launch-ready policy documents aligned with actual app behavior.

Documents to create:

- Privacy Policy.
- Terms of Service.
- AI/Nutrition Accuracy Disclaimer.
- Data Deletion Policy.
- Subscription and ads terms later, once monetization is finalized.

Important facts to include:

- Photos are used for analysis and saved with meal logs.
- AI-generated nutrition estimates may be inaccurate and should not be treated as medical advice.
- Users can delete their account and associated data.
- Data processors include hosting/database/storage/AI providers once finalized.
- The app is not a replacement for a doctor, dietitian, or medical professional.

Note:

- We can draft strong practical documents in-repo, but final public legal copy should be reviewed before launch.

## Phase 5: Backend Rate Limiting

Goal: protect cost, abuse, and API availability.

Items to decide:

- Per install ID, per profile, and per IP limits.
- Separate limits for cheap routes and expensive routes.
- Whether limits should be stricter for anonymous users.

Initial recommendation for discussion:

- `/v1/scans/prepare`: moderate per-install/IP limit.
- `/v1/scans/:id/analyze`: strict per-install/profile/IP limit because this can call Gemini.
- Auth endpoints: strict per-email/IP limit.
- Journal reads: generous but capped.
- Manual meal writes/deletes: moderate per-profile limit.

Acceptance:

- Gemini calls cannot be spammed beyond quota/rate limits.
- Legit normal users do not hit limits during normal testing.
- Rate-limit responses are clear and retryable.

## Phase 6: Pre-AI Image Validation

Goal: reject clearly bad images before spending AI cost.

Recommended split:

- Client-side: validate file size, dimensions, brightness, contrast, and blur/sharpness.
- Backend-side: enforce byte size, mime type, image dimensions if available, and no-food/no-items handling.
- AI-side: if Gemini returns no visible food, do not consume scan credit and show a friendly recapture message.

Open discussion:

- True food/non-food detection before Gemini may require a lightweight classifier or a cheaper model. We should compare cost, accuracy, and implementation complexity before adding it.

Acceptance:

- Very blurry/dark/tiny images are rejected before analysis.
- Non-food or empty analysis does not consume scan credit.
- User gets a premium recapture flow instead of a broken review screen.

## Phase 7: Mobile API Reliability

Goal: prevent slow APIs from feeling frozen.

Work:

- Add shared timeout wrapper for all API calls.
- Add retry rules only for safe/idempotent cases.
- Preserve idempotency keys for retryable write flows.
- Add structured API error types with request IDs when backend supports them.
- Improve loading and retry UI where needed.

Acceptance:

- Slow network shows clear loading/retry states.
- Writes do not duplicate meals.
- Scan and confirm flows fail gracefully.

## Phase 8: Subscriptions And Ads

Goal: design monetization cleanly before implementation.

Current quota source of truth:

- Launch free allowance is 3 lifetime scan credits, not 3 scans per day.
- Install-aware quota uses `install_scan_credits` when the app sends an install ID.
- Profile fallback quota uses `scan_credits` with the sentinel date `1970-01-01`.
- Current `/v1/config` reports `freeLifetime: 3`, `rewardedCap: 0`, and `launchTotalCap: 3`.
- Anonymous users who exhaust free lifetime credits are routed to account linking before more scan unlock options.

Discussion needed:

- Rewarded ad credit rules after lifetime free credits are exhausted.
- Whether rewarded ad credits reset daily, weekly, or remain capped per account/install.
- Max rewarded scans per user period after signup.
- Premium scan limits.
- Premium features: ad-free, macro insights, micronutrient profile, weekly reports, advanced analytics.
- App Store / Play Store subscription products.
- Server-side entitlement validation.
- Abuse prevention for rewarded ads.

Recommendation:

- Treat this as a separate architecture/product phase because it touches mobile UI, backend entitlements, store products, analytics, and legal terms.

## Final Launch Checklist

- Final app icon and launch assets.
- iOS App Store screenshots and metadata.
- Privacy policy URL and in-app privacy access.
- Account deletion flow.
- Apple/Google/email auth verified on real device.
- Production API domain verified.
- Production Vercel envs verified.
- Supabase DB migrations deployed.
- Supabase storage bucket verified.
- Gemini production key/model verified.
- Rate limiting enabled.
- No-food/no-credit behavior verified.
- Full local quality gate passes.
- TestFlight smoke test passes on fresh install and returning user install.
