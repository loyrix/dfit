/// Part A — personalised macro targets, ported from `packages/domain`.
///
/// This exists so the target screen can show the calorie number and the macro
/// bands moving as the user drags a slider, without a request per frame. The
/// server stays authoritative for anything saved; this is a preview.
///
/// A preview that disagrees with what gets saved is worse than no preview, so
/// both implementations are pinned to
/// `packages/domain/fixtures/macro-target-vectors.json`. If they ever diverge by
/// a single point, both test suites go red. That is not hypothetical: this
/// screen kept the old flat −300/+250 goal offsets after the server moved to
/// multiplicative factors, and showed people a target roughly 200 kcal from the
/// one being stored.
///
/// Regenerate after a deliberate change to Part A:
///   pnpm --filter @logmyplate/domain build
///   node packages/domain/fixtures/generate-macro-target-vectors.mjs
library;

import 'dart:math' as math;

import 'meal.dart';

class MacroBand {
  const MacroBand({required this.min, required this.max});

  final double min;
  final double max;
}

class MacroSplit {
  const MacroSplit({
    required this.carbsPct,
    required this.fatPct,
    required this.proteinPct,
  });

  final double carbsPct;
  final double fatPct;
  final double proteinPct;

  Map<String, dynamic> toJson() => {
    'carbsPct': carbsPct,
    'fatPct': fatPct,
    'proteinPct': proteinPct,
  };

  static MacroSplit? fromJson(Map<String, dynamic>? json) {
    if (json == null) return null;
    final carbs = (json['carbsPct'] as num?)?.toDouble();
    final fat = (json['fatPct'] as num?)?.toDouble();
    final protein = (json['proteinPct'] as num?)?.toDouble();
    if (carbs == null || fat == null || protein == null) return null;
    return MacroSplit(carbsPct: carbs, fatPct: fat, proteinPct: protein);
  }

  bool sameAs(MacroSplit? other) {
    if (other == null) return false;
    return carbsPct == other.carbsPct &&
        fatPct == other.fatPct &&
        proteinPct == other.proteinPct;
  }
}

class MacroTargets {
  const MacroTargets({
    required this.bmi,
    required this.bmrCalories,
    required this.tdeeCalories,
    required this.targetDailyCalories,
    required this.centers,
    required this.carbsBand,
    required this.fatBand,
    required this.proteinBand,
    required this.tolerance,
    required this.customSplitApplied,
  });

  final double bmi;
  final double bmrCalories;
  final double tdeeCalories;
  final int targetDailyCalories;
  final MacroSplit centers;
  final MacroBand carbsBand;
  final MacroBand fatBand;
  final MacroBand proteinBand;
  final double tolerance;
  final bool customSplitApplied;
}

double _round1(double value) => (value * 10).round() / 10;

/// A3. `active` is the spec's "very active".
double _activityFactor(ActivityLevel level) {
  return switch (level) {
    ActivityLevel.sedentary => 1.2,
    ActivityLevel.light => 1.375,
    ActivityLevel.moderate => 1.55,
    ActivityLevel.active => 1.725,
  };
}

/// A4. Multiplicative rather than a flat offset, so a deficit scales with the
/// person's actual needs instead of taking the same 300 kcal off everyone.
double _goalFactor(HealthGoal goal) {
  return switch (goal) {
    HealthGoal.loseGently => 0.8,
    HealthGoal.maintain => 1.0,
    HealthGoal.gainGently => 1.1,
  };
}

/// A7. Goal-driven users get a tighter band; maintenance tolerates more drift.
double _tolerance(HealthGoal goal) {
  return switch (goal) {
    HealthGoal.loseGently => 5,
    HealthGoal.gainGently => 5,
    HealthGoal.maintain => 8,
  };
}

/// A5 buckets activity into two groups rather than five: the macro centre only
/// needs to tell "mostly still" from "training".
bool _isHigherActivity(ActivityLevel level) =>
    level == ActivityLevel.moderate || level == ActivityLevel.active;

