import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'models/auth_session.dart';
import 'models/captured_meal_photo.dart';
import 'models/meal.dart';
import 'models/meal_type_resolver.dart';
import 'navigation/logmyplate_page_route.dart';
import 'screens/account_gate_screen.dart';
import 'screens/account_profile_screen.dart';
import 'screens/analyzing_screen.dart';
import 'screens/camera_screen.dart';
import 'screens/meal_detail_screen.dart';
import 'screens/review_meal_screen.dart';
import 'screens/settings_screen.dart';
import 'screens/today_screen.dart';
import 'screens/weekly_journal_screen.dart';
import 'screens/welcome_screen.dart';
import 'services/rewarded_ad_service.dart';
import 'state/auth_controller.dart';
import 'state/journal_controller.dart';
import 'theme/logmyplate_colors.dart';
import 'theme/logmyplate_theme.dart';
import 'widgets/logmyplate_notice.dart';

class LogMyPlateApp extends StatefulWidget {
  const LogMyPlateApp({
    super.key,
    AuthController? authController,
    JournalController? journalController,
    RewardedAdGateway? rewardedAdGateway,
  }) : _authController = authController,
       _journalController = journalController,
       _rewardedAdGateway = rewardedAdGateway;

  final AuthController? _authController;
  final JournalController? _journalController;
  final RewardedAdGateway? _rewardedAdGateway;

  @override
  State<LogMyPlateApp> createState() => _LogMyPlateAppState();
}

class _LogMyPlateAppState extends State<LogMyPlateApp> {
  static const _hasSeenWelcomeKey = 'logmyplate.has_seen_welcome';
  static const _themeModeKey = 'logmyplate.theme_mode';

  final _navigatorKey = GlobalKey<NavigatorState>();
  late final AuthController _authController =
      widget._authController ?? AuthController();
  late final JournalController _journalController =
      widget._journalController ?? JournalController();
  late final RewardedAdGateway _rewardedAds =
      widget._rewardedAdGateway ?? GoogleRewardedAdService();
  ThemeMode _themeMode = ThemeMode.dark;
  bool _hasSeenWelcome = false;
  bool _welcomeStateLoaded = false;
  bool _openingWeeklyJournal = false;

  @override
  void initState() {
    super.initState();
    _authController.addListener(_handleAccessStateChanged);
    _journalController.addListener(_handleAccessStateChanged);
    _initializeApp();
  }

