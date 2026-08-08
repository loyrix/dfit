import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:logmyplate_mobile/src/models/macro_targets.dart';
import 'package:logmyplate_mobile/src/models/meal.dart';

/// Conformance suite for the shared Part A specification.
///
/// The same fixture is asserted by the TypeScript implementation in
/// packages/domain/src/macro-targets.test.ts. Pinning both to one set of vectors
/// is what makes it safe for the target screen to preview a calorie number and
/// macro bands locally while the API stays authoritative for what is saved.
///
/// This is not a theoretical safeguard. The screen kept the old flat -300/+250
/// goal offsets after the server moved to multiplicative factors, and showed
/// people a target roughly 200 kcal away from the one being stored.
///
/// Regenerate after a deliberate change to Part A:
///   pnpm --filter @logmyplate/domain build
///   node packages/domain/fixtures/generate-macro-target-vectors.mjs
void main() {
  final fixture = File(
    '../../packages/domain/fixtures/macro-target-vectors.json',
  );

  HealthSex sexFrom(String value) => switch (value) {
    'male' => HealthSex.male,
    'female' => HealthSex.female,
    _ => HealthSex.notSpecified,
  };

  ActivityLevel? activityFrom(String value) => switch (value) {
    'sedentary' => ActivityLevel.sedentary,
    'light' => ActivityLevel.light,
    'moderate' => ActivityLevel.moderate,
    'active' => ActivityLevel.active,
    // The app does not yet offer "extra_active"; the API accepts it, so these
    // vectors are skipped rather than mapped onto a level that means something
    // different.
    _ => null,
  };

  HealthGoal goalFrom(String value) => switch (value) {
    'lose_gently' => HealthGoal.loseGently,
    'gain_gently' => HealthGoal.gainGently,
    _ => HealthGoal.maintain,
  };

  test('shared vector fixture is present', () {
    expect(
      fixture.existsSync(),
      isTrue,
      reason:
          'Run: node packages/domain/fixtures/generate-macro-target-vectors.mjs',
    );
  });

  test('matches every shared macro target vector', () {
    final data = jsonDecode(fixture.readAsStringSync()) as Map<String, dynamic>;
    final vectors = data['vectors'] as List<dynamic>;
    expect(vectors, isNotEmpty);

    var checked = 0;
    for (final entry in vectors) {
      final vector = entry as Map<String, dynamic>;
      final input = vector['input'] as Map<String, dynamic>;
      final expected = vector['expected'] as Map<String, dynamic>;
      final name = vector['name'] as String;

      final activityLevel = activityFrom(input['activityLevel'] as String);
      if (activityLevel == null) continue;
      checked++;

      final actual = calculateMacroTargets(
        heightCm: (input['heightCm'] as num).toDouble(),
        weightKg: (input['weightKg'] as num).toDouble(),
        ageYears: (input['ageYears'] as num).toInt(),
        sex: sexFrom(input['sex'] as String),
        activityLevel: activityLevel,
        goal: goalFrom(input['goal'] as String),
        customMacroSplit: MacroSplit.fromJson(
          input['customMacroSplit'] as Map<String, dynamic>?,
        ),
      );

      expect(actual.bmi, (expected['bmi'] as num).toDouble(), reason: '$name bmi');
      expect(
        actual.targetDailyCalories,
        (expected['targetDailyCalories'] as num).toInt(),
        reason: '$name target calories',
      );
      expect(
        actual.bmrCalories,
        (expected['bmrCalories'] as num).toDouble(),
        reason: '$name bmr',
      );

      final centers = expected['centers'] as Map<String, dynamic>;
      expect(
        actual.centers.carbsPct,
        (centers['carbsPct'] as num).toDouble(),
        reason: '$name carbs centre',
      );
      expect(
        actual.centers.fatPct,
        (centers['fatPct'] as num).toDouble(),
        reason: '$name fat centre',
      );
      expect(
        actual.centers.proteinPct,
        (centers['proteinPct'] as num).toDouble(),
        reason: '$name protein centre',
      );

      final bands = expected['bands'] as Map<String, dynamic>;
      final carbs = bands['carbsPct'] as Map<String, dynamic>;
      expect(
        actual.carbsBand.min,
        (carbs['min'] as num).toDouble(),
        reason: '$name carbs band min',
      );
      expect(
        actual.carbsBand.max,
        (carbs['max'] as num).toDouble(),
        reason: '$name carbs band max',
      );

      expect(
        actual.customSplitApplied,
        expected['customSplitApplied'] as bool,
        reason: '$name custom split flag',
      );
    }

    // Guards against the activity filter silently skipping everything.
    expect(checked, greaterThan(40));
  });

  test('a custom split replaces the computed centres outright', () {
    final targets = calculateMacroTargets(
      heightCm: 175,
      weightKg: 70,
      ageYears: 30,
      sex: HealthSex.male,
      activityLevel: ActivityLevel.moderate,
      goal: HealthGoal.maintain,
      customMacroSplit: const MacroSplit(
        carbsPct: 30,
        fatPct: 25,
        proteinPct: 45,
      ),
    );

    // An explicit choice is a stronger signal of intent than an estimate, so it
    // replaces rather than blends.
    expect(targets.centers.carbsPct, 30);
    expect(targets.centers.proteinPct, 45);
    expect(targets.customSplitApplied, isTrue);
    expect(targets.tolerance, 5);
  });
}
