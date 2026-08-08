# Meal Health Score — Worked Example

This document walks through a full end-to-end example using the latest scoring system (Parts A–E), from a single user profile down to individual meals, a daily rating, and a weekly rating.

---

## Sample User Profile

Female, 28 years old, 65kg, 165cm, lightly active, goal: **muscle gain**

### Part A — Personalized Targets (computed once)

|                                                      | Value                                             |
| ---------------------------------------------------- | ------------------------------------------------- |
| BMR                                                  | 10(65) + 6.25(165) − 5(28) − 161 = **1,346 kcal** |
| TDEE (×1.375, lightly active)                        | **1,851 kcal**                                    |
| Target daily calories (muscle gain, ×1.10)           | **2,036 kcal**                                    |
| BMI                                                  | 23.9 (Normal — no BMI nudge applied)              |
| Macro center (muscle gain, sedentary/light activity) | carbs 40% · fat 25% · protein 35%                 |
| Tolerance                                            | ±5 (goal-driven, tighter band)                    |
| **Target bands**                                     | **Carbs 35–45% · Fat 20–30% · Protein 30–40%**    |

---

## Meal 1 — Breakfast (Greek yogurt, berries, granola)

**Input:** carbs 45g, fat 8g, protein 22g, fiber 4g, sugar 18g, cooking = raw, confidence 0.85

| Step                   | Result                                                   |
| ---------------------- | -------------------------------------------------------- |
| Calories               | 180 + 72 + 88 = 340 kcal                                 |
| % split                | carbs 52.9% · fat 21.2% · protein 25.9%                  |
| Closeness scores       | carbs 53 (over band) · fat 100 · protein 41 (under band) |
| Base score             | 0.4(53) + 0.35(100) + 0.25(41) = 66.3                    |
| Protein bonus          | +6.5                                                     |
| Skew penalty           | 0                                                        |
| Fiber bonus            | +1.7                                                     |
| Sugar penalty          | −7.7                                                     |
| Cooking modifier (raw) | +4.3                                                     |
| **meal_score**         | **≈ 71**                                                 |

**Display (tap-through only):** ★★★★☆ — _"Nicely balanced meal."_

---

## Meal 2 — Lunch (chicken burrito bowl)

**Input:** carbs 60g, fat 18g, protein 45g, fiber 8g, sugar 6g, cooking = sauced/creamy, confidence 0.7

| Step                             | Result                                          |
| -------------------------------- | ----------------------------------------------- |
| Calories                         | 240 + 162 + 180 = 582 kcal                      |
| % split                          | carbs 41.2% · fat 27.8% · protein 30.9%         |
| Closeness scores                 | carbs 100 · fat 100 · protein 100 (all in-band) |
| Base score                       | 100                                             |
| Protein bonus                    | +10 (capped)                                    |
| Skew penalty                     | 0                                               |
| Fiber bonus                      | +2.8                                            |
| Sugar penalty                    | −2.1                                            |
| Cooking modifier (sauced/creamy) | −3.5                                            |
| **meal_score**                   | **≈ 100 (capped)**                              |

**Display (tap-through only):** ★★★★★ — _"Great balance across carbs, fat, and protein."_

---

## Meal 3 — Dinner (pasta with light sauce, small chicken portion)

**Input:** carbs 90g, fat 12g, protein 20g, fiber 5g, sugar 10g, cooking = baked, confidence 0.8

