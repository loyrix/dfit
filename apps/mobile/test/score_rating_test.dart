import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:logmyplate_mobile/src/models/macro_targets.dart';
import 'package:logmyplate_mobile/src/models/score_rating.dart';
import 'package:logmyplate_mobile/src/theme/logmyplate_theme.dart';
import 'package:logmyplate_mobile/src/widgets/daily_score_card.dart';
import 'package:logmyplate_mobile/src/widgets/macro_split_sliders.dart';
import 'package:logmyplate_mobile/src/widgets/meal_score_row.dart';

Widget _host(Widget child) {
  return MaterialApp(
    theme: LogMyPlateTheme.light(),
    home: Scaffold(body: SingleChildScrollView(child: child)),
  );
}

void main() {
  group('ScoreRating.fromJson', () {
    test('parses a well-formed rating', () {
      final rating = ScoreRating.fromJson({
        'stars': 4,
        'message': 'Solid day!',
        'level': 'daily',
        'provisional': true,
      });

      expect(rating, isNotNull);
      expect(rating!.stars, 4);
      expect(rating.level, ScoreLevel.daily);
      expect(rating.provisional, isTrue);
    });

    test('returns null rather than a default when absent', () {
      // An untracked day is not a bad day. A missing rating must render as no
      // card, never as one star.
      expect(ScoreRating.fromJson(null), isNull);
    });

    test('rejects a star count outside 1-5', () {
      // Out of range means the payload is not what we think it is. Showing
      // nothing beats clamping to something plausible and wrong.
      expect(
        ScoreRating.fromJson({'stars': 0, 'message': 'x', 'level': 'daily'}),
        isNull,
      );
      expect(
        ScoreRating.fromJson({'stars': 9, 'message': 'x', 'level': 'daily'}),
        isNull,
      );
    });

    test('rejects an unknown level', () {
      expect(
        ScoreRating.fromJson({'stars': 3, 'message': 'x', 'level': 'yearly'}),
        isNull,
      );
    });

    test('defaults provisional to false', () {
      final rating = ScoreRating.fromJson({
        'stars': 3,
        'message': 'x',
        'level': 'meal',
      });
      expect(rating!.provisional, isFalse);
    });

    test('survives a cache round-trip', () {
      // Bootstrap is cached through toJson; dropping this lost the card on
      // every cold start when it happened to plateScore and advice.
      const original = ScoreRating(
        stars: 5,
        message: 'Great job',
        level: ScoreLevel.weekly,
        provisional: false,
      );
      final restored = ScoreRating.fromJson(original.toJson());
      expect(restored!.stars, 5);
      expect(restored.level, ScoreLevel.weekly);
      expect(restored.message, 'Great job');
    });
  });

  group('DailyScoreCard', () {
    testWidgets('shows stars and the message, never a number', (tester) async {
      await tester.pumpWidget(
        _host(
          const DailyScoreCard(
            rating: ScoreRating(
              stars: 4,
              message: 'Solid day! You are close to your targets.',
              level: ScoreLevel.daily,
            ),
            mealsLogged: 3,
          ),
        ),
      );

      expect(find.byKey(const ValueKey('daily-score-stars')), findsOneWidget);
      expect(
        find.text('Solid day! You are close to your targets.'),
        findsOneWidget,
      );
      // The 0-100 score is internal. Nothing on this card may imply otherwise.
      expect(find.textContaining('/100'), findsNothing);
      expect(find.textContaining('out of 100'), findsNothing);
    });

    testWidgets('frames a provisional day as still in progress', (
      tester,
    ) async {
      await tester.pumpWidget(
        _host(
          const DailyScoreCard(
            rating: ScoreRating(
              stars: 2,
              message: 'A bit off balance today.',
              level: ScoreLevel.daily,
              provisional: true,
            ),
            mealsLogged: 1,
          ),
        ),
      );

      // Someone who has logged one meal is not having a two-star day.
      expect(
        find.byKey(const ValueKey('daily-score-progress-note')),
        findsOneWidget,
      );
      expect(find.textContaining('1 meal so far'), findsOneWidget);
    });

    testWidgets('omits the in-progress note once the day is settled', (
      tester,
    ) async {
      await tester.pumpWidget(
        _host(
          const DailyScoreCard(
            rating: ScoreRating(
              stars: 4,
              message: 'Solid day!',
              level: ScoreLevel.daily,
            ),
            mealsLogged: 3,
          ),
        ),
      );

      expect(
        find.byKey(const ValueKey('daily-score-progress-note')),
        findsNothing,
      );
    });
  });

  group('WeeklyScoreCard', () {
    testWidgets('names how many days it is built from', (tester) async {
      await tester.pumpWidget(
        _host(
          const WeeklyScoreCard(
            rating: ScoreRating(
              stars: 4,
              message: 'Strong week!',
              level: ScoreLevel.weekly,
            ),
            trackedDays: 2,
          ),
        ),
      );

      // A four-star week built from two days must not read as a full one.
      expect(find.text('From 2 days logged this week.'), findsOneWidget);
      expect(find.byKey(const ValueKey('weekly-score-stars')), findsOneWidget);
    });
  });

  group('MealScoreRow', () {
    testWidgets('shows the per-meal rating without a number', (tester) async {
      await tester.pumpWidget(
        _host(
          const MealScoreRow(
            rating: ScoreRating(
              stars: 3,
              message: 'Reasonably balanced meal.',
              level: ScoreLevel.meal,
            ),
          ),
        ),
      );

      expect(find.byKey(const ValueKey('meal-score-stars')), findsOneWidget);
      expect(find.text('Reasonably balanced meal.'), findsOneWidget);
      expect(find.textContaining('/100'), findsNothing);
    });
  });

  group('MacroSplitSliders.redistribute', () {
    const start = MacroSplit(carbsPct: 50, fatPct: 25, proteinPct: 25);

    double total(MacroSplit split) =>
        split.carbsPct + split.fatPct + split.proteinPct;

    test('always totals 100', () {
      for (final value in [10.0, 25.0, 33.0, 47.0, 70.0]) {
        for (final kind in MacroKind.values) {
          final result = MacroSplitSliders.redistribute(start, kind, value);
          expect(
            total(result),
            closeTo(100, 0.05),
            reason: '$kind at $value must still total 100',
          );
        }
      }
    });

    test('moves the dragged macro to the requested value', () {
      final result = MacroSplitSliders.redistribute(
        start,
        MacroKind.protein,
        40,
      );
      expect(result.proteinPct, 40);
    });

    test('splits the difference in proportion to the other two', () {
      // Carbs 50 -> 40 frees 10 points across an even 25/25, so both rise
      // equally rather than one absorbing all of it.
      final result = MacroSplitSliders.redistribute(start, MacroKind.carbs, 40);
      expect(result.carbsPct, 40);
      expect(result.fatPct, closeTo(30, 0.05));
      expect(result.proteinPct, closeTo(30, 0.05));
    });

    test('keeps every macro above the floor at the extremes', () {
      final result = MacroSplitSliders.redistribute(start, MacroKind.carbs, 70);
      expect(result.fatPct, greaterThanOrEqualTo(10));
      expect(result.proteinPct, greaterThanOrEqualTo(10));
      expect(total(result), closeTo(100, 0.05));
    });

    test('clamps a value past the allowed range', () {
      final result = MacroSplitSliders.redistribute(start, MacroKind.fat, 95);
      expect(result.fatPct, 70);
      expect(total(result), closeTo(100, 0.05));
    });
  });

  group('MacroSplitSliders widget', () {
    testWidgets('disables the sliders until the override is switched on', (
      tester,
    ) async {
      await tester.pumpWidget(
        _host(
          MacroSplitSliders(
            enabled: false,
            split: const MacroSplit(carbsPct: 50, fatPct: 25, proteinPct: 25),
            computed: const MacroSplit(carbsPct: 45, fatPct: 30, proteinPct: 25),
            onEnabledChanged: (_) {},
            onChanged: (_) {},
          ),
        ),
      );

      // Off by default, showing the computed baseline rather than a stale
      // manual split.
      expect(find.text('Calculated from your goal and activity.'), findsOneWidget);
      final slider = tester.widget<Slider>(
        find.descendant(
          of: find.byKey(const ValueKey('macro-split-carbs')),
          matching: find.byType(Slider),
        ),
      );
      expect(slider.onChanged, isNull);
      expect(slider.value, 45);
    });

    testWidgets('reports a redistributed split when dragged', (tester) async {
      MacroSplit? reported;
      await tester.pumpWidget(
        _host(
          MacroSplitSliders(
            enabled: true,
            split: const MacroSplit(carbsPct: 50, fatPct: 25, proteinPct: 25),
            computed: const MacroSplit(carbsPct: 50, fatPct: 25, proteinPct: 25),
            onEnabledChanged: (_) {},
            onChanged: (split) => reported = split,
          ),
        ),
      );

      await tester.drag(
        find.descendant(
          of: find.byKey(const ValueKey('macro-split-carbs')),
          matching: find.byType(Slider),
        ),
        const Offset(-60, 0),
      );
      await tester.pump();

      expect(reported, isNotNull);
      expect(
        reported!.carbsPct + reported!.fatPct + reported!.proteinPct,
        closeTo(100, 0.05),
      );
      expect(reported!.carbsPct, lessThan(50));
    });
  });
}