/// A5. Goal × activity drives composition.
MacroSplit _macroCenters(HealthGoal goal, ActivityLevel activityLevel) {
  final higher = _isHigherActivity(activityLevel);
  return switch (goal) {
    HealthGoal.loseGently => higher
        ? const MacroSplit(carbsPct: 35, fatPct: 25, proteinPct: 40)
        : const MacroSplit(carbsPct: 30, fatPct: 30, proteinPct: 40),
    HealthGoal.gainGently => higher
        ? const MacroSplit(carbsPct: 45, fatPct: 25, proteinPct: 30)
        : const MacroSplit(carbsPct: 40, fatPct: 25, proteinPct: 35),
    HealthGoal.maintain => higher
        ? const MacroSplit(carbsPct: 50, fatPct: 25, proteinPct: 25)
        : const MacroSplit(carbsPct: 45, fatPct: 30, proteinPct: 25),
  };
}

/// A6. A small additive nudge, never an override: BMI describes body status
/// while goal and activity describe intent, and intent stays in charge.
MacroSplit _applyBmiNudge(MacroSplit centers, double bmi) {
  if (bmi >= 30) {
    return MacroSplit(
      carbsPct: centers.carbsPct - 5,
      fatPct: centers.fatPct,
      proteinPct: centers.proteinPct + 5,
    );
  }
  if (bmi < 18.5) {
    return MacroSplit(
      carbsPct: centers.carbsPct + 5,
      fatPct: centers.fatPct + 3,
      proteinPct: centers.proteinPct - 3,
    );
  }
  return centers;
}

/// A2. Mifflin-St Jeor. "not specified" averages the two, per the spec.
double calculateBmr({
  required double heightCm,
  required double weightKg,
  required int ageYears,
  required HealthSex sex,
}) {
  final base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  return switch (sex) {
    HealthSex.male => base + 5,
    HealthSex.female => base - 161,
    HealthSex.notSpecified => base + (5 + -161) / 2,
  };
}

MacroBand _band(double center, double tolerance) =>
    MacroBand(min: _round1(center - tolerance), max: _round1(center + tolerance));

MacroTargets calculateMacroTargets({
  required double heightCm,
  required double weightKg,
  required int ageYears,
  required HealthSex sex,
  required ActivityLevel activityLevel,
  required HealthGoal goal,
  MacroSplit? customMacroSplit,
}) {
  final heightM = heightCm / 100;
  final bmi = _round1(weightKg / (heightM * heightM));

  final bmr = calculateBmr(
    heightCm: heightCm,
    weightKg: weightKg,
    ageYears: ageYears,
    sex: sex,
  );
  final tdee = bmr * _activityFactor(activityLevel);
  final targetDailyCalories = (tdee * _goalFactor(goal)).round();

  final customApplied = customMacroSplit != null;

  // A9 replaces the centres entirely and fixes tolerance at 5.
  final centers = customApplied
      ? customMacroSplit
      : _applyBmiNudge(_macroCenters(goal, activityLevel), bmi);
  final tolerance = customApplied ? 5.0 : _tolerance(goal);

  return MacroTargets(
    bmi: bmi,
    bmrCalories: _round1(bmr),
    tdeeCalories: _round1(tdee),
    targetDailyCalories: targetDailyCalories,
    centers: centers,
    carbsBand: _band(centers.carbsPct, tolerance),
    fatBand: _band(centers.fatPct, tolerance),
    proteinBand: _band(centers.proteinPct, tolerance),
    tolerance: tolerance,
    customSplitApplied: customApplied,
  );
}

/// The calorie floor the API applies on top of Part A.
///
/// A product safety rail rather than part of the spec: it keeps a very small or
/// very sedentary profile from producing a target nobody should eat to.
int calorieFloorFor(HealthSex sex) {
  return switch (sex) {
    HealthSex.male => 1500,
    HealthSex.female => 1200,
    HealthSex.notSpecified => 1300,
  };
}

int targetCaloriesWithFloor({
  required int targetDailyCalories,
  required HealthSex sex,
}) => math.max(calorieFloorFor(sex), targetDailyCalories);
