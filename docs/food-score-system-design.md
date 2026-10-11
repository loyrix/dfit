# Food Score System — Design

> **Status: design only. No code is written against this document yet.**
>
> **The blocking gap is closed.** The complete 2023 Nutri-Score algorithm and the
> WHO limits are transcribed from source in [§11](#11-source-data--transcribed).
> One paid document (ICMR-NIN RDA, ₹400) is the only outstanding data item, and
> it blocks the India overlay only — not the build.
>
> This supersedes the scoring approach in
> [meal-health-score-logic.md](meal-health-score-logic.md) and
> [meal-health-score-implementation-plan.md](meal-health-score-implementation-plan.md).
> Those stay as the record of what shipped and why it was replaced.

---

## Why this document exists

The scoring model changed three times in a single day, and every change was
triggered by a user noticing a wrong answer rather than by us catching it:

1. **Plate Score** — 0–100 with a portion axis. Produced a bare `0` on 29% of
   real meals with nothing useful to say.
2. **Macro-band matching** — scored every item against the user's whole-day
   macro split. A mandarin orange scored **0/100, one star**. So did an apple.
   So did almonds.
3. **Nutrient-density heuristic** — what is live today. Better, but every
   threshold in it was chosen by an engineer with no external authority behind
   it.

Each fix was sound in isolation. The problem is the pattern: we have no way to
know a model is right except waiting for someone to complain. This document
exists to replace invented thresholds with published standards, and to replace
"nobody has complained recently" with a benchmark that fails loudly.

**The single most important thing here is [the benchmark set](#8-benchmark-set-and-validation).**
Everything else is replaceable. Without an acceptance test agreed _before_ the
model is built, this becomes a fourth reactive rewrite.

---

## 1. Principles

These do not change without revisiting this document.

**AI perceives, standards judge.** The model's only job is to answer _what food
is this_ and _how much of it_. Every judgement about whether that food is good
comes from a published standard applied in deterministic code. The score is
never an AI opinion.

**Three questions, three scores.** They are not competing answers to one
question. They use different inputs and must never be blended.

**Roll up, never re-score.** A higher level is always an aggregate of the level
beneath it. Two levels computed independently from the same food is exactly how
we produced a screen showing `85/100` beside `1 star`.

**Absent is not zero.** A nutrient nobody measured is unknown. Treating it as
zero reads a missing measurement as a real one.

**Every number traces to a citation.** There is no nutritionist on this project.
The published standard is the only authority, so anything we cannot cite, we do
not claim.

**Universal is stored, personal is rendered.** The food's own score is what
persists. Anything depending on the person — their goal, their conditions — is a
view applied on read, so it stays correct when they change.

---

## 2. The three scores

|                  | Nutrition                  | Goal fit                  | Habits                   |
| ---------------- | -------------------------- | ------------------------- | ------------------------ |
| **Question**     | Is this food good?         | Does this suit my target? | Am I eating better?      |
| **Input**        | The food only              | Food + your body/target   | Your history             |
| **Basis**        | Nutri-Score method         | Target section + WHO/ICMR | Own metric, WHO-anchored |
| **Levels**       | Item → meal → day → week   | Day (meal = contribution) | Week                     |
| **Personalised** | Conditions only, on render | Fully                     | Inherited                |
| **Access**       | Free                       | Premium / rewarded ad     | Premium / rewarded ad    |

Because the inputs differ, the three cannot contradict each other. The orange
that started this reads as: **nutrition 5★ · used 3% of your day · third fruit
this week, up from one.** Three true statements about one food. No single
blended star could ever have said that.

---

## 3. Score 1 — Nutrition

### What it answers

Is this food nutritious, independent of who is eating it?

### Basis: the Nutri-Score method

Structure of the algorithm, which I state with confidence:

- Computed **per 100 g** of the food (per 100 ml for drinks).
- **Negative points** from: energy, sugars, saturated fat, sodium/salt.
- **Positive points** from: fibre, protein, and the percentage of the food that
  is fruit, vegetables, legumes and nuts.
- Final value is negative points minus positive points, subject to a rule that
  withholds protein points when negative points are high, unless the
  fruit/vegetable component is at maximum.
- The result maps to bands A–E.
- **Beverages use a different table entirely.** This is what stops a sugary soft
  drink scoring like a vegetable because it is mostly water — the exact failure
  the current heuristic had to be patched around.

> **The numeric tables are not reproduced here on purpose.** Point boundaries and
> band cut-offs must be transcribed from the official publication, not recalled.
> See [§11 Transcription register](#11-transcription-register).

### Why this and not what we have now

The current model uses energy density as a proxy because it needed no ingredient
list. That was a reasonable improvisation, but it misreads drinks, has no
authority behind it, and cannot be cited. Nutri-Score answers the same question
with a published method that has been through peer review and regulatory
adoption.

### Deviations we will have to make

Every one of these must be documented in the shipped code and in any public
methodology page.

| Deviation                                             | Reason                                                                                                                    |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Inputs are AI estimates from a photo, not a lab panel | The method assumes a declared nutrition panel. Our inputs carry error the method was never designed to absorb.            |
| Applied to prepared and home-cooked dishes            | The method targets packaged food. A thali has no label.                                                                   |
| Cooking method modifier                               | Not part of Nutri-Score. Frying materially changes a food and we can now detect it. Must be declared as ours, not theirs. |
| Rolled up to meal/day/week                            | The method scores a single food. Aggregation is our construction.                                                         |

### Naming and trademark

The algorithm is published and free to implement. **The name and logo are
registered trademarks of Santé publique France**, and their usage regulation
expects application to packaged food, per 100 g, from a declared panel, in the
official logo form. Scoring a photographed home-cooked meal and branding it
"Nutri-Score" is outside authorised use.

- **Do:** "based on the Nutri-Score methodology", with a link to the publication.
- **Do not:** brand the score as Nutri-Score, or reproduce the coloured logo.

### Condition personalisation

Conditions never alter the stored value. They tighten thresholds on render,
using published limits so the app applies a public guideline rather than an
opinion:

| Condition        | Tightened by         | Source                      |
| ---------------- | -------------------- | --------------------------- |
| Diabetes, PCOS   | Free-sugar allowance | WHO free-sugars guideline   |
| Hypertension     | Sodium ceiling       | WHO sodium guideline        |
| High cholesterol | Saturated fat        | WHO saturated-fat guideline |

Rules already settled from the current implementation and worth keeping:

- Adjustments **only ever subtract**. A condition can make a food look worse for
  that person; never better than it is.
- Conditions take the **strongest adjustment per axis rather than stacking**, so
  someone ticking three boxes does not see everything collapse to one star.
- A penalty fires **only on a measured value**. Whole fruit must never be
  marked down because fiber was not recorded.

---

## 4. Score 2 — Goal fit

### What it answers

Does what you ate suit the target you set?

### Basis

**This layer is the Target section.** It already exists and already works:

- Mifflin-St Jeor → BMR
- × activity factor → TDEE
- × goal factor → daily calorie target
- Macro ranges from WHO globally, ICMR-NIN for Indian users, replacing the
  bands we invented
- Custom macro split overrides computed centres when the user sets one

### Levels

- **Day is the real answer.** Did today fit your target.
- **Meal is a contribution, not a verdict** — _"this was 32% of your day"_. One
  meal cannot succeed or fail against a daily target, and pretending otherwise
  is what produced the original portion-axis problem.

### Conditions

Conditions adjust the **targets themselves** here, not the score: a lower sodium
ceiling for hypertension, a tighter free-sugar allowance for diabetes. Same
citations as §3.

### The known behavioural problem, carried forward

Measured on 228 real days: users log **2.0 meals per day**, 48% of days have
only one meal, and the average logged day totals **996 kcal against a ~2,000
target**. A naive daily calorie comparison scores 75% of real days at zero —
measuring logging completeness and reporting it as diet quality.

**Decision:** goal fit is only shown once the day has enough logged to be
meaningful, and is explicitly framed as _"based on what you have logged"_ until
then. The exact threshold is an open item in §10.

---

## 5. Score 3 — Habits

### What it answers

Are you eating better than you were?

### An important correction to an earlier proposal

I previously suggested basing this on **HEI**. **That was wrong and I am
withdrawing it.** HEI scores components measured in cup- and ounce-equivalents
of food groups — total vegetables, greens and beans, whole fruits, whole grains,
dairy, seafood, and so on. We cannot compute a single one of those from what we
capture. Claiming "HEI-based" would be an overclaim of exactly the kind this
document exists to prevent.

What survives from HEI is only the _shape_ of the idea: score a **dietary
pattern over time** rather than a snapshot. That principle is sound and worth
keeping. The metric itself is ours.

### Basis

Built entirely from the nutrition scores already computed, measuring three
things against **the user's own history**, never a population:

- **Consistency** — how many days in the window carry a log at all
- **Level** — the average daily nutrition score across those days
- **Direction** — this window compared with the previous one

Days with nothing logged are **excluded, never scored zero**. A gap in logging
is not evidence of poor eating, and this is the layer where getting that wrong
would be most discouraging.

### Honesty constraint

This is our own metric. It is _anchored_ to WHO limits through the nutrition
scores it aggregates, but it is not itself a published standard and must never
be presented as one.

---

## 6. Roll-up architecture

**Item → meal → day → week. Each level is an aggregate of the level below it,
never a recomputation from raw nutrition.**

This is the property that makes contradiction structurally impossible, and it is
worth more than any amount of threshold tuning.

### Why item level

Production data settles it:

|                                      |                      |
| ------------------------------------ | -------------------- |
| Items with per-item nutrition stored | **1,432 of 1,432**   |
| Items with a weight                  | **all**              |
| Average items per meal               | 2.35 (max 10)        |
| Meals that are a single item         | **282 of 609 (46%)** |
| Items under 20 g                     | 99 of 1,432 (7%)     |

Item-level scoring needs **no new data and no migration** — it is already there.
For 46% of meals it is identical to meal-level anyway. And Nutri-Score is
per-item by construction: a thali's aggregate per-100 g figure describes a
substance nobody ate.

It is also where the product value is. _"Dal 4★, rice 3★, pickle 1★"_ is advice.
_"Meal: 3★"_ is a verdict you cannot act on.

**Tiny items:** below roughly 20 g or 25 kcal, contribute to the roll-up but do
not display an individual score. A 5 g pickle does not deserve its own verdict.

### Weighting

| Step        | Method           | Why                                                                      |
| ----------- | ---------------- | ------------------------------------------------------------------------ |
| Item → meal | Calorie-weighted | A 400 g salad and a 10 g pickle are not equal parts of what you ate      |
| Meal → day  | Calorie-weighted | A 900 kcal dinner is more of your day than a 50 kcal apple               |
| Day → week  | Plain average    | A week is a pattern of days; a day is a behavioural unit, not a quantity |

> **Correction to earlier advice.** I previously recommended a plain mean for the
> day so one large meal could not dominate. That was wrong. Someone eating a
> 900 kcal fried dinner and an apple did not have an average day — calorie
> weighting says so and a plain mean does not.

---

## 7. Data contract

### What we have today

Per item, stored and complete: `calories`, `proteinG`, `carbsG`, `fatG`,
`grams`, `cookingMethod` (from prompt v9).

Partial: `fiberG` ≈ 47% of recent scans, `sugarG` ≈ 28%, `sodiumMg` ≈ 35%.

### What Nutri-Score needs that we do not capture

Reading the reference implementation changed this list. The algorithm needs
**category flags**, not just nutrients — and each one switches a different table
or rule, so a wrong flag is worse than a wrong gram.

| Field                       | Status      | Why the algorithm needs it                                              |
| --------------------------- | ----------- | ----------------------------------------------------------------------- |
| `saturatedFatG`             | **Missing** | Negative component in its own right                                     |
| `fruitVegLegumePercent`     | **Missing** | Positive component. Hardest field; error-prone on mixed dishes          |
| `isBeverage`                | **Missing** | Switches to the drinks tables and cut-offs entirely                     |
| `isWater`                   | **Missing** | Only water may score A among beverages                                  |
| `isFatOilNutsSeeds`         | **Missing** | Swaps energy for energy-from-saturates, and saturated fat for its ratio |
| `isCheese`                  | **Missing** | Protein always counts, regardless of negative points                    |
| `isRedMeatProduct`          | **Missing** | Caps protein at 2 points                                                |
| `hasNonNutritiveSweeteners` | **Missing** | 4 extra negative points on beverages                                    |

For the fats/oils/nuts/seeds path we also need **total fat**, to derive the
saturated-fat ratio and energy from saturates.

**This is a prompt problem, not a data-availability problem.** These fields are
absent because we never asked for them, not because the model cannot produce
them. That is what prompt **v10** is for.

### Prompt v10 contract

Per item, in addition to everything v9 returns:

```
saturatedFatG               number, grams
fruitVegLegumePercent       number, 0-100, share of item weight
isBeverage                  boolean
isWater                     boolean
isFatOilNutsSeeds           boolean
isCheese                    boolean
isRedMeatProduct            boolean
hasNonNutritiveSweeteners   boolean
```

The booleans are the higher-risk half. A gram estimate 10% out moves a score
slightly; a wrong `isBeverage` scores the food against an entirely different
table. The prompt must be explicit that these describe **what kind of thing the
food is**, and that an unclear case is omitted rather than guessed.

Design rules for v10, consistent with what we learned building v6–v9:

- Every new field **optional and absent from `required`**, so older prompts and
  cached analyses keep parsing.
- The model is told to **omit a field rather than guess**. A confident wrong
  saturated-fat value moves the score; an omission simply means we do not score.
- Regional accuracy stays as it is: `food_photo_IN` carries India-specific
  guidance, `food_photo_GLOBAL` stays cuisine-neutral.
- New versions are inserted **published but inactive**, and activated
  deliberately.

---

## 8. Benchmark set and validation

**This is the part that prevents a fourth rewrite. It is built before the
scoring engine, not after.**

### The set

60–100 real foods with an expected band agreed **in advance**. It must include
every case that has already embarrassed us:

- Mandarin orange, apple, almonds — the whole foods that scored zero
- Cola, fruit juice — where energy density misleads
- White rice, plain roti — refined staples
- A full thali, a paneer plate — mixed dishes where roll-up matters
- Samosa, crisps, doughnut — the bottom end
- Grilled chicken, dal, steamed vegetables — the top end
- Foods with missing fields, to pin the missing-data policy

### How expectations are set without a nutritionist

**Derived from the standard, not from taste — and now, not by hand either.**

Open Food Facts publishes, as open data, real products together with their
officially computed Nutri-Score **and the full component breakdown**. A single
API call returns the score, the grade, every negative and positive component
with its points and maximum, the category flags, and the protein-exclusion
reason. Verified working during this design pass:

```
GET https://world.openfoodfacts.org/api/v2/product/{barcode}.json?fields=nutriscore_data
```

Returning, for Nutella:

```
score 31, grade e   negative 31/55   positive 0/10
count_proteins 0 — negative_points_greater_than_or_equal_to_11
  energy         2227.9 kJ   6/10
  sugars           56.3 g   15/15
  saturated_fat    10.6 g   10/10
  salt             0.11 g    0/20
  fiber            (none)    0/5
  fruits_veg          0 %    0/5
```

This is materially better than the hand-computation this document originally
proposed:

- **Objective.** Expectations come from the reference implementation, not from
  our reading of a PDF.
- **Component-level.** We can assert every intermediate point value, not just
  the final grade. A bug in one threshold is caught precisely rather than
  showing up as an off-by-one grade somewhere.
- **Large.** Hundreds of vectors are as cheap as ten, so coverage is a matter
  of choosing foods rather than of effort.
- **Re-runnable.** Regenerate whenever the standard is revised.

**Method:** select benchmark products, pull their `nutriscore_data`, store it as
a fixture in the repository, and assert our engine reproduces every component
and the final grade. This is the same shared-fixture pattern already proven by
`plate-score-vectors.json`, which pins the TypeScript and Dart implementations
to one another.

**One gap this does not close.** Open Food Facts is packaged food. It gives us
no vector for a thali, a bowl of dal, or a home-cooked curry — exactly the food
our users photograph. So the set has two halves:

- **Conformance vectors** from Open Food Facts, which prove our arithmetic is
  correct.
- **Judgement vectors** for prepared and Indian dishes, computed by us from a
  published composition source and reviewed by eye. These prove the _result is
  sensible_, which is a weaker claim and must be labelled as such.

Only the first half is authoritative. The second is where our deviations live,
and it is where an expert review would add the most if one is ever available.

### Validation gates

1. **Conformance** — engine reproduces every benchmark expectation exactly.
2. **Distribution** — run across the 475 real meals and 1,381 nutrition rows and
   review the spread _before_ shipping. A model that puts 60% of real meals at
   one or two stars is a finding, not a detail.
3. **Regression** — the benchmark runs in CI. Any future tuning either passes it
   or is rejected.

---

## 9. Product surfaces

### Where each score lives

| Surface          | Shows                               | Access |
| ---------------- | ----------------------------------- | ------ |
| Meal card        | Nutrition stars + one named insight | Free   |
| Meal detail      | Per-item nutrition breakdown        | Free   |
| Meal detail      | Goal fit — this meal's contribution | Locked |
| Today            | Daily nutrition average             | Free   |
| Today            | Goal fit for the day                | Locked |
| Journal / weekly | Habits score and trend              | Locked |

**No new section.** The existing meal detail screen becomes the depth surface.
A separate "My Meal" tab would split the mental model and duplicate a screen
users already know.

### The free tier must deliver something real

One **named insight** per meal — _"the pickle is what's dragging this down"_ —
not just a star. If the free tier is only a number, there is nothing to come
back for and nothing to screenshot.

### Locked state

Show a **real but obscured shape**, never a text label. A dimmed meter with a
value you can almost read converts because the user can see something specific
is waiting. `Goal fit ●●●○○ 🔒 See why` beats _"Unlock more insights"_.

### Unlock

Premium, **or** a rewarded ad for the same result. Someone who cannot pay is not
locked out — that is generous rather than restrictive, and it matches how scans
already work, so the mechanic is already understood.

### The prompt to explore

After a meal, a rate-limited nudge toward the locked scores. **Rate-limited via
`engagement_policy`**, alongside the existing review-prompt and interstitial
caps — same cooldown and daily-cap machinery, tunable from the backend without a
release. Never hardcoded, never after every single meal.

---

## 10. Decisions taken, and open items

### Taken

| Decision         | Value                                          |
| ---------------- | ---------------------------------------------- |
| Scoring unit     | Item, rolled up                                |
| Weighting        | Calorie-weighted to day, plain average to week |
| Nutrition basis  | Nutri-Score method, cited not branded          |
| Global backbone  | WHO                                            |
| Regional overlay | ICMR-NIN for India, WHO default elsewhere      |
| Region source    | IP                                             |
| Habits basis     | Own metric — **not** HEI                       |
| Missing inputs   | No fallback — do not score                     |
| Nutritionist     | None. Citation is the authority                |
| Free tier        | Nutrition score, all levels                    |

### Missing-data policy — recommendation

Per the "no fallback" decision, an item is scored **only when every input the
method requires is present**. Otherwise it shows _"Not enough detail to score"_
with a way to add the missing values.

Two refinements I would argue for:

- **A partial meal still rolls up** from the items that could be scored, clearly
  labelled as covering _n_ of _m_ items. Discarding a whole thali because the
  pickle lacked a saturated-fat estimate helps nobody.
- **Show a confidence indicator** where the AI reported low confidence. The
  method assumes a lab panel; our inputs are photo estimates, and the UI should
  not imply a precision we do not have.

### Open

1. **Goal-fit threshold** — how many meals or what share of target before the
   day's goal fit is shown rather than framed as partial.
2. **`fruitVegLegumeNutPercent` reliability** — the hardest new field. Needs
   testing on real mixed dishes before we depend on it. If it proves unreliable,
   the fallback is to score without it and document that as a deviation.
3. **Region for travellers** — IP gives location, not dietary background. An
   Indian user in the US is a real case; a profile override may be needed.
4. **Score name** — deferred. `[SCORE_NAME]` throughout until chosen. Trademark
   clearance deferred until traction, with a basic App Store and web search on
   any shortlist.

---

## 11. Source data — transcribed

**Status: the blocking gap is closed.** The Nutri-Score algorithm below is
transcribed from the canonical open-source reference implementation, not from
memory. Two independent sources agree on the grade cut-offs.

### Primary source

`lib/ProductOpener/Nutriscore.pm` in **openfoodfacts-server** — the
implementation that computes the grades shown across Open Food Facts and the
apps built on it. Open source, publicly auditable, actively maintained.

> https://github.com/openfoodfacts/openfoodfacts-server — `lib/ProductOpener/Nutriscore.pm`

Cross-checked against an independent technical write-up of the 2023 algorithm,
which agrees on every cut-off:
<https://www.eclarion.com/nutriscore-calculator/methodology/>

**We implement the 2023 revision**, which applied to new products from
31 December 2023 with a transition period to end-2025. That decision is now
made: the older 2021 algorithm is superseded and there is no reason to build
against it.

### Negative point thresholds (2023)

A nutrient scores one point per threshold it **exceeds** (strictly greater
than), so the point count is the number of thresholds passed.

| Component              | Thresholds                                                   | Max |
| ---------------------- | ------------------------------------------------------------ | --- |
| Energy, kJ/100 g       | 335, 670, 1005, 1340, 1675, 2010, 2345, 2680, 3015, 3350     | 10  |
| Energy, beverages      | 30, 90, 150, 210, 240, 270, 300, 330, 360, 390               | 10  |
| Sugars, g/100 g        | 3.4, 6.8, 10, 14, 17, 20, 24, 27, 31, 34, 37, 41, 44, 48, 51 | 15  |
| Sugars, beverages      | 0.5, 2, 3.5, 5, 6, 7, 8, 9, 10, 11                           | 10  |
| Saturated fat, g/100 g | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10                                | 10  |
| Salt, g/100 g          | 0.2 → 4.0 in steps of 0.2                                    | 20  |

For the **fats, oils, nuts and seeds** category only, energy is replaced by
energy from saturates and saturated fat by the saturated-fat ratio:

| Component                           | Thresholds                                         | Max |
| ----------------------------------- | -------------------------------------------------- | --- |
| Energy from saturated fat, kJ/100 g | 120, 240, 360, 480, 600, 720, 840, 960, 1080, 1200 | 10  |
| Saturated fat ratio, %              | 10, 16, 22, 28, 34, 40, 46, 52, 58, 64             | 10  |

> The saturated-fat-ratio table is the **one exception** to the rule above: it
> uses greater-than-**or-equal**. Getting this wrong shifts a point on every
> fat and oil.

Beverages carry **4 extra negative points** when they contain non-nutritive
sweeteners.

### Positive point thresholds (2023)

| Component                        | Thresholds                        | Max |
| -------------------------------- | --------------------------------- | --- |
| Fruit, vegetables, legumes — %   | 40, 60, 80, 80, 80                | 5   |
| Fruit/veg/legumes, beverages — % | 40, 40, 60, 60, 80, 80            | 6   |
| Fibre, g/100 g (AOAC)            | 3.0, 4.1, 5.2, 6.3, 7.4           | 5   |
| Protein, g/100 g                 | 2.4, 4.8, 7.2, 9.6, 12, 14, 17    | 7   |
| Protein, beverages               | 1.2, 1.5, 1.8, 2.1, 2.4, 2.7, 3.0 | 7   |

### Protein-exclusion rule — exact

Protein points count **only** when one of these holds:

- the product is a **beverage**, or
- the product is a **cheese**, or
- it is in **fats/oils/nuts/seeds** and negative points **< 7**, or
- any other food and negative points **< 11**.

Otherwise protein contributes nothing and only fibre and fruit/veg count.

**Red meat products** cap protein at **2 points** — beef, veal, pork and lamb,
extended to game, horse, donkey, goat, camel and kangaroo.

### Final score and grades

`score = negative points − positive points`, where positive points include
protein only under the rule above.

| Category                | A          | B   | C    | D    | E    |
| ----------------------- | ---------- | --- | ---- | ---- | ---- |
| General foods           | ≤ 0        | ≤ 2 | ≤ 10 | ≤ 18 | > 18 |
| Fats, oils, nuts, seeds | ≤ −6       | ≤ 2 | ≤ 10 | ≤ 18 | > 18 |
| Beverages               | water only | ≤ 2 | ≤ 6  | ≤ 9  | > 9  |

**Only water may score A among beverages.** No other drink can reach the top
band however it is formulated — which is the mechanism, built into the standard
itself, that solves the cola problem our own heuristic had to be patched for.

### Rounding

The current FAQ removed the old rounding rule: nutrient values are used as
declared, not rounded before comparison.

### Transcription verified against a real product

The tables above were implemented from this document alone and checked against
Open Food Facts' own output for Nutella (barcode 3017624010701):

|                    | Energy | Sugars | Sat fat | Salt | Negative | Positive | Score | Grade |
| ------------------ | ------ | ------ | ------- | ---- | -------- | -------- | ----- | ----- |
| Open Food Facts    | 6/10   | 15/15  | 10/10   | 0/20 | 31       | 0        | 31    | e     |
| From this document | 6/10   | 15/15  | 10/10   | 0/20 | 31       | 0        | 31    | e     |

Every component matches, including the protein-exclusion decision
(`negative_points ≥ 11`, so protein does not count). The transcription is
correct, not merely plausible.

### WHO limits — verified

Verified against WHO's own pages, not recalled.

| Limit                | Value                                           | Source                                                                                |
| -------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------- |
| Free sugars          | < 10% of total energy; < 5% for further benefit | [WHO guideline](https://www.who.int/publications/i/item/9789241549028/)               |
| Sodium               | < 2000 mg/day (< 5 g salt)                      | [WHO salt reduction](https://www.who.int/news-room/fact-sheets/detail/salt-reduction) |
| Saturated fat        | ≤ 10% of total energy                           | [WHO healthy diet](https://www.who.int/news-room/fact-sheets/detail/healthy-diet)     |
| Trans fat            | ≤ 1% of total energy                            | same                                                                                  |
| Total fat            | ≤ 30% of total energy                           | same                                                                                  |
| Fruit and vegetables | ≥ 400 g/day                                     | same                                                                                  |
| Dietary fibre        | ≥ 25 g/day                                      | same                                                                                  |

The earlier draft stated these from memory. They were correct, and are now
cited.

### ICMR-NIN — partially open, one gap remains

| Item                              | Status                   |
| --------------------------------- | ------------------------ |
| Salt ≤ 5 g/day (2 g sodium)       | Confirmed, matches WHO   |
| Macronutrient distribution ranges | **Not freely available** |
| Protein g/kg body weight          | **Not freely available** |

The full _Nutrient Requirements and Recommended Dietary Allowances for Indians_
is sold by NIN (₹400; short summary ₹150) rather than published open. The
freely available _Dietary Guidelines for Indians 2024_ is largely qualitative.

**Recommendation:** buy the RDA document. At ₹400 it is the cheapest line item
in this project and it is the only thing standing between us and a properly
cited India overlay. Until it is in hand, **Indian users get WHO defaults** —
which are correct, just not India-specific.

> https://nin.res.in/dietaryguidelines/pdfjs/locale/DGI_2024.pdf (guidelines, free)
> https://www.nin.res.in/RDA_Full_Report_2024.html (RDA, paid)

## 12. Build order

Nothing user-visible ships until phase 5.

| Phase | Work                                                                                                                                         | Gate                                                               |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| **0** | ~~Transcribe standards~~ **done, §11**. Pull conformance vectors from Open Food Facts; add judgement vectors for prepared and Indian dishes. | Fixture committed. Benchmark reviewed and agreed. No product code. |
| **1** | Prompt v10 — new fields, inserted inactive. Contract additive.                                                                               | Existing scans still parse. New fields land on new scans.          |
| **2** | Nutrition engine, item level.                                                                                                                | **Passes 100% of the benchmark.**                                  |
| **3** | Roll-up: meal, day, week. Condition view.                                                                                                    | Levels provably cannot disagree. Condition rules cite a source.    |
| **4** | Goal fit onto the Target section. Habits metric.                                                                                             | Validated against the 475 real meals; distribution reviewed.       |
| **5** | UI, locked states, unlock, engagement prompt.                                                                                                | Both themes, `flutter analyze` clean, widget tests per surface.    |
| **6** | Public methodology page.                                                                                                                     | Every deviation in §3 documented.                                  |

**Backward compatibility, unchanged from the rules that governed the last
build:** additive contract fields only, nullable migrations only, existing
stored targets never recomputed, and scoring failures must never break a scan or
a journal load.

---

## 13. What makes this defensible

Worth stating plainly, because it is the reason for the extra work.

- **Published method, cited.** Not an AI opinion. A user asking _why_ gets an
  answer with a source.
- **India handled properly.** Nutri-Score was not built for a thali and ICMR-NIN
  targets are not in any global competitor's product. The combination is
  genuinely hard to copy.
- **The correction loop already running.** Scan corrections and learned foods
  mean estimates improve with use. That compounds and cannot be bought.
- **Transparency as trust.** Publishing the method — as Nutri-Score itself does
  — is something a competitor shipping a black-box AI number cannot match.

The moat is the credibility, not the algorithm. Anyone can implement a published
standard; the defensible position is being the app that applies it honestly to
food the standards authors never considered.

---

## 14. Implementation strategy

The design says _what_ to build. This says _how to get it into production without
breaking anything_, which is a different problem and the one we have repeatedly
got wrong.

### The one rule: parallel run, never a switch

**Build the new engine alongside the live one. Compute both for every meal. Log
both. Compare on real traffic. Only then switch, behind a flag, and keep the old
path warm.**

Every previous scoring change went straight to production and was validated by a
user noticing something wrong. Shadow mode is the mechanism that makes the fourth
change different: by the time anyone sees a star from the new engine, we will
already know exactly how it behaves on real food, because it will have been
scoring real food silently for days.

Concretely:

1. New engine computes on every scan and journal load, result recorded, **never
   rendered**.
2. A comparison job reports the distribution of new-vs-old across all traffic,
   and lists the largest disagreements by food.
3. We review that list. Disagreements are either a bug or an improvement, and
   each one gets a verdict before anything ships.
4. Switch by runtime flag in `app_runtime_config`, the same mechanism that
   already controls `meal_score_policy` — so it flips without a deploy.
5. The flag flips back just as fast. That is the kill switch.

Shadow mode costs one extra computation per request. Both engines are pure
functions over data already in memory; there is no extra query and no extra AI
call.

### The critical path is data, not code

The engine cannot score anything without `saturatedFatG` and
`fruitVegLegumePercent`, and **no stored meal has either**. They only start
arriving once prompt v10 is live.

This makes v10 a **lead time, not a task**. Ship it first and let data accumulate
while the engine is being written. Building the engine first means finishing it
and then waiting.

**Order: v10 → (accumulate while building) → engine → shadow → switch.**

### Backfill: do it, and it is cheaper than expected

**601 of 643 meals still have their stored image — 93%.** So history can be
recovered by re-running the v10 prompt over stored images rather than being
written off.

This matters more than it looks. The marketing line is _"have you checked your
score?"_ — and someone who opens the app to a journal of blanks has nothing to
check. Launching with history already scored is the difference between a feature
and an empty promise.

- ~600 re-analyses on Gemini Flash is a trivial cost.
- Run it as an offline job against stored images, writing only the new fields.
- **Never overwrite a user-edited value.** Same rule as the micronutrient
  recovery: the AI fills gaps, it does not correct people.
- The 42 meals with no image stay unscored, honestly labelled.

Run the backfill **after** v10 is validated on live traffic, so we are not
replaying a prompt that turns out to need another revision.

### Gates that cannot be skipped

| Gate                                     | Blocks              | Automated       |
| ---------------------------------------- | ------------------- | --------------- |
| Conformance fixture from Open Food Facts | Merging the engine  | ✅ CI           |
| Distribution review on 475 real meals    | Leaving shadow mode | Manual, one-off |
| Shadow disagreement review               | Flipping the flag   | Manual, one-off |
| `flutter analyze` + widget tests         | Shipping the build  | ✅ CI           |

The first is the important one. It runs on every commit forever, and it is what
stops a future tuning change quietly breaking the standard.

### What actually makes it a moat — and it is not the algorithm

Anyone can implement a published standard. Three deliverables are what make this
defensible, and **all three ship with the feature, not after it**:

**The methodology page.** Public, plain-language, citing the Nutri-Score method
and WHO limits, listing every deviation from §3 honestly. This is the entire
trust argument. Without it we are another app with an AI number.

**The share card.** _"Have you checked your score?"_ only works if there is
something to show. This is a genuine growth dependency, not a nice-to-have —
and it needs designing, because there is a structural problem to solve:

> Yuka grew by people scanning products in shops, which is inherently public and
> repeatable on any barcode. A meal photo is private and unrepeatable — nobody
> else can scan your lunch. The viral loop is not the same shape and will not
> appear by itself.

The share card has to carry the score, the food, and the method citation, and be
worth posting. That is a design problem to solve deliberately.

**The name.** Deferred, but it gates the marketing, the share card and the
methodology page. It is on the critical path for launch even though it blocks no
code.

### Recommended sequence

| Step | Ships                                             | Depends on          |
| ---- | ------------------------------------------------- | ------------------- |
| 1    | Prompt v10, inactive → validated → active         | —                   |
| 2    | Conformance fixture + benchmark in CI             | — (parallel with 1) |
| 3    | Nutrition engine, item level, passing the fixture | 2                   |
| 4    | Shadow mode on, comparison reporting              | 1, 3                |
| 5    | Backfill over 601 stored images                   | 1 validated         |
| 6    | Roll-up, goal fit, habits                         | 3                   |
| 7    | Review distribution and disagreements             | 4, 5                |
| 8    | UI, locked states, unlock, share card             | 6                   |
| 9    | Methodology page                                  | 6                   |
| 10   | Flip the flag                                     | 7, 8, 9             |

Steps 1 and 2 start immediately and in parallel. Step 5 runs in the background.
Nothing user-visible happens before step 10, and step 10 is reversible.

### What we do not do

- **No big-bang replacement.** The old engine stays until the new one has proven
  itself on real traffic.
- **No backfill before the prompt is validated.** Replaying a prompt that still
  needs revision wastes the run and muddies the comparison.
- **No shipping the score without the methodology page.** The citation is the
  product; shipping the number alone gives away the moat.
- **No silent tuning after launch.** Any change to a threshold re-runs the
  fixture and the distribution check.
