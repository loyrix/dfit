/// The meal health score as the user sees it.
///
/// Deliberately carries **no numeric score**. Parts B, C and D each produce a
/// 0-100 value, but it stays on the server: a number implies a precision a
/// macro heuristic does not have, and hands the user a figure to optimise
/// anxiously. The API never sends it, and this class has nowhere to put it, so
/// no screen can render one by accident.
///
/// Every rating is computed server-side. That is what makes the thresholds and
/// weights tunable from the backend without an app release, which matters
/// because the shipped defaults are known to be strict and will need adjusting
/// after the first round of testing.
library;

enum ScoreLevel { meal, daily, weekly }

/// One plain-language line behind a meal's rating.
///
/// Words only, like the rating itself. [code] names the factor so the sheet
/// can avoid saying the same thing twice; it is never shown.
class ScoreReason {
  const ScoreReason({
    required this.good,
    required this.code,
    required this.text,
    this.personalised = false,
  });

  /// True when this lifted the rating, false when it held it back.
  final bool good;
  final String code;
  final String text;

  /// True when the user's own health focus is what made this count.
  final bool personalised;

  static ScoreReason? fromJson(Object? json) {
    if (json is! Map<String, dynamic>) return null;
    final text = (json['text'] as String?)?.trim();
    final tone = json['tone'] as String?;
    if (text == null || text.isEmpty) return null;
    // An unknown tone is a payload from a newer API. Dropping the line is
    // safer than guessing whether it is praise or a caution.
    if (tone != 'good' && tone != 'watch') return null;
    return ScoreReason(
      good: tone == 'good',
      code: json['code'] as String? ?? '',
      text: text,
      personalised: json['personalised'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() => {
    'tone': good ? 'good' : 'watch',
    'code': code,
    'text': text,
    'personalised': personalised,
  };
}

class ScoreRating {
  const ScoreRating({
    required this.stars,
    required this.message,
    required this.level,
    this.provisional = false,
    this.reasons = const [],
  });

  /// 1-5. The whole user-facing signal.
  final int stars;

  /// Why it scored that way, in one sentence. Carries the meaning the star
  /// count alone cannot.
  final String message;

  final ScoreLevel level;

  /// True while a day is still in progress. Someone who has logged only
  /// breakfast is not having a one-star day, they are having an incomplete one,
  /// and the copy has to say so.
  final bool provisional;

  /// Why the rating came out as it did. Empty for a day or a week, and on an
  /// API that predates the explanation.
  final List<ScoreReason> reasons;

  static ScoreRating? fromJson(Map<String, dynamic>? json) {
    if (json == null) return null;

    final stars = (json['stars'] as num?)?.toInt();
    final message = json['message'] as String?;
    if (stars == null || message == null || message.isEmpty) return null;

    // An out-of-range star count means the payload is not what we think it is.
    // Showing nothing beats clamping to something plausible and wrong.
    if (stars < 1 || stars > 5) return null;

    final level = ScoreLevel.values
        .where((value) => value.name == json['level'])
        .firstOrNull;
    if (level == null) return null;

    return ScoreRating(
      stars: stars,
      message: message,
      level: level,
      provisional: json['provisional'] as bool? ?? false,
      reasons: ((json['reasons'] as List<dynamic>?) ?? const [])
          .map(ScoreReason.fromJson)
          .whereType<ScoreReason>()
          .toList(growable: false),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'stars': stars,
      'message': message,
      'level': level.name,
      'provisional': provisional,
      // Cached journal data round-trips through here; without this a cold
      // start would lose the explanation behind every rating.
      if (reasons.isNotEmpty)
        'reasons': reasons.map((reason) => reason.toJson()).toList(),
    };
  }
}

extension _FirstOrNull<T> on Iterable<T> {
  T? get firstOrNull {
    final iterator = this.iterator;
    return iterator.moveNext() ? iterator.current : null;
  }
}
