import 'package:flutter/material.dart';

import 'models/meal.dart';
import 'screens/analyzing_screen.dart';
import 'screens/camera_screen.dart';
import 'screens/meal_detail_screen.dart';
import 'screens/review_meal_screen.dart';
import 'screens/settings_screen.dart';
import 'screens/today_screen.dart';
import 'screens/welcome_screen.dart';
import 'state/journal_controller.dart';
import 'theme/dfit_theme.dart';

class DFitApp extends StatefulWidget {
  const DFitApp({super.key});

  @override
  State<DFitApp> createState() => _DFitAppState();
}

class _DFitAppState extends State<DFitApp> {
  final _navigatorKey = GlobalKey<NavigatorState>();
  late final JournalController _journalController = JournalController();
  ThemeMode _themeMode = ThemeMode.system;
  bool _hasSeenWelcome = false;

  @override
  void initState() {
    super.initState();
    _journalController.loadToday();
  }

  @override
  void dispose() {
    _journalController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'DFit',
      debugShowCheckedModeBanner: false,
      theme: DFitTheme.light(),
      darkTheme: DFitTheme.dark(),
      themeMode: _themeMode,
      navigatorKey: _navigatorKey,
      home: _hasSeenWelcome
          ? _todayScreen()
          : WelcomeScreen(
              onStart: () {
                setState(() => _hasSeenWelcome = true);
                _openCamera();
              },
            ),
    );
  }

  Widget _todayScreen() {
    return AnimatedBuilder(
      animation: _journalController,
      builder: (context, _) {
        return TodayScreen(
          meals: _journalController.meals,
          target: _journalController.target,
          loading: _journalController.loading,
          syncMessage: _journalController.error,
          onScan: _openCamera,
          onAddManually: _openManualReview,
          onOpenSettings: _openSettings,
          onOpenMeal: _openMealDetail,
        );
      },
    );
  }

  Future<void> _openCamera() async {
    await _navigatorKey.currentState!.push<void>(
      MaterialPageRoute<void>(
        builder: (_) => CameraScreen(
          onCaptured: () {
            _navigatorKey.currentState!.pushReplacement<void, void>(
              MaterialPageRoute<void>(
                builder: (_) => AnalyzingScreen(
                  onAnalyze: _journalController.analyzeCapturedMeal,
                  onAnalyzed: (analysis) {
                    _navigatorKey.currentState!.pushReplacement<void, void>(
                      MaterialPageRoute<void>(
                        builder: (_) => ReviewMealScreen(
                          initialItems: analysis.items,
                          initialMealType: analysis.mealType,
                          onConfirm: (type, items) {
                            return _confirmAnalyzedMeal(
                              scanId: analysis.scanId,
                              title: analysis.mealName,
                              type: type,
                              items: items,
                            );
                          },
                        ),
                      ),
                    );
                  },
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  Future<void> _openManualReview() async {
    await _navigatorKey.currentState!.push<void>(
      MaterialPageRoute<void>(
        builder: (_) => ReviewMealScreen(
          initialItems: sampleDetectedItems().take(2).toList(),
          onConfirm: _saveMeal,
        ),
      ),
    );
  }

  Future<void> _saveMeal(MealType type, List<MealItem> items) async {
    await _journalController.saveMeal(type, items);
    _navigatorKey.currentState!.popUntil((route) => route.isFirst);
  }

  Future<void> _confirmAnalyzedMeal({
    required String scanId,
    required String title,
    required MealType type,
    required List<MealItem> items,
  }) async {
    await _journalController.confirmAnalyzedMeal(
      scanId: scanId,
      title: title,
      type: type,
      items: items,
    );
    _navigatorKey.currentState!.popUntil((route) => route.isFirst);
  }

  Future<void> _openSettings() async {
    await _navigatorKey.currentState!.push<void>(
      MaterialPageRoute<void>(
        builder: (_) => SettingsScreen(
          themeMode: _themeMode,
          onThemeChanged: (mode) {
            setState(() => _themeMode = mode);
          },
        ),
      ),
    );
  }

  Future<void> _openMealDetail(MealLog meal) async {
    await _navigatorKey.currentState!.push<void>(
      MaterialPageRoute<void>(builder: (_) => MealDetailScreen(meal: meal)),
    );
  }
}
