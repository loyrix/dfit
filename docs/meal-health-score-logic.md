# Meal Health Score System — Formulas & Explanations

A personalized scoring system for meals scanned via photo, using AI-extracted macros (carbs, fats, protein, sugar, fiber, cooking method) combined with user profile data (sex, age, height, weight, activity level, goal).

**Display design:** Users see **1–5 star ratings + a short guidance message** — never raw numbers. Full numeric scores are still computed internally (for accuracy, tuning, and analytics) but are a backend-only implementation detail.

- **Daily rating** — primary UI, live/provisional, updates as meals are logged
- **Weekly rating** — trend view, averaged from daily scores
- **Per-meal rating** — secondary, tap-through only (viewing a single logged meal's detail)

---

## Overview / Flow

```
User profile (sex, age, weight, height, activity, goal)
        ↓  [Part A — computed once, cached]
Personalized target macro bands + target daily calories
        ↓
Photo scan → AI returns: carbs_g, fats_g, protein_g, sugar_g, fiber_g,
             likely_cooking_method, confidences
        ↓
   ┌────────────┴────────────┐
   ↓                         ↓
[Part B]                [Part C]
Meal score          Daily score (live, provisional)
(per scan,                    ↓
 tap-through only)      [Part D]
                     Weekly score (trend)
                              ↓
                  [Part E — applied to B, C, D outputs]
                  Numeric score → Star rating + Guidance message
                  (this is the only thing users actually see)
```

---

## PART A — Personalized Target Setup

_(per user, computed once / cached, recomputed when profile changes)_

### A1. BMI

```
BMI = weight_kg / (height_m * height_m)
```

**What it does:** Classifies the user by weight relative to height (Underweight / Normal / Overweight / Obese).

**Why it's here:** BMI alone can't capture calorie needs (it ignores age, sex, activity), so it isn't the main driver of anything. It's used later (A6) only as a **small secondary nudge** to macro composition.

### A2. BMR (Mifflin-St Jeor equation)

```
Male:   BMR = 10*weight_kg + 6.25*height_cm - 5*age + 5
Female: BMR = 10*weight_kg + 6.25*height_cm - 5*age - 161
Other:  BMR = average(Male formula, Female formula)
```

**What it does:** Estimates calories burned at complete rest.

**Why it's here:** This is the foundation everything else builds on. Unlike BMI, it factors in age and sex — both meaningfully affect metabolic rate. Two people with identical BMI can have very different BMRs.

### A3. TDEE (activity adjustment)

```
Sedentary         → BMR * 1.20
Lightly active    → BMR * 1.375
Moderately active → BMR * 1.55
Very active       → BMR * 1.725
Extra active      → BMR * 1.90
```

**What it does:** Scales BMR up based on real-world activity level.

**Why it's here:** This is where the activity level field gets used meaningfully — without it, a sedentary and a very active person with the same BMR would be treated identically, which isn't accurate.

### A4. Goal-adjusted target daily calories

```
Fat loss    → TDEE * 0.80
Muscle gain → TDEE * 1.10
Maintenance → TDEE * 1.00

target_daily_calories = result above
```

**What it does:** Applies a deficit or surplus based on the user's goal.

**Why it's here:** Produces `target_daily_calories`, which becomes central to daily scoring (Part C4) — this is where calorie adherence, not just macro ratio, gets measured.

### A5. Macro center — primary driver (goal × activity lookup)

```
FAT LOSS
  Sedentary/Light   → carb_center=30, fat_center=30, protein_center=40
  Moderate/Very     → carb_center=35, fat_center=25, protein_center=40

MUSCLE GAIN
  Sedentary/Light   → carb_center=40, fat_center=25, protein_center=35
  Moderate/Very     → carb_center=45, fat_center=25, protein_center=30

MAINTENANCE
  Sedentary/Light   → carb_center=45, fat_center=30, protein_center=25
  Moderate/Very     → carb_center=50, fat_center=25, protein_center=25
```

**What it does:** Assigns an ideal macro composition based on goal and activity level combined.

**Why goal + activity, not BMI, drives this:** These are more direct, intentional signals for macro composition than body category. Someone training hard for muscle gain needs different carb/protein balance than someone sedentary trying to lose fat, regardless of BMI. BMI tells you body status; goal tells you what to optimize for.

### A6. Macro center — BMI secondary nudge

```
if BMI >= 30:
    protein_center += 5
    carb_center    -= 5
if BMI < 18.5:
    carb_center    += 5
    fat_center     += 3
    protein_center -= 3
```

**What it does:** Small shift to the macro center from A5, based on BMI category.

**Why small and additive, not a full override:** BMI is a supporting signal, not the primary driver — this keeps its influence real but bounded, without letting it override the more intentional signals of goal and activity.

### A7. Tolerance band width

```
Fat loss / Muscle gain → tolerance = 5
Maintenance             → tolerance = 8
```

**What it does:** Converts the single "ideal" macro % into a realistic acceptable range.

**Why it varies by goal:** Goal-driven users (fat loss/muscle gain) get a tighter band since they're optimizing for something specific; maintenance gets a looser band since day-to-day variation matters less for them.

**Why a band, not an exact number:** No one hits an exact macro percentage every meal — a single-point target would make the system feel impossibly strict.

### A8. Final target bands (min/max)

```
carb_target_min    = carb_center    - tolerance
carb_target_max    = carb_center    + tolerance
fat_target_min     = fat_center     - tolerance
fat_target_max     = fat_center     + tolerance
protein_target_min = protein_center - tolerance
protein_target_max = protein_center + tolerance
```

**What it does:** Produces the six numbers that all scoring (meal, daily, weekly) measures against.

### A9. Manual override (optional, custom user macro split)

```
if user_has_custom_split:
    carb_center, fat_center, protein_center = user_carb_pct, user_fat_pct, user_protein_pct
    tolerance = 5
```

**What it does:** If a user explicitly sets their own macro targets, this replaces the computed defaults entirely.

**Why override, not blend:** An explicit user choice is a stronger signal of intent than an algorithmic estimate — averaging the two would dilute a deliberate decision.

---

## PART B — Per-Meal Score

_(runs on every photo scan; shown only when user taps into a specific logged meal)_

### B1. Macros → calories

```
cal_carbs   = carbs_g * 4
cal_fat     = fats_g * 9
cal_protein = protein_g * 4
total_cal   = cal_carbs + cal_fat + cal_protein
```

**What it does:** Converts grams to calories using standard energy values.

**Why:** Grams aren't directly comparable across macros — a gram of fat carries more than double the energy of carbs/protein. Calories put all three on the same footing.

### B2. Calories → percentages

```
pct_carbs   = cal_carbs   / total_cal * 100
pct_fat     = cal_fat     / total_cal * 100
pct_protein = cal_protein / total_cal * 100
```

**What it does:** Expresses each macro as a % of the meal's total calories.

**Why:** Lets a 300-calorie snack and a 1,200-calorie dinner be compared on the same composition scale, independent of size.

### B3. Closeness function (reused throughout the whole system)

```python
def closeness(value, target_min, target_max, falloff=15):
    if target_min <= value <= target_max:
        return 100
    distance = target_min - value if value < target_min else value - target_max
    return max(0, 100 - (distance / falloff) * 100)

score_carbs   = closeness(pct_carbs,   carb_target_min,    carb_target_max)
score_fat     = closeness(pct_fat,     fat_target_min,     fat_target_max)
score_protein = closeness(pct_protein, protein_target_min, protein_target_max)
```

**What it does:** Scores closeness to the target band — 100 inside the band, smoothly decaying outside it.

**Why smooth decay, not a hard cutoff:** Avoids a jarring cliff at the band edge (e.g. 55% vs 56% carbs scoring very differently). This same function is reused in Parts C and D — one core mechanism applied consistently at every level.

**Why `falloff = 15`:** Controls how forgiving the decay is — how many percentage points outside the band it takes to hit zero. Lower = stricter, higher = more lenient. Tunable.

### B4. Weighted base score

```
base_score = (0.40 * score_carbs) + (0.35 * score_fat) + (0.25 * score_protein)
```

**What it does:** Combines the three macro scores, weighted by how much each should influence the total.

**Why weighted, not averaged evenly:** Carb imbalance is often the most visible driver of unhealthy-feeling meals, so it's weighted highest; protein shortfall in a single meal is less immediately consequential, so it's weighted lowest. Tunable, not fixed law.

### B5. Extreme skew penalty

```
skew_penalty = 15 if max(pct_carbs, pct_fat, pct_protein) > 70 else 0
```

**What it does:** Flat penalty if one macro dominates the meal (>70% of calories), regardless of individual band scores.

**Why needed on top of B3/B4:** The closeness function scores each macro independently, so a meal could look acceptable on a couple of macros while still being extremely lopsided overall. This is a deliberate catch-all: no single macro should dominate entirely.

### B6. Protein density bonus

```
protein_density = protein_g / total_cal * 100
protein_bonus   = min(10, protein_density * scaling_factor)
```

**What it does:** Rewards meals delivering more protein per calorie — a proxy for nutrient density over "empty calories."

**Why capped at 10:** Prevents a very high-protein meal from masking other problems (e.g. very low fiber, high sugar) via an oversized bonus.

### B7. Soft-capped modifiers (fiber, sugar, cooking method — backend only)

```
fiber_bonus   = clamp((fiber_g / 10) * 5, 0, 8)   * confidence_fiber
sugar_penalty = clamp((sugar_g / 20) * 10, 0, 12) * confidence_sugar

cooking_method_base = {
  "fried": -8, "sauced/creamy": -5, "baked": -2,
  "grilled": +3, "steamed": +5, "raw": +5, "unknown": 0
}[likely_cooking_method]

cooking_modifier = cooking_method_base * cooking_method_confidence
```

**What it does:** Applies bonuses/penalties for fiber, sugar, and estimated cooking method — values the AI extracts but with uncertain accuracy.

**Why capped:** Even at full confidence, each factor has a hard ceiling on score influence, so no single uncertain estimate can dominate the result.

**Why multiplied by confidence:** This is the key mechanism for safely using data you don't fully trust. Low AI confidence (0–1 scale) scales the adjustment down proportionally — it still contributes signal but can't meaningfully swing the score based on a shaky guess.

**Why never shown raw:** Displaying exact grams/percentages would imply more precision than actually exists — better to let them quietly influence the score than present them as facts.

### B8. Final meal score

```
meal_score = base_score + protein_bonus - skew_penalty + fiber_bonus - sugar_penalty + cooking_modifier
meal_score = clamp(meal_score, 0, 100)
```

**What it does:** Sums the core score and all modifiers, clamped to 0–100.

**Why this structure:** `base_score` — built from the AI's core macro extraction, the most-trusted part of the pipeline — carries the most weight. Everything layered on top is bounded so less-trusted signals can't dominate.

---

## PART C — Daily Score (Live, Provisional)

_(primary UI number; recalculates in real time as meals are logged)_

### C1. Aggregate macros across today's meals

```
day_carbs_g   = sum(carbs_g for each meal logged today)
day_fats_g    = sum(fats_g for each meal logged today)
day_protein_g = sum(protein_g for each meal logged today)
day_fiber_g   = sum(fiber_g for each meal logged today)
day_sugar_g   = sum(sugar_g for each meal logged today)
```

**What it does:** Sums raw grams (not scores) across every meal logged today.

**Why sum grams first, not average meal scores:** Summing macros and then scoring the total is more accurate than averaging individual meal scores. Averaging scores would let a great breakfast and a terrible lunch "cancel out" evenly, when what actually matters is the day's _combined_ macro profile — which is what the body actually experiences.

### C2. Daily calories and percentages

```
day_cal_carbs   = day_carbs_g * 4
day_cal_fat     = day_fats_g * 9
day_cal_protein = day_protein_g * 4
day_total_cal   = day_cal_carbs + day_cal_fat + day_cal_protein

day_pct_carbs   = day_cal_carbs   / day_total_cal * 100
day_pct_fat     = day_cal_fat     / day_total_cal * 100
day_pct_protein = day_cal_protein / day_total_cal * 100
```

**What it does:** Same conversion as B1–B2, applied to daily totals.

### C3. Macro balance score

```
day_score_carbs   = closeness(day_pct_carbs,   carb_target_min,    carb_target_max)
day_score_fat     = closeness(day_pct_fat,     fat_target_min,     fat_target_max)
day_score_protein = closeness(day_pct_protein, protein_target_min, protein_target_max)

day_base_score = (0.40 * day_score_carbs) + (0.35 * day_score_fat) + (0.25 * day_score_protein)
```

**What it does:** Reuses the same `closeness()` function and target bands from Part A against the day's aggregated percentages.

**Why reuse the same function/bands:** Consistency — the same definition of "balanced" applies whether looking at one meal or a whole day; only the input data changes.

### C4. Calorie adherence score — new at this level

```
calorie_ratio = day_total_cal / target_daily_calories * 100
calorie_score = closeness(calorie_ratio, 90, 110, falloff=20)
```

**What it does:** Scores how close the day's total calories are to `target_daily_calories` (from A4) — full marks within ±10%.

**Why this only makes sense at the daily level:** A single meal's calorie count says almost nothing on its own. Total calories across a full day compared to a computed target is a genuinely meaningful adherence signal — this is exactly the number `target_daily_calories` was built for.

**Why a wider falloff (20) than macro bands (15):** Daily calorie totals naturally vary more day-to-day than macro ratios, so a more forgiving decay avoids over-punishing normal variation.

### C5. Skew penalty, protein bonus, fiber/sugar/cooking modifiers (daily versions)

```
day_skew_penalty = 15 if max(day_pct_carbs, day_pct_fat, day_pct_protein) > 70 else 0

day_protein_density = day_protein_g / day_total_cal * 100
day_protein_bonus   = min(10, day_protein_density * scaling_factor)

day_fiber_bonus   = clamp((day_fiber_g / 10) * 5, 0, 8)   * avg_confidence_fiber_today
day_sugar_penalty = clamp((day_sugar_g / 20) * 10, 0, 12) * avg_confidence_sugar_today

day_cooking_modifier = calorie_weighted_average(
    cooking_method_base per meal today,
    weighted by each meal's share of day_total_cal
)
```

**What it does:** Same formulas as Part B, computed on daily aggregated totals. Cooking method becomes a calorie-weighted average across today's meals.

**Why calorie-weighted, not a simple average:** A large fried dinner should affect the day's cooking-method modifier more than a small steamed side dish — weighting by each meal's share of daily calories reflects actual dietary impact.

### C6. Final daily score

```
day_composite = day_base_score + day_protein_bonus - day_skew_penalty
              + day_fiber_bonus - day_sugar_penalty + day_cooking_modifier

daily_score = clamp(0.7 * day_composite + 0.3 * calorie_score, 0, 100)
```

**What it does:** Blends the macro-composite score with calorie adherence.

**Why blend rather than treat calorie_score as just another small modifier:** Calorie adherence is a core pillar of "was today good," not a minor bonus/penalty like fiber or sugar — it deserves an explicit, meaningful weight (30% here, tunable).

### C7. Live/provisional rule

```
if meals_logged_today == 0:
    show "No meals logged yet today"
else:
    show daily_score → converted to stars (Part E), labeled "so far"
```

**What it does:** Shows a live rating as soon as one meal is logged, clearly framed as in-progress.

**Why live instead of waiting for a data threshold:** Gives users immediate feedback and a sense of progress through the day. The "so far" framing manages the trade-off — it signals the rating isn't final without hiding it.

---

## PART D — Weekly Score

_(trend view, averaged from daily scores)_

### D1. Average daily scores

```
weekly_score = average(daily_score for days with meals_logged_today >= 1)
```

**What it does:** Averages daily scores across the week, counting only days with at least one logged meal.

**Why exclude zero-meal days rather than scoring them 0:** An untracked day isn't necessarily a "bad" day — scoring it 0 would unfairly punish a logging gap as if it were poor eating.

### D2. Consistency bonus

```
days_within_good_range = count(daily_score >= 61 for the week)
consistency_bonus = min(5, days_within_good_range * 1)
weekly_score = clamp(weekly_score + consistency_bonus, 0, 100)
```

**What it does:** Adds a small bonus based on how many days in the week scored well.

**Why it's useful:** A plain average can't distinguish "consistently decent every day" from "three excellent days, four poor days" if they average out the same. Rewarding consistency nudges toward steady balance over time — reinforcing the whole point of moving away from per-meal judgment.

---

## PART E — Star Rating & Guidance Message Layer

_(the only thing users actually see — applied on top of B, C, D's numeric outputs)_

### E1. Numeric score → star rating

```python
def score_to_stars(score):
    if score <= 20: return 1
    if score <= 40: return 2
    if score <= 60: return 3
    if score <= 80: return 4
    return 5
```

```
0–20   → ★☆☆☆☆ (1 star)
21–40  → ★★☆☆☆ (2 stars)
41–60  → ★★★☆☆ (3 stars)
61–80  → ★★★★☆ (4 stars)
81–100 → ★★★★★ (5 stars)
```

**What it does:** Converts the internal 0–100 numeric score into a simple 1–5 star rating.

**Why stars instead of numbers:** A number like "73/100" implies more precision than a macro-based heuristic actually has, and can invite exactly the kind of anxious over-optimization this system is designed to avoid. Stars communicate the same practical signal — roughly how well-balanced things are — without false precision or a score to obsess over.

**Why keep the numeric score internally:** You still want the precise number for analytics, tuning caps/weights, and refining guidance messages over time — the stars are purely a final display transformation, not a replacement for the underlying math.

### E2. Guidance messages — Daily

```
1 star  → "Today was tough — try to add more protein and balance tomorrow."
2 stars → "A bit off balance today. Small tweaks tomorrow can help."
3 stars → "Decent day — a little more balance would take this further."
4 stars → "Solid day! You're close to your targets."
5 stars → "Great job — today was well balanced across the board."
```

**Why messages matter as much as the stars:** The star count alone doesn't explain _why_ — the message carries the actual meaning and (eventually) actionable direction. These starting messages are generic; they can be made smarter later by referencing the specific weak point (e.g., "protein was low today") using the backend score components that are still being computed, without ever showing a number.

### E3. Guidance messages — Weekly

```
1 star  → "This week was a rough stretch. Let's reset — small changes add up."
2 stars → "Below your usual balance this week. One better day at a time."
3 stars → "A fairly balanced week overall — keep building on it."
4 stars → "Strong week! You're consistently close to your targets."
5 stars → "Excellent week — great consistency across the days."
```

### E4. Guidance messages — Per-meal (tap-through only)

```
1 star  → "Low in balance — mostly one macro dominating."
2 stars → "A bit skewed — could use more balance."
3 stars → "Reasonably balanced meal."
4 stars → "Nicely balanced meal."
5 stars → "Great balance across carbs, fat, and protein."
```

**Why lighter-touch than daily/weekly messages:** A single meal shouldn't feel as "final" or judgment-heavy as a full day or week — it's supplementary detail for a curious user who tapped in, not the primary signal they're meant to act on.

### E5. UI visibility summary

| Level    | Visibility                                        | Format                                             |
| -------- | ------------------------------------------------- | -------------------------------------------------- |
| Per-meal | Tap-through only (viewing a specific logged meal) | Stars + short message                              |
| Daily    | Primary UI, always visible, live-updating         | Stars + message, "so far" while day is in progress |
| Weekly   | Primary UI, trend view                            | Stars + message                                    |

---

## Worked Example (end-to-end)

**Sample user:** Male, 30, 80kg, 178cm, moderately active, goal: fat loss
→ Target daily calories: 2,192 kcal · Carb band 30–40% · Fat band 20–30% · Protein band 35–45%

**One meal (lunch — grilled chicken, rice, veg):**
Numeric meal*score = 100 → **★★★★★** — *"Great balance across carbs, fat, and protein."\_ (shown only if tapped)

**One day (3 meals: light-protein breakfast, the lunch above, a fried dinner):**
Day totals landed low on protein and under target calories → Numeric daily*score ≈ 36 → **★★☆☆☆** — *"A bit off balance today. Small tweaks tomorrow can help."\_

**One week (that day plus 6 others, scores: 68, 74, 36, 81, 62, 58, 70):**
Average = 64.1, +5 consistency bonus (5 days ≥61) → Numeric weekly*score ≈ 69 → **★★★★☆** — *"Strong week! You're consistently close to your targets."\_

**The throughline:** a perfect single meal contributed to a rough day, which became just one data point in a strong week — no single plate or single day defines what the user sees as their headline rating.

---

## Notes on Tuning

- All weights (0.40/0.35/0.25, 0.7/0.3), caps (8, 12, 10, 15, 5), falloffs (15, 20), and star thresholds are starting points — tune using real usage data or a labeled test set of meals/days with expected outcomes.
- Part A's goal × activity table and BMI nudges are reasonable defaults, not medical prescriptions — worth a nutritionist sanity-check before shipping.
- Consider raising B7/C5 caps over time as AI extraction quality (sugar/fiber/cooking method accuracy) improves.
- Guidance messages (E2–E4) are a good place to grow sophistication over time — e.g., dynamically naming the specific weak macro or behavior — without ever needing to expose the underlying number.
- v2+ idea: split daily macro targets across meal types (breakfast/lunch/dinner/snack) rather than applying the same daily % target uniformly.
