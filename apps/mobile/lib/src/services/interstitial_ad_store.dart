import 'package:shared_preferences/shared_preferences.dart';

import '../models/meal.dart';

class InterstitialAdStore {
  static const _confirmedScanCountKey =
      'logmyplate.interstitial.confirmed_scan_count';
  static const _lastShownAtKey = 'logmyplate.interstitial.last_shown_at_ms';
  static const _lastShownScanCountKey =
      'logmyplate.interstitial.last_shown_scan_count';
  static const _shownDateKey = 'logmyplate.interstitial.shown_date';
  static const _shownCountTodayKey =
      'logmyplate.interstitial.shown_count_today';

  Future<InterstitialAdStats> load({DateTime? now}) async {
    final preferences = await SharedPreferences.getInstance();
    return _read(preferences, now ?? DateTime.now());
  }

  Future<InterstitialAdStats> recordConfirmedScan({DateTime? now}) async {
    final preferences = await SharedPreferences.getInstance();
    final timestamp = now ?? DateTime.now();
    final current = _read(preferences, timestamp);
    final next = current.copyWith(confirmedScans: current.confirmedScans + 1);
    await preferences.setInt(_confirmedScanCountKey, next.confirmedScans);
    await _persistDailyWindow(preferences, next, timestamp);
    return next;
  }

  Future<void> markShown({
    required int confirmedScanCount,
    DateTime? now,
  }) async {
    final preferences = await SharedPreferences.getInstance();
    final timestamp = now ?? DateTime.now();
    final current = _read(preferences, timestamp);
    final next = current.copyWith(
      lastShownAt: timestamp,
      lastShownScanCount: confirmedScanCount,
      shownCountToday: current.shownCountToday + 1,
      shownDate: _localDateKey(timestamp),
    );
    await preferences.setInt(_lastShownAtKey, timestamp.millisecondsSinceEpoch);
    await preferences.setInt(_lastShownScanCountKey, confirmedScanCount);
    await _persistDailyWindow(preferences, next, timestamp);
  }

  InterstitialAdStats _read(SharedPreferences preferences, DateTime timestamp) {
    final today = _localDateKey(timestamp);
    final storedDate = preferences.getString(_shownDateKey);
    final lastShownMs = preferences.getInt(_lastShownAtKey);
    return InterstitialAdStats(
      confirmedScans: preferences.getInt(_confirmedScanCountKey) ?? 0,
      lastShownAt: lastShownMs == null
          ? null
          : DateTime.fromMillisecondsSinceEpoch(lastShownMs),
      lastShownScanCount: preferences.getInt(_lastShownScanCountKey),
      shownDate: today,
      shownCountToday: storedDate == today
          ? preferences.getInt(_shownCountTodayKey) ?? 0
          : 0,
    );
  }

  Future<void> _persistDailyWindow(
    SharedPreferences preferences,
    InterstitialAdStats stats,
    DateTime timestamp,
  ) async {
    await preferences.setString(_shownDateKey, _localDateKey(timestamp));
    await preferences.setInt(_shownCountTodayKey, stats.shownCountToday);
  }

  static String _localDateKey(DateTime timestamp) {
    final local = timestamp.toLocal();
    return '${local.year.toString().padLeft(4, '0')}-'
        '${local.month.toString().padLeft(2, '0')}-'
        '${local.day.toString().padLeft(2, '0')}';
  }
}

class InterstitialAdStats {
  const InterstitialAdStats({
    required this.confirmedScans,
    required this.shownDate,
    required this.shownCountToday,
    this.lastShownAt,
    this.lastShownScanCount,
  });

  final int confirmedScans;
  final DateTime? lastShownAt;
  final int? lastShownScanCount;
  final String shownDate;
  final int shownCountToday;

  InterstitialAdStats copyWith({
    int? confirmedScans,
    DateTime? lastShownAt,
    int? lastShownScanCount,
    String? shownDate,
    int? shownCountToday,
  }) {
    return InterstitialAdStats(
      confirmedScans: confirmedScans ?? this.confirmedScans,
      lastShownAt: lastShownAt ?? this.lastShownAt,
      lastShownScanCount: lastShownScanCount ?? this.lastShownScanCount,
      shownDate: shownDate ?? this.shownDate,
      shownCountToday: shownCountToday ?? this.shownCountToday,
    );
  }

  bool isEligible({
    required EngagementInterstitialAdsPolicy policy,
    required bool isPremiumUser,
    required DateTime now,
  }) {
    if (!policy.enabled) return false;
    if (policy.dailyCap <= 0) return false;
    if (policy.premiumExcluded && isPremiumUser) return false;
    if (policy.freeUsersOnly && isPremiumUser) return false;
    if (confirmedScans < policy.minConfirmedScansBeforeFirstAd) return false;
    if (shownCountToday >= policy.dailyCap) return false;

    final shownAt = lastShownAt;
    if (shownAt != null && policy.cooldownMinutes > 0) {
      final nextAllowedAt = shownAt.add(
        Duration(minutes: policy.cooldownMinutes),
      );
      if (now.isBefore(nextAllowedAt)) return false;
    }

    final previousShownScanCount = lastShownScanCount;
    if (previousShownScanCount == null) return true;
    return confirmedScans - previousShownScanCount >= policy.scansBetweenAds;
  }
}
