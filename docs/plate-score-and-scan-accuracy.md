# Plate Score & Scan Accuracy — Phased Implementation Plan

> **Goal**: Add a personalized Plate Score to scan review and the journal, and harden
> scan accuracy — without displaying any nutrition value we cannot stand behind.
>
> **Decisions locked**:
>
> - ✅ Micronutrients (fiber/sugar/sodium) are **never displayed as numbers**. They may only
>   trigger qualitative warnings, and only when actually returned by the model.
> - ✅ Plate Score is **deterministic domain math**, not an LLM output.
> - ✅ Score is gated on having a **health target**, never on medical conditions.
> - ✅ Medical conditions change the **words**, never the **number**.
> - ✅ Every phase is backward compatible in both directions (old app ↔ new API).

---

## Baseline (measured 2026-08-01, live DB, read-only)

| Metric                                                | Value                      |
| ----------------------------------------------------- | -------------------------- |
| Profiles                                              | 405                        |
| Registered                                            | 73                         |
| **Health targets set**                                | **64 (88% of registered)** |
| Ever logged a meal                                    | 85                         |
| Active 30d / 7d                                       | 29 / 9                     |
| Premium                                               | 3                          |
| Meals / meal items                                    | 544 / 1,285                |
| `nutrition_results` rows with fiber, sugar, or sodium | **0 of 1,285**             |
| `user_corrections` rows                               | **0**                      |
| `meal_items.user_edited = true`                       | **1,285 of 1,285**         |

Two conclusions drive the phase order:

1. **88% health-target completion** proves users will fill in profile data. The score
   should be built on the profile data that already exists.
2. **The accuracy feedback loop records nothing.** Phase 0 must come first or no later
   phase can be evaluated.

---

## Known defects this plan fixes

### D1 — Micronutrients are generated then discarded

Gemini returns `fiberG` per item today (verified in `ai_predictions.raw_ai_json`), but
`MacroTotals` in [apps/mobile/lib/src/models/meal.dart:18-31](../apps/mobile/lib/src/models/meal.dart)
declares only four fields. `fromJson` parses four, `toJson` sends four, so the confirm
request drops fiber and the API writes `null`. We pay for a nutrient and throw it away.

### D2 — Sugar and sodium are never requested

The `required` array at [gemini-ai-provider.ts:123](../apps/api/src/services/gemini-ai-provider.ts)
lists only `calories, proteinG, carbsG, fatG`, and the prompt instruction at line 341 asks
for "calories, proteinG, carbsG, fatG, and fiberG when feasible". Sugar and sodium appear
nowhere in the instruction, so the model omits them and computed totals fall back to `0`.

### D3 — No portion sanity bounds

Worst observed meal: **"Mustard Oil Bottle", 920 g of mustard oil, 8,140 kcal**. A
container photo was logged as consumed food. The prompt's VISIBLE-ONLY rules say to
reject packaging-only photos but nothing bounds the output, and nothing validates it
server-side. Frequency: 6 items > 1000 kcal, 2 > 1500 kcal, 4 items > 600 g.

Calorie **density** is not the problem — almonds 580, butter 720, oil 885 kcal/100g are
all correct. The error is in `estimatedGrams` and in container-vs-serving judgement.

### D4 — The accuracy feedback loop is dead

`user_corrections` is empty and `user_edited` is uniformly `true`, so there is no way to
measure whether any prompt change helps.

### D5 — Analysis cache will serve stale personalization

[scans.ts:213-222](../apps/api/src/routes/scans.ts) caches on `profileId + imageHash`.
Correctly scoped per user (no cross-user leak), but once the response embeds
condition-specific advice, changing your conditions keeps returning the old advice.

---

## Backward compatibility rules (apply to every phase)

These are non-negotiable and apply to all code below:

1. **Every new contract field is `.optional()`.** Never add a required field to an
   existing response schema.
2. **New API + old app**: old Dart `fromJson` reads named keys and ignores unknown ones,
   so additive response fields are safe. Never rename or retype an existing field.
