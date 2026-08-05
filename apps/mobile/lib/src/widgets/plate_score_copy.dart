import '../models/plate_score.dart';

/// Every user-facing string for the Plate Score, in one place.
///
/// Kept together deliberately: the score is a judgement, and the words are what
/// make it useful or confusing. Three rules shaped this copy:
///
/// 1. **Say what it means, not what it is called.** "Heavy" described a 250 kcal
///    snack as large when the score meant "poorly balanced". Band names now
///    describe balance, never size.
/// 2. **Never show a bare number.** A bar at 0 with the label "Portion" tells a
///    user nothing. Every axis pairs its value with a direction and, where there
///    is one, an action.
/// 3. **No jargon and no internals.** Users do not need to know that an axis was
///    renormalised or that a nutrient was omitted rather than zeroed.
class PlateScoreCopy {
  const PlateScoreCopy._();

  /// Headline verdict. Describes balance, never portion size.
  static String bandTitle(PlateScoreBand band) => switch (band) {
    PlateScoreBand.excellent => 'Well balanced',
    PlateScoreBand.good => 'Good balance',
    PlateScoreBand.moderate => 'Room to improve',
    PlateScoreBand.heavy => 'Unbalanced',
  };

  /// One plain sentence under the headline, so the number means something.
  static String bandSummary(PlateScoreBand band) => switch (band) {
    PlateScoreBand.excellent => 'This plate covers your bases nicely.',
    PlateScoreBand.good => 'A solid plate with a little room to tune.',
    PlateScoreBand.moderate => 'Fine to eat, with one or two things to adjust.',
    PlateScoreBand.heavy => 'Worth adjusting if you eat this often.',
  };

  /// Explains what the score is measured against.
  static String tierCaption(PlateScore score) =>
      score.tier == PlateScoreTier.personal
      ? 'Scored against your daily calorie goal'
      : 'Scored on balance alone';

  /// Short label used on the collapsed card.
  static String tierHint(PlateScore score) => score.canPersonalise
      ? 'Tap to see why, or personalise it'
      : 'Tap to see why';

  static String axisLabel(PlateScoreAxis axis) => switch (axis) {
    PlateScoreAxis.calorieFit => 'Portion size',
    PlateScoreAxis.protein => 'Protein',
    PlateScoreAxis.macroBalance => 'Carbs, fat & protein mix',
    PlateScoreAxis.fiber => 'Fiber',
  };

  /// The sentence that makes a bar actionable.
  ///
  /// Written so a low bar always explains itself. "Portion size 0" used to
  /// appear on 29% of meals with nothing to tell the user which way to move.
  static String axisDetail(
    PlateScoreAxisResult axis,
    PlateScoreMealLabel meal,
  ) => switch (axis.detail) {
    PlateScoreAxisDetail.portionLarge =>
      'Bigger than a typical ${meal.label} for your goal',
    PlateScoreAxisDetail.portionSmall =>
      'Lighter than a typical ${meal.label} — fine if you eat again later',
    PlateScoreAxisDetail.proteinLow =>
      'Could use more protein for these calories',
    PlateScoreAxisDetail.carbHeavy =>
      'Mostly carbs — some protein or veg would even it out',
    PlateScoreAxisDetail.fatHeavy => 'Fat is doing most of the work here',
    PlateScoreAxisDetail.fiberLow =>
      'Light on fiber — whole grains, beans or veg help',
    PlateScoreAxisDetail.onTrack => 'Looks good',
  };

  /// Shown when the meal has no health target behind it.
  static const personaliseTitle = 'Get a score for your day';
  static const personaliseBody =
      'Add your height, weight and goal so we can judge portion size too.';

  /// Explains that portion size is measured against the meal slot, which the
  /// user can change. A mis-labelled meal is the most common reason a portion
  /// bar looks wrong.
  static String mealTypeNote(PlateScoreMealLabel meal) =>
      'Portion size is judged against a typical ${meal.label}. '
      'Change the meal type above if that is not right.';

  static const disclaimer =
      'General guidance to help you eat well, not medical advice.';
}

/// Wraps a meal type so copy can read naturally without importing the enum's
/// display rules everywhere.
class PlateScoreMealLabel {
  const PlateScoreMealLabel(this.label);

  final String label;

  static const fallback = PlateScoreMealLabel('meal');
}
