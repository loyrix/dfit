import 'dart:async';

import 'package:flutter/foundation.dart';

import '../models/captured_meal_photo.dart';
import '../models/meal.dart';
import '../services/app_diagnostics.dart';
import '../services/journal_cache_store.dart';
import '../services/logmyplate_analytics.dart';
import '../services/logmyplate_api_client.dart';

class JournalController extends ChangeNotifier {
  JournalController({
    LogMyPlateApiClient? apiClient,
    JournalCacheStore? cacheStore,
    LogMyPlateAnalytics? analytics,
  }) : _apiClient = apiClient ?? LogMyPlateApiClient(),
       _cacheStore = cacheStore ?? JournalCacheStore(),
       _analytics = analytics ?? const NoopLogMyPlateAnalytics();

  final LogMyPlateApiClient _apiClient;
  final JournalCacheStore _cacheStore;
  final LogMyPlateAnalytics _analytics;

  bool _loading = false;
  String? _error;
  List<MealLog> _meals = [];
  MacroTotals _totals = MacroTotals.zero;
  ScanQuota? _quota;
  SubscriptionStatus? _subscription;
  RewardedAdProgress _rewardedAdProgress = RewardedAdProgress.initial();
  HealthTarget? _healthTarget;
  AppUpdatePolicy _updatePolicy = AppUpdatePolicy.current();
  EngagementPolicy _engagementPolicy = EngagementPolicy.disabled();
  JournalRangeData? _weeklyRange;
  StreakSummary _streakSummary = StreakSummary.disabled();
  DateTime? _lastLoadedAt;

  bool get loading => _loading;
  String? get error => _error;
  List<MealLog> get meals => List.unmodifiable(_meals);
  MacroTotals get totals => _totals;
  ScanQuota? get quota => _quota;
  SubscriptionStatus? get subscription => _subscription;
  RewardedAdProgress get rewardedAdProgress => _rewardedAdProgress;
  HealthTarget? get healthTarget => _healthTarget;
  AppUpdatePolicy get updatePolicy => _updatePolicy;
  EngagementPolicy get engagementPolicy => _engagementPolicy;
  MacroTotals? get dailyTarget =>
      _healthTarget?.dailyTargetTotals ?? _weeklyRange?.target;
  JournalRangeData? get weeklyRange => _weeklyRange;
  StreakSummary get streakSummary => _streakSummary;
  DateTime? get lastLoadedAt => _lastLoadedAt;
  bool get initialLoading =>
      _loading && _lastLoadedAt == null && _meals.isEmpty;

  void resetForAccountChange() {
    _loading = false;
    _error = null;
    _meals = [];
    _totals = MacroTotals.zero;
    _quota = null;
    _subscription = null;
    _rewardedAdProgress = RewardedAdProgress.initial();
    _healthTarget = null;
    _updatePolicy = AppUpdatePolicy.current();
    _engagementPolicy = EngagementPolicy.disabled();
    _weeklyRange = null;
    _streakSummary = StreakSummary.disabled();
    _lastLoadedAt = null;
    notifyListeners();
  }

  @override
  void dispose() {
    _apiClient.close();
    super.dispose();
  }

