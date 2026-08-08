import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:logmyplate_mobile/src/models/macro_targets.dart';
import 'package:logmyplate_mobile/src/models/score_rating.dart';
import 'package:logmyplate_mobile/src/theme/logmyplate_theme.dart';
import 'package:logmyplate_mobile/src/widgets/daily_score_card.dart';
import 'package:logmyplate_mobile/src/widgets/macro_split_sliders.dart';
import 'package:logmyplate_mobile/src/widgets/meal_score_row.dart';
import 'package:logmyplate_mobile/src/widgets/score_visuals.dart';

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
            computed: const MacroSplit(
              carbsPct: 45,
              fatPct: 30,
              proteinPct: 25,
            ),
            onEnabledChanged: (_) {},
            onChanged: (_) {},
          ),
        ),
      );

      // Off by default, showing the computed baseline rather than a stale
      // manual split.
      expect(
        find.text('Calculated from your goal and activity.'),
        findsOneWidget,
      );
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
            computed: const MacroSplit(
              carbsPct: 50,
              fatPct: 25,
              proteinPct: 25,
            ),
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

  group('score tone', () {
    test('maps stars to a tone', () {
      expect(scoreToneFor(1), ScoreTone.needsWork);
      expect(scoreToneFor(2), ScoreTone.needsWork);
      expect(scoreToneFor(3), ScoreTone.steady);
      expect(scoreToneFor(4), ScoreTone.great);
      expect(scoreToneFor(5), ScoreTone.great);
    });

    testWidgets('gives both themes their own palette', (tester) async {
      // Each theme gets a distinct key so the Builder element is rebuilt rather
      // than reused, which would silently capture the first theme twice.
      Future<ScoreToneStyle> capture(ThemeData theme, String key) async {
        late ScoreToneStyle captured;
        await tester.pumpWidget(
          MaterialApp(
            theme: theme,
            home: Builder(
              key: ValueKey(key),
              builder: (context) {
                captured = ScoreToneStyle.of(context, ScoreTone.great);
                return const SizedBox();
              },
            ),
          ),
        );
        // MaterialApp crossfades between themes; without settling, the first
        // frame still reports the outgoing palette.
        await tester.pumpAndSettle();
        return captured;
      }

      final lightStyle = await capture(LogMyPlateTheme.light(), 'light');
      final darkStyle = await capture(LogMyPlateTheme.dark(), 'dark');

      // Gold tuned for cream turns muddy on ink, so the two must not be equal.
      expect(darkStyle.starGradient, isNot(equals(lightStyle.starGradient)));
      expect(darkStyle.emptyStar, isNot(equals(lightStyle.emptyStar)));
    });

    testWidgets('never paints a filled star with the dark "on accent" token', (
      tester,
    ) async {
      // Regression: filled stars were drawn in accentOn (#3D2E07), a text-on-
      // accent colour, which rendered them muddy brown in both themes.
      for (final theme in [LogMyPlateTheme.light(), LogMyPlateTheme.dark()]) {
        await tester.pumpWidget(
          MaterialApp(
            theme: theme,
            home: Builder(
              builder: (context) {
                final style = ScoreToneStyle.of(context, ScoreTone.great);
                expect(
                  style.starGradient,
                  isNot(contains(const Color(0xFF3D2E07))),
                );
                return const SizedBox();
              },
            ),
          ),
        );
        await tester.pumpAndSettle();
      }
    });

    testWidgets('a weak rating is warm, not red', (tester) async {
      // Most real days land at one or two stars. An alarm state would fire
      // almost daily and the app would read as scolding.
      const destructive = Color(0xFFD94B4B);
      for (final theme in [LogMyPlateTheme.light(), LogMyPlateTheme.dark()]) {
        await tester.pumpWidget(
          MaterialApp(
            theme: theme,
            home: Builder(
              builder: (context) {
                final style = ScoreToneStyle.of(context, ScoreTone.needsWork);
                expect(style.starGradient, isNot(contains(destructive)));
                expect(style.wash.a, lessThan(0.2));
                return const SizedBox();
              },
            ),
          ),
        );
        await tester.pumpAndSettle();
      }
    });
  });

  group('celebration', () {
    testWidgets('bursts for a strong rating', (tester) async {
      await tester.pumpWidget(
        _host(
          const DailyScoreCard(
            rating: ScoreRating(
              stars: 5,
              message: 'Great job',
              level: ScoreLevel.daily,
            ),
            mealsLogged: 3,
          ),
        ),
      );
      await tester.pump(const Duration(milliseconds: 300));

      expect(find.byType(CustomPaint), findsWidgets);
      expect(find.byKey(const ValueKey('daily-score-badge')), findsOneWidget);
      expect(find.text('Excellent'), findsOneWidget);
      await tester.pumpAndSettle();
    });

    testWidgets('stays quiet for a weak rating', (tester) async {
      await tester.pumpWidget(
        _host(
          const DailyScoreCard(
            rating: ScoreRating(
              stars: 2,
              message: 'A bit off balance today.',
              level: ScoreLevel.daily,
            ),
            mealsLogged: 2,
          ),
        ),
      );
      await tester.pump(const Duration(milliseconds: 300));

      // No celebration and no badge: a weak day is met with warmth, not
      // decoration and not an alarm.
      expect(find.byKey(const ValueKey('daily-score-badge')), findsNothing);
      await tester.pumpAndSettle();
    });

    testWidgets('honours reduced motion', (tester) async {
      await tester.pumpWidget(
        MediaQuery(
          data: const MediaQueryData(disableAnimations: true),
          child: _host(
            const DailyScoreCard(
              rating: ScoreRating(
                stars: 5,
                message: 'Great job',
                level: ScoreLevel.daily,
              ),
              mealsLogged: 3,
            ),
          ),
        ),
      );
      await tester.pump();

      // The stars must still be there; only the motion is dropped.
      expect(find.byKey(const ValueKey('daily-score-stars')), findsOneWidget);
      await tester.pumpAndSettle();
    });
  });
}
