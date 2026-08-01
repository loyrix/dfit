import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:logmyplate_mobile/src/models/meal.dart';
import 'package:logmyplate_mobile/src/models/plate_score.dart';
import 'package:logmyplate_mobile/src/screens/review_meal_screen.dart';
import 'package:logmyplate_mobile/src/theme/logmyplate_theme.dart';
import 'package:logmyplate_mobile/src/widgets/plate_score_chip.dart';

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

int _visibleScore(WidgetTester tester) {
  final text = tester.widget<Text>(
    find.byKey(const ValueKey('plate-score-value')),
  );
  return int.parse(text.data!);
}

void main() {
  group('review screen plate score', () {
    testWidgets('shows a general-tier score when there is no health target', (
      tester,
    ) async {
      await tester.pumpWidget(
        _wrap(
          ReviewMealScreen(
            initialItems: [_item(name: 'Dal', calories: 350)],
            onConfirm: (_, _, {bool analyzeWithAI = false}) async {},
          ),
        ),
      );

      expect(find.byKey(const ValueKey('plate-score-value')), findsOneWidget);
      expect(find.textContaining('General balance'), findsOneWidget);
    });

    testWidgets('labels the score for a user with a health target', (
      tester,
    ) async {
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

      expect(find.textContaining('For your goal'), findsOneWidget);
      expect(find.textContaining('General balance'), findsNothing);
    });

    testWidgets('recomputes immediately when an item is removed', (
      tester,
    ) async {
      await tester.pumpWidget(
        _wrap(
          ReviewMealScreen(
            // A large, fat-heavy second item drags the balance down, so removing
            // it must visibly move the score without any network round-trip.
            initialItems: [
              _item(name: 'Dal', calories: 350),
              _item(
                name: 'Fried Snack',
                calories: 900,
                proteinG: 4,
                carbsG: 60,
                fatG: 70,
                fiberG: 0,
              ),
            ],
            onConfirm: (_, _, {bool analyzeWithAI = false}) async {},
          ),
        ),
      );

      final before = _visibleScore(tester);

      await tester.drag(find.text('Fried Snack'), const Offset(-500, 0));
      await tester.pumpAndSettle();

      expect(find.text('Fried Snack'), findsNothing);
      expect(_visibleScore(tester), greaterThan(before));
    });

    testWidgets('opens the breakdown sheet without leaving the review screen', (
      tester,
    ) async {
      await tester.pumpWidget(
        _wrap(
          ReviewMealScreen(
            initialItems: [_item(name: 'Dal', calories: 350)],
            onConfirm: (_, _, {bool analyzeWithAI = false}) async {},
          ),
        ),
      );

      await tester.tap(find.byKey(const ValueKey('plate-score-value')));
      await tester.pumpAndSettle();

      expect(find.text('WHAT WENT INTO THIS'), findsOneWidget);
      // The unconfirmed meal must still be behind the sheet.
      expect(find.text('Confirm meal'), findsOneWidget);
    });

    testWidgets('offers to personalise a general-tier score', (tester) async {
      var tapped = false;
      await tester.pumpWidget(
        _wrap(
          ReviewMealScreen(
            initialItems: [_item(name: 'Dal', calories: 350)],
            onPersonaliseScore: () => tapped = true,
            onConfirm: (_, _, {bool analyzeWithAI = false}) async {},
          ),
        ),
      );

      await tester.tap(find.byKey(const ValueKey('plate-score-value')));
      await tester.pumpAndSettle();

      await tester.tap(find.textContaining('Add your height, weight and goal'));
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
