import 'dart:async';
import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'models/auth_session.dart';
import 'models/captured_meal_photo.dart';
import 'models/meal.dart';
import 'models/meal_type_resolver.dart';
import 'navigation/logmyplate_page_route.dart';
import 'screens/account_gate_screen.dart';
import 'screens/analyzing_screen.dart';
import 'screens/camera_screen.dart';
import 'screens/health_target_screen.dart';
import 'screens/meal_detail_screen.dart';
import 'screens/profile_screen.dart';
import 'screens/review_meal_screen.dart';
import 'screens/today_screen.dart';
import 'screens/weekly_journal_screen.dart';
import 'screens/welcome_screen.dart';
import 'services/rewarded_ad_service.dart';
import 'state/auth_controller.dart';
import 'state/journal_controller.dart';
import 'theme/logmyplate_colors.dart';
import 'theme/logmyplate_theme.dart';
import 'widgets/logmyplate_notice.dart';
import 'widgets/primitive_icons.dart';

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
  int _selectedTab = 0;
  bool _openingWeeklyJournal = false;
  bool _openingHealthTargetSetup = false;
  bool _loadingJournalTab = false;
  String? _journalTabError;
  JournalRangeData? _journalTabRange;

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
          ? _mainShell()
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

  Widget _mainShell() {
    return AnimatedBuilder(
      animation: _authController,
      builder: (context, _) {
        return AnimatedBuilder(
          animation: _journalController,
          builder: (context, _) {
            return _LogMyPlateShell(
              selectedIndex: _selectedTab,
              scanPulsing:
                  _journalController.meals.isEmpty &&
                  !_journalController.initialLoading,
              onSelect: _selectTab,
              onScan: _openCamera,
              onTarget: _openHealthTargetEditor,
              child: _selectedTab == 0
                  ? _todayScreen(
                      showScanAction: false,
                      showSettingsAction: false,
                      bottomPadding: 144,
                    )
                  : _selectedTab == 1
                  ? _journalTabScreen()
                  : ProfileScreen(
                      themeMode: _themeMode,
                      session: _authController.session,
                      healthTarget: _journalController.healthTarget,
                      onThemeChanged: _setThemeMode,
                      onOpenAccount: () =>
                          _openAccountHome(AccountGateReason.saveJournal),
                      onEditHealthTarget: _openHealthTargetEditor,
                      onSignOut: _signOutFromProfile,
                    ),
            );
          },
        );
      },
    );
  }

  Widget _todayScreen({
    bool showScanAction = true,
    bool showSettingsAction = true,
    double bottomPadding = 120,
  }) {
    return AnimatedBuilder(
      animation: _journalController,
      builder: (context, _) {
        return TodayScreen(
          meals: _journalController.meals,
          totals: _journalController.totals,
          target: _journalController.dailyTarget,
          quota: _journalController.quota,
          weeklyRange: _journalController.weeklyRange,
          loading: _journalController.loading,
          initialLoading: _journalController.initialLoading,
          weeklyJournalOpening: _openingWeeklyJournal,
          showScanAction: showScanAction,
          showSettingsAction: showSettingsAction,
          bottomPadding: bottomPadding,
          syncMessage: _journalController.error,
          onRefresh: _journalController.loadToday,
          onScan: _openCamera,
          onAddManually: _openManualReview,
          onOpenSettings: () => _selectTab(2),
          onOpenMeal: (meal) => _openMealDetail(meal),
          onDeleteMeal: _deleteMeal,
          onOpenWeeklyJournal: _openWeeklyJournal,
        );
      },
    );
  }

  Widget _journalTabScreen() {
    final range = _journalTabRange;
    if (range == null) {
      return _JournalTabLoadingScreen(
        loading: _loadingJournalTab,
        message: _journalTabError,
        onRetry: () => _loadJournalTab(force: true),
      );
    }

    return WeeklyJournalScreen(
      range: range,
      showBackButton: false,
      bottomPadding: 144,
      isSyncing: _loadingJournalTab,
      syncMessage: _journalTabError,
      onRefresh: () => _loadJournalTab(force: true),
      onLoadWeek: _journalController.loadWeeklyRange,
      onLoadWeeks: _journalController.loadAvailableWeeks,
      onOpenMeal: _openMealDetail,
      onDeleteMeal: _deleteMeal,
    );
  }

  void _selectTab(int index) {
    setState(() => _selectedTab = index);
    if (index == 1) unawaited(_loadJournalTab());
  }

  Future<void> _loadJournalTab({bool force = false}) async {
    if (_loadingJournalTab || (!force && _journalTabRange != null)) return;

    setState(() {
      _loadingJournalTab = true;
      _journalTabError = null;
    });

    try {
      final range = await _journalController.loadWeeklyRange(0);
      if (!mounted) return;
      setState(() => _journalTabRange = range);
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _journalTabError = 'Could not load your journal. Tap to retry.';
      });
    } finally {
      if (mounted) setState(() => _loadingJournalTab = false);
    }
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
    if (!await _confirmDailyTargetScan()) return;
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
    if (!await _confirmDailyTargetScan()) return;
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
    _journalTabRange = null;
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
    _journalTabRange = null;
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

    while (mounted) {
      final context = _navigatorKey.currentContext;
      if (context == null) return false;
      if (!context.mounted) return false;
      final action = await showModalBottomSheet<_NoScanCreditsAction>(
        context: context,
        backgroundColor: Colors.transparent,
        builder: (_) => _NoScanCreditsSheet(
          progress: _journalController.rewardedAdProgress,
        ),
      );

      if (action == _NoScanCreditsAction.watchAd) {
        return _watchConsecutiveRewardedAdsForScan();
      } else if (action == _NoScanCreditsAction.addManually) {
        await _openManualReview();
      } else if (action == _NoScanCreditsAction.refresh) {
        await _journalController.loadToday();
        if ((_journalController.quota?.totalRemaining ?? 0) > 0) return true;
      }
      break;
    }

    return false;
  }

  Future<bool> _watchConsecutiveRewardedAdsForScan() async {
    while (mounted) {
      final progress = _journalController.rewardedAdProgress;
      if (progress.dailyLimitReached) return false;

      final result = await _watchRewardedAdForScan();
      if (result == _RewardedAdWatchResult.unlocked) return true;
      if (result == _RewardedAdWatchResult.failed) return false;
    }

    return false;
  }

  Future<_RewardedAdWatchResult> _watchRewardedAdForScan() async {
    final progress = _journalController.rewardedAdProgress;
    final next = progress.adsNeededForNextScan;
    _showJournalNotice(
      tone: LogMyPlateNoticeTone.info,
      title: next == 1 ? 'Final ad' : 'Preparing ad',
      message: next == 1
          ? 'Finish this ad to unlock your scan.'
          : 'Keep watching to unlock 1 scan.',
    );

    final outcome = await _rewardedAds.showScanUnlockAd();
    if (!outcome.earnedReward) {
      _showJournalNotice(
        tone: LogMyPlateNoticeTone.warning,
        title: 'Ad not completed',
        message: outcome.errorMessage ?? 'Watch a full ad to earn progress.',
      );
      return _RewardedAdWatchResult.failed;
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
        return reward.quota.totalRemaining > 0
            ? _RewardedAdWatchResult.unlocked
            : _RewardedAdWatchResult.failed;
      }

      final next = reward.adsNeededForNextScan;
      _showJournalNotice(
        tone: LogMyPlateNoticeTone.info,
        title: 'Almost there',
        message: next == 1
            ? 'Opening 1 more ad to unlock your scan.'
            : 'Opening $next more ads to unlock your scan.',
      );
      return _RewardedAdWatchResult.progressed;
    } catch (_) {
      _showJournalNotice(
        tone: LogMyPlateNoticeTone.error,
        title: 'Unlock sync failed',
        message: 'Ad was watched, but the scan could not be credited.',
      );
      return _RewardedAdWatchResult.failed;
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

  Future<AuthSession?> _openAccountHome(AccountGateReason reason) async {
    final existing = _authController.session;
    if (existing != null) {
      setState(() => _selectedTab = 2);
      return existing;
    }

    final session = await _openAccountGate(reason);
    if (session != null) {
      await _markWelcomeSeen();
      _journalController.resetForAccountChange();
      setState(() {
        _selectedTab = 0;
        _journalTabRange = null;
      });
      _navigatorKey.currentState!.popUntil((route) => route.isFirst);
      await _journalController.loadToday();
      await _promptForHealthTargetIfNeeded();
    }
    return session;
  }

  Future<void> _promptForHealthTargetIfNeeded() async {
    if (!_authController.isSignedIn ||
        _journalController.healthTarget != null ||
        _openingHealthTargetSetup) {
      return;
    }

    final navigator = _navigatorKey.currentState;
    if (navigator == null) return;

    await _openHealthTargetSetup();
  }

  Future<void> _openHealthTargetEditor() async {
    if (!_authController.isSignedIn) {
      await _openAccountHome(AccountGateReason.saveJournal);
      return;
    }
    await _openHealthTargetSetup(
      initialTarget: _journalController.healthTarget,
    );
  }

  Future<void> _openHealthTargetSetup({HealthTarget? initialTarget}) async {
    if (_openingHealthTargetSetup) return;

    final navigator = _navigatorKey.currentState;
    if (navigator == null) return;

    _openingHealthTargetSetup = true;
    try {
      final target = await navigator.push<HealthTarget>(
        logmyplatePageRoute<HealthTarget>(
          builder: (_) => HealthTargetScreen(
            initialTarget: initialTarget,
            onSave: _journalController.saveHealthTarget,
          ),
        ),
      );
      if (target != null) {
        setState(() => _journalTabRange = null);
        _showJournalNotice(
          tone: LogMyPlateNoticeTone.success,
          title: initialTarget == null
              ? 'Daily target set'
              : 'Daily target updated',
          message: '${target.dailyCalorieTarget} kCal will guide your journal.',
        );
      }
    } finally {
      _openingHealthTargetSetup = false;
    }
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

  Future<void> _signOutFromProfile() async {
    await _authController.signOut();
    await _markWelcomeSeen();
    _journalController.resetForAccountChange();
    setState(() {
      _selectedTab = 0;
      _journalTabRange = null;
    });
    _navigatorKey.currentState?.popUntil((route) => route.isFirst);
    await _journalController.loadToday();
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
    _journalTabRange = null;
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

  Future<bool> _confirmDailyTargetScan() async {
    final target = _journalController.dailyTarget;
    if (!_authController.isSignedIn ||
        target == null ||
        target.calories <= 0 ||
        _journalController.totals.calories < target.calories) {
      return true;
    }

    final context = _navigatorKey.currentContext;
    if (context == null) return true;

    final continueScan = await showModalBottomSheet<bool>(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (_) => _DailyTargetReachedSheet(
        consumedCalories: _journalController.totals.calories,
        targetCalories: target.calories,
      ),
    );

    return continueScan == true;
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

class _LogMyPlateShell extends StatelessWidget {
  const _LogMyPlateShell({
    required this.child,
    required this.selectedIndex,
    required this.scanPulsing,
    required this.onSelect,
    required this.onScan,
    required this.onTarget,
  });

  final Widget child;
  final int selectedIndex;
  final bool scanPulsing;
  final ValueChanged<int> onSelect;
  final VoidCallback onScan;
  final VoidCallback onTarget;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          Positioned.fill(
            child: AnimatedSwitcher(
              duration: const Duration(milliseconds: 240),
              transitionBuilder: (child, animation) {
                final slide =
                    Tween<Offset>(
                      begin: const Offset(0.03, 0),
                      end: Offset.zero,
                    ).animate(
                      CurvedAnimation(
                        parent: animation,
                        curve: Curves.easeOutCubic,
                      ),
                    );
                return FadeTransition(
                  opacity: animation,
                  child: SlideTransition(position: slide, child: child),
                );
              },
              child: KeyedSubtree(
                key: ValueKey<int>(selectedIndex),
                child: child,
              ),
            ),
          ),
          Positioned(
            left: 14,
            right: 14,
            bottom: 12,
            child: SafeArea(
              top: false,
              child: _ShellNavBar(
                selectedIndex: selectedIndex,
                onSelect: onSelect,
                onScan: onScan,
                onTarget: onTarget,
                scanPulsing: scanPulsing,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ShellNavBar extends StatelessWidget {
  const _ShellNavBar({
    required this.selectedIndex,
    required this.onSelect,
    required this.onScan,
    required this.onTarget,
    required this.scanPulsing,
  });

  final int selectedIndex;
  final ValueChanged<int> onSelect;
  final VoidCallback onScan;
  final VoidCallback onTarget;
  final bool scanPulsing;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;

    return ClipRRect(
      borderRadius: BorderRadius.circular(24),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 18, sigmaY: 18),
        child: Container(
          height: 88,
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
          decoration: BoxDecoration(
            color: colors.surfaceCard.withValues(alpha: 0.88),
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: colors.border, width: 0.6),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.14),
                blurRadius: 30,
                offset: const Offset(0, 14),
              ),
            ],
          ),
          child: Stack(
            alignment: Alignment.center,
            children: [
              Row(
                children: [
                  _ShellTabButton(
                    label: 'Today',
                    icon: Icons.home_rounded,
                    selected: selectedIndex == 0,
                    onTap: () => onSelect(0),
                  ),
                  _ShellTabButton(
                    label: 'Journal',
                    icon: Icons.calendar_month_rounded,
                    selected: selectedIndex == 1,
                    onTap: () => onSelect(1),
                  ),
                  const SizedBox(width: 70),
                  _ShellTabButton(
                    label: 'Target',
                    icon: Icons.track_changes_rounded,
                    selected: false,
                    onTap: onTarget,
                  ),
                  _ShellTabButton(
                    label: 'Profile',
                    icon: Icons.person_rounded,
                    selected: selectedIndex == 2,
                    onTap: () => onSelect(2),
                  ),
                ],
              ),
              _ShellScanTab(onTap: onScan, pulsing: scanPulsing),
            ],
          ),
        ),
      ),
    );
  }
}

class _ShellTabButton extends StatelessWidget {
  const _ShellTabButton({
    required this.label,
    required this.icon,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;

    return Expanded(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(18),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          padding: const EdgeInsets.symmetric(vertical: 5),
          decoration: BoxDecoration(
            color: selected
                ? LogMyPlateColors.accent.withValues(alpha: 0.16)
                : Colors.transparent,
            borderRadius: BorderRadius.circular(18),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                icon,
                size: 18,
                color: selected ? colors.accentText : colors.textSecondary,
              ),
              const SizedBox(height: 2),
              Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: selected ? colors.accentText : colors.textSecondary,
                  letterSpacing: 0,
                  fontSize: 10,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ShellScanTab extends StatelessWidget {
  const _ShellScanTab({required this.onTap, required this.pulsing});

  final VoidCallback onTap;
  final bool pulsing;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;

    return SizedBox(
      width: 70,
      child: InkWell(
        key: const ValueKey('shell-scan-action'),
        onTap: onTap,
        borderRadius: BorderRadius.circular(18),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Stack(
              alignment: Alignment.center,
              children: [
                if (pulsing)
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: LogMyPlateColors.accent.withValues(alpha: 0.24),
                      ),
                    ),
                  ),
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: const LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [Color(0xFFFFE3A3), LogMyPlateColors.accent],
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: LogMyPlateColors.accent.withValues(alpha: 0.22),
                        blurRadius: 18,
                        offset: const Offset(0, 8),
                      ),
                    ],
                  ),
                  child: Center(
                    child: PrimitiveCameraIcon(
                      color: colors.accentOn,
                      size: 21,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 2),
            Text(
              'Scan',
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                color: colors.accentText,
                letterSpacing: 0,
                fontSize: 10,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _JournalTabLoadingScreen extends StatelessWidget {
  const _JournalTabLoadingScreen({
    required this.loading,
    required this.message,
    required this.onRetry,
  });

  final bool loading;
  final String? message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 18, 16, 126),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Journal', style: Theme.of(context).textTheme.displayLarge),
              const SizedBox(height: 6),
              Text(
                'Weekly trends and day-wise meal history.',
                style: Theme.of(
                  context,
                ).textTheme.bodyMedium?.copyWith(color: colors.textSecondary),
              ),
              const Spacer(),
              Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (loading)
                      CircularProgressIndicator(
                        color: LogMyPlateColors.accent,
                        backgroundColor: colors.mutedFill,
                      )
                    else
                      Icon(
                        Icons.calendar_month_rounded,
                        color: colors.textSecondary,
                        size: 44,
                      ),
                    const SizedBox(height: 16),
                    Text(
                      message ?? 'Loading weekly journal',
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    if (message != null) ...[
                      const SizedBox(height: 12),
                      TextButton(
                        onPressed: onRetry,
                        child: const Text('Retry'),
                      ),
                    ],
                  ],
                ),
              ),
              const Spacer(),
            ],
          ),
        ),
      ),
    );
  }
}