| Step                     | Result                                                          |
| ------------------------ | --------------------------------------------------------------- |
| Calories                 | 360 + 108 + 80 = 548 kcal                                       |
| % split                  | carbs 65.7% · fat 19.7% · protein 14.6%                         |
| Closeness scores         | carbs 0 (well over band) · fat 96 · protein 0 (well under band) |
| Base score               | 0.4(0) + 0.35(96) + 0.25(0) = 33.6                              |
| Protein bonus            | +2.9                                                            |
| Skew penalty             | 0 (65.7% doesn't cross the 70% skew threshold)                  |
| Fiber bonus              | +2.0                                                            |
| Sugar penalty            | −4.0                                                            |
| Cooking modifier (baked) | −1.6                                                            |
| **meal_score**           | **≈ 33**                                                        |

**Display (tap-through only):** ★★☆☆☆ — _"A bit skewed — could use more balance."_

---

## Daily Rating — Wednesday (all 3 meals aggregated)

### Aggregated totals

| Macro   | Total |
| ------- | ----- |
| Carbs   | 195g  |
| Fat     | 38g   |
| Protein | 87g   |
| Fiber   | 17g   |
| Sugar   | 34g   |

### Scoring

| Step                                                      | Result                                                                              |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Day calories                                              | 780 + 342 + 348 = 1,470 kcal                                                        |
| Day % split                                               | carbs 53.1% · fat 23.3% · protein 23.7%                                             |
| Closeness scores                                          | carbs 39 (over band) · fat 100 · protein 0 (well under band — target was 30–40%)    |
| Day base score                                            | 0.4(39) + 0.35(100) + 0.25(0) = 50.6                                                |
| Calorie ratio                                             | 1,470 / 2,036 = 72.2%                                                               |
| Calorie score                                             | **0** (well below the ±10% window — undereating relative to her muscle-gain target) |
| Protein bonus                                             | +5.9                                                                                |
| Skew penalty                                              | 0                                                                                   |
| Fiber bonus                                               | +6.9                                                                                |
| Sugar penalty                                             | −8.5                                                                                |
| Cooking modifier (calorie-weighted: raw + sauced + baked) | ≈ +0.1                                                                              |
| Day composite                                             | 50.6 + 5.9 − 0 + 6.9 − 8.5 + 0.1 = 55.0                                             |
| **daily_score**                                           | **0.7(55.0) + 0.3(0) = 38.5**                                                       |

**Display (primary UI):** ★★☆☆☆ — _"A bit off balance today. Small tweaks tomorrow can help."_

**Key insight:** Two of the three meals scored well individually, but the day-level view catches what no single meal showed — **total calories and protein both landed too low** relative to her muscle-gain target. This is exactly the kind of gap per-meal scores can't surface on their own.

---

## Weekly Rating (this day + 6 others)

| Day             | Daily Score |
| --------------- | ----------- |
| Mon             | 72          |
| Tue             | 65          |
| **Wed (above)** | **38.5**    |
| Thu             | 80          |
| Fri             | 55          |
| Sat             | 90          |
| Sun             | 61          |

### Scoring

| Step                      | Result                                |
| ------------------------- | ------------------------------------- |
| Average of 7 daily scores | (72+65+38.5+80+55+90+61)/7 = **65.9** |
| Days scoring "Good" (≥61) | Mon, Tue, Thu, Sat, Sun = 5 days      |
| Consistency bonus         | +5 (capped)                           |
| **weekly_score**          | clamp(65.9 + 5, 0, 100) = **70.9**    |

**Display (primary UI):** ★★★★☆ — _"Strong week! You're consistently close to your targets."_

---

## Summary — What the User Actually Sees

| Level               | Visibility     | Rating    | Message                                                        |
| ------------------- | -------------- | --------- | -------------------------------------------------------------- |
| Breakfast           | Tap-through    | ★★★★☆     | "Nicely balanced meal."                                        |
| Lunch               | Tap-through    | ★★★★★     | "Great balance across carbs, fat, and protein."                |
| Dinner              | Tap-through    | ★★☆☆☆     | "A bit skewed — could use more balance."                       |
| **Wednesday (Day)** | **Primary UI** | **★★☆☆☆** | **"A bit off balance today. Small tweaks tomorrow can help."** |
| **This Week**       | **Primary UI** | **★★★★☆** | **"Strong week! You're consistently close to your targets."**  |

The user's home screen only shows the bolded rows — the day and week ratings. A rough Wednesday (driven mainly by low protein and undereating relative to her muscle-gain calorie target) is visible and actionable at the daily level, but doesn't derail her overall weekly picture, which stays strong thanks to more consistent days around it.