3. **Old API + new app**: every new field must be read as nullable
   (`json['x'] as num?`), and the UI must render correctly when it is absent. A new app
   pointed at an old API must simply not show the score, never crash.
4. **Migrations are additive only**: nullable columns, no `not null` without a default,
   no drops, no type changes. Every `.up.sql` needs a working `.down.sql`.
5. **Feature-gated at runtime**: ship behind `app_runtime_config` so the score can be
   disabled without an app release, following the existing `engagement_policy` and
   `ai_scan_config` pattern.
6. **Never block the scan loop**: if scoring, profile load, or advice generation fails,
   the scan must still confirm. Wrap every new step so its failure is non-fatal.

---

# Phase 0 — Make accuracy measurable

**Why first**: Phases 1-4 cannot be evaluated without this. Small, no user-visible change.

### 0.1 [MODIFY] Fix the `user_edited` flag

`meal_items.user_edited` is `true` for every row, so it carries no information. Find where
the confirm path sets it (`createMeal` in
[apps/api/src/repositories/postgres-store.ts](../apps/api/src/repositories/postgres-store.ts))
and set it from a real per-item signal sent by the client, defaulting to `false`.

Mobile: track an `edited` bool on `_ReviewMealEntry` in
[review_meal_screen.dart:375](../apps/mobile/lib/src/screens/review_meal_screen.dart), set
it in `_openEditItemSheet`, and include it per item in the confirm request.

_Backward compat_: `userEdited` already exists in `mealItemSchema` with `.default(false)`.
Old apps that omit it get `false` — which is more correct than today's blanket `true`.

### 0.2 [MODIFY] Record corrections

On confirm, for any item where the user changed quantity, unit, grams, or deleted/added an
item, write a `user_corrections` row (`correction_kind`, `before_json`, `after_json`). The
table already exists and is unused.

Keep it fire-and-forget — a failed correction write must never fail the confirm.

### 0.3 [CONFIG] Enable analytics and capture a baseline

Firebase is implemented but disabled by default
([docs/engagement-growth-controls.md](engagement-growth-controls.md) Phase 2). Enable
`engagement_policy.analytics`, let it run for one week, and record the baseline for scans
per active user, review-screen edit rate, and confirm rate **before** Phase 1 ships.

### 0.4 [NEW] Accuracy report in admin

A simple admin page listing recent scans where the user materially changed the portion,
plus outliers (item > 800 kcal, item > 500 g, meal > 2500 kcal). This is the review queue
that tells you whether Phase 1 worked.

**Exit criteria**: corrections are being written; a baseline week is recorded.

---

# Phase 1 — Scan accuracy hardening

**Why now**: the score is only as trustworthy as the nutrition under it. Fix inputs first.

### 1.1 [MODIFY] Prompt: add a portion sanity self-check

Add to `defaultFoodPhotoPromptTemplate` in
[gemini-ai-provider.ts](../apps/api/src/services/gemini-ai-provider.ts), after
`PORTION ESTIMATION METHOD`:

```txt
CONTAINER VS SERVED PORTION:
- Log only the portion a person is about to eat.
- If a bottle, jar, packet, carton, tin, or storage container is visible, do NOT log its
  full contents. Either log the visibly served portion, or return no items.
- Cooking oils, ghee, butter, and condiments are almost never consumed as a standalone
  serving. Log them only when visibly served, and only in teaspoon-to-tablespoon amounts.

PORTION SANITY CHECK (perform before returning):
- Re-read every estimatedGrams and ask whether one person would eat that amount now.
- Typical single-serving bounds: oils/ghee/butter 5-20 g; chutney/pickle/sauce 10-40 g;
  nuts/seeds 10-40 g; cooked dal/sabzi/curry 100-250 g; cooked rice 100-300 g;
  roti/chapati 30-60 g each; beverages 150-400 ml.
- An item above 600 g or above 800 kcal is almost certainly wrong. Re-estimate it.
- If a plausible portion cannot be determined, lower confidence rather than guessing high.
```

### 1.2 [MODIFY] Prompt: derive nutrition from grams

