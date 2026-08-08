# Meal Health Score — Implementation Plan & Tracker

> Implements [meal-health-score-logic.md](meal-health-score-logic.md) (Parts A–E) and
> [meal-health-score-worked-example.md](meal-health-score-worked-example.md).
>
> This supersedes the per-meal Plate Score described in
> [plate-score-and-scan-accuracy.md](plate-score-and-scan-accuracy.md). That document stays as
> the record of the accuracy work (Phases 0–1), which is unaffected.

**Update the tracker at the end of every phase.** A phase is only `Done` when its
verification gate passes.

---

## Decisions locked

| Decision                       | Value                                                 | Rationale                                                                                     |
| ------------------------------ | ----------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| User-facing rating             | **1–5 stars + guidance message.** Never a raw number. | A number implies precision a macro heuristic does not have, and invites anxious optimisation. |
| Primary surface                | **Daily**, then **Weekly**                            | A single plate should not be the headline judgement.                                          |
| Per-meal rating                | **Tap-through only**                                  | Supplementary detail, not the signal to act on.                                               |
| Daily score with 1 meal logged | **Show the star immediately.** Details later.         | User decision, 2026-08-08. Revisit after test round 1.                                        |
| Numeric scores                 | Computed and stored internally, never displayed       | Needed for tuning and analytics.                                                              |
| Branch                         | **`main`, direct**                                    | User decision. Pushes go to the production backend.                                           |
| Star thresholds                | Starting points, tunable                              | Re-check against real distribution after round 1.                                             |

---

## Backward compatibility rules

These are load-bearing: **the API is pushed straight to production.** Nothing below may break a
running app.

### What is live right now (verified 2026-08-08)

| Build                          | Scans | Last seen | Consumes `plateScore`?         |
| ------------------------------ | ----- | --------- | ------------------------------ |
| **1.0.1 build 27** (App Store) | 143   | today     | **No** — predates all score UI |
| 1.0.2 builds 21–23 (test)      | 198   | today     | Yes                            |
| 1.0.1 / 1.0.0 builds ≤ 26      | ~500  | historic  | No                             |

**The live App Store app does not read the score at all.** That is what makes reshaping the
score payload safe. The 1.0.2 test builds do read it and will be replaced by a new build.

### Rules

1. **Never remove or retype an existing response field.** Add only. Anything new is
   `.optional()` or `.default()`.
2. **Never make an existing request field required.** Old apps must keep posting what they
   post today and succeed.
3. **Migrations are additive**: nullable columns, or `not null` with a default. Every `.up.sql`
   needs a working `.down.sql`.
4. **Do not recompute stored `dailyCalorieTarget` for existing users.** Part A changes the goal
   maths from flat (−300/+250 kcal) to multiplicative (×0.80/×1.10). Rewriting 70 existing rows
   would silently move people's targets without them asking. Existing rows keep their value
   until the user next saves their profile.
5. **New scoring ships behind runtime config** so it can be switched off without a deploy,
   following the `engagement_policy` / `plate_score_policy` pattern.
6. **Scoring must never fail a scan or a journal load.** Every new computation is wrapped so its
   failure is non-fatal.
7. **Next build number is `1.0.2+28`.** Builds 21–23 already exist; 1.0.1 reached build 27.

---

## Known data blockers

These are real and must be handled, not assumed away.

| Blocker                     | State                                                                                                                   | Consequence                                                                                    |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| **Cooking method**          | Not captured. `preparation` is home/restaurant/packaged/unknown, which is _not_ fried/grilled/steamed/raw/baked/sauced. | B7 cooking modifier is inert until prompt v9.                                                  |
| **Per-nutrient confidence** | Not returned. One item-level `confidence` only.                                                                         | B7 multiplies each modifier by its own confidence; without it the safety mechanism is missing. |
| **Sugar coverage**          | **0 of 1,295** nutrition rows                                                                                           | Sugar penalty contributes nothing yet.                                                         |
| **Fiber coverage**          | **1 of 1,295** rows                                                                                                     | Fiber bonus contributes nothing yet.                                                           |

Fiber and sugar accumulate from every new scan following the micronutrient recovery work, so
coverage improves without further action. Cooking method and per-nutrient confidence need a
prompt change (Phase 6).

---

## Phase tracker

| #   | Phase                             | Scope                                                                                                                 | Status         |
| --- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------- | -------------- |
| 0   | Docs + build number               | Move spec docs into `docs/`, fix build-number collision                                                               | ✅ Done        |
| 1   | **Part A** — personalised targets | 5 activity levels, multiplicative goals, macro centres (goal × activity), BMI nudge, tolerance, target bands          | ✅ Done        |
| 2   | **Part A9** — manual override     | Custom macro split storage + precedence over computed bands, Part A wired into the API                                | ✅ Done        |
| 3   | **Part B** — per-meal rewrite     | `closeness()`, weighted base, skew penalty, protein bonus, fiber/sugar/cooking modifiers. **Drops the portion axis.** | ✅ Done        |
| 4   | **Part C** — daily score          | Aggregate grams, daily bands, calorie adherence, 0.7/0.3 blend, live from first meal                                  | ✅ Done        |
| 5   | **Part D** — weekly score         | Average of daily scores, consistency bonus, skip zero-meal days                                                       | ✅ Done        |
| 6   | **Part E** — stars + messages     | `score_to_stars`, guidance copy per level, demote per-meal to tap-through                                             | ✅ Done        |
| 7   | AI capture                        | Cooking method only — per-nutrient confidence proved unnecessary. Prompt v9, inactive until reviewed                  | ✅ Done        |
| 8   | Wire scoring + UI surfaces        | Scoring into the API, Today daily card, weekly card, meal tap-through, target page sliders                            | 🟡 In progress |
| 9   | Release                           | Full verification, backward-compat check, build `1.0.2+28`                                                            | ⬜ Not started |

