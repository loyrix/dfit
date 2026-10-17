import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:logmyplate_mobile/src/models/meal.dart';
import 'package:logmyplate_mobile/src/models/plate_score.dart';
import 'package:logmyplate_mobile/src/models/score_rating.dart';
import 'package:logmyplate_mobile/src/screens/meal_detail_screen.dart';
import 'package:logmyplate_mobile/src/theme/logmyplate_theme.dart';
import 'package:logmyplate_mobile/src/widgets/meal_card.dart';
import 'package:logmyplate_mobile/src/widgets/meal_rating_sheet.dart';
import 'package:logmyplate_mobile/src/widgets/plate_score_chip.dart';
import 'package:logmyplate_mobile/src/widgets/score_star_row.dart';

Widget _wrap(Widget child) =>
    MaterialApp(theme: LogMyPlateTheme.light(), home: child);

const _rating = ScoreRating(
  stars: 2,
  message: 'Light on nutrition for the calories.',
  level: ScoreLevel.meal,
  reasons: [
    ScoreReason(
      good: false,
      code: 'dense_energy',
      text: 'Calorie-dense: a small amount carries a lot of energy.',
    ),
    ScoreReason(
      good: false,
      code: 'high_sodium',
      text: 'High in sodium (salt) for the calories.',
    ),
    ScoreReason(
      good: true,
      code: 'good_fiber',
      text: 'A good amount of fiber.',
    ),
  ],
);

MealLog _meal({
  ScoreRating? rating = _rating,
  MealAdvice? advice,
  PlateScore? plateScore,
}) => MealLog(
  id: 'meal-1',
  type: MealType.snack,
  title: 'Masala chips',
  loggedAt: DateTime(2026, 10, 10),
  items: const [
    MealItem(
      name: 'Masala chips',
      quantity: 1,
      unit: 'serving',
      grams: 50,
      nutrition: MacroTotals(calories: 270, proteinG: 3, carbsG: 28, fatG: 17),
    ),
  ],
  rating: rating,
  advice: advice,
  plateScore: plateScore,
);

const _scoreWithWarnings = PlateScore(
  score: 41,
  band: PlateScoreBand.moderate,
  tier: PlateScoreTier.general,
  axes: [],
  skipped: [],
  warnings: [
    PlateWarning(
      code: 'high_sodium',
      text: 'Sodium looks high for one meal.',
      personalised: false,
    ),
    PlateWarning(
      code: 'high_sugar',
      text: 'Sugar looks high for one meal.',
      personalised: true,
    ),
  ],
);

Future<void> _openSheet(WidgetTester tester, MealLog meal) async {
  await tester.pumpWidget(
    _wrap(
      Scaffold(
        body: Builder(
          builder: (context) => TextButton(
            onPressed: () => MealRatingSheet.show(context, meal: meal),
            child: const Text('open'),
          ),
        ),
      ),
    ),
  );
  await tester.tap(find.text('open'));
  await tester.pumpAndSettle();
}