Replace the single "Always provide..." line with an explicit derivation order, so the
model anchors on a per-100g reference instead of estimating the final number holistically:

```txt
NUTRITION DERIVATION:
- Identify the food, then recall realistic per-100g values for that food as commonly
  prepared in India, then scale by estimatedGrams. Do not estimate final values directly.
- Keep calories coherent with macros: calories should be close to
  (4 x proteinG) + (4 x carbsG) + (9 x fatG). If they disagree by more than 20%,
  re-check both.
- Always provide calories, proteinG, carbsG, fatG.
- Provide fiberG, sugarG, and sodiumMg only when you can estimate them from the identified
  food with reasonable confidence. Omit a field entirely rather than guessing or
  returning 0. An omitted field is treated as unknown, which is correct and expected.
```

Note the last line: because the UI never shows these numbers, a missing value costs
nothing, while a fabricated `0` would produce a false "low sodium" warning. **Omission is
strictly preferable to a guess.**

### 1.3 [MODIFY] Response schema — keep micros optional

In the `responseSchema` at [gemini-ai-provider.ts:112-124](../apps/api/src/services/gemini-ai-provider.ts),
leave `required` as `["calories", "proteinG", "carbsG", "fatG"]`. Do **not** add sugar or
sodium to `required` — forcing them guarantees fabricated values, which is exactly what we
are trying to avoid.

### 1.4 [NEW] Server-side plausibility clamp

Never trust the model to respect its own bounds. Add to `packages/domain`:

```ts
// packages/domain/src/portion-sanity.ts
export type PortionFlag = "implausible_grams" | "implausible_calories" | "macro_incoherent";

export const flagImplausibleItem = (item: {
  estimatedGrams: number;
  nutrition: { calories: number; proteinG: number; carbsG: number; fatG: number };
}): PortionFlag[] => {
  /* ... */
};
```

Rules: grams > 600, calories > 800 for a single item, or `|calories - (4P + 4C + 9F)|`
greater than 25% of calories.

Apply in the analyze route: flagged items are still returned (the user may genuinely have
a large portion) but are **logged for the Phase 0.4 review queue** and get reduced
`confidence`, which the review screen already surfaces. Do not silently rewrite the
model's numbers.

### 1.5 [MODIFY] Mobile — carry micros through without showing them

Extend `MacroTotals` in [meal.dart](../apps/mobile/lib/src/models/meal.dart) to 7 fields:

```dart
final double? fiberG;
final double? sugarG;
final double? sodiumMg;

// fromJson — nullable reads, tolerant of old payloads
fiberG: (json['fiberG'] as num?)?.toDouble(),
sugarG: (json['sugarG'] as num?)?.toDouble(),
sodiumMg: (json['sodiumMg'] as num?)?.toDouble(),

// toJson — omit nulls entirely so we never persist a fabricated 0
if (fiberG != null) 'fiberG': fiberG,
```

Also update `operator +` and `scaled()` to propagate them: `null + null = null`,
`null + value = value`. **No UI change — these values are never rendered.**

_Backward compat_: nullable reads mean old API payloads parse fine; omitting nulls in
`toJson` means the API keeps writing `null` exactly as it does today.

**Exit criteria**: new scans persist fiber (and sugar/sodium when confident); zero items
above 800 kcal in the following week's review queue.

---

# Phase 2 — Deterministic Plate Score

**Why**: a number we compute is reproducible, free, instant, and defensible.

### 2.1 [NEW] `packages/domain/src/plate-score.ts`

```ts
export type PlateScoreInput = {
  totals: MacroTotals; // micros may be undefined
  dailyCalorieTarget: number;
  goal: "maintain" | "lose_gently" | "gain_gently";
  mealShare: number; // this meal's expected share of the day
};

export type PlateScoreResult = {
  score: number; // 0-100
  band: "excellent" | "good" | "moderate" | "heavy";
  axes: PlateScoreAxis[]; // which axes actually contributed
  reasons: string[]; // deterministic, from axes only
};
```

**Scoring axes** — only from data we trust:

