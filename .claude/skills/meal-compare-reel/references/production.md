# The edit and the publish

## The 9.8-second cut

Both clips come out of Flow at ~10s: roughly 3s of hand placing the plate, then a static tail.

| Time | Length | Segment | On screen |
|---|---|---|---|
| 0.0 – 1.8 | 1.8s | Clip 1, hand places the top plate · **1.5× speed** | **hook** |
| 1.8 – 3.3 | 1.5s | Clip 1, top plate alone | **[top] kcal** |
| 3.3 – 4.3 | 1.0s | Score strip — top dish | — |
| 4.3 – 6.1 | 1.8s | Clip 2, hand places the bottom plate · **1.5× speed** | *nothing* |
| 6.1 – 7.5 | 1.4s | Clip 2, both plates | **[bottom] kcal** |
| 7.5 – 8.5 | 1.0s | Score strip — bottom dish | — |
| 8.5 – 9.8 | 1.3s | Clip 2, both plates | **closing question** |

The hand takes ~3s to enter, place and leave; at 1.5× it reads the same in 2s. Only the two placing segments get the speed change.

**Hooks and closers by category** — these must match the caption, so the video poses a question the caption then collects on:

| Category | Opens | Closes |
|---|---|---|
| Junk vs Healthy | Guess the calories 👀 | Which one? 👇 |
| Non-vegan vs Vegan | One of these is vegan 👀 | Did you guess right? 👇 |
| High-carb vs Keto | Same meal. One swap. 👀 | Worth the swap? 👇 |
| Packaged vs Fruit | Guess the calories 👀 | More food. [N] fewer calories. 👇 |

## VN build

1. New project → **9:16**, 1080×1920, 30fps
2. Import both clips → any clip → **Volume → 0 → ✓ Apply to All**
3. Scrub each clip and note when the hand has completely left the frame — every cut hangs off that
4. Cut with playhead → scissors → delete the unwanted piece. Drag the same source clip in again for each additional slice; clip 2 is used three times
5. Set the two placing segments to **1.5× speed**
6. Scale every video segment to **110%** — pushes both the Gemini sparkle and the Veo label off the bottom-right corner
7. Text: build the first kcal box, then **duplicate** it and edit only the digits. Identical position is what makes the viewer read one number changing rather than two unrelated facts
8. Keep all text between **22% and 78%** of frame height — platform UI covers the rest
9. Export **1080p, 30fps**, highest quality

**Score strips** — log both meals in LogMyPlate, screenshot each result, crop to the band holding the **star row and the score number**. No status bar, no button, no verdict sentence: one second isn't long enough to read a sentence, but ★☆☆☆☆ and **31**/100 register instantly.

Crop to the stars **or** the number, never both. The app shows meal-quality stars and a macro-balance score side by side; they measure different things and read as a contradiction in a video frame.

**Two exports** from the same timeline — one with audio for YouTube, one silent for Instagram.

## Captions

The caption does not drive reach. On the channel, **93.3% of views came from the Shorts feed** — retention is the lever. The caption exists to pull comments and to convert anyone who lands on the profile.

- End every caption on a question
- Hashtags go in the **first comment**, never the caption
- Pin your own comment right after posting, reply to everyone in the first hour
- YouTube: **three hashtags only** — the first three show above the title

### Instagram

```
Guess the calories 👀

{TOP}, or {bottom} — which one do you think LogMyPlate scored higher?

Drop your guess below 👇
```

With numbers, once both meals are logged:

```
🔴 {TOP} — [KCAL] kcal · [SCORE]/100
🟢 {BOTTOM} — [KCAL] kcal · [SCORE]/100

Calories tell you how much. They don't tell you what.

Which one would you eat? 👇
```

For fruit pairs, lead with the gap instead:

```
🔴 {TOP} — [KCAL] kcal · [SCORE]/100
🟢 {BOTTOM} — [KCAL] kcal · [SCORE]/100

More food. [N] fewer calories. Same craving handled.

Which would you pick? 👇
```

### Hashtags

Base:
```
#caloriedeficit #caloriecounting #calories #weightloss #fatloss #nutrition #calorias #comidasaludable #indianfitness #fatlossindia #logmyplate
```

Prepend by category:
- Junk vs Healthy — `#eatclean #healthyeating #mealprep`
- Non-vegan vs Vegan — `#vegan #plantbased #veganfood #veganrecipes`
- High-carb vs Keto — `#keto #ketodiet #lowcarb #ketorecipes`
- Packaged vs Fruit — `#fruit #healthysnacks #eatclean #healthyeating`

### YouTube

Title — renders on screen, so it brands the video for free, and search traffic keeps arriving months later:

```
{TOP} vs {BOTTOM} — Which Is Actually Healthier?
```

Fruit pairs: `{TOP} vs {BOTTOM} — [KCAL] Calories vs [KCAL]`

Description:

```
Two meals, scanned with LogMyPlate.

{TOP} — [KCAL] kcal — [SCORE]/100
{BOTTOM} — [KCAL] kcal — [SCORE]/100

Calorie counting tells you how much you ate. It doesn't tell you what you ate.
LogMyPlate scans your plate, tracks the calories, and scores the meal.

Which one would you pick?

#caloriecounting #healthyeating #caloriedeficit
```

Tick the **AI-generated content** toggle on both platforms.

## Things that don't work

**Split screen in VN.** Compositing two separately generated clips means matching two independently rendered tabletops, which never line up. The chained-clips approach avoids it entirely: clip 2 starts on the exact frame clip 1 ends on, so the surface is literally the same render.

**A moving phone overlay.** VN has no motion tracking, so an app screen can't follow a phone through frame. A static phone card that fades in works and takes ten minutes; the hand-held version needs After Effects and isn't worth it for a ten-second video.

**A full-screen end card.** It breaks the loop, and loops are the cheapest reach available. Put a small wordmark on the closing beat instead.
