import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'models/meal.dart';
import 'screens/analyzing_screen.dart';
import 'screens/camera_screen.dart';
import 'screens/meal_detail_screen.dart';
import 'screens/review_meal_screen.dart';
import 'screens/settings_screen.dart';
import 'screens/today_screen.dart';
import 'screens/welcome_screen.dart';
import 'state/journal_controller.dart';
import 'theme/dfit_colors.dart';
import 'theme/dfit_theme.dart';

class DFitApp extends StatefulWidget {
  const DFitApp({super.key});

  @override
  State<DFitApp> createState() => _DFitAppState();
}

class _DFitAppState extends State<DFitApp> {
  static const _hasSeenWelcomeKey = 'dfit.has_seen_welcome';

  final _navigatorKey = GlobalKey<NavigatorState>();
  final _messengerKey = GlobalKey<ScaffoldMessengerState>();
  late final JournalController _journalController = JournalController();
  ThemeMode _themeMode = ThemeMode.system;
  bool _hasSeenWelcome = false;
  bool _welcomeStateLoaded = false;

  @override
  void initState() {
    super.initState();
    _loadWelcomeState();
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
      scaffoldMessengerKey: _messengerKey,
      home: !_welcomeStateLoaded
          ? const _LaunchScreen()
          : _hasSeenWelcome
          ? _todayScreen()
          : WelcomeScreen(
              onStart: () {
                _markWelcomeSeen();
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
          totals: _journalController.totals,
          target: _journalController.target,
          quota: _journalController.quota,
          weeklyRange: _journalController.weeklyRange,
          loading: _journalController.loading,
          syncMessage: _journalController.error,
          onRefresh: _journalController.loadToday,
          onScan: _openCamera,
          onAddManually: _openManualReview,
          onOpenSettings: _openSettings,
          onOpenMeal: _openMealDetail,
        );
      },
    );
  }

  Future<void> _loadWelcomeState() async {
    try {
      final preferences = await SharedPreferences.getInstance();
      _hasSeenWelcome = preferences.getBool(_hasSeenWelcomeKey) ?? false;
    } catch (_) {
      _hasSeenWelcome = false;
    }
    if (!mounted) return;
    setState(() => _welcomeStateLoaded = true);
  }

  Future<void> _markWelcomeSeen() async {
    setState(() => _hasSeenWelcome = true);
    try {
      final preferences = await SharedPreferences.getInstance();
      await preferences.setBool(_hasSeenWelcomeKey, true);
    } catch (_) {
      // The app can still continue when local preferences are temporarily
      // unavailable; the user may simply see welcome again after restart.
    }
  }

  Future<void> _openCamera() async {
    if (!await _ensureScanAllowed()) return;

    await _navigatorKey.currentState!.push<void>(
      MaterialPageRoute<void>(
        builder: (_) => CameraScreen(
          onCaptured: (photo) {
            _navigatorKey.currentState!.pushReplacement<void, void>(
              MaterialPageRoute<void>(
                builder: (_) => AnalyzingScreen(
                  photo: photo,
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
    _showJournalMessage('Meal saved');
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
    _showJournalMessage('Scan saved');
  }

  Future<bool> _ensureScanAllowed() async {
    final quota = _journalController.quota;
    if (quota == null || quota.totalRemaining > 0) return true;

    final context = _navigatorKey.currentContext;
    if (context == null) return false;

    final action = await showModalBottomSheet<_NoScanCreditsAction>(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (_) => const _NoScanCreditsSheet(),
    );

    if (action == _NoScanCreditsAction.addManually) {
      await _openManualReview();
    } else if (action == _NoScanCreditsAction.refresh) {
      await _journalController.loadToday();
    }

    return false;
  }

  void _showJournalMessage(String message) {
    final messenger = _messengerKey.currentState;
    messenger
      ?..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          content: Text(message),
          behavior: SnackBarBehavior.floating,
          backgroundColor: DFitColors.surfaceHero,
          margin: const EdgeInsets.fromLTRB(16, 0, 16, 92),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          duration: const Duration(seconds: 2),
        ),
      );
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

class _LaunchScreen extends StatelessWidget {
  const _LaunchScreen();

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      backgroundColor: DFitColors.bgInk,
      body: SafeArea(
        child: Center(
          child: Text(
            'DFit',
            style: TextStyle(
              color: DFitColors.accent,
              fontSize: 24,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ),
    );
  }
}

enum _NoScanCreditsAction { addManually, refresh }

class _NoScanCreditsSheet extends StatelessWidget {
  const _NoScanCreditsSheet();

  @override
  Widget build(BuildContext context) {
    final colors = context.dfit;

    return SafeArea(
      child: Container(
        margin: const EdgeInsets.all(12),
        padding: const EdgeInsets.fromLTRB(18, 18, 18, 16),
        decoration: BoxDecoration(
          color: colors.surfaceCard,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: colors.border),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'No scans left',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 6),
            Text(
              'Log manually for now. Ad unlocks and premium scan packs come next.',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: colors.textSecondary,
                height: 1.35,
              ),
            ),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: () =>
                  Navigator.of(context).pop(_NoScanCreditsAction.addManually),
              style: FilledButton.styleFrom(
                backgroundColor: colors.primaryAction,
                foregroundColor: colors.primaryActionText,
                padding: const EdgeInsets.symmetric(vertical: 15),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
              child: const Text('Add manually'),
            ),
            const SizedBox(height: 8),
            TextButton(
              onPressed: () =>
                  Navigator.of(context).pop(_NoScanCreditsAction.refresh),
              child: const Text('Refresh quota'),
            ),
          ],
        ),
      ),
    );
  }
}
