# Mobile UI/UX & Performance Audit

Date: 2026-07-03
Scope: `apps/mobile` — full pass over screens (12.5k lines), widgets (4k), theme
(537), state (1.2k). Goal: faster, smoother, more premium — **without changing
behaviour**. Every item lists the exact location and a low-risk fix.

## What is already good (do not touch)

- **Glass system is genuinely well engineered.** `GlassSurface` falls back to
  an opaque tint on Android (live `BackdropFilter` flickers there), and honours
  high-contrast and reduced-motion accessibility settings. Keep this design.
- **Notice discipline:** zero raw `SnackBar` calls; all 18 user notices go
  through the unified `LogMyPlateNotice` system.
- **Design tokens exist and are used**: `LogMyPlateSpacing` (202 usages),
  `LogMyPlateColors`, theme split light/dark, hero-surface abstraction.
- Launch already optimized (parallel init in `_initializeApp`).

---

## A. Performance findings (ranked by impact)

### A1. Camera screen rebuilds ~60fps the entire time it is open — HIGH

`camera_screen.dart:196` — an `AnimatedBuilder` on a repeating 2600ms
controller wraps the **entire Scaffold body**, so the whole screen (photo
preview `Image.memory`, hint field, buttons) rebuilds every frame while the
user frames a shot or types a hint.

**Fix:** move the `AnimatedBuilder` down to wrap only the element the
animation actually drives (the scan ring/sweep), and stop the controller
(`_controller.stop()`) while a photo preview is showing if the ring is hidden.
Zero visual change; large CPU/battery cut on the highest-dwell screen.

### A2. Analyzing screen: same pattern during the longest wait — HIGH

`analyzing_screen.dart:54` + `:415` — repeating controller + `AnimatedBuilder`
around the full stack, including the photo. During the 5–12 s analysis wait the
device burns CPU repainting the photo every frame — while also uploading.

**Fix:** scope the builder to the animated overlay only; wrap the static photo
in a `RepaintBoundary`.

### A3. Zero `RepaintBoundary` in the whole app — MEDIUM

Repeating animations + iOS `BackdropFilter` glass surfaces means blur regions
get re-sampled whenever anything nearby repaints.

**Fix:** add `RepaintBoundary` around (1) the photo previews, (2) glass cards
that sit under animated elements, (3) the Today meal list. A handful of
one-line wraps.

### A4. `Image.memory` decodes at full resolution — MEDIUM

All 4 call sites (`camera_screen:520`, `analyzing_screen:446`,
`review_meal_screen:268`, `glass_backdrop:24`) set `gaplessPlayback` (good)
but never `cacheWidth`. A 1600 px capture is decoded and held at full size
even for a small preview tile.

**Fix:** pass `cacheWidth: (logical width × devicePixelRatio)` per site
(e.g. review thumbnail ≈ 400–600 px). Cuts decode time and image memory ~4–10×.

### A5. Shell-wide rebuilds on every controller notify — MEDIUM/LOW

`app.dart:252-257` — `_mainShell` nests `AnimatedBuilder(auth)` ×
`AnimatedBuilder(journal)` around the whole shell; `JournalController` has 16
`notifyListeners` sites, several firing during scan/quota flows. The
`MaterialApp.builder` listener at `app.dart:170` is mostly fine (stable `child`
reference short-circuits the subtree).

**Fix (measured, not wholesale):** keep as-is for now; if profiling shows shell
jank during scans, split the journal controller's scan-progress notifications
from journal-data notifications, or scope screens with `ListenableBuilder` on
narrower `ValueNotifier`s. Do not refactor blindly — current app size tolerates
it.

### A6. Skeleton shimmer rebuilds ~20 boxes per frame — LOW

`today_screen.dart:686-739` — loading-only, so bounded; if touched, drive the
shimmer with a single `CustomPainter` or `ShaderMask` instead of rebuilding the
column. Optional.

### A7. Plain `ListView(` (11) vs `.builder` (3) — LOW

Today's meal list is small (≤ ~10 items/day) so children-lists are fine.
Verify only `weekly_journal_screen.dart` (1371 lines) — if it builds 7×meals
eagerly, convert that one to `.builder`/slivers.