void main() {
  group('ScoreRating reasons', () {
    test('parses reasons and survives the cache round trip', () {
      final rating = ScoreRating.fromJson({
        'stars': 2,
        'message': 'Light on nutrition for the calories.',
        'level': 'meal',
        'reasons': [
          {
            'tone': 'watch',
            'code': 'high_sugar',
            'text': 'High in sugar for the calories.',
            'personalised': false,
          },
          {
            'tone': 'good',
            'code': 'good_fiber',
            'text': 'A good amount of fiber.',
          },
        ],
      })!;

      expect(rating.reasons, hasLength(2));
      expect(rating.reasons.first.good, isFalse);
      expect(rating.reasons.last.good, isTrue);

      final restored = ScoreRating.fromJson(rating.toJson())!;
      expect(restored.reasons.map((reason) => reason.code), [
        'high_sugar',
        'good_fiber',
      ]);
    });

    test('an API that predates reasons still gives a rating', () {
      final rating = ScoreRating.fromJson({
        'stars': 4,
        'message': 'Good choice — plenty of nutrition here.',
        'level': 'meal',
      })!;

      expect(rating.stars, 4);
      expect(rating.reasons, isEmpty);
    });

    test('drops a reason it cannot classify rather than guessing', () {
      final rating = ScoreRating.fromJson({
        'stars': 3,
        'message': 'A reasonable choice.',
        'level': 'meal',
        'reasons': [
          {'tone': 'neutral', 'code': 'future', 'text': 'Something new.'},
          {'tone': 'good', 'code': 'good_protein', 'text': ''},
          {'tone': 'good', 'code': 'good_fiber', 'text': 'A good amount.'},
        ],
      })!;

      expect(rating.reasons.map((reason) => reason.code), ['good_fiber']);
    });
  });

  group('MealRatingSheet', () {
    testWidgets('explains the rating, with no number anywhere', (tester) async {
      await _openSheet(tester, _meal(plateScore: _scoreWithWarnings));

      expect(find.text('Light on nutrition for the calories.'), findsOneWidget);
      expect(find.text('WHY THIS RATING'), findsOneWidget);
      expect(find.text('A good amount of fiber.'), findsOneWidget);
      // The Plate Score travels with the meal but is never shown.
      expect(find.text('41'), findsNothing);
      expect(find.text('/100'), findsNothing);
      expect(find.textContaining('not medical advice'), findsOneWidget);
    });

    testWidgets('does not repeat a warning the reasons already made', (
      tester,
    ) async {
      await _openSheet(tester, _meal(plateScore: _scoreWithWarnings));

      expect(find.text('WORTH KNOWING'), findsOneWidget);
      // Sodium is already under "why this rating"; sugar is new information.
      expect(find.text('Sodium looks high for one meal.'), findsNothing);
      expect(
        find.text(
          'Sugar looks high for one meal. Flagged because of your health focus.',
        ),
        findsOneWidget,
      );
    });

    testWidgets('shows the AI suggestions when the meal has them', (
      tester,
    ) async {
      await _openSheet(
        tester,
        _meal(
          advice: const MealAdvice(
            watchOuts: ['The chips are fried and salted.'],
            swaps: ['Swap the chips for roasted makhana.'],
          ),
        ),
      );

      expect(find.text('TRY THIS NEXT TIME'), findsOneWidget);
      expect(find.text('Swap the chips for roasted makhana.'), findsOneWidget);
      expect(find.text('The chips are fried and salted.'), findsOneWidget);
    });

    testWidgets('falls back to a rule-based suggestion without AI advice', (
      tester,
    ) async {
      // A barcode or older meal has no advice; the section must not be empty.
      await _openSheet(tester, _meal());

      expect(find.text('TRY THIS NEXT TIME'), findsOneWidget);
      expect(find.textContaining('snack'), findsWidgets);
    });

    testWidgets('still opens for a rating with no reasons', (tester) async {
      await _openSheet(
        tester,
        _meal(
          rating: const ScoreRating(
            stars: 3,
            message: 'A reasonable choice.',
            level: ScoreLevel.meal,
          ),
        ),
      );

      expect(find.text('A reasonable choice.'), findsOneWidget);
      expect(find.text('WHY THIS RATING'), findsNothing);
    });

    testWidgets('does nothing for a meal with no rating', (tester) async {
      await _openSheet(tester, _meal(rating: null));

      expect(find.byType(MealRatingSheet), findsNothing);
    });
  });

  group('stars replace the Plate Score', () {
    testWidgets(
      'tapping the stars on a Today meal card navigates to meal details and does not open rating sheet',
      (tester) async {
        var openedMeal = false;
        await tester.pumpWidget(
          _wrap(
            Scaffold(
              body: MealCard(
                meal: _meal(plateScore: _scoreWithWarnings),
                onTap: () => openedMeal = true,
              ),
            ),
          ),
        );

        expect(find.byType(PlateScoreChip), findsNothing);
        expect(find.text('41'), findsNothing);

        await tester.tap(find.byType(ScoreStarRow));
        await tester.pumpAndSettle();

        expect(openedMeal, isTrue);
        expect(find.byType(MealRatingSheet), findsNothing);
      },
    );

    testWidgets('tapping elsewhere on the card still opens meal details', (
      tester,
    ) async {
      var openedMeal = false;
      await tester.pumpWidget(
        _wrap(
          Scaffold(
            body: MealCard(
              meal: _meal(plateScore: _scoreWithWarnings),
              onTap: () => openedMeal = true,
            ),
          ),
        ),
      );

      await tester.tap(find.text('Masala chips'));
      await tester.pumpAndSettle();

      expect(openedMeal, isTrue);
      expect(find.byType(MealRatingSheet), findsNothing);
    });

    testWidgets('a meal row with no rating shows neither', (tester) async {
      await tester.pumpWidget(
        _wrap(
          Scaffold(
            body: MealCard(
              meal: _meal(rating: null, plateScore: _scoreWithWarnings),
              onTap: () {},
            ),
          ),
        ),
      );

      expect(find.byType(PlateScoreChip), findsNothing);
      expect(find.text('41'), findsNothing);
    });

    testWidgets('meal detail opens the explanation from the star row', (
      tester,
    ) async {
      await tester.pumpWidget(_wrap(MealDetailScreen(meal: _meal())));
      await tester.pumpAndSettle();

      await tester.ensureVisible(find.byKey(const ValueKey('meal-score-open')));
      await tester.tap(find.byKey(const ValueKey('meal-score-open')));
      await tester.pumpAndSettle();

      expect(find.byType(MealRatingSheet), findsOneWidget);
      expect(find.text('WHY THIS RATING'), findsOneWidget);
    });
  });
}
