import 'package:flutter/foundation.dart';

import '../models/captured_meal_photo.dart';
import '../models/meal.dart';
import '../services/dfit_api_client.dart';
import '../services/journal_cache_store.dart';

class JournalController extends ChangeNotifier {
  JournalController({DFitApiClient? apiClient, JournalCacheStore? cacheStore})
    : _apiClient = apiClient ?? DFitApiClient(),
      _cacheStore = cacheStore ?? JournalCacheStore();

  final DFitApiClient _apiClient;
  final JournalCacheStore _cacheStore;

  bool _loading = false;
  String? _error;
  List<MealLog> _meals = [];
  MacroTotals _totals = MacroTotals.zero;
  MacroTotals _target = defaultTarget;
  ScanQuota? _quota;
  JournalRangeData? _weeklyRange;
  DateTime? _lastLoadedAt;

  bool get loading => _loading;
  String? get error => _error;
  List<MealLog> get meals => List.unmodifiable(_meals);
  MacroTotals get totals => _totals;
  MacroTotals get target => _target;
  ScanQuota? get quota => _quota;
  JournalRangeData? get weeklyRange => _weeklyRange;
  DateTime? get lastLoadedAt => _lastLoadedAt;
  bool get initialLoading =>
      _loading && _lastLoadedAt == null && _meals.isEmpty;

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
      notifyListeners();
    }

    try {
      final bootstrap = await _apiClient.fetchBootstrap();
      _applyBootstrap(bootstrap);
      await _cacheStore.save(bootstrap);
    } catch (error) {
      _error = _journalErrorMessage(error);
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<void> saveMeal(MealType type, List<MealItem> items) async {
    final title = items.map((item) => item.name).take(3).join(', ');
    final key = 'meal-${DateTime.now().microsecondsSinceEpoch}';

    try {
      final meal = await _apiClient.createMeal(
        type: type,
        title: title,
        items: items,
        idempotencyKey: key,
      );
      _meals = [meal, ..._meals];
      _totals = _totals + meal.totals;
      _error = null;
      await loadToday();
    } catch (_) {
      final now = DateTime.now();
      final pendingMeal = MealLog(
        id: now.microsecondsSinceEpoch.toString(),
        type: type,
        title: title,
        loggedAt: now,
        items: items,
        syncState: MealSyncState.pending,
      );
      _meals = [pendingMeal, ..._meals];
      _totals = _totals + pendingMeal.totals;
      _error = 'Saved locally. Will sync when the API is reachable.';
    }

    notifyListeners();
  }

  Future<void> refreshQuota() => _refreshQuota();

  void _applyBootstrap(AppBootstrapData bootstrap) {
    _meals = bootstrap.today.meals;
    _totals = bootstrap.today.totals;
    _target = bootstrap.today.target ?? defaultTarget;
    _weeklyRange = bootstrap.weeklyRange;
    _quota = bootstrap.quota;
    _lastLoadedAt =
        DateTime.tryParse(bootstrap.serverTime)?.toLocal() ?? DateTime.now();
  }

  Future<void> _refreshQuota({bool notify = true}) async {
    try {
      _quota = await _apiClient.fetchQuota();
      if (notify) notifyListeners();
    } catch (_) {
      // Quota is helpful context, but journal loading should not fail because
      // this small side request failed.
    }
  }

  String _journalErrorMessage(Object error) {
    if (error is DFitApiException) {
      return 'Could not refresh journal (${error.statusCode}). Pull to retry.';
    }
    return 'Could not refresh journal. Pull to retry.';
  }

  Future<ScanAnalysis> analyzeCapturedMeal(CapturedMealPhoto photo) async {
    _error = null;
    final seed = DateTime.now().microsecondsSinceEpoch;
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
    await _refreshQuota(notify: false);
    return analysis;
  }

  Future<void> confirmAnalyzedMeal({
    required String scanId,
    required MealType type,
    required String title,
    required List<MealItem> items,
  }) async {
    final key = 'scan-confirm-${DateTime.now().microsecondsSinceEpoch}';

    await _apiClient.confirmScan(
      scanId: scanId,
      type: type,
      title: title,
      items: items,
      idempotencyKey: key,
    );
    await loadToday();
  }
}
