# Star ratings: hidden temporarily

**Status:** hidden in the mobile app since 2026-10-18. We are refining the
star rating and its explanation, and will turn it back on in the next release.

This is a display switch only. Nothing was deleted and no API, contract or
database behaviour changed.

## What is hidden

`showStarRatings` in `apps/mobile/lib/src/widgets/score_visuals.dart` is
`false`. While it is off, the app does not show:

| Surface                    | Widget            | Screen                            |
| -------------------------- | ----------------- | --------------------------------- |
| Daily stars card           | `DailyScoreCard`  | Today                             |
| Weekly stars card          | `WeeklyScoreCard` | Weekly journal                    |
| Meal stars on a meal row   | `MealStarsButton` | Today, Day Analysis               |
| Meal stars and explanation | `MealScoreRow`    | Meal detail (and its share image) |
| Rating explanation sheet   | `MealRatingSheet` | Opened only from meal detail      |

## AI usage that is hidden with it

The rating sheet is the only place the scan model's meal advice
(`MealAdvice.watchOuts` and `MealAdvice.swaps`, the "Worth knowing" and "Try
this next time" sections) is shown. With the sheet unreachable, that AI output
is no longer visible anywhere in the app.

The API still asks the model for this advice during a food photo scan and
stores it with the meal. That is deliberate: when ratings come back, meals
logged in the meantime will still have their advice. The scan prompt version is
controlled from the admin Prompts page, not by this switch.

The Plate Score number was already hidden before this change. Nutritionist
chat is a separate feature and is not affected.

## What still runs

- The API computes and returns `rating` on meals, the day and the week, exactly
  as before. Older app builds keep showing stars.
- Rating calculation in `packages/domain` and `apps/api/src/services/meal-rating.ts`
  is unchanged.

## Turning it back on

1. Set `showStarRatings = true` in `score_visuals.dart`, or delete the switch
   and its five checks.
2. Remove the "star ratings hidden" tests in `apps/mobile/test/app_test.dart`
   and `apps/mobile/test/meal_rating_sheet_test.dart`, and the
   `showStarRatings = true` setup in the tests that cover the rated layout.
3. Delete this note.
4. Run `pnpm mobile:analyze` and `pnpm mobile:test`.
