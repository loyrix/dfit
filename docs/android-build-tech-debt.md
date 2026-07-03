# Android Build Tech Debt

Date: 2026-07-01
Scope: Warnings emitted by `scripts/mobile/build-android-play-release.sh`
(`flutter build appbundle --release`).

**None of these currently block the build.** The 1.0.2 (build 20) release AAB
compiles and bundles successfully. This document captures the debt, its
severity, and the concrete trigger that turns each item from "warning" into
"must fix" so we can act at the right time instead of reacting to a broken
build.

## Current toolchain snapshot

| Component             | Version                        | Notes                                          |
| --------------------- | ------------------------------ | ---------------------------------------------- |
| Flutter               | `3.46.0-1.0.pre-223`           | **`main` channel** (pre-release), not `stable` |
| Gradle                | `8.14`                         | Current                                        |
| Android Gradle Plugin | `8.11.1`                       | Current                                        |
| Kotlin (KGP)          | `2.2.20`                       | Declared in `android/settings.gradle.kts`      |
| App Java level        | `17` (source/target/jvmTarget) | Modern, correct                                |
| minSdk / compileSdk   | `24` / Flutter default         | Fine                                           |

---

## Item 0 (root cause) — Release builds run on the Flutter `main` channel

**This is why every deprecation below is showing up now.** `main` is where
Flutter lands breaking changes first; `stable` users will not see the KGP
failure until a much later date.

- **Severity:** High (process risk, not a code bug).
- **Why it matters:** Shipping production AABs from a nightly/dev channel means
  unreviewed engine/tooling changes can silently affect a live release. It also
  makes "future versions will fail to build" arrive early and unpredictably.
- **Recommended action:** Pin release builds to the `stable` channel
  (`flutter channel stable && flutter upgrade`). Keep `main` only for local
  experimentation, never for Play uploads.
- **Trigger to act:** Before the _next_ release after 1.0.2. Do not let this
  1.0.2 release be blocked on it — the current build already works.
- **Effort:** Low. Risk: needs a full re-test pass after switching channels.

---

## Item 1 — Kotlin Gradle Plugin → Built-in Kotlin (APP side)

Warning: _"applies the Kotlin Gradle Plugin, which will cause build failures in
future versions of Flutter."_

- **Owner:** Us. This is our `android/app/build.gradle.kts` (`id("kotlin-android")`)
  and `android/settings.gradle.kts`
  (`id("org.jetbrains.kotlin.android") version "2.2.20" apply false`).
- **Severity:** Medium. Warning today; a hard build failure in a future Flutter
  version.
- **Fix:** Follow the official guide
  (https://docs.flutter.dev/release/breaking-changes/migrate-to-built-in-kotlin/for-app-developers)
  — remove the explicit KGP declaration/apply and let Flutter's built-in Kotlin
  manage it. Small, self-contained change we fully control.
- **Trigger to act:** Whichever comes first —
  1. we next touch Android Gradle config for any reason, or
  2. a Flutter version we want to adopt escalates this to an error.
     On `main` channel this could arrive sooner, which is another reason to do
     Item 0 first.
- **Effort:** Low. Risk: Low–Medium (verify a clean release build after).

## Item 2 — Kotlin Gradle Plugin → Built-in Kotlin (PLUGIN side)

Warning lists 10 plugins that still apply KGP: `firebase_analytics`,
`google_sign_in_android`, `image_picker_android`, `package_info_plus`,
`purchases_flutter`, `share_plus`, `shared_preferences_android`,
`sign_in_with_apple`, `url_launcher_android`, `webview_flutter_android`.

- **Owner:** Upstream plugin authors. **We cannot fix these directly.**
- **Severity:** Medium, but out of our hands. All 10 are mainstream, actively
  maintained plugins; they will migrate before Flutter stable makes this fatal.
- **Fix (ours):** Keep dependencies current (`flutter pub upgrade`,
  `flutter pub outdated`) and adopt versions that ship the migration. Only file
  upstream issues if a plugin lags badly near the deadline.
- **Trigger to act:** When a Flutter version we need escalates KGP to an error
  AND a plugin has no migrated release — that is the only scenario where we are
  actually blocked. Mitigate proactively by staying on `stable` (Item 0), where
  the deadline lands later and plugins have time to catch up.
- **Effort:** Low ongoing (dependency hygiene). Risk: external dependency.

## Item 3 — `source/target value 8 is obsolete`

Warning: _"source value 8 is obsolete... target value 8 is obsolete."_

- **Owner:** Upstream. Our app already compiles at Java 17
  (`compileOptions`/`kotlinOptions` in `build.gradle.kts`). These warnings come
  from a **dependency/plugin** still compiling at Java 8, not from our code.
- **Severity:** Low. "Obsolete" refers to a future JDK removal, not a near-term
  break.
- **Fix:** None for us today; resolves as plugins raise their Java baseline.
- **Trigger to act:** Only if a future JDK we must use drops Java 8 source
  support and a dependency still targets it. Not actionable now.
- **Effort:** None (monitor only).

## Item 4 — `deprecated API` notes

Warning: _"Some input files use or override a deprecated API. Recompile with
-Xlint:deprecation for details."_

- **Owner:** Mostly upstream plugin/generated code.
- **Severity:** Low (cosmetic). Deprecated ≠ removed.
- **Fix:** No action required. If we ever want to see which APIs, add
  `-Xlint:deprecation`, but it is noise for a release build.
- **Trigger to act:** Only if a specific deprecated API is announced for removal
  in a compileSdk we adopt.
- **Effort:** None (monitor only).

## NOT tech debt — Font tree-shaking

Message: _"Font asset MaterialIcons-Regular.otf was tree-shaken, reducing it
from 1645184 to 9152 bytes (99.4% reduction)."_

This is **informational and desirable** — Flutter is stripping unused icon
glyphs to shrink the app. No action. Listed here only so it is not mistaken for
a problem.

---

## Priority summary

| Priority | Item                                  | Action                          | When                                         |
| -------- | ------------------------------------- | ------------------------------- | -------------------------------------------- |
| 1        | Item 0 — `main` channel               | Move release builds to `stable` | Before next release after 1.0.2              |
| 2        | Item 1 — app KGP migration            | Migrate to Built-in Kotlin      | Next Android config touch, or when it errors |
| 3        | Item 2 — plugin KGP                   | Keep deps current; monitor      | Ongoing; act only if blocked                 |
| 4        | Items 3 & 4 — Java 8 / deprecated API | Monitor only                    | Only if a required JDK/SDK forces it         |
| —        | Font tree-shaking                     | None (good behavior)            | —                                            |

**Bottom line:** Ship 1.0.2 now — nothing here blocks it. The single most
valuable follow-up is Item 0 (get off `main`); the only item that is truly ours
to fix in code is Item 1, and it is low-effort and non-urgent.
