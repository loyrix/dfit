import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:logmyplate_mobile/src/models/meal.dart';
import 'package:logmyplate_mobile/src/models/plate_score.dart';
import 'package:logmyplate_mobile/src/screens/meal_detail_screen.dart';
import 'package:logmyplate_mobile/src/screens/review_meal_screen.dart';
import 'package:logmyplate_mobile/src/theme/logmyplate_theme.dart';
import 'package:logmyplate_mobile/src/widgets/plate_score_card.dart';
import 'package:logmyplate_mobile/src/widgets/plate_score_chip.dart';
import 'package:logmyplate_mobile/src/widgets/plate_score_copy.dart';
import 'package:logmyplate_mobile/src/widgets/plate_score_sheet.dart';
import 'package:logmyplate_mobile/src/widgets/score_star_row.dart';

MealItem _item({
  required String name,
  required int calories,
  double proteinG = 10,
  double carbsG = 30,
  double fatG = 8,
  double? fiberG = 5,
}) => MealItem(
  name: name,
  quantity: 1,
  unit: 'serving',
  grams: 150,
  nutrition: MacroTotals(
    calories: calories,
    proteinG: proteinG,
    carbsG: carbsG,
    fatG: fatG,
    fiberG: fiberG,
  ),
);

Widget _wrap(Widget child) =>
    MaterialApp(theme: LogMyPlateTheme.light(), home: child);

