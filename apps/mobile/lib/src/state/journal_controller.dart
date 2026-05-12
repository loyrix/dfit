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
  MacroTotals _target = defaultTarget;

  bool get loading => _loading;
  String? get error => _error;
  List<MealLog> get meals => List.unmodifiable(_meals);
  MacroTotals get target => _target;

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
      _target = today.target ?? defaultTarget;
    } catch (error) {
      _error = error.toString();
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
      _error = null;
      await loadToday();
    } catch (_) {
      final now = DateTime.now();
      _meals = [
        MealLog(
          id: now.microsecondsSinceEpoch.toString(),
          type: type,
          title: title,
          loggedAt: now,
          items: items,
          syncState: MealSyncState.pending,
        ),
        ..._meals,
      ];
      _error = 'Saved locally. Will sync when the API is reachable.';
    }

    notifyListeners();
  }

  Future<ScanAnalysis> analyzeCapturedMeal(CapturedMealPhoto photo) async {
    _error = null;
    final seed = DateTime.now().microsecondsSinceEpoch;
    final prepared = await _apiClient.prepareScan(
      idempotencyKey: 'scan-prepare-$seed',
    );
    return _apiClient.analyzeScan(
      scanId: prepared.scanId,
      idempotencyKey: 'scan-analyze-$seed',
      photo: photo,
    );
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
