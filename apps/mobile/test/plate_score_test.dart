import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:logmyplate_mobile/src/models/meal.dart';
import 'package:logmyplate_mobile/src/models/plate_score.dart';

/// Conformance suite for the shared Plate Score specification.
///
/// The same fixture is asserted by the TypeScript implementation in
/// packages/domain/src/plate-score-vectors.test.ts. Pinning both to one set of
/// vectors is what makes it safe to compute the score locally for the review
/// screen's live preview while the API stays authoritative for saved meals — if
/// the two ever disagree by a single point, both suites go red.
///
/// Regenerate after a deliberate scoring change:
///   pnpm --filter @logmyplate/domain build
///   node packages/domain/fixtures/generate-plate-score-vectors.mjs
void main() {
  final fixture = File('../../packages/domain/fixtures/plate-score-vectors.json');

  MacroTotals macrosFrom(Map<String, dynamic> json) => MacroTotals(
    calories: (json['calories'] as num).round(),
    proteinG: (json['proteinG'] as num).toDouble(),
    carbsG: (json['carbsG'] as num).toDouble(),
    fatG: (json['fatG'] as num).toDouble(),
    fiberG: (json['fiberG'] as num?)?.toDouble(),
    sugarG: (json['sugarG'] as num?)?.toDouble(),
    sodiumMg: (json['sodiumMg'] as num?)?.toDouble(),
  );

  MealType mealTypeFrom(String value) => switch (value) {
    'breakfast' => MealType.breakfast,
    'lunch' => MealType.lunch,
    'dinner' => MealType.dinner,
    _ => MealType.snack,
  };

  test('shared vector fixture is present', () {
    expect(
      fixture.existsSync(),
      isTrue,
      reason:
          'Expected ${fixture.path}. Regenerate with '
          'node packages/domain/fixtures/generate-plate-score-vectors.mjs',
    );
  });

  if (!fixture.existsSync()) return;

  final vectors =
      (jsonDecode(fixture.readAsStringSync()) as Map<String, dynamic>)['vectors']
          as List<dynamic>;

  test('fixture is non-trivial', () {
    expect(vectors.length, greaterThanOrEqualTo(10));
  });

  for (final raw in vectors) {
    final vector = raw as Map<String, dynamic>;
    final name = vector['name'] as String;
    final input = vector['input'] as Map<String, dynamic>;
    final expected = vector['expected'] as Map<String, dynamic>?;

    test('matches TypeScript: $name', () {
      final profileJson = input['profile'] as Map<String, dynamic>?;
      final result = calculatePlateScore(
        items: (input['items'] as List<dynamic>)
            .map((item) => macrosFrom(item as Map<String, dynamic>))
            .toList(),
        mealType: mealTypeFrom(input['mealType'] as String),
        profile: profileJson == null
            ? null
            : PlateScoreProfile(
                dailyCalorieTarget: (profileJson['dailyCalorieTarget'] as num).round(),
                goal: PlateScoreGoalWire.fromWire(profileJson['goal'] as String?),
              ),
      );

      if (expected == null) {
        expect(result, isNull);
        return;
      }

      expect(result, isNotNull);
      expect(result!.score, expected['score'] as int, reason: 'score for $name');
      expect(result.band.wireName, expected['band'] as String, reason: 'band for $name');
      expect(result.tier.wireName, expected['tier'] as String, reason: 'tier for $name');

      final expectedSkipped = (expected['skipped'] as List<dynamic>).cast<String>();
      expect(result.skipped.map((axis) => axis.wireName).toList(), expectedSkipped);

      final expectedAxes = (expected['axes'] as List<dynamic>)
          .cast<Map<String, dynamic>>();
      expect(result.axes.length, expectedAxes.length, reason: 'axis count for $name');
      for (var index = 0; index < expectedAxes.length; index += 1) {
        final actualAxis = result.axes[index];
        final expectedAxis = expectedAxes[index];
        expect(actualAxis.axis.wireName, expectedAxis['axis'] as String);
        expect(
          actualAxis.score,
          closeTo((expectedAxis['score'] as num).toDouble(), 0.05),
          reason: '${actualAxis.axis.wireName} score for $name',
        );
        expect(
          actualAxis.weight,
          closeTo((expectedAxis['weight'] as num).toDouble(), 0.05),
          reason: '${actualAxis.axis.wireName} weight for $name',
        );
      }
    });
  }

  group('policy parsing', () {
    test('falls back to bundled defaults when the API sends nothing', () {
      final policy = PlateScorePolicy.fromJson(null);
      expect(policy.weights[PlateScoreAxis.protein], 30);
      expect(policy.fiberDensityTarget, 14);
    });

    test('applies a backend override without an app release', () {
      final policy = PlateScorePolicy.fromJson({
        'fiberDensityTarget': 20,
        'bandCutoffs': {'excellent': 90},
      });

      expect(policy.fiberDensityTarget, 20);
      expect(policy.excellentCutoff, 90);
      // Unspecified fields keep their defaults rather than becoming zero.
      expect(policy.goodCutoff, 70);
      expect(policy.weights[PlateScoreAxis.protein], 30);
    });
  });

  group('PlateScore.fromJson', () {
    test('returns null when the API omits the score', () {
      expect(PlateScore.fromJson(null), isNull);
    });

    test('flags when a score could still be personalised', () {
      final score = PlateScore.fromJson({
        'score': 72,
        'band': 'good',
        'tier': 'general',
        'axes': <dynamic>[],
        'skipped': <dynamic>['calorie_fit'],
      });

      expect(score, isNotNull);
      expect(score!.canPersonalise, isTrue);
    });
  });
}