void main() {
  // The Plate Score is still computed and still has its card and sheet, but no
  // screen shows it any more: users see the star rating instead. These tests
  // pin both halves — the screens stay free of the number, and the card keeps
  // working for when it is shown again.
  group('review screen shows no rating before the meal is saved', () {
    testWidgets('has no Plate Score number and no stars', (tester) async {
      await tester.pumpWidget(
        _wrap(
          ReviewMealScreen(
            initialItems: [_item(name: 'Dal', calories: 350)],
            plateScoreProfile: const PlateScoreProfile(
              dailyCalorieTarget: 2000,
              goal: HealthGoal.maintain,
            ),
            onConfirm: (_, _, {bool analyzeWithAI = false}) async {},
          ),
        ),
      );

      expect(find.byType(PlateScoreCard), findsNothing);
      expect(find.byKey(const ValueKey('plate-score-value')), findsNothing);
      expect(find.text('/100'), findsNothing);
      // Stars are computed by the server, so they first exist after saving.
      expect(find.byType(ScoreStarRow), findsNothing);
    });
  });

  group('plate score card', () {
    PlateScore scoreFor(List<MealItem> items, {PlateScoreProfile? profile}) =>
        calculatePlateScore(
          items: items.map((item) => item.nutrition).toList(),
          mealType: MealType.lunch,
          profile: profile,
          policy: PlateScorePolicy.fallback,
        )!;

    Widget card(PlateScore score, {VoidCallback? onPersonalise}) => _wrap(
      Scaffold(
        body: PlateScoreCard(score: score, onPersonalise: onPersonalise),
      ),
    );

    testWidgets('shows a general-tier score when there is no health target', (
      tester,
    ) async {
      await tester.pumpWidget(
        card(scoreFor([_item(name: 'Dal', calories: 350)])),
      );

      expect(find.byKey(const ValueKey('plate-score-value')), findsOneWidget);
      expect(find.textContaining('personalise'), findsOneWidget);
    });

    testWidgets('labels the score for a user with a health target', (
      tester,
    ) async {
      await tester.pumpWidget(
        card(
          scoreFor(
            [_item(name: 'Dal', calories: 350)],
            profile: const PlateScoreProfile(
              dailyCalorieTarget: 2000,
              goal: HealthGoal.maintain,
            ),
          ),
        ),
      );

      expect(find.text('Tap to see why'), findsOneWidget);
      expect(find.textContaining('personalise'), findsNothing);
    });

    test('scores a meal higher once a heavy item is removed', () {
      // A large, fat-heavy second item drags the balance down.
      final dal = _item(name: 'Dal', calories: 350);
      final friedSnack = _item(
        name: 'Fried Snack',
        calories: 900,
        proteinG: 4,
        carbsG: 60,
        fatG: 70,
        fiberG: 0,
      );

      expect(
        scoreFor([dal]).score,
        greaterThan(scoreFor([dal, friedSnack]).score),
      );
    });

    testWidgets('opens the breakdown sheet', (tester) async {
      await tester.pumpWidget(
        card(scoreFor([_item(name: 'Dal', calories: 350)])),
      );

      await tester.tap(find.byKey(const ValueKey('plate-score-value')));
      await tester.pumpAndSettle();

      expect(find.text('HOW THIS ADDS UP'), findsOneWidget);
    });

    testWidgets('offers to personalise a general-tier score', (tester) async {
      var tapped = false;
      await tester.pumpWidget(
        card(
          scoreFor([_item(name: 'Dal', calories: 350)]),
          onPersonalise: () => tapped = true,
        ),
      );

      await tester.tap(find.byKey(const ValueKey('plate-score-value')));
      await tester.pumpAndSettle();

      await tester.tap(find.text(PlateScoreCopy.personaliseTitle));
      await tester.pumpAndSettle();

      expect(tapped, isTrue);
    });

    testWidgets('hides the card when there is nothing to score', (
      tester,
    ) async {
      await tester.pumpWidget(
        _wrap(
          ReviewMealScreen(
            initialItems: const [],
            onConfirm: (_, _, {bool analyzeWithAI = false}) async {},
          ),
        ),
      );

      expect(find.byKey(const ValueKey('plate-score-value')), findsNothing);
    });
  });

  group('average score helpers', () {
    MealLog meal(int? score) => MealLog(
      id: 'meal-$score',
      type: MealType.lunch,
      title: 'Meal',
      loggedAt: DateTime(2026, 8, 1),
      items: const [],
      plateScore: score == null
          ? null
          : PlateScore(
              score: score,
              band: PlateScoreBand.good,
              tier: PlateScoreTier.general,
              axes: const [],
              skipped: const [],
            ),
    );

    test('averages only meals that have a score', () {
      // A meal logged before scoring shipped must not drag the average down.
      expect(averagePlateScoreOf([meal(80), meal(null), meal(60)]), 70);
    });

    test('returns null when nothing is scored', () {
      expect(averagePlateScoreOf([meal(null)]), isNull);
      expect(averagePlateScoreOf(const []), isNull);
    });

    test('bands an average with the same cutoffs as a single meal', () {
      const policy = PlateScorePolicy.fallback;
      expect(plateScoreBandFor(90, policy), PlateScoreBand.excellent);
      expect(plateScoreBandFor(72, policy), PlateScoreBand.good);
      expect(plateScoreBandFor(55, policy), PlateScoreBand.moderate);
      expect(plateScoreBandFor(20, policy), PlateScoreBand.heavy);
    });
  });

  group('warnings in the score sheet', () {
    Widget sheetWith(List<PlateWarning> warnings) => _wrap(
      Scaffold(
        body: PlateScoreSheet(
          score: PlateScore(
            score: 62,
            band: PlateScoreBand.moderate,
            tier: PlateScoreTier.personal,
            axes: const [],
            skipped: const [],
            warnings: warnings,
          ),
        ),
      ),
    );

    testWidgets('hides the section when there is nothing to flag', (
      tester,
    ) async {
      await tester.pumpWidget(sheetWith(const []));
      expect(find.text('WORTH KNOWING'), findsNothing);
    });

    testWidgets('shows a warning without revealing the nutrient value', (
      tester,
    ) async {
      await tester.pumpWidget(
        sheetWith(const [
          PlateWarning(
            code: 'high_sodium',
            text: 'Sodium looks high for one meal.',
            personalised: false,
          ),
        ]),
      );

      expect(find.text('WORTH KNOWING'), findsOneWidget);
      expect(find.text('Sodium looks high for one meal.'), findsOneWidget);
    });

    testWidgets('notes when a health condition made it more sensitive', (
      tester,
    ) async {
      await tester.pumpWidget(
        sheetWith(const [
          PlateWarning(
            code: 'high_sodium',
            text: 'Sodium looks high for one meal.',
            personalised: true,
          ),
        ]),
      );

      expect(
        find.textContaining('Flagged because of your health focus'),
        findsOneWidget,
      );
    });
  });

  group('meal advice', () {
    Widget sheetWith(MealAdvice? advice) => _wrap(
      Scaffold(
        body: PlateScoreSheet(
          score: const PlateScore(
            score: 72,
            band: PlateScoreBand.good,
            tier: PlateScoreTier.personal,
            axes: [],
            skipped: [],
          ),
          advice: advice,
        ),
      ),
    );

    test('treats an all-empty advice payload as absent', () {
      // An unremarkable meal should produce no card rather than empty headings.
      expect(
        MealAdvice.fromJson({
          'summary': '',
          'positives': <dynamic>[],
          'watchOuts': <dynamic>[],
          'swaps': <dynamic>[],
        }),
        isNull,
      );
      expect(MealAdvice.fromJson(null), isNull);
    });

    test('drops blank strings the model may emit', () {
      final advice = MealAdvice.fromJson({
        'summary': 'A balanced plate.',
        'positives': <dynamic>['Good protein', '   ', 42],
      });

      expect(advice, isNotNull);
      expect(advice!.positives, ['Good protein']);
    });

    testWidgets('shows nothing extra when there is no advice', (tester) async {
      await tester.pumpWidget(sheetWith(null));

      expect(find.text('WHAT WORKS HERE'), findsNothing);
      expect(find.text('TRY THIS NEXT TIME'), findsNothing);
    });

    testWidgets('renders summary, positives and swaps', (tester) async {
      await tester.pumpWidget(
        sheetWith(
          const MealAdvice(
            summary: 'A balanced plate with decent protein.',
            positives: ['Good protein source'],
            watchOuts: ['Fairly carb heavy'],
            swaps: ['Swap one roti for a salad'],
          ),
        ),
      );

      expect(
        find.text('A balanced plate with decent protein.'),
        findsOneWidget,
      );
      expect(find.text('Good protein source'), findsOneWidget);
      expect(find.text('Fairly carb heavy'), findsOneWidget);
      expect(find.text('Swap one roti for a salad'), findsOneWidget);
    });

    testWidgets('always states this is not medical advice', (tester) async {
      await tester.pumpWidget(
        sheetWith(const MealAdvice(summary: 'A balanced plate.')),
      );

      expect(find.textContaining('not medical advice'), findsOneWidget);
    });
  });

  group('score copy is understandable', () {
    testWidgets('anchors the number and names the verdict', (tester) async {
      await tester.pumpWidget(
        _wrap(
          const Scaffold(
            body: PlateScoreCard(
              score: PlateScore(
                score: 78,
                band: PlateScoreBand.good,
                tier: PlateScoreTier.general,
                axes: [],
                skipped: [],
              ),
            ),
          ),
        ),
      );

      // "78" alone left people guessing the scale and whether it was good.
      expect(find.text('/100'), findsOneWidget);
      expect(
        find.text(PlateScoreCopy.bandTitle(PlateScoreBand.good)),
        findsWidgets,
      );
    });

    test('never describes a poorly balanced meal as large', () {
      // "Heavy" appeared on 55 real meals under 400 kcal.
      for (final band in PlateScoreBand.values) {
        expect(
          PlateScoreCopy.bandTitle(band).toLowerCase(),
          isNot(contains('heavy')),
        );
      }
    });

    test('every axis state explains which way to move', () {
      const meal = PlateScoreMealLabel('lunch');
      for (final detail in PlateScoreAxisDetail.values) {
        final line = PlateScoreCopy.axisDetail(
          PlateScoreAxisResult(
            axis: PlateScoreAxis.calorieFit,
            score: 0,
            weight: 25,
            detail: detail,
          ),
          meal,
        );
        expect(line, isNotEmpty);
        expect(line, isNot(equals('0')));
      }
    });
  });

  group('score survives the paths that dropped it', () {
    PlateScore score() => const PlateScore(
      score: 74,
      band: PlateScoreBand.good,
      tier: PlateScoreTier.personal,
      axes: [],
      skipped: [],
    );

    MealLog savedMeal() => MealLog(
      id: 'meal-1',
      type: MealType.snack,
      title: 'Waffles with Berries',
      loggedAt: DateTime(2026, 8, 5),
      items: [_item(name: 'Waffle', calories: 468)],
      plateScore: score(),
      advice: const MealAdvice(summary: 'Mostly refined carbs.'),
    );

    test('MealLog round-trips the score and advice through the cache', () {
      // The bootstrap cache serialises meals with toJson and reads them back
      // with fromJson. Omitting these fields silently lost every score on a
      // cold start.
      final restored = MealLog.fromJson(savedMeal().toJson());

      expect(restored.plateScore, isNotNull);
      expect(restored.plateScore!.score, 74);
      expect(restored.advice?.summary, 'Mostly refined carbs.');
    });

    testWidgets('meal detail keeps the Plate Score out of sight', (
      tester,
    ) async {
      // The meal still carries its score; the screen just does not show it.
      await tester.pumpWidget(_wrap(MealDetailScreen(meal: savedMeal())));
      await tester.pumpAndSettle();

      expect(find.byType(PlateScoreCard), findsNothing);
      expect(find.text('/100'), findsNothing);
      expect(find.text('74'), findsNothing);
    });

    testWidgets('meal detail shows no card when there is no score', (
      tester,
    ) async {
      final unscored = MealLog(
        id: 'meal-2',
        type: MealType.snack,
        title: 'Old meal',
        loggedAt: DateTime(2026, 7, 1),
        items: [_item(name: 'Waffle', calories: 468)],
      );
      await tester.pumpWidget(_wrap(MealDetailScreen(meal: unscored)));
      await tester.pumpAndSettle();

      expect(find.byType(PlateScoreCard), findsNothing);
    });
  });

  group('PlateScoreChip', () {
    testWidgets('shows the number and colours by band', (tester) async {
      await tester.pumpWidget(
        _wrap(
          const Scaffold(
            body: PlateScoreChip(
              score: PlateScore(
                score: 82,
                band: PlateScoreBand.good,
                tier: PlateScoreTier.personal,
                axes: [],
                skipped: [],
              ),
            ),
          ),
        ),
      );

      expect(find.text('82'), findsOneWidget);
    });
  });
}
