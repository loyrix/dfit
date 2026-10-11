---
name: meal-compare-reel
description: Produce a LogMyPlate meal-comparison Reel or YouTube Short — two plates on one table, calorie figures and meal scores from the app, under ten seconds. Covers the locked Google Flow prompt set, the VN edit, the second-by-second on-screen text, and the Instagram and YouTube captions. Use when generating food images or clips in Google Flow, cutting one of these videos in VN, picking a dish pair, or writing captions for the content channel.
---

# Meal comparison reels

A repeatable format: two plates stacked in one vertical frame, a gloved hand places each one, the app's real calorie count and score go on screen, under ten seconds, ends on both plates so it loops.

Everything below was arrived at by a failed generation or a broken edit. **Do not relitigate these decisions each time.**

## Settled conventions

- **Junk is placed first, healthy second.** The healthy plate arriving is the payoff beat.
- **Stacked top/bottom, never side by side.** In a 9:16 frame, width is the scarce dimension — stacking splits the abundant one and each plate gets roughly twice the area.
- **Both plates identical** in size, shape, depth and colour. Never one plate and one bowl. The story is food volume at a given calorie count, not plate size.
- **Under 10 seconds.**
- **Never show a number the app didn't return.** Log both meals in LogMyPlate, screenshot the results, use those figures. This is non-negotiable — see `accuracy-and-backward-compat` in memory.
- **Appetite beats authenticity.** These videos sell the calorie idea, not the food. Pushing prompts toward documentary realism produced dull, browned, unappetising plates. Optimise for craveable.

## One mechanic: the swap

**Every pair is the same craving with one real change.** Fried to steamed, cream to tomato, mayo removed, syrup left off. Both calorie figures go on screen and the closing card names the gap — "same craving, 280 fewer calories".

**The test a pair has to pass:** would a person genuinely stand there choosing between these two? Comparing a festival sweet to idli sambhar failed it — nobody picks between them, so there is nothing to react to. Pizza vs a chicken bowl passes because both are lunch. Fried modak vs steamed modak passes because both are the same sweet.

**Festival pairs never scold.** Both plates are festival sweets, so the message is "have the lighter one", not "don't celebrate". They also fix identifiability — a gulab jamun or a mooncake is recognised on sight in a way "grilled chicken with vegetables" never is.

**Each festival is a campaign, not a post.** Seven festivals carry their own set — Janmashtami (10, a short window), then Raksha Bandhan, Ganesh Chaturthi, Navratri & Durga Puja, Diwali, Christmas and Eid at 25 each. That covers **two posts a day for the ten days before the date, plus the day itself**, with four spare. Each set is built the same way: ~12 sweet swaps, 6 savoury, 4 festive meal, 3 drinks, so ten days of content doesn't look like the same video repeated.

**Post inside the window.** Worth almost nothing off-season, best day of the year on the date.

**Watch for fake swaps.** Some "healthier" alternatives are worse: a dry-fruit laddoo of dates, cashews and ghee often beats a besan laddoo on calories per gram, and jaggery has essentially the same calories as sugar. Only two swaps reliably hold up — **steamed instead of fried**, and **chhena or paneer instead of khoya and ghee**. Verify against the app before claiming a gap.

## Workflow

1. **Pick a pair** — `references/pairs.md` (260 swaps: seven festival campaigns, plus four evergreen categories), or the live board at https://claude.ai/code/artifact/a3fc9dc5-562c-4fb8-b89e-63463a9b2416
2. **Generate** — `references/prompts.md` has the seven prompts in order. Generate the both-plates image *before* the single-plate one, and derive the single-plate by **removing** a plate. Removal edits preserve the remaining food; repositioning edits corrupt it.
3. **Log both meals in the app**, screenshot each result, crop to the star row plus the score number.
4. **Cut in VN** — `references/production.md`
5. **Publish** — captions and hashtags in `references/production.md`

Steps in `prompts.md` marked *generate once* are done a single time for the whole channel. After that a new video is two dish lines and about five minutes.

## Failure modes, and what fixes them

| Symptom | Cause | Fix |
|---|---|---|
| Background renders as a wall | the word "plaster" | say "stone tabletop… laid flat, seen from directly above, never a wall" |
| Food arrives on the plate, then vanishes mid-clip | video prompt didn't name the plate contents | Frames generation does not read the end frame as instructions — list what's on the plate |
| Fruit comes back stewed and brown | blanket "served hot, steam rising" | the food block must split hot from cold; fresh food never steams |
| Portion looks reasonable when the number says it shouldn't | no quantity given | state the weight, and forbid shrinking the portion to balance the composition |
| Subject degrades after an edit | asked the model to *reposition* it | never reposition — generate the full composition first, then delete from it |
| Plates cropped at the frame edge | "margin" is too vague | give an explicit plate diameter as a fraction of frame width |
| Hand has wrong finger count | unconstrained | "exactly five fingers", and fall back to the no-hand clip rather than re-rolling twice |

## What actually drives reach

Measured on the channel: **93.3% of views came from the Shorts feed.** Reach is retention, not keywords. Hashtags, description and posting time move almost nothing.

- The caption's job is **comments**, not distribution. End every one on a question.
- Hashtags go in the **first comment**, never the caption — they push the hook below the fold.
- Instagram: export **silent** and add trending audio in the app. Music baked in VN doesn't attribute to the audio page and loses that discovery surface.
- YouTube: bake the audio in. The title renders on screen, so it does the branding for free, and search traffic keeps arriving months later.
- Tick the **AI-generated content** toggle on both platforms.

## Related memory

`meal-compare-reel-conventions`, `prompt-delivery-style`, `accuracy-and-backward-compat`, `logmyplate-marketing-strategy`.

When handing prompts to the user, always give the **complete ready-to-paste text**, never a partial edit — and on any change, re-check the whole set for conflicts before replying.