enum _NoScanCreditsAction { watchAd, addManually, refresh }

enum _RewardedAdWatchResult { unlocked, progressed, failed }

class _NoScanCreditsSheet extends StatelessWidget {
  const _NoScanCreditsSheet({required this.progress});

  final RewardedAdProgress progress;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;
    final adsNeeded = progress.adsNeededForNextScan;
    final completed = progress.dailyLimitReached
        ? progress.adsPerScan
        : progress.adsCompletedTowardNextScan;
    final title = adsNeeded == 1 ? 'Almost there' : 'No scans left';
    final description = progress.dailyLimitReached
        ? 'You have reached today\'s ad unlock limit. Add this meal manually or refresh later.'
        : adsNeeded == 1
        ? 'Watch 1 more rewarded ad to unlock 1 scan.'
        : 'Watch $adsNeeded rewarded ads to unlock 1 scan. You can unlock up to ${progress.dailyScanLimit} scans per day.';
    final buttonLabel = adsNeeded == 1
        ? 'Watch final ad'
        : 'Start earning scan';

    return SafeArea(
      child: SingleChildScrollView(
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
              Text(title, style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 6),
              Text(
                description,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: colors.textSecondary,
                  height: 1.35,
                ),
              ),
              if (!progress.dailyLimitReached) ...[
                const SizedBox(height: 12),
                Text(
                  'Progress $completed of ${progress.adsPerScan} ads',
                  style: Theme.of(context).textTheme.labelMedium?.copyWith(
                    color: colors.textSecondary,
                  ),
                ),
              ],
              const SizedBox(height: 16),
              FilledButton(
                onPressed: progress.dailyLimitReached
                    ? null
                    : () => Navigator.of(
                        context,
                      ).pop(_NoScanCreditsAction.watchAd),
                style: FilledButton.styleFrom(
                  backgroundColor: colors.primaryAction,
                  foregroundColor: colors.primaryActionText,
                  padding: const EdgeInsets.symmetric(vertical: 15),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
                child: Text(buttonLabel),
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
      ),
    );
  }
}