| Axis                                 | Source                           | Always available  |
| ------------------------------------ | -------------------------------- | ----------------- |
| Calorie fit vs. target share         | `calories`, `dailyCalorieTarget` | Yes               |
| Protein adequacy                     | `proteinG`                       | Yes               |
| Macro balance (P/C/F split vs. goal) | `proteinG/carbsG/fatG`           | Yes               |
| Fiber density                        | `fiberG`                         | Only when present |

**The critical rule — missing means unknown, not zero.** If `fiberG` is absent, drop the
fiber axis and renormalize the remaining weights. Never score a missing nutrient as `0`,
or every historical meal scores as perfectly low-sugar and low-sodium.

This means a 2026-06 meal with no micros still gets a valid calorie/protein/balance score,
and meals logged after Phase 1 get a slightly richer one. Both are honest.

### 2.2 [NEW] Warnings — the only use of micronutrients

Separate from the score, and qualitative only:

```ts
export type PlateWarning = { code: string; text: string };
```

Fire **only** when the value is present and clearly over a threshold. Never state the
number. Never fire on absence.

| Condition   | Fires when                               | Copy                                  |
| ----------- | ---------------------------------------- | ------------------------------------- |
| High sodium | `sodiumMg` present and > 800             | "Sodium looks high for one meal"      |
| High sugar  | `sugarG` present and > 25                | "Added sugar looks high for one meal" |
| Low fiber   | `fiberG` present and < 3 with carbs > 45 | "Light on fiber for the carbs here"   |

Per the locked decision: **no raw micronutrient values reach the UI**, ever.

### 2.3 [NEW] Tests

`packages/domain/src/plate-score.test.ts`, matching the existing `nutrition.test.ts` style:
identical input always yields an identical score; a meal with no micros scores on three
axes; adding fiber only ever raises the score; warnings never fire on undefined.

_Backward compat_: pure addition to `packages/domain`. No API, contract, or DB change in
this phase — nothing to break.

**Exit criteria**: `pnpm test` green; scoring is a pure function with no I/O.

---

# Phase 3 — Score in review and journal

**Why**: makes the feature visible to all 64 health-target users with zero new profile data.

### 3.1 [MODIFY] Review screen card

Insert one card in [review_meal_screen.dart](../apps/mobile/lib/src/screens/review_meal_screen.dart)
between `_ReviewSummaryCard` (line 98) and the "Items to confirm" label (line 105).

Because the score is local math and the review screen is an **editing** screen
(items are editable at lines 113-147), the score **recalculates on every edit** — no
network call, no flicker. This is the moment the feature sells itself.

Tapping opens a **bottom sheet**, not a route — the review screen has an unfinished task
on it and pushing a route risks users dropping out before confirming.

### 3.2 [MODIFY] `MealCard` — one widget, whole journal

[meal_card.dart](../apps/mobile/lib/src/widgets/meal_card.dart) is shared, so a single
change lights up the Today list. The row is already dense (type label, item names, macro
line, calories), so add a **compact colored score chip next to the kCal**, not a second
number.

### 3.3 [MODIFY] Weekly journal

- `_DayMealRow` ([weekly_journal_screen.dart:341](../apps/mobile/lib/src/screens/weekly_journal_screen.dart)) — same chip.
- `_JournalDayRow` (line 971) — **daily average score**.
- `_WeeklyJournalHero` (line 743) — **week average score**.

The weekly average is the retention hook. A single meal score is a nice touch; "this week
74, up from 68" is why someone opens the app tomorrow. If only one journal surface gets
built, build this one.

### 3.4 The three profile states

| State                                | Behavior                                                                  |
| ------------------------------------ | ------------------------------------------------------------------------- |
| Health target + conditions (Phase 4) | Full score + "For: Type 2 Diabetes" + tailored reasons                    |
| **Health target, no conditions**     | **Full score**, goal-based, plus "Add health conditions to personalize ›" |
| No health target                     | No score. "Set up your profile to see how meals fit you ›"                |

**Gate on health target, never on conditions.** 64 users have a health target; 0 have
conditions (the field does not exist yet). Gating on conditions makes the feature invisible
to 100% of users on launch day — so nobody discovers the conditions field, so it stays
invisible. Never invent a score against a default profile.

