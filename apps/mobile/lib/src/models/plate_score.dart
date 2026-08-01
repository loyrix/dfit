import 'meal.dart';

/// Plate Score — a deterministic 0-100 rating of a single meal.
///
/// This is a deliberate port of `packages/domain/src/plate-score.ts`. The two
/// implementations are pinned to a shared fixture
/// (`packages/domain/fixtures/plate-score-vectors.json`) that both test suites
/// assert against, so they cannot drift apart silently.
///
/// Why a local copy exists at all: the review screen is an editing screen, and
/// recomputing on the server would mean a network round-trip per portion tweak.
/// The *shape* of the algorithm lives here; every tunable number arrives from
/// the API in `bootstrap.plateScorePolicy`, so the weights and targets stay
/// adjustable from the backend without an app release.
///
/// The API remains authoritative for saved meals. This is used for the live
/// preview while a meal is still being edited.
enum PlateScoreAxis { calorieFit, protein, macroBalance, fiber }

enum PlateScoreBand { excellent, good, moderate, heavy }

enum PlateScoreTier { general, personal }

enum PlateScoreGoal { maintain, loseGently, gainGently }

extension PlateScoreAxisWire on PlateScoreAxis {
  String get wireName => switch (this) {
    PlateScoreAxis.calorieFit => 'calorie_fit',
    PlateScoreAxis.protein => 'protein',
    PlateScoreAxis.macroBalance => 'macro_balance',
    PlateScoreAxis.fiber => 'fiber',
  };

  static PlateScoreAxis? fromWire(String value) => switch (value) {
    'calorie_fit' => PlateScoreAxis.calorieFit,
    'protein' => PlateScoreAxis.protein,
    'macro_balance' => PlateScoreAxis.macroBalance,
    'fiber' => PlateScoreAxis.fiber,
    _ => null,
  };
}

extension PlateScoreBandWire on PlateScoreBand {
  String get wireName => name;

  static PlateScoreBand fromWire(String value) => switch (value) {
    'excellent' => PlateScoreBand.excellent,
    'good' => PlateScoreBand.good,
    'moderate' => PlateScoreBand.moderate,
    _ => PlateScoreBand.heavy,
  };
}

extension PlateScoreTierWire on PlateScoreTier {
  String get wireName => name;

  static PlateScoreTier fromWire(String value) =>
      value == 'personal' ? PlateScoreTier.personal : PlateScoreTier.general;
}

extension PlateScoreGoalWire on PlateScoreGoal {
  String get wireName => switch (this) {
    PlateScoreGoal.maintain => 'maintain',
    PlateScoreGoal.loseGently => 'lose_gently',
    PlateScoreGoal.gainGently => 'gain_gently',
  };

  static PlateScoreGoal fromWire(String? value) => switch (value) {
    'lose_gently' => PlateScoreGoal.loseGently,
    'gain_gently' => PlateScoreGoal.gainGently,
    _ => PlateScoreGoal.maintain,
  };
}

class PlateScoreRange {
  const PlateScoreRange({required this.min, required this.max});

  final double min;
  final double max;

  factory PlateScoreRange.fromJson(
    Map<String, dynamic>? json,
    PlateScoreRange fallback,
  ) {
    if (json == null) return fallback;
    return PlateScoreRange(
      min: (json['min'] as num?)?.toDouble() ?? fallback.min,
      max: (json['max'] as num?)?.toDouble() ?? fallback.max,
    );
  }
}