  @override
  void dispose() {
    _authController.removeListener(_handleAccessStateChanged);
    _journalController.removeListener(_handleAccessStateChanged);
    _rewardedAds.dispose();
    _authController.dispose();
    _journalController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'LogMyPlate',
      debugShowCheckedModeBanner: false,
      theme: LogMyPlateTheme.light(),
      darkTheme: LogMyPlateTheme.dark(),
      themeMode: _themeMode,
      navigatorKey: _navigatorKey,
      home: !_welcomeStateLoaded
          ? const _LaunchScreen()
          : _hasSeenWelcome
          ? _todayScreen()
          : WelcomeScreen(onStart: _startFromWelcome),
    );
  }

  Future<void> _initializeApp() async {
    await _loadLocalPreferences();
    await _authController.load();
    if (_authController.isSignedIn && !_hasSeenWelcome) {
      await _markWelcomeSeen();
    }
    await _journalController.loadToday();
    _handleAccessStateChanged();
  }

  Widget _todayScreen() {
    return AnimatedBuilder(
      animation: _journalController,
      builder: (context, _) {
        return TodayScreen(
          meals: _journalController.meals,
          totals: _journalController.totals,
          quota: _journalController.quota,
          weeklyRange: _journalController.weeklyRange,
          loading: _journalController.loading,
          initialLoading: _journalController.initialLoading,
          weeklyJournalOpening: _openingWeeklyJournal,
          syncMessage: _journalController.error,
          onRefresh: _journalController.loadToday,
          onScan: _openCamera,
          onAddManually: _openManualReview,
          onOpenSettings: _openSettings,
          onOpenMeal: (meal) => _openMealDetail(meal),
          onDeleteMeal: _deleteMeal,
          onOpenWeeklyJournal: _openWeeklyJournal,
        );
      },
    );
  }

  Future<void> _loadLocalPreferences() async {
    try {
      final preferences = await SharedPreferences.getInstance();
      _hasSeenWelcome = preferences.getBool(_hasSeenWelcomeKey) ?? false;
      _themeMode = _themeModeFromPreference(
        preferences.getString(_themeModeKey),
      );
    } catch (_) {
      _hasSeenWelcome = false;
      _themeMode = ThemeMode.dark;
    }
    if (!mounted) return;
    setState(() => _welcomeStateLoaded = true);
  }

  ThemeMode _themeModeFromPreference(String? value) {
    return switch (value) {
      'system' => ThemeMode.system,
      'light' => ThemeMode.light,
      'dark' => ThemeMode.dark,
      _ => ThemeMode.dark,
    };
  }

  Future<void> _setThemeMode(ThemeMode mode) async {
    setState(() => _themeMode = mode);
    try {
      final preferences = await SharedPreferences.getInstance();
      await preferences.setString(_themeModeKey, mode.name);
    } catch (_) {
      // Keep the selected theme for this session even if local storage is
      // temporarily unavailable.
    }
  }

  Future<void> _markWelcomeSeen() async {
    setState(() => _hasSeenWelcome = true);
    await _persistWelcomeSeen();
  }

  Future<void> _persistWelcomeSeen() async {
    try {
      final preferences = await SharedPreferences.getInstance();
      await preferences.setBool(_hasSeenWelcomeKey, true);
    } catch (_) {
      // The app can still continue when local preferences are temporarily
      // unavailable; the user may simply see welcome again after restart.
    }
  }

  Future<void> _startFromWelcome() async {
    await _journalController.refreshQuota();

    final quota = _journalController.quota;
    if (!_authController.isSignedIn &&
        quota != null &&
        quota.totalRemaining <= 0) {
      final session = await _openAccountHome(AccountGateReason.quotaExhausted);
      if (session != null) await _markWelcomeSeen();
      return;
    }

    if (!await _ensureScanAllowed()) return;
    await _persistWelcomeSeen();
    await _pushCameraFlow();
    if (mounted) await _markWelcomeSeen();
  }

  void _handleAccessStateChanged() {
    if (!_welcomeStateLoaded ||
        !_authController.isSignedIn ||
        _hasSeenWelcome) {
      return;
    }

    Future<void>(() async {
      await _markWelcomeSeen();
    });
  }

  Future<void> _openCamera() async {
    if (!await _ensureScanAllowed()) return;
    await _pushCameraFlow();
  }

  Future<void> _pushCameraFlow() async {
    await _navigatorKey.currentState!.push<void>(
      logmyplatePageRoute<void>(
        builder: (_) => CameraScreen(
          onCaptured: (photo) {
            _navigatorKey.currentState!.pushReplacement<void, void>(
              logmyplatePageRoute<void>(
                builder: (_) => AnalyzingScreen(
                  photo: photo,
                  onAnalyze: _journalController.analyzeCapturedMeal,
                  onScanCreditRequired: () async {
                    await _openAccountHome(AccountGateReason.quotaExhausted);
                    await _journalController.refreshQuota();
                  },
                  onAddManually: _openManualReview,
                  onAnalyzed: (analysis) {
                    _navigatorKey.currentState!.pushReplacement<void, void>(
                      logmyplatePageRoute<void>(
                        builder: (_) => ReviewMealScreen(
                          initialItems: analysis.items,
                          initialMealType: mealTypeForReview(
                            localTime: DateTime.now(),
                            foodSuggestedType: analysis.mealType,
                          ),
                          lockInitialItems: true,
                          photo: photo,
                          onConfirm: (type, items) {
                            return _confirmAnalyzedMeal(
                              scanId: analysis.scanId,
                              title: analysis.mealName,
                              type: type,
                              items: items,
                              photo: analysis.imageStored ? null : photo,
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
      logmyplatePageRoute<void>(
        builder: (_) => ReviewMealScreen(
          initialItems: sampleDetectedItems().take(2).toList(),
          initialMealType: mealTypeForLocalTime(DateTime.now()),
          onConfirm: _saveMeal,
        ),
      ),
    );
  }

  Future<void> _saveMeal(MealType type, List<MealItem> items) async {
    await _journalController.saveMeal(type, items);
    _navigatorKey.currentState!.popUntil((route) => route.isFirst);
    _showJournalNotice(
      tone: LogMyPlateNoticeTone.success,
      title: 'Meal saved',
      message: 'Your journal is up to date.',
    );
  }

  Future<void> _confirmAnalyzedMeal({
    required String scanId,
    required String title,
    required MealType type,
    required List<MealItem> items,
    CapturedMealPhoto? photo,
  }) async {
    await _journalController.confirmAnalyzedMeal(
      scanId: scanId,
      title: title,
      type: type,
      items: items,
      photo: photo,
    );
    _navigatorKey.currentState!.popUntil((route) => route.isFirst);
    _showJournalNotice(
      tone: LogMyPlateNoticeTone.success,
      title: 'Scan saved',
      message: 'Your meal log is ready.',
    );
  }

  Future<bool> _ensureScanAllowed() async {
    final quota = _journalController.quota;
    if (quota == null || quota.totalRemaining > 0) return true;

    if (!_authController.isSignedIn) {
      final session = await _openAccountHome(AccountGateReason.quotaExhausted);
      if (session != null) {
        _showJournalNotice(
          tone: LogMyPlateNoticeTone.info,
          title: 'Account linked',
          message: 'Ad unlocks are available when scans run out.',
        );
      }
      return false;
    }

    final context = _navigatorKey.currentContext;
    if (context == null) return false;

    final action = await showModalBottomSheet<_NoScanCreditsAction>(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (_) => const _NoScanCreditsSheet(),
    );

    if (action == _NoScanCreditsAction.watchAd) {
      return _watchRewardedAdForScan();
    } else if (action == _NoScanCreditsAction.addManually) {
      await _openManualReview();
    } else if (action == _NoScanCreditsAction.refresh) {
      await _journalController.loadToday();
    }

    return false;
  }

  Future<bool> _watchRewardedAdForScan() async {
    _showJournalNotice(
      tone: LogMyPlateNoticeTone.info,
      title: 'Preparing ad',
      message: 'Your scan unlock continues after the ad.',
    );

    final outcome = await _rewardedAds.showScanUnlockAd();
    if (!outcome.earnedReward) {
      _showJournalNotice(
        tone: LogMyPlateNoticeTone.warning,
        title: 'Ad not completed',
        message: outcome.errorMessage ?? 'Watch a full ad to earn progress.',
      );
      return false;
    }

    try {
      final reward = await _journalController.completeRewardedAd(
        adUnitId: outcome.adUnitId,
        idempotencyKey: 'rewarded-ad-${DateTime.now().microsecondsSinceEpoch}',
        rewardType: outcome.rewardType,
        rewardAmount: outcome.rewardAmount,
      );

      if (reward.grantedScan) {
        _showJournalNotice(
          tone: LogMyPlateNoticeTone.success,
          title: 'Scan unlocked',
          message: 'You can scan one more meal now.',
        );
        return reward.quota.totalRemaining > 0;
      }

      final next = reward.adsNeededForNextScan;
      _showJournalNotice(
        tone: LogMyPlateNoticeTone.warning,
        title: 'Almost there',
        message: next == 1
            ? 'Watch 1 more rewarded ad to unlock a scan.'
            : 'Watch $next more rewarded ads to unlock a scan.',
      );
      return false;
    } catch (_) {
      _showJournalNotice(
        tone: LogMyPlateNoticeTone.error,
        title: 'Unlock sync failed',
        message: 'Ad was watched, but the scan could not be credited.',
      );
      return false;
    }
  }

  void _showJournalNotice({
    required LogMyPlateNoticeTone tone,
    required String title,
    String? message,
  }) {
    final overlay = _navigatorKey.currentState?.overlay;
    if (overlay == null) return;
    LogMyPlateNotice.showInOverlay(
      overlay,
      tone: tone,
      title: title,
      message: message,
    );
  }

  Future<void> _openSettings() async {
    await _navigatorKey.currentState!.push<void>(
      logmyplatePageRoute<void>(
        builder: (_) => AnimatedBuilder(
          animation: _authController,
          builder: (context, _) {
            return SettingsScreen(
              themeMode: _themeMode,
              session: _authController.session,
              onOpenAccount: () =>
                  _openAccountHome(AccountGateReason.saveJournal),
              onThemeChanged: _setThemeMode,
            );
          },
        ),
      ),
    );
  }

  Future<AuthSession?> _openAccountHome(AccountGateReason reason) async {
    final existing = _authController.session;
    if (existing != null) {
      await _openAccountProfile(existing);
      return existing;
    }

    final session = await _openAccountGate(reason);
    if (session != null) {
      await _markWelcomeSeen();
      _journalController.resetForAccountChange();
      _navigatorKey.currentState!.popUntil((route) => route.isFirst);
      await _journalController.loadToday();
    }
    return session;
  }

  Future<AuthSession?> _openAccountGate(AccountGateReason reason) async {
    final result = await _navigatorKey.currentState!.push<AuthSession>(
      logmyplatePageRoute<AuthSession>(
        builder: (_) => AnimatedBuilder(
          animation: _authController,
          builder: (context, _) {
            return AccountGateScreen(
              reason: reason,
              loading: _authController.loading,
              error: _authController.error,
              onSignIn: _authController.signIn,
              onEmailAuth: (mode, email, password) {
                return _authController.signInWithEmail(
                  mode: mode,
                  email: email,
                  password: password,
                );
              },
              onClearError: _authController.clearError,
              onManualLog: () {
                _navigatorKey.currentState!.pop();
                _openManualReview();
              },
            );
          },
        ),
      ),
    );

    return result;
  }

  Future<void> _openAccountProfile(AuthSession session) async {
    await _navigatorKey.currentState!.push<void>(
      logmyplatePageRoute<void>(
        builder: (_) => AnimatedBuilder(
          animation: _authController,
          builder: (context, _) {
            final currentSession = _authController.session ?? session;
            return AccountProfileScreen(
              session: currentSession,
              onSignOut: () async {
                await _authController.signOut();
                await _markWelcomeSeen();
                _journalController.resetForAccountChange();
                _navigatorKey.currentState?.popUntil((route) => route.isFirst);
                await _journalController.loadToday();
                return false;
              },
            );
          },
        ),
      ),
    );
  }

  Future<bool> _openMealDetail(MealLog meal) async {
    final deleted = await _navigatorKey.currentState!.push<bool>(
      logmyplatePageRoute<bool>(
        builder: (_) => MealDetailScreen(
          meal: meal,
          onUpdateMeal: _journalController.updateMeal,
          onDeleteMeal: _deleteMeal,
        ),
      ),
    );
    return deleted == true;
  }

  Future<void> _deleteMeal(MealLog meal) async {
    await _journalController.deleteMeal(meal);
    _showJournalNotice(
      tone: LogMyPlateNoticeTone.success,
      title: 'Meal deleted',
      message: 'Today\'s totals were updated.',
    );
  }

  Future<void> _openWeeklyJournal() async {
    final summary = _journalController.weeklyRange;
    if (summary == null || _openingWeeklyJournal) return;

    setState(() => _openingWeeklyJournal = true);

    try {
      final range = await _journalController.loadWeeklyRange(0);

      await _navigatorKey.currentState!.push<void>(
        logmyplatePageRoute<void>(
          builder: (_) => WeeklyJournalScreen(
            range: range,
            isSyncing: _journalController.loading,
            syncMessage: _journalController.error,
            onRefresh: _journalController.loadToday,
            onLoadWeek: _journalController.loadWeeklyRange,
            onLoadWeeks: _journalController.loadAvailableWeeks,
            onOpenMeal: _openMealDetail,
            onDeleteMeal: _deleteMeal,
          ),
        ),
      );
    } catch (_) {
      _showJournalNotice(
        tone: LogMyPlateNoticeTone.error,
        title: 'Journal unavailable',
        message: 'Could not load the weekly journal. Pull to retry.',
      );
    } finally {
      if (mounted) {
        setState(() => _openingWeeklyJournal = false);
      }
    }
  }
}

class _LaunchScreen extends StatelessWidget {
  const _LaunchScreen();

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      backgroundColor: LogMyPlateColors.bgInk,
      body: SafeArea(
        child: Center(
          child: Text(
            'LogMyPlate',
            style: TextStyle(
              color: LogMyPlateColors.accent,
              fontSize: 24,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ),
    );
  }
}

enum _NoScanCreditsAction { watchAd, addManually, refresh }

class _NoScanCreditsSheet extends StatelessWidget {
  const _NoScanCreditsSheet();

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;

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
              'Watch 2 rewarded ads to unlock 1 scan. You can unlock up to 5 scans per day.',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: colors.textSecondary,
                height: 1.35,
              ),
            ),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: () =>
                  Navigator.of(context).pop(_NoScanCreditsAction.watchAd),
              style: FilledButton.styleFrom(
                backgroundColor: colors.primaryAction,
                foregroundColor: colors.primaryActionText,
                padding: const EdgeInsets.symmetric(vertical: 15),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
              child: const Text('Watch ad'),
            ),
            const SizedBox(height: 8),
            OutlinedButton(
              onPressed: () =>
                  Navigator.of(context).pop(_NoScanCreditsAction.addManually),
              style: OutlinedButton.styleFrom(
                foregroundColor: colors.textPrimary,
                side: BorderSide(color: colors.border),
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