---

## B. Design consistency (the "premium" gap)

### B1. 25 distinct corner-radius values — HIGH (for visual polish)

Distribution includes 99/100/999 pills plus 2,4,6,7,8,9,10,12,13,14,17,20,22,
24,26,28,30,32,34. Premium UIs read "designed" because radii come from a scale.

**Fix:** add radius tokens to the theme —
`xs 4 · sm 8 · md 12 · lg 20 · xl 28 · pill 999` — and map each usage to the
nearest token (9→8, 10→8 or 12, 13/14→12, 17→20, 22→20, 24/26→28, 30/32/34→28,
99/100→pill). Mechanical, reviewable diff; visual change is subtle but
system-wide coherence is exactly what "premium" feels like.

### B2. 278 direct `Colors.*` + 21 raw `Color(0x…)` outside the theme — MEDIUM

Mostly `Colors.white/black.withValues(alpha: …)` scrims and dividers. Each is a
dark-mode/contrast risk and drifts tone independently.

**Fix:** add semantic tokens (`scrim`, `hairline`, `overlayStrong`, …) to
`LogMyPlateColors`/glass theme and migrate file-by-file. Prioritize paywall,
today, camera (the "money" screens).

### B3. Spacing tokens bypassed in ~35% of cases — MEDIUM

202 tokenized vs 111 raw `EdgeInsets` literals. Migrate opportunistically when
touching a file; don't do a big-bang pass.

### B4. Motion scale — LOW

Durations cluster well (140–260 ms) but are ad-hoc per file. Add three tokens
(`fast 140 · standard 200 · gentle 260`) + one curve pair, use everywhere. Makes
all transitions feel related.

### B5. 12 inline `TextStyle(` — LOW

Move into the text theme when touching those files.

---

## C. UX polish (highest perceived-quality wins)

### C1. Haptics are almost absent — HIGH, trivially cheap

One `HapticFeedback` call in the entire app (chat). Premium apps confirm
physical moments physically:

- capture/pick photo → `lightImpact`
- analysis complete → `mediumImpact`
- meal confirmed → `lightImpact`
- plan selected / purchase success on paywall → `selectionClick` / `mediumImpact`
- destructive confirm (delete meal/account) → `heavyImpact`

~6 one-liners; disable when `MediaQuery.disableAnimations` (a11y) if desired.

### C2. Analyzing wait shows no progress stages — HIGH

The wait is 5–12 s (longest UX moment in the app) with a generic animation.
Perceived latency drops sharply when the copy tracks reality:

1. "Uploading photo…" (until analyze request returns)
2. "Identifying dishes…"
3. "Estimating portions & nutrition…"

Stage 1→2 can key off the real upload completion; 2→3 on a timer. No API
change needed.

### C3. Icon-only controls lack semantics — MEDIUM (a11y)

3 `Semantics`/`semanticLabel` usages app-wide. Add labels to the scan FAB,
close/dismiss buttons, tab icons. Cheap, and App Store reviewers increasingly
notice VoiceOver dead-ends on paywalls specifically.

### C4. Pull-to-refresh only on Today — LOW

`RefreshIndicator` exists only in `today_screen.dart:91`. Users will try the
same gesture on the weekly journal; add it there for consistency.

---

## Suggested execution batches (all zero-behaviour-change)

| Batch           | Items                                       | Risk                                             | Payoff                                          |
| --------------- | ------------------------------------------- | ------------------------------------------------ | ----------------------------------------------- |
| 1. Perf scoping | A1, A2, A3, A4                              | Very low (mechanical)                            | Battery + smoothness on the two hottest screens |
| 2. Feel         | C1 haptics, C2 analyzing stages             | Very low                                         | Biggest perceived-quality jump per line of code |
| 3. Tokens       | B1 radius scale, B4 motion tokens           | Low (subtle visual diffs — eyeball before/after) | System-wide "designed" coherence                |
| 4. Hygiene      | B2/B3/B5 migrations, C3 semantics, A7 check | Low, incremental                                 | Long-term consistency                           |

Batches 1–2 are safe to ship inside the 1.0.2 release. Batch 3 changes pixels
(slightly) — do it when you can visually review screens in both themes.