/// Every tunable number, mirroring `PlateScorePolicy` in the domain package.
///
/// Defaults match the shipped TypeScript values so an older API that does not
/// send a policy still scores identically.
class PlateScorePolicy {
  const PlateScorePolicy({
    this.weights = const {
      PlateScoreAxis.calorieFit: 25,
      PlateScoreAxis.protein: 30,
      PlateScoreAxis.macroBalance: 25,
      PlateScoreAxis.fiber: 20,
    },
    this.mealShare = const {
      MealType.breakfast: 0.25,
      MealType.lunch: 0.35,
      MealType.dinner: 0.3,
      MealType.snack: 0.1,
    },
    this.calorieTolerance = const {
      MealType.breakfast: 0.35,
      MealType.lunch: 0.35,
      MealType.dinner: 0.35,
      MealType.snack: 0.7,
    },
    this.proteinDensityTarget = const {
      PlateScoreGoal.maintain: 40,
      PlateScoreGoal.loseGently: 50,
      PlateScoreGoal.gainGently: 45,
    },
    this.generalProteinDensityTarget = 40,
    this.fiberDensityTarget = 14,
    this.proteinPct = const PlateScoreRange(min: 15, max: 35),
    this.carbsPct = const PlateScoreRange(min: 40, max: 65),
    this.fatPct = const PlateScoreRange(min: 20, max: 35),
    this.penaltyMultiplier = 1.5,
    this.excellentCutoff = 85,
    this.goodCutoff = 70,
    this.moderateCutoff = 50,
  });

  final Map<PlateScoreAxis, double> weights;
  final Map<MealType, double> mealShare;
  final Map<MealType, double> calorieTolerance;
  final Map<PlateScoreGoal, double> proteinDensityTarget;
  final double generalProteinDensityTarget;
  final double fiberDensityTarget;
  final PlateScoreRange proteinPct;
  final PlateScoreRange carbsPct;
  final PlateScoreRange fatPct;
  final double penaltyMultiplier;
  final double excellentCutoff;
  final double goodCutoff;
  final double moderateCutoff;

  static const fallback = PlateScorePolicy();

  /// Parses the policy served in bootstrap. Any missing field falls back to the
  /// bundled default rather than to zero, so a partial payload never produces a
  /// nonsense score.
  factory PlateScorePolicy.fromJson(Map<String, dynamic>? json) {
    if (json == null) return fallback;
    const base = fallback;

    double pick(Map<String, dynamic>? source, String key, double fallbackValue) =>
        (source?[key] as num?)?.toDouble() ?? fallbackValue;

    final weights = json['weights'] as Map<String, dynamic>?;
    final shares = json['mealShare'] as Map<String, dynamic>?;
    final tolerance = json['calorieTolerance'] as Map<String, dynamic>?;
    final protein = json['proteinDensityTarget'] as Map<String, dynamic>?;
    final bands = json['macroBands'] as Map<String, dynamic>?;
    final cutoffs = json['bandCutoffs'] as Map<String, dynamic>?;

    return PlateScorePolicy(
      weights: {
        for (final axis in PlateScoreAxis.values)
          axis: pick(weights, axis.wireName, base.weights[axis]!),
      },
      mealShare: {
        for (final type in MealType.values)
          type: pick(shares, type.name, base.mealShare[type]!),
      },
      calorieTolerance: {
        for (final type in MealType.values)
          type: pick(tolerance, type.name, base.calorieTolerance[type]!),
      },
      proteinDensityTarget: {
        for (final goal in PlateScoreGoal.values)
          goal: pick(protein, goal.wireName, base.proteinDensityTarget[goal]!),
      },
      generalProteinDensityTarget: pick(
        json,
        'generalProteinDensityTarget',
        base.generalProteinDensityTarget,
      ),
      fiberDensityTarget: pick(json, 'fiberDensityTarget', base.fiberDensityTarget),
      proteinPct: PlateScoreRange.fromJson(
        bands?['proteinPct'] as Map<String, dynamic>?,
        base.proteinPct,
      ),
      carbsPct: PlateScoreRange.fromJson(
        bands?['carbsPct'] as Map<String, dynamic>?,
        base.carbsPct,
      ),
      fatPct: PlateScoreRange.fromJson(
        bands?['fatPct'] as Map<String, dynamic>?,
        base.fatPct,
      ),
      penaltyMultiplier: pick(bands, 'penaltyMultiplier', base.penaltyMultiplier),
      excellentCutoff: pick(cutoffs, 'excellent', base.excellentCutoff),
      goodCutoff: pick(cutoffs, 'good', base.goodCutoff),
      moderateCutoff: pick(cutoffs, 'moderate', base.moderateCutoff),
    );
  }
}

