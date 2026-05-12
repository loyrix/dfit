import 'package:flutter/foundation.dart';

import '../models/captured_meal_photo.dart';
import '../models/meal.dart';
import '../services/dfit_api_client.dart';

class JournalController extends ChangeNotifier {
  JournalController({DFitApiClient? apiClient})
    : _apiClient = apiClient ?? DFitApiClient();

  final DFitApiClient _apiClient;

  bool _loading = false;
  String? _error;
  List<MealLog> _meals = [];
  MacroTotals _totals = MacroTotals.zero;
  MacroTotals _target = defaultTarget;
  ScanQuota? _quota;
  DateTime? _lastLoadedAt;

  bool get loading => _loading;
  String? get error => _error;
  List<MealLog> get meals => List.unmodifiable(_meals);
  MacroTotals get totals => _totals;
  MacroTotals get target => _target;
  ScanQuota? get quota => _quota;
  DateTime? get lastLoadedAt => _lastLoadedAt;

  @override
  void dispose() {
    _apiClient.close();
    super.dispose();
  }

  Future<void> loadToday() async {
    _loading = true;
    _error = null;
    notifyListeners();

    try {
      final today = await _apiClient.fetchToday();
      _meals = today.meals;
      _totals = today.totals;
      _target = today.target ?? defaultTarget;
      _lastLoadedAt = DateTime.now();
      await _refreshQuota(notify: false);
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
