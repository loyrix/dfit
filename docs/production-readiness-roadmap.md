# LogMyPlate Production Readiness Roadmap

Date: 2026-05-19

This document captures the current production-readiness decisions so we can execute them phase by phase without losing context.

## Current Decisions

- App icon and logo will be handled at the very last stage.
- Android release readiness will wait until after the iOS launch path is stable.
- Apple and Google login buttons should become functional, not hidden permanently.
- Auth session tokens must move from plain shared preferences to secure device storage.
- Account deletion must delete the user account and all related user data.
- Privacy policy, terms, disclaimers, and legal copy need to stay aligned with
  subscriptions, rewarded ads, push tokens, and account deletion before launch.
- Backend rate limiting is required, but the exact limits need product discussion before implementation.
- Pre-AI image validation is required to reduce bad UX and avoid wasting Gemini calls.
- Mobile API client needs production-grade timeout/retry handling.
- Vercel production domain/env validation remains part of release readiness.
- Subscriptions, rewarded ads, and server-side push notification controls now
  have implementation baselines and need production store/provider verification.
- Current launch quota path: new installs receive 3 initial scans; free users can
  earn scans through rewarded ads when enabled; Premium receives 300 scans per
  month with a maximum of 10 scans per day.

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

Documents to maintain:

- Privacy Policy.
- Terms of Service.
- AI/Nutrition Accuracy Disclaimer.
- Data Deletion Policy.
- Subscription, RevenueCat, rewarded ads, app-store purchase, and push-token
  disclosures.

Important facts to include:

- Photos are used for analysis and saved with meal logs.
- AI-generated nutrition estimates may be inaccurate and should not be treated as medical advice.
- Users can delete their account and associated data.
- Data processors include hosting/database/storage/AI providers once finalized.
- RevenueCat and app stores are used for subscription entitlement and purchase
  lifecycle handling; LogMyPlate does not store full payment card details.
- Push reminders use platform device tokens. iOS routes through APNs; Android
  routes through FCM.
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

Goal: verify monetization end to end before production launch.

Current quota source of truth:

- Launch free allowance is 3 initial scan credits.
- Install-aware quota uses `install_scan_credits` when the app sends an install ID.
- Profile fallback quota uses `scan_credits` with the sentinel date `1970-01-01`.
- Anonymous users who exhaust initial free credits are routed to account linking
  before more scan unlock options.
- Signed-in free users can unlock rewarded scan credits after quota exhaustion.
- Premium users receive 300 scans per month with a maximum of 10 scans per day.

Current rewarded ad rule:

- 1 completed rewarded ad = 1 rewarded scan credit.
- Rewarded scan credits are capped at 5 scans per local day.
- Rewarded ad completions and grants are tracked server-side; mobile uses AdMob test ad units until production IDs are supplied.
- app-ads.txt should be hosted at the root of the developer website listed for each app. The current AdMob publisher line is `google.com, pub-6936425975956435, DIRECT, f08c47fec0942fa0`.

Current subscription rule:

- RevenueCat manages offerings and entitlements.
- Backend stores Premium entitlement state from RevenueCat sync and webhooks.
- Current Premium entitlement ID is `premium`.
- Store products are monthly, quarterly, and annual.
- Launch pricing target is India-led: Rs 299/month, Rs 799/quarter, and
  Rs 2,499/year, with global storefront prices localized from that base rather
  than premium-marked-up by region during early launch.

Remaining production verification:

- App Store subscription products must be approved before production purchases.
- Google Play subscription configuration can remain pending until Android launch,
  but RevenueCat Play Store credentials must be validated before Android paid
  launch.
- RevenueCat production offerings must point at approved store products; Test
  Store products can be used for local or pre-approval flow testing only.
- Full AdMob server-side verification should be enabled before live ad unit IDs.
- App Store privacy details and Google Play Data safety forms must match the
  Privacy Policy.

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