Status values: ⬜ Not started · 🟡 In progress · ✅ Done · ⛔ Blocked

---

## Phase detail and verification gates

### Phase 1 — Part A: personalised targets

**Build**

- Add `extra_active` (×1.90) to the activity enum. Additive: old apps keep sending the four
  existing values.
- Goal factors become multiplicative: fat loss ×0.80, muscle gain ×1.10, maintenance ×1.00.
- Macro centre lookup by goal × activity (A5), BMI nudge (A6), tolerance 5 or 8 (A7),
  target bands (A8).
- New pure module in `packages/domain`. Nothing consumes it yet.

**Gate — passed 2026-08-08**

- ✅ `packages/domain/src/macro-targets.ts` + 39 tests. Domain suite 133 passing.
- ✅ Every one of the 15 goal × activity cells asserted individually, plus a check that each
  centre triple sums to 100. Both BMI-nudge branches and the additive-not-override property
  covered. All five activity factors and all three goal factors asserted.
- ✅ A9 override covered: replaces centres outright, forces tolerance 5, outranks the BMI nudge.
- ✅ **No existing behaviour changed.** `health-targets.ts`, `profiles.ts` and the profiles
  contract are untouched, and nothing consumes the new module yet, so runtime effect is zero.
  Stored targets snapshot for the record: 70 rows, sum 145,321 kcal, range 1,200–3,520.

**Gate amended — the worked example is not reproducible as written**

The original gate required reproducing `meal-health-score-worked-example.md` exactly. Its
arithmetic does not follow its own formulas, so that target was unreachable:

| Value           | Worked example | Part A formula |
| --------------- | -------------- | -------------- |
| BMR             | 1,346          | **1,380.25**   |
| TDEE            | 1,851          | **1,897.8**    |
| Target calories | 2,036          | **2,088**      |

The stated BMR corresponds to a height of ~159.5cm rather than the 165cm given, and the error
cascades. BMI (23.9), the macro centres, tolerance and all six band values **do** match.

`meal-health-score-logic.md` is therefore treated as authoritative and the worked example as an
illustration. Coding to reproduce it would have implemented Part A incorrectly. The same applies
to two `closeness()` values in its Meal 1 (see Phase 3).

### Phase 2 — Part A9: manual override

**Build**

- Nullable `custom_carb_pct` / `custom_fat_pct` / `custom_protein_pct` on
  `profile_health_targets`.
- When present, they replace computed centres entirely and tolerance becomes 5.

**Gate**

- Absent columns behave exactly as Phase 1. Migration verified against the 70 existing rows.

### Phase 3 — Part B: per-meal rewrite

**Build**

- `closeness(value, min, max, falloff=15)`, weighted base 0.40/0.35/0.25, skew penalty,
  protein density bonus (≤10), fiber bonus (≤8), sugar penalty (≤12), cooking modifier,
  all confidence-scaled where confidence exists.
- **Removes the calorie/portion axis from per-meal scoring**, which structurally fixes the
  "Portion size 0 on 29% of meals" problem rather than papering over it.

**Gate**

- All three worked-example meals reproduce: 71, 100 (capped), 33.
- Shared TS↔Dart vector fixture regenerated; both suites green.
- Missing nutrients still mean unknown, never zero.

### Phase 4 — Part C: daily score

**Gate**

- Worked example reproduces: day composite 55.0, calorie score 0, `daily_score` 38.5.
- Aggregates grams then scores, never averages meal scores.
- Shows from the first logged meal.

### Phase 5 — Part D: weekly score

**Gate**

- Worked example reproduces: average 65.9, +5 consistency, `weekly_score` 70.9.
- Zero-meal days excluded, not scored zero.

### Phase 6 — Part E: stars + messages

**Gate**

- `score_to_stars` boundaries exact at 20/40/60/80.
- No numeric score reachable in any user-facing widget. Asserted by test.
- Per-meal rating only reachable by tapping into a meal.

### Phase 7 — AI capture

**Gate**

- Prompt v9 inserted **published but inactive**, dry-run against production inside a rolled-back
  transaction. `preparation` is left untouched; cooking method is a new field.

### Phase 8 — UI surfaces

**Gate**

- Today shows the daily star card with an explicit in-progress framing.
- Weekly shows the weekly star card.
- Meal detail keeps the tap-through breakdown.
- Target page gains macro sliders writing the Phase 2 custom split.
- `flutter analyze` clean, widget tests cover each surface.

### Phase 9 — Release

**Gate**

- `pnpm typecheck`, `pnpm test`, `flutter analyze`, `flutter test`, `prettier --check` all green.
- Read-only production check: no existing stored target moved, no live-app request shape changed.
- Build `1.0.2+28`.

---

## Open questions to revisit after test round 1

1. **Star distribution.** On current production data the median meal scores 74, so most meals may
   land on 4 stars and the rating could feel static. Measure the real spread once Parts B–D are
   live and adjust thresholds if it flattens.
2. **Daily score early in the day.** Calorie adherence is 30% of the daily score, so a user who
   has logged only breakfast will read low all morning. Shipping as-is per the locked decision;
   revisit if testers find it discouraging.
3. **Weighting review.** The 0.40/0.35/0.25 macro weights and all caps are starting points and
   deserve a nutritionist sanity check before wide release.