  Future<void> loadToday() async {
    _loading = true;
    _error = null;
    notifyListeners();

    final cached = _lastLoadedAt == null && _meals.isEmpty
        ? await _cacheStore.load()
        : null;
    if (cached != null) {
      _applyBootstrap(cached);
      await _analytics.applyPolicy(cached.engagementPolicy.analytics);
      notifyListeners();
    }

    try {
      final bootstrap = await _apiClient.fetchBootstrap();
      _applyBootstrap(bootstrap);
      await _analytics.applyPolicy(bootstrap.engagementPolicy.analytics);
      unawaited(
        _analytics.logEvent(
          'bootstrap_loaded',
          parameters: {
            'auth_method': bootstrap.profile.authMethod,
            'meal_count': bootstrap.today.meals.length,
            'free_remaining': bootstrap.quota.freeRemaining,
            'rewarded_remaining': bootstrap.quota.rewardedRemaining,
            'premium_remaining': bootstrap.quota.premiumRemaining,
            'has_target': bootstrap.healthTarget != null,
          },
        ),
      );
      await _cacheStore.save(bootstrap);
    } catch (error, stackTrace) {
      AppDiagnostics.instance.record(
        'journal.load_today',
        error,
        stackTrace: stackTrace,
      );
      _error = _journalErrorMessage(error);
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<MealLog> saveMeal(MealType type, List<MealItem> items) async {
    final title = items.map((item) => item.name).take(3).join(', ');
    final key = 'meal-${DateTime.now().microsecondsSinceEpoch}';

    try {
      final meal = await _apiClient.createMeal(
        type: type,
        title: title,
        items: items,
        idempotencyKey: key,
      );
      _upsertLocalMeal(meal);
      _error = null;
      unawaited(
        _analytics.logEvent(
          'manual_meal_saved',
          parameters: {
            'meal_type': type.name,
            'item_count': items.length,
            'calories': meal.totals.calories,
          },
        ),
      );
      _refreshJournalSoon();
      notifyListeners();
      return meal;
    } catch (error, stackTrace) {
      AppDiagnostics.instance.record(
        'journal.save_meal',
        error,
        stackTrace: stackTrace,
        context: {'items': items.length},
      );
      final now = DateTime.now();
      final pendingMeal = MealLog(
        id: now.microsecondsSinceEpoch.toString(),
        type: type,
        title: title,
        loggedAt: now,
        items: items,
        syncState: MealSyncState.pending,
      );
      _upsertLocalMeal(pendingMeal);
      _error = 'Saved locally. Will sync when the API is reachable.';
      notifyListeners();
      return pendingMeal;
    }
  }

  Future<MealLog> updateMeal(MealLog meal, List<MealItem> items) async {
    final key = 'meal-update-${DateTime.now().microsecondsSinceEpoch}';

    try {
      final updated = await _apiClient.updateMeal(
        mealId: meal.id,
        type: meal.type,
        title: meal.title,
        items: items,
        idempotencyKey: key,
      );
      _upsertLocalMeal(updated);
      _error = null;
      unawaited(
        _analytics.logEvent(
          'meal_updated',
          parameters: {
            'meal_type': meal.type.name,
            'item_count': items.length,
            'calories': updated.totals.calories,
          },
        ),
      );
      notifyListeners();
      _refreshJournalSoon();
      return updated;
    } catch (error, stackTrace) {
      AppDiagnostics.instance.record(
        'journal.update_meal',
        error,
        stackTrace: stackTrace,
        context: {'mealId': meal.id, 'items': items.length},
      );
      rethrow;
    }
  }

  Future<void> deleteMeal(MealLog meal) async {
    if (meal.syncState == MealSyncState.pending) {
      _removeLocalMeal(meal.id);
      _error = null;
      notifyListeners();
      return;
    }

    final key = 'meal-delete-${DateTime.now().microsecondsSinceEpoch}';
    try {
      await _apiClient.deleteMeal(mealId: meal.id, idempotencyKey: key);
      _removeLocalMeal(meal.id);
      _error = null;
      unawaited(
        _analytics.logEvent(
          'meal_deleted',
          parameters: {
            'meal_type': meal.type.name,
            'item_count': meal.items.length,
            'calories': meal.totals.calories,
          },
        ),
      );
      notifyListeners();
      _refreshJournalSoon();
    } catch (error, stackTrace) {
      AppDiagnostics.instance.record(
        'journal.delete_meal',
        error,
        stackTrace: stackTrace,
        context: {'mealId': meal.id},
      );
      rethrow;
    }
  }

  Future<void> refreshQuota() => _refreshQuota();

  Future<SubscriptionStatus> refreshSubscription() async {
    final subscription = await _apiClient.fetchSubscription();
    _subscription = subscription;
    notifyListeners();
    return subscription;
  }

  Future<SubscriptionStatus> syncRevenueCatSubscription({
    String? appUserId,
  }) async {
    final subscription = await _apiClient.syncRevenueCatSubscription(
      appUserId: appUserId,
    );
    _subscription = subscription;
    await _refreshQuota(notify: false);
    notifyListeners();
    return subscription;
  }

  Future<HealthTarget> saveHealthTarget(HealthTargetInput input) async {
    try {
      final target = await _apiClient.saveHealthTarget(
        input,
        idempotencyKey:
            'health-target-${DateTime.now().microsecondsSinceEpoch}',
      );
      _healthTarget = target;
      _error = null;
      unawaited(
        _analytics.logEvent(
          'health_target_saved',
          parameters: {
            'goal': target.goal.apiName,
            'activity_level': target.activityLevel.apiName,
            'daily_calorie_target': target.dailyCalorieTarget,
            'bmi_category': target.bmiCategory,
          },
        ),
      );
      notifyListeners();
      _refreshJournalSoon();
      return target;
    } catch (error, stackTrace) {
      AppDiagnostics.instance.record(
        'profile.health.save',
        error,
        stackTrace: stackTrace,
      );
      rethrow;
    }
  }

  Future<RewardedAdCredit> completeRewardedAd({
    required String adUnitId,
    required String idempotencyKey,
    String? verificationToken,
    String? rewardType,
    int? rewardAmount,
  }) async {
    try {
      final reward = await _apiClient.completeRewardedAd(
        adUnitId: adUnitId,
        idempotencyKey: idempotencyKey,
        verificationToken: verificationToken,
        rewardType: rewardType,
        rewardAmount: rewardAmount,
      );
      _quota = reward.quota;
      _rewardedAdProgress = reward.progress;
      _error = null;
      unawaited(
        _analytics.logEvent(
          'rewarded_ad_earned',
          parameters: {
            'granted_scan': reward.grantedScan,
            'ads_watched_today': reward.adsWatchedToday,
            'scans_granted_today': reward.scansGrantedToday,
          },
        ),
      );
      notifyListeners();
      return reward;
    } catch (error, stackTrace) {
      if (error is LogMyPlateApiException &&
          error.errorCode == 'rewarded_ad_verification_pending') {
        rethrow;
      }
      AppDiagnostics.instance.record(
        'ads.rewarded.complete',
        error,
        stackTrace: stackTrace,
      );
      rethrow;
    }
  }

  Future<JournalRangeData> loadWeeklyRange(int weekOffset) {
    return _apiClient.fetchJournalRange(weekOffset: weekOffset);
  }

  Future<List<JournalWeekOption>> loadAvailableWeeks() {
    return _apiClient.fetchJournalWeeks();
  }

  Future<List<FoodSearchResult>> searchFoods(String query) {
    return _apiClient.searchFoods(query);
  }

  void _refreshJournalSoon() {
    unawaited(loadToday());
  }

  void _upsertLocalMeal(MealLog meal) {
    _meals = [meal, ..._meals.where((existing) => existing.id != meal.id)];
    _totals = _sumMealTotals(_meals);
  }

  void _removeLocalMeal(String mealId) {
    _meals = _meals.where((meal) => meal.id != mealId).toList();
    _totals = _sumMealTotals(_meals);
  }

  MacroTotals _sumMealTotals(List<MealLog> meals) {
    return meals.fold<MacroTotals>(
      MacroTotals.zero,
      (total, meal) => total + meal.totals,
    );
  }

  void _applyBootstrap(AppBootstrapData bootstrap) {
    _meals = bootstrap.today.meals;
    _totals = bootstrap.today.totals;
    _healthTarget = bootstrap.healthTarget;
    _updatePolicy = bootstrap.updatePolicy;
    _engagementPolicy = bootstrap.engagementPolicy;
    _weeklyRange = bootstrap.weeklyRange;
    _streakSummary = bootstrap.streakSummary;
    _quota = bootstrap.quota;
    _subscription = bootstrap.subscription;
    _rewardedAdProgress = bootstrap.rewardedAdProgress;
    _lastLoadedAt =
        DateTime.tryParse(bootstrap.serverTime)?.toLocal() ?? DateTime.now();
  }

  Future<void> _refreshQuota({bool notify = true}) async {
    try {
      _quota = await _apiClient.fetchQuota();
      if (notify) notifyListeners();
    } catch (error, stackTrace) {
      AppDiagnostics.instance.record(
        'quota.refresh',
        error,
        stackTrace: stackTrace,
      );
      // Quota is helpful context, but journal loading should not fail because
      // this small side request failed.
    }
  }

  String _journalErrorMessage(Object error) {
    if (error is LogMyPlateApiException) {
      return error.retryable
          ? 'Journal sync is taking longer than expected. Pull to retry.'
          : 'Could not refresh journal. Pull to retry.';
    }
    return 'Could not refresh journal. Pull to retry.';
  }

  Future<ScanAnalysis> analyzeCapturedMeal(CapturedMealPhoto photo) async {
    _error = null;
    final seed = DateTime.now().microsecondsSinceEpoch;
    try {
      unawaited(
        _analytics.logEvent(
          'scan_started',
          parameters: {
            'has_hint': photo.userHint?.trim().isNotEmpty == true,
            'bytes': photo.byteSize,
          },
        ),
      );
      final prepared = await _apiClient.prepareScan(
        idempotencyKey: 'scan-prepare-$seed',
      );
      _quota = prepared.quota;
      notifyListeners();

      final analysis = await _apiClient.analyzeScan(
        scanId: prepared.scanId,
        idempotencyKey: 'scan-analyze-$seed',
        photo: photo,
      );
      unawaited(
        _analytics.logEvent(
          'scan_analysis_succeeded',
          parameters: {
            'meal_type': analysis.mealType.name,
            'item_count': analysis.items.length,
            'calories': analysis.totals.calories,
            'image_stored': analysis.imageStored,
          },
        ),
      );
      await _refreshQuota(notify: false);
      return analysis;
    } catch (error, stackTrace) {
      unawaited(
        _analytics.logEvent(
          'scan_analysis_failed',
          parameters: {
            'error_type': error is LogMyPlateApiException
                ? error.errorCode ?? 'api_error'
                : error.runtimeType.toString(),
            'has_hint': photo.userHint?.trim().isNotEmpty == true,
            'bytes': photo.byteSize,
          },
        ),
      );
      AppDiagnostics.instance.record(
        'scan.analyze',
        error,
        stackTrace: stackTrace,
        context: {
          'hasHint': photo.userHint?.trim().isNotEmpty == true,
          'bytes': photo.byteSize,
        },
      );
      rethrow;
    }
  }

  Future<MealLog> confirmAnalyzedMeal({
    required String scanId,
    required MealType type,
    required String title,
    required List<MealItem> items,
    CapturedMealPhoto? photo,
  }) async {
    final key = 'scan-confirm-${DateTime.now().microsecondsSinceEpoch}';

    try {
      final confirmed = await _apiClient.confirmScan(
        scanId: scanId,
        type: type,
        title: title,
        items: items,
        idempotencyKey: key,
        photo: photo,
      );
      final meal =
          confirmed.meal ??
          MealLog(
            id: confirmed.mealId,
            type: type,
            title: title,
            loggedAt: DateTime.now(),
            items: items,
            image: null,
          );
      _upsertLocalMeal(meal);
      _error = null;
      unawaited(
        _analytics.logEvent(
          'scan_confirmed',
          parameters: {
            'meal_type': type.name,
            'item_count': items.length,
            'calories': meal.totals.calories,
            'image_attached': photo != null,
          },
        ),
      );
      notifyListeners();
      _refreshJournalSoon();
      return meal;
    } catch (error, stackTrace) {
      AppDiagnostics.instance.record(
        'scan.confirm',
        error,
        stackTrace: stackTrace,
        context: {'items': items.length},
      );
      rethrow;
    }
  }
}