class _DailyTargetReachedSheet extends StatelessWidget {
  const _DailyTargetReachedSheet({
    required this.consumedCalories,
    required this.targetCalories,
  });

  final int consumedCalories;
  final int targetCalories;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;
    final overBy = consumedCalories - targetCalories;

    return SafeArea(
      child: Container(
        margin: const EdgeInsets.all(12),
        padding: const EdgeInsets.fromLTRB(18, 18, 18, 16),
        decoration: BoxDecoration(
          color: colors.surfaceCard,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: colors.border),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                Container(
                  width: 46,
                  height: 46,
                  decoration: BoxDecoration(
                    color: LogMyPlateColors.accent.withValues(alpha: 0.16),
                    shape: BoxShape.circle,
                  ),
                  child: Center(
                    child: Text(
                      '${((consumedCalories / targetCalories) * 100).round()}%',
                      style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        color: colors.accentText,
                        fontFeatures: const [FontFeature.tabularFigures()],
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Daily target reached',
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        overBy <= 0
                            ? 'You are at your calorie target for today.'
                            : 'You are $overBy kCal over today\'s target.',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: colors.textSecondary,
                          height: 1.3,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: () => Navigator.of(context).pop(true),
              style: FilledButton.styleFrom(
                backgroundColor: LogMyPlateColors.accent,
                foregroundColor: LogMyPlateColors.accentDeep,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
              child: const Text('Scan anyway'),
            ),
            TextButton(
              onPressed: () => Navigator.of(context).pop(false),
              child: const Text('Stay on journal'),
            ),
          ],
        ),
      ),
    );
  }
}