class PlateScoreAxisResult {
  const PlateScoreAxisResult({
    required this.axis,
    required this.score,
    required this.weight,
  });

  final PlateScoreAxis axis;
  final double score;
  final double weight;
}

class PlateScoreProfile {
  const PlateScoreProfile({required this.dailyCalorieTarget, required this.goal});

  final int dailyCalorieTarget;
  final PlateScoreGoal goal;
}

class PlateScore {
  const PlateScore({
    required this.score,
    required this.band,
    required this.tier,
    required this.axes,
    required this.skipped,
  });

  final int score;
  final PlateScoreBand band;
  final PlateScoreTier tier;
  final List<PlateScoreAxisResult> axes;
  final List<PlateScoreAxis> skipped;

  /// Reads a score computed by the API. Returns null when absent, so an older
  /// API response simply renders no score rather than a fabricated zero.
  static PlateScore? fromJson(Map<String, dynamic>? json) {
    if (json == null) return null;
    final score = (json['score'] as num?)?.round();
    if (score == null) return null;

    return PlateScore(
      score: score,
      band: PlateScoreBandWire.fromWire(json['band'] as String? ?? 'heavy'),
      tier: PlateScoreTierWire.fromWire(json['tier'] as String? ?? 'general'),
      axes: ((json['axes'] as List<dynamic>?) ?? const [])
          .whereType<Map<String, dynamic>>()
          .map((entry) {
            final axis = PlateScoreAxisWire.fromWire(entry['axis'] as String? ?? '');
            if (axis == null) return null;
            return PlateScoreAxisResult(
              axis: axis,
              score: (entry['score'] as num?)?.toDouble() ?? 0,
              weight: (entry['weight'] as num?)?.toDouble() ?? 0,
            );
          })
          .whereType<PlateScoreAxisResult>()
          .toList(),
      skipped: ((json['skipped'] as List<dynamic>?) ?? const [])
          .whereType<String>()
          .map(PlateScoreAxisWire.fromWire)
          .whereType<PlateScoreAxis>()
          .toList(),
    );
  }

  /// True when the user could get a more tailored score by filling in their
  /// health target. Drives the "personalise this" prompt.
  bool get canPersonalise => skipped.contains(PlateScoreAxis.calorieFit);
}

double _clamp(double value) => value.clamp(0, 100).toDouble();

double _round1(double value) => (value * 10).round() / 10;

/// Sums macros while preserving "unknown": a micronutrient counts only when at
/// least one item reported it. Absent stays absent so its axis is skipped rather
/// than scored as zero.
({double calories, double proteinG, double carbsG, double fatG, double? fiberG})
_sumForScoring(List<MacroTotals> items) {
  var calories = 0.0;
  var proteinG = 0.0;
  var carbsG = 0.0;
  var fatG = 0.0;
  double? fiberG;

  for (final item in items) {
    calories += item.calories.toDouble();
    proteinG += item.proteinG;
    carbsG += item.carbsG;
    fatG += item.fatG;
    final fiber = item.fiberG;
    if (fiber != null && fiber >= 0) fiberG = (fiberG ?? 0) + fiber;
  }

  return (
    calories: calories,
    proteinG: proteinG,
    carbsG: carbsG,
    fatG: fatG,
    fiberG: fiberG,
  );
}

/// One-sided: full marks at or below the expected share, declining only above
/// it. Eating less than a nominal meal share is not a fault.
double _calorieFitScore(double actual, double expected, double tolerance) {
  if (expected <= 0) return 0;
  if (actual <= expected) return 100;
  final excess = (actual - expected) / expected;
  if (excess >= tolerance) return 0;
  return _clamp(100 * (1 - excess / tolerance));
}

