import 'package:shared_preferences/shared_preferences.dart';

import '../models/meal.dart';

class ReviewPromptStore {
  static const _confirmedScanCountKey =
      'logmyplate.review_prompt.confirmed_scan_count';
  static const _activeDatesKey = 'logmyplate.review_prompt.active_dates';
  static const _lastShownAtKey = 'logmyplate.review_prompt.last_shown_at_ms';
  static const _lastPromptedAppVersionKey =
      'logmyplate.review_prompt.last_prompted_app_version';
  static const _maxStoredActiveDates = 370;

  Future<ReviewPromptStats> load() async {
    final preferences = await SharedPreferences.getInstance();
    return _read(preferences);
  }

  Future<ReviewPromptStats> recordConfirmedScan({DateTime? now}) async {
    final preferences = await SharedPreferences.getInstance();
    final current = _read(preferences);
    final timestamp = now ?? DateTime.now();
    final activeDates = <String>{
      ...current.activeDates,
      _localDateKey(timestamp),
    };
    final next = ReviewPromptStats(
      confirmedScans: current.confirmedScans + 1,
      activeDates: _boundedActiveDates(activeDates),
      lastShownAt: current.lastShownAt,
      lastPromptedAppVersion: current.lastPromptedAppVersion,
    );
    await preferences.setInt(_confirmedScanCountKey, next.confirmedScans);
    await preferences.setStringList(_activeDatesKey, next.activeDates.toList());
    return next;
  }

  Future<void> markPromptShown({
    required String appVersionKey,
    DateTime? now,
  }) async {
    final preferences = await SharedPreferences.getInstance();
    final timestamp = now ?? DateTime.now();
    await preferences.setInt(_lastShownAtKey, timestamp.millisecondsSinceEpoch);
    await preferences.setString(_lastPromptedAppVersionKey, appVersionKey);
  }

  ReviewPromptStats _read(SharedPreferences preferences) {
    final lastShownMs = preferences.getInt(_lastShownAtKey);
    return ReviewPromptStats(
      confirmedScans: preferences.getInt(_confirmedScanCountKey) ?? 0,
      activeDates: _boundedActiveDates(
        preferences.getStringList(_activeDatesKey)?.toSet() ?? const <String>{},
      ),
      lastShownAt: lastShownMs == null
          ? null
          : DateTime.fromMillisecondsSinceEpoch(lastShownMs),
      lastPromptedAppVersion: preferences.getString(_lastPromptedAppVersionKey),
    );
  }

  static Set<String> _boundedActiveDates(Set<String> dates) {
    final sorted = dates.where((date) => date.isNotEmpty).toList()..sort();
    final bounded = sorted.length <= _maxStoredActiveDates
        ? sorted
        : sorted.sublist(sorted.length - _maxStoredActiveDates);
    return Set.unmodifiable(bounded);
  }

  static String _localDateKey(DateTime timestamp) {
    final local = timestamp.toLocal();
    return '${local.year.toString().padLeft(4, '0')}-'
        '${local.month.toString().padLeft(2, '0')}-'
        '${local.day.toString().padLeft(2, '0')}';
  }
}

class ReviewPromptStats {
  const ReviewPromptStats({
    required this.confirmedScans,
    required this.activeDates,
    this.lastShownAt,
    this.lastPromptedAppVersion,
  });

  final int confirmedScans;
  final Set<String> activeDates;
  final DateTime? lastShownAt;
  final String? lastPromptedAppVersion;

  int get activeDays => activeDates.length;

  bool isEligible({
    required EngagementReviewPromptPolicy policy,
    required String appVersionKey,
    required DateTime now,
  }) {
    if (!policy.enabled) return false;
    if (confirmedScans < policy.minConfirmedScans) return false;
    if (activeDays < policy.minActiveDays) return false;
    if (policy.oncePerAppVersion &&
        appVersionKey.isNotEmpty &&
        lastPromptedAppVersion == appVersionKey) {
      return false;
    }

    final shownAt = lastShownAt;
    if (shownAt != null) {
      final nextAllowedAt = shownAt.add(Duration(days: policy.cooldownDays));
      if (now.isBefore(nextAllowedAt)) return false;
    }

    return true;
  }
}