_Backward compat_: score is computed client-side from `mealSchema` data that already
exists, so no API or DB change. Old app builds simply never render the chip.

**Exit criteria**: score visible on review, Today, and weekly; renders correctly in all
three profile states; no API change shipped.

---

# Phase 4 — Health conditions

**Why last**: it is the only phase needing a migration, and it is worthless until Phase 3
has made the score visible enough that users want to personalize it.

### 4.1 [NEW] Migration

`pnpm db:new profile_health_conditions` (convention: `YYYYMMDDHHMMSS`):

```sql
-- up
alter table profile_health_targets
  add column if not exists health_focus text[] not null default '{}';

-- down
alter table profile_health_targets drop column if exists health_focus;
```

Additive, defaulted, nullable-safe. Existing rows get `'{}'` and behave exactly as today.

### 4.2 [MODIFY] Contracts

In [packages/contracts/src/profiles.ts](../packages/contracts/src/profiles.ts):

```ts
export const healthFocusSchema = z.enum([
  "diabetes", "blood_pressure", "cholesterol", "pcos",
]);

// on profileHealthTargetRequestSchema — optional with a default
healthFocus: z.array(healthFocusSchema).max(4).default([]),
```

**Launch with exactly these four.** Kidney disease, gout, IBS, pregnancy, and allergies are
the highest medical risk and the smallest audience — they do not belong in v1.

_Backward compat_: `.default([])` means old app builds that omit the field still validate.

### 4.3 [MODIFY] Profile UI

Add the multi-select to
[health_target_screen.dart](../apps/mobile/lib/src/screens/health_target_screen.dart) —
the form 88% of registered users already complete voluntarily. Optional, editable anytime,
with an explicit "None" choice.

### 4.4 [MODIFY] Condition-aware advice in the existing AI call

Load the health target in the analyze route the same way
[chat.ts:93](../apps/api/src/routes/chat.ts) already does, and inject `healthFocus` into
the prompt. Extend the response schema with **optional** fields: one summary line, up to
two positives, one watch-out, and one or two swaps.

**One Gemini call, not two.** A second per-scan call adds cost and latency right as free
scans are being cut, and doubles the failure surface on your core loop.

**The rule that keeps this safe: conditions influence the words, never the number.** The
Phase 2 score stays pure nutrition math. Conditions add qualitative text and a "For: ..."
label. This gives you a shareable metric while keeping medical-adjacent output
non-numeric.

### 4.5 [FIX] Cache key (D5)

Add the condition set to `findScanAnalysisCache` at
[scans.ts:213-222](../apps/api/src/routes/scans.ts), or users who change conditions keep
getting stale advice on repeat photos.

### 4.6 Safety copy

Every advice surface carries "Educational only, not medical advice." Never diagnose, never
reference medication, never say a food is dangerous. Prefer "may not align well with your
profile" over "bad for you".

**Exit criteria**: conditions save and edit; advice reflects them; score is unchanged by
them; disclaimer present on every advice surface.

---

## Rollout

Ship each phase independently behind runtime config, following the existing
`ai_scan_config` pattern:

```ts
plateScore: {
  enabled: boolean; // default false
  showInJournal: boolean; // default false
  conditionsEnabled: boolean; // default false
}
```

Defaults are all `false`, so deploying changes nothing until an operator opts in — the
same safety property `engagement_policy` already has.

**Suggested order**: Phase 0 (measure) → Phase 1 (accuracy) → wait one week and compare
against the baseline → Phase 2 + 3 (score, visible) → Phase 4 (conditions).

Phases 0 and 1 are worth shipping on their own merits even if the score is never built.

## What is deliberately excluded from v1

- Displaying any fiber, sugar, or sodium number.
- A per-condition numeric score ("banana = 72 for diabetes") — not defensible, not
  reproducible.
- Kidney disease, gout, IBS, pregnancy, allergies.
- A second AI call per scan.
- Blood-test interpretation, meal plans, grocery lists — later versions at the earliest.