/// Rises to the target and plateaus: exceeding it is not a fault.
double _adequacyScore(double actual, double target) {
  if (target <= 0) return 0;
  return _clamp((actual / target) * 100);
}

double _macroBalanceScore(
  double calories,
  double proteinG,
  double carbsG,
  double fatG,
  PlateScorePolicy policy,
) {
  if (calories <= 0) return 0;

  final proteinPct = ((proteinG * 4) / calories) * 100;
  final carbsPct = ((carbsG * 4) / calories) * 100;
  final fatPct = ((fatG * 9) / calories) * 100;

  double penalty(double pct, PlateScoreRange range) {
    if (pct < range.min) return range.min - pct;
    if (pct > range.max) return pct - range.max;
    return 0;
  }

  final total =
      penalty(proteinPct, policy.proteinPct) +
      penalty(carbsPct, policy.carbsPct) +
      penalty(fatPct, policy.fatPct);

  return _clamp(100 - total * policy.penaltyMultiplier);
}

PlateScoreBand _bandFor(int score, PlateScorePolicy policy) {
  if (score >= policy.excellentCutoff) return PlateScoreBand.excellent;
  if (score >= policy.goodCutoff) return PlateScoreBand.good;
  if (score >= policy.moderateCutoff) return PlateScoreBand.moderate;
  return PlateScoreBand.heavy;
}

/// Computes a Plate Score locally, for the live preview while a meal is being
/// edited. Returns null when there is nothing to score, so the caller hides the
/// card rather than showing a meaningless zero.
PlateScore? calculatePlateScore({
  required List<MacroTotals> items,
  required MealType mealType,
  PlateScoreProfile? profile,
  PlateScorePolicy policy = PlateScorePolicy.fallback,
}) {
  final totals = _sumForScoring(items);
  if (totals.calories <= 0) return null;

  final active = <(PlateScoreAxis, double)>[];
  final skipped = <PlateScoreAxis>[];

  if (profile != null && profile.dailyCalorieTarget > 0) {
    final expected = profile.dailyCalorieTarget * policy.mealShare[mealType]!;
    active.add((
      PlateScoreAxis.calorieFit,
      _calorieFitScore(totals.calories, expected, policy.calorieTolerance[mealType]!),
    ));
  } else {
    skipped.add(PlateScoreAxis.calorieFit);
  }

  final proteinTarget = profile != null
      ? policy.proteinDensityTarget[profile.goal]!
      : policy.generalProteinDensityTarget;
  final proteinPer1000 = (totals.proteinG / totals.calories) * 1000;
  active.add((PlateScoreAxis.protein, _adequacyScore(proteinPer1000, proteinTarget)));

  active.add((
    PlateScoreAxis.macroBalance,
    _macroBalanceScore(
      totals.calories,
      totals.proteinG,
      totals.carbsG,
      totals.fatG,
      policy,
    ),
  ));

  final fiber = totals.fiberG;
  if (fiber != null) {
    final per1000 = (fiber / totals.calories) * 1000;
    active.add((
      PlateScoreAxis.fiber,
      _adequacyScore(per1000, policy.fiberDensityTarget),
    ));
  } else {
    skipped.add(PlateScoreAxis.fiber);
  }

  final weightSum = active.fold<double>(
    0,
    (sum, entry) => sum + policy.weights[entry.$1]!,
  );
  if (weightSum <= 0) return null;

  final score =
      (active.fold<double>(
                0,
                (sum, entry) => sum + entry.$2 * policy.weights[entry.$1]!,
              ) /
              weightSum)
          .round();

  return PlateScore(
    score: score,
    band: _bandFor(score, policy),
    tier: profile != null ? PlateScoreTier.personal : PlateScoreTier.general,
    axes: active
        .map(
          (entry) => PlateScoreAxisResult(
            axis: entry.$1,
            score: _round1(entry.$2),
            weight: _round1((policy.weights[entry.$1]! / weightSum) * 100),
          ),
        )
        .toList(),
    skipped: skipped,
  );
}
