import 'dart:async';
import 'dart:convert';
import 'dart:math';
import 'dart:ui';

import 'package:app_links/app_links.dart' as platform_links;
import 'package:flutter/foundation.dart';
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
import 'screens/health_target_screen.dart';
import 'screens/meal_detail_screen.dart';
import 'screens/profile_screen.dart';
import 'screens/review_meal_screen.dart';
import 'screens/today_screen.dart';
import 'screens/weekly_journal_screen.dart';
import 'screens/welcome_screen.dart';
import 'services/app_build_info.dart';
import 'services/app_diagnostics.dart';
import 'services/app_links.dart';
import 'services/interstitial_ad_store.dart';
import 'services/logmyplate_analytics.dart';
import 'services/logmyplate_api_client.dart';
import 'services/push_notification_service.dart';
import 'services/review_prompt_store.dart';
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
    InterstitialAdGateway? interstitialAdGateway,
    LogMyPlateAnalytics? analytics,
    ReviewPromptStore? reviewPromptStore,
    InterstitialAdStore? interstitialAdStore,
    AppBuildInfoStore? appBuildInfoStore,
    PushNotificationRegistrar? pushNotificationRegistrar,
  }) : _authController = authController,
       _journalController = journalController,
       _rewardedAdGateway = rewardedAdGateway,
       _interstitialAdGateway = interstitialAdGateway,
       _analytics = analytics,
       _reviewPromptStore = reviewPromptStore,
       _interstitialAdStore = interstitialAdStore,
       _appBuildInfoStore = appBuildInfoStore,
       _pushNotificationRegistrar = pushNotificationRegistrar;

  final AuthController? _authController;
  final JournalController? _journalController;
  final RewardedAdGateway? _rewardedAdGateway;
  final InterstitialAdGateway? _interstitialAdGateway;
  final LogMyPlateAnalytics? _analytics;
  final ReviewPromptStore? _reviewPromptStore;
  final InterstitialAdStore? _interstitialAdStore;
  final AppBuildInfoStore? _appBuildInfoStore;
  final PushNotificationRegistrar? _pushNotificationRegistrar;

  @override
  State<LogMyPlateApp> createState() => _LogMyPlateAppState();
}

class _LogMyPlateAppState extends State<LogMyPlateApp> {
  static const _hasSeenWelcomeKey = 'logmyplate.has_seen_welcome';
  static const _themeModeKey = 'logmyplate.theme_mode';

  final _navigatorKey = GlobalKey<NavigatorState>();
  late final AuthController _authController =
      widget._authController ?? AuthController();
  late final LogMyPlateAnalytics _analytics =
      widget._analytics ?? LogMyPlateFirebaseAnalytics();
  late final JournalController _journalController =
      widget._journalController ?? JournalController(analytics: _analytics);
  late final RewardedAdGateway _rewardedAds =
      widget._rewardedAdGateway ?? GoogleRewardedAdService();
  late final InterstitialAdGateway _interstitialAds =
      widget._interstitialAdGateway ?? GoogleInterstitialAdService();
  late final ReviewPromptStore _reviewPromptStore =
      widget._reviewPromptStore ?? ReviewPromptStore();
  late final InterstitialAdStore _interstitialAdStore =
      widget._interstitialAdStore ?? InterstitialAdStore();
  late final AppBuildInfoStore _appBuildInfoStore =
      widget._appBuildInfoStore ?? AppBuildInfoStore();
  late final PushNotificationRegistrar _pushNotifications =
      widget._pushNotificationRegistrar ?? FirebasePushNotificationRegistrar();
  late final platform_links.AppLinks _incomingLinks = platform_links.AppLinks();
  StreamSubscription<Uri>? _incomingLinkSubscription;
  ThemeMode _themeMode = ThemeMode.dark;
  bool _hasSeenWelcome = false;
  bool _welcomeStateLoaded = false;
  bool _appInitialized = false;
  bool _openingDeleteAccountLink = false;
  int _selectedTab = 0;
  bool _openingWeeklyJournal = false;
  bool _openingHealthTargetSetup = false;
  bool _loadingJournalTab = false;
  String? _dismissedOptionalUpdateKey;
  String? _journalTabError;
  JournalRangeData? _journalTabRange;

  @override
  void initState() {
    super.initState();
    _authController.addListener(_handleAccessStateChanged);
    _journalController.addListener(_handleAccessStateChanged);
    _initializeApp();
    _initializeDeepLinks();
  }

  @override
  void dispose() {
    _incomingLinkSubscription?.cancel();
    _authController.removeListener(_handleAccessStateChanged);
    _journalController.removeListener(_handleAccessStateChanged);
    _rewardedAds.dispose();
    _interstitialAds.dispose();
    _pushNotifications.dispose();
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
      builder: (context, child) {
        final content = _KeyboardDismissScope(
          child: child ?? const SizedBox.shrink(),
        );
        return AnimatedBuilder(
          animation: _journalController,
          builder: (context, _) => _AppUpdateGate(
            policy: _journalController.updatePolicy,
            dismissedOptionalKey: _dismissedOptionalUpdateKey,
            onDismissOptional: (key) {
              if (!mounted) return;
              setState(() => _dismissedOptionalUpdateKey = key);
            },
            child: content,
          ),
        );
      },
      home: !_welcomeStateLoaded
          ? const _LaunchScreen()
          : _hasSeenWelcome
          ? _mainShell()
          : WelcomeScreen(onStart: _startFromWelcome),
    );
  }

  Future<void> _initializeApp() async {
    await _analytics.initialize();
    await _loadLocalPreferences();
    await _authController.load();
    if (_authController.isSignedIn && !_hasSeenWelcome) {
      await _markWelcomeSeen();
    }
    await _journalController.loadToday();
    unawaited(_syncPushNotifications());
    unawaited(
      _analytics.logEvent(
        'app_open',
        parameters: {
          'auth_method': _journalController.lastLoadedAt == null
              ? 'unknown'
              : _authController.session == null
              ? 'anonymous'
              : _authController.session!.provider.name,
          'has_seen_welcome': _hasSeenWelcome,
          'theme_mode': _themeMode.name,
        },
        oncePerSession: true,
      ),
    );
    _handleAccessStateChanged();
    if (mounted) setState(() => _appInitialized = true);
  }

  void _initializeDeepLinks() {
    try {
      _incomingLinkSubscription = _incomingLinks.uriLinkStream.listen(
        _handleIncomingLink,
        onError: (_) {},
      );
      unawaited(_handleInitialLink());
    } catch (_) {
      // Deep links are best-effort; normal app launch should continue even
      // when a platform does not expose link delivery in tests or previews.
    }
  }

  Future<void> _handleInitialLink() async {
    try {
      final uri = await _incomingLinks.getInitialLink();
      if (uri != null) await _handleIncomingLink(uri);
    } catch (_) {}
  }

  Future<void> _handleIncomingLink(Uri uri) async {
    final link = parseLogMyPlateDeepLink(uri);
    if (link == LogMyPlateDeepLink.deleteAccount) {
      await _openAccountDeletionFromLink();
    }
  }

  Widget _mainShell() {
    return AnimatedBuilder(
      animation: _authController,
      builder: (context, _) {
        return AnimatedBuilder(
          animation: _journalController,
          builder: (context, _) {
            return LayoutBuilder(
              builder: (context, constraints) {
                final useTabletLayout = _LogMyPlateShell.useTabletLayoutFor(
                  constraints,
                );
                final shellBottomPadding = useTabletLayout ? 32.0 : 144.0;

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
                          bottomPadding: shellBottomPadding,
                        )
                      : _selectedTab == 1
                      ? _journalTabScreen(bottomPadding: shellBottomPadding)
                      : ProfileScreen(
                          themeMode: _themeMode,
                          session: _authController.session,
                          bottomPadding: useTabletLayout ? 32 : 188,
                          onThemeChanged: _setThemeMode,
                          onOpenAccount: _openProfileAccount,
                          onDeleteAccount: _deleteProfileFromAccount,
                          onSignOut: _signOutFromProfile,
                        ),
                );
              },
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
          streakSummary: _journalController.streakSummary,
          loading: _journalController.loading,
          initialLoading: _journalController.initialLoading,
          weeklyJournalOpening: _openingWeeklyJournal,
          showScanAction: showScanAction,
          showSettingsAction: showSettingsAction,
          bottomPadding: bottomPadding,
          syncMessage: _journalController.error,
          onRefresh: _refreshToday,
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

  Widget _journalTabScreen({double bottomPadding = 144}) {
    final range = _journalTabRange;
    if (range == null) {
      return _JournalTabLoadingScreen(
        loading: _loadingJournalTab,
        message: _journalTabError,
        bottomPadding: bottomPadding,
        onRetry: () => _loadJournalTab(force: true),
      );
    }

    return WeeklyJournalScreen(
      range: range,
      showBackButton: false,
      bottomPadding: bottomPadding,
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
    unawaited(
      _analytics.logEvent(
        'tab_selected',
        parameters: {'tab_index': index, 'tab': _tabName(index)},
      ),
    );
    if (index == 1) unawaited(_loadJournalTab());
  }

  String _tabName(int index) {
    return switch (index) {
      0 => 'today',
      1 => 'journal',
      2 => 'profile',
      _ => 'unknown',
    };
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

  Future<void> _refreshToday() async {
    await _journalController.loadToday();
    unawaited(_syncPushNotifications());
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
          initialItems: const [],
          initialMealType: mealTypeForLocalTime(DateTime.now()),
          onConfirm: _saveMeal,
        ),
      ),
    );
  }

  Future<void> _saveMeal(MealType type, List<MealItem> items) async {
    final meal = await _journalController.saveMeal(type, items);
    setState(() {
      _journalTabRange = null;
      _selectedTab = 0;
    });
    unawaited(_syncPushNotifications());
    _replaceCurrentRouteWithMealDetail(meal);
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
    final meal = await _journalController.confirmAnalyzedMeal(
      scanId: scanId,
      title: title,
      type: type,
      items: items,
      photo: photo,
    );
    setState(() {
      _journalTabRange = null;
      _selectedTab = 0;
    });
    unawaited(_syncPushNotifications());
    _replaceCurrentRouteWithMealDetail(meal);
    _showJournalNotice(
      tone: LogMyPlateNoticeTone.success,
      title: 'Scan saved',
      message: 'Your meal log is ready.',
    );
    unawaited(_runPostConfirmGrowthPrompts());
  }

  Future<void> _runPostConfirmGrowthPrompts() async {
    final reviewPromptShown = await _maybeShowReviewPromptAfterConfirmedScan();
    if (reviewPromptShown) return;
    await _maybeShowInterstitialAfterConfirmedScan();
  }

  Future<bool> _maybeShowReviewPromptAfterConfirmedScan() async {
    try {
      final now = DateTime.now();
      final stats = await _reviewPromptStore.recordConfirmedScan(now: now);
      final policy = _journalController.engagementPolicy.reviewPrompt;
      if (!policy.enabled) return false;

      final appBuild = await _appBuildInfoStore.load();
      final appVersionKey = _reviewPromptVersionKey(appBuild);
      if (!stats.isEligible(
        policy: policy,
        appVersionKey: appVersionKey,
        now: now,
      )) {
        return false;
      }

      final storeUrl = _reviewPromptStoreUrl(policy);
      if (storeUrl == null) return false;

      await _reviewPromptStore.markPromptShown(
        appVersionKey: appVersionKey,
        now: now,
      );
      await Future<void>.delayed(const Duration(milliseconds: 700));
      if (!mounted) return false;

      final context = _navigatorKey.currentContext;
      if (context == null || !context.mounted) return false;
      final accepted = await showModalBottomSheet<bool>(
        context: context,
        backgroundColor: Colors.transparent,
        builder: (_) => _ReviewPromptSheet(policy: policy),
      );
      if (accepted != true || !context.mounted) return true;

      await openLogMyPlateLink(
        context,
        storeUrl,
        copiedMessage: 'Store link copied',
      );
      return true;
    } catch (error, stackTrace) {
      AppDiagnostics.instance.record(
        'review_prompt.after_scan_confirm',
        error,
        stackTrace: stackTrace,
      );
      return false;
    }
  }

  Future<void> _maybeShowInterstitialAfterConfirmedScan() async {
    try {
      final now = DateTime.now();
      final stats = await _interstitialAdStore.recordConfirmedScan(now: now);
      final policy = _journalController.engagementPolicy.interstitialAds;
      if (!policy.enabled) return;

      final quota = _journalController.quota;
      final isPremiumUser = (quota?.premiumRemaining ?? 0) > 0;
      if (!stats.isEligible(
        policy: policy,
        isPremiumUser: isPremiumUser,
        now: now,
      )) {
        return;
      }

      final adUnitId = _interstitialAdUnitId(policy);
      if (adUnitId.isEmpty) return;

      await Future<void>.delayed(const Duration(milliseconds: 1000));
      if (!mounted) return;

      final outcome = await _interstitialAds.showPostConfirmAd(
        adUnitId: adUnitId,
      );
      if (!outcome.shown) return;

      await _interstitialAdStore.markShown(
        confirmedScanCount: stats.confirmedScans,
        now: DateTime.now(),
      );
    } catch (error, stackTrace) {
      AppDiagnostics.instance.record(
        'interstitial_ad.after_scan_confirm',
        error,
        stackTrace: stackTrace,
      );
    }
  }

  String _reviewPromptVersionKey(AppBuildInfo appBuild) {
    final version = appBuild.version.trim();
    final build = appBuild.buildNumber.trim();
    if (version.isEmpty && build.isEmpty) return '';
    if (build.isEmpty) return version;
    if (version.isEmpty) return build;
    return '$version+$build';
  }

  Uri? _reviewPromptStoreUrl(EngagementReviewPromptPolicy policy) {
    final url = defaultTargetPlatform == TargetPlatform.android
        ? policy.storeUrls.android
        : policy.storeUrls.ios;
    if (url == null || url.trim().isEmpty) return null;
    return Uri.tryParse(url.trim());
  }

  String _interstitialAdUnitId(EngagementInterstitialAdsPolicy policy) {
    final configured = defaultTargetPlatform == TargetPlatform.android
        ? policy.adUnitIds.android
        : policy.adUnitIds.ios;
    final configuredAdUnitId = configured?.trim() ?? '';
    if (configuredAdUnitId.isNotEmpty) return configuredAdUnitId;
    return LogMyPlateAdConfig.interstitialAdUnitId;
  }

  void _replaceCurrentRouteWithMealDetail(MealLog meal) {
    final navigator = _navigatorKey.currentState;
    if (navigator == null) return;

    unawaited(
      navigator.pushReplacement<bool, void>(
        logmyplatePageRoute<bool>(
          builder: (_) => MealDetailScreen(
            meal: meal,
            onUpdateMeal: _updateMeal,
            onDeleteMeal: _deleteMeal,
          ),
        ),
      ),
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
        return _watchRewardedAdForScanUnlock();
      } else if (action == _NoScanCreditsAction.addManually) {
        await _openManualReview();
      } else if (action == _NoScanCreditsAction.refresh) {
        await _journalController.loadToday();
        unawaited(_syncPushNotifications());
        if ((_journalController.quota?.totalRemaining ?? 0) > 0) return true;
      }
      break;
    }

    return false;
  }

  Future<bool> _watchRewardedAdForScanUnlock() async {
    final progress = _journalController.rewardedAdProgress;
    if (progress.dailyLimitReached) return false;

    _showJournalNotice(
      tone: LogMyPlateNoticeTone.info,
      title: 'Preparing ad',
      message: 'Complete the rewarded ad to unlock 1 scan.',
    );

    final verificationToken = _newRewardedAdVerificationToken();
    final outcome = await _showScanUnlockAdWithLoader(
      verificationToken: verificationToken,
      serverSideUserId: _authController.session?.profileId,
    );
    if (!outcome.earnedReward) {
      unawaited(
        _analytics.logEvent(
          'rewarded_ad_failed',
          parameters: {'reason': outcome.errorMessage ?? 'not_completed'},
        ),
      );
      _showJournalNotice(
        tone: LogMyPlateNoticeTone.warning,
        title: 'Ad not completed',
        message: outcome.errorMessage ?? 'Watch a full ad to earn progress.',
      );
      return false;
    }

    try {
      final reward = await _completeRewardedAdWithVerificationRetry(
        adUnitId: outcome.adUnitId,
        idempotencyKey: 'rewarded-ad-$verificationToken',
        verificationToken: verificationToken,
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

      _showJournalNotice(
        tone: LogMyPlateNoticeTone.warning,
        title: 'Scan not unlocked',
        message: reward.scansGrantedToday >= reward.dailyScanLimit
            ? 'Today\'s ad unlock limit has been reached.'
            : 'The ad was completed, but no scan credit was granted.',
      );
      return false;
    } catch (error) {
      unawaited(
        _analytics.logEvent(
          'rewarded_ad_failed',
          parameters: {
            'reason': error is LogMyPlateApiException
                ? error.errorCode ?? 'api_error'
                : error.runtimeType.toString(),
          },
        ),
      );
      if (error is LogMyPlateApiException &&
          error.errorCode == 'rewarded_ad_verification_pending') {
        _showJournalNotice(
          tone: LogMyPlateNoticeTone.warning,
          title: 'Verification delayed',
          message:
              'The ad was watched, but Google verification is still pending.',
        );
        return false;
      }

      _showJournalNotice(
        tone: LogMyPlateNoticeTone.error,
        title: 'Unlock sync failed',
        message: 'Ad was watched, but the scan could not be credited.',
      );
      return false;
    }
  }

  Future<RewardedAdCredit> _completeRewardedAdWithVerificationRetry({
    required String adUnitId,
    required String idempotencyKey,
    required String verificationToken,
    String? rewardType,
    int? rewardAmount,
  }) async {
    const retryDelays = [
      Duration(milliseconds: 700),
      Duration(milliseconds: 1200),
      Duration(milliseconds: 1800),
      Duration(milliseconds: 2500),
    ];

    for (var attempt = 0; attempt <= retryDelays.length; attempt += 1) {
      try {
        return await _journalController.completeRewardedAd(
          adUnitId: adUnitId,
          idempotencyKey: idempotencyKey,
          verificationToken: verificationToken,
          rewardType: rewardType,
          rewardAmount: rewardAmount,
        );
      } catch (error) {
        final pendingVerification =
            error is LogMyPlateApiException &&
            error.errorCode == 'rewarded_ad_verification_pending';
        if (!pendingVerification || attempt == retryDelays.length) rethrow;

        if (attempt == 0) {
          _showJournalNotice(
            tone: LogMyPlateNoticeTone.info,
            title: 'Verifying ad',
            message: 'Finishing the rewarded scan unlock now.',
          );
        }
        await Future<void>.delayed(retryDelays[attempt]);
      }
    }

    throw StateError('Rewarded ad verification retry loop exhausted.');
  }

  Future<RewardedAdOutcome> _showScanUnlockAdWithLoader({
    required String verificationToken,
    String? serverSideUserId,
  }) async {
    final context = _navigatorKey.currentContext;
    final overlay = context == null || !context.mounted
        ? null
        : Overlay.maybeOf(context, rootOverlay: true);
    OverlayEntry? loader;

    void hideLoader() {
      loader?.remove();
      loader = null;
    }

    if (overlay != null) {
      loader = OverlayEntry(builder: (_) => const _RewardedAdLoadingOverlay());
      overlay.insert(loader!);
    }

    try {
      unawaited(
        _analytics.logEvent(
          'rewarded_ad_started',
          parameters: {'placement': 'scan_unlock'},
        ),
      );
      return await _rewardedAds.showScanUnlockAd(
        onAdShowed: hideLoader,
        serverSideUserId: serverSideUserId,
        verificationToken: verificationToken,
      );
    } finally {
      hideLoader();
    }
  }

  String _newRewardedAdVerificationToken() {
    final random = Random.secure();
    final bytes = List<int>.generate(24, (_) => random.nextInt(256));
    return base64UrlEncode(bytes).replaceAll('=', '');
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

  Future<AuthSession?> _openAccountHome(
    AccountGateReason reason, {
    bool promptForHealthTarget = true,
  }) async {
    final existing = _authController.session;
    if (existing != null) {
      setState(() => _selectedTab = 2);
      return existing;
    }

    final session = await _openAccountGate(reason);
    if (session != null) {
      unawaited(
        _analytics.logEvent(
          'account_linked',
          parameters: {
            'reason': reason.name,
            'provider': session.provider.name,
          },
        ),
      );
      await _markWelcomeSeen();
      _journalController.resetForAccountChange();
      setState(() {
        _selectedTab = 0;
        _journalTabRange = null;
      });
      _navigatorKey.currentState!.popUntil((route) => route.isFirst);
      await _journalController.loadToday();
      unawaited(_syncPushNotifications());
      if (promptForHealthTarget) await _promptForHealthTargetIfNeeded();
    }
    return session;
  }

  Future<void> _openAccountDeletionFromLink() async {
    if (_openingDeleteAccountLink) return;

    _openingDeleteAccountLink = true;
    try {
      await _waitForNavigationReady();
      if (!mounted) return;

      if (!_hasSeenWelcome) await _markWelcomeSeen();

      var session = _authController.session;
      if (session == null) {
        session = await _openAccountHome(
          AccountGateReason.accountDeletion,
          promptForHealthTarget: false,
        );
        if (session == null || !mounted) return;
      }

      final navigator = _navigatorKey.currentState;
      navigator?.popUntil((route) => route.isFirst);
      if (!mounted) return;

      setState(() => _selectedTab = 2);
      await WidgetsBinding.instance.endOfFrame;
      if (!mounted) return;

      final context = _navigatorKey.currentContext;
      if (context == null || !context.mounted) return;
      final confirmed = await showModalBottomSheet<bool>(
        context: context,
        isScrollControlled: true,
        backgroundColor: Colors.transparent,
        builder: (_) => const DeleteAccountSheet(),
      );
      if (confirmed == true && mounted) {
        await _deleteProfileFromAccount();
      }
    } finally {
      _openingDeleteAccountLink = false;
    }
  }

  Future<void> _waitForNavigationReady() async {
    while (mounted &&
        (!_appInitialized || _navigatorKey.currentState == null)) {
      await Future<void>.delayed(const Duration(milliseconds: 40));
    }
    await WidgetsBinding.instance.endOfFrame;
  }

  Future<void> _openProfileAccount() async {
    final existing = _authController.session;
    if (existing == null) {
      await _openAccountHome(AccountGateReason.saveJournal);
      return;
    }

    await _navigatorKey.currentState!.push<void>(
      logmyplatePageRoute<void>(
        builder: (_) => AnimatedBuilder(
          animation: _authController,
          builder: (context, _) {
            final session = _authController.session ?? existing;
            return AccountProfileScreen(
              session: session,
              loading: _authController.loading,
              error: _authController.error,
              onClearError: _authController.clearError,
              onSignOut: () async {
                await _signOutFromProfile();
                return true;
              },
              onDeactivateProfile: _deactivateProfileFromAccount,
              onDeleteProfile: _deleteProfileFromAccount,
            );
          },
        ),
      ),
    );
  }

  Future<bool> _deactivateProfileFromAccount() async {
    final completed = await _authController.deactivateProfile();
    if (!completed) return false;
    await _finishAccountLifecycle(
      title: 'Profile deactivated',
      message: 'You can continue anonymously.',
    );
    return true;
  }

  Future<bool> _deleteProfileFromAccount() async {
    final completed = await _authController.deleteProfile();
    if (!completed) return false;
    await _finishAccountLifecycle(
      title: 'Account deleted',
      message: 'Your account, journal, saved photos, and targets were deleted.',
    );
    return true;
  }

  Future<void> _finishAccountLifecycle({
    required String title,
    required String message,
  }) async {
    await _markWelcomeSeen();
    _journalController.resetForAccountChange();
    setState(() {
      _selectedTab = 0;
      _journalTabRange = null;
    });
    _navigatorKey.currentState?.popUntil((route) => route.isFirst);
    await _journalController.loadToday();
    unawaited(_syncPushNotifications());
    _showJournalNotice(
      tone: LogMyPlateNoticeTone.success,
      title: title,
      message: message,
    );
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
        unawaited(_syncPushNotifications());
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
    unawaited(
      _analytics.logEvent(
        'account_gate_shown',
        parameters: {'reason': reason.name},
      ),
    );
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
              onPasswordResetRequest: (email) {
                return _authController.requestPasswordReset(email: email);
              },
              onPasswordResetConfirm: (email, code, password) {
                return _authController.confirmPasswordReset(
                  email: email,
                  code: code,
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
    unawaited(_syncPushNotifications());
  }

  Future<bool> _openMealDetail(MealLog meal) async {
    final deleted = await _navigatorKey.currentState!.push<bool>(
      logmyplatePageRoute<bool>(
        builder: (_) => MealDetailScreen(
          meal: meal,
          onUpdateMeal: _updateMeal,
          onDeleteMeal: _deleteMeal,
        ),
      ),
    );
    return deleted == true;
  }

  Future<void> _deleteMeal(MealLog meal) async {
    await _journalController.deleteMeal(meal);
    _journalTabRange = null;
    unawaited(_syncPushNotifications());
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
            onRefresh: _refreshToday,
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

  Future<MealLog> _updateMeal(MealLog meal, List<MealItem> items) async {
    final updated = await _journalController.updateMeal(meal, items);
    _journalTabRange = null;
    unawaited(_syncPushNotifications());
    return updated;
  }

  Future<void> _syncPushNotifications() async {
    try {
      await _pushNotifications.sync(
        _journalController.engagementPolicy.notifications,
      );
    } catch (error, stackTrace) {
      AppDiagnostics.instance.record(
        'push_notifications.sync',
        error,
        stackTrace: stackTrace,
      );
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

class _KeyboardDismissScope extends StatelessWidget {
  const _KeyboardDismissScope({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      behavior: HitTestBehavior.translucent,
      onTap: () => FocusManager.instance.primaryFocus?.unfocus(),
      child: child,
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

  static const _tabletShortestSideBreakpoint = 600.0;
  static const _tabletContentMaxWidth = 760.0;

  static bool useTabletLayoutFor(BoxConstraints constraints) {
    return constraints.biggest.shortestSide >= _tabletShortestSideBreakpoint;
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;

    return LayoutBuilder(
      builder: (context, constraints) {
        final useTabletLayout = useTabletLayoutFor(constraints);

        if (useTabletLayout) {
          return Scaffold(
            backgroundColor: colors.background,
            body: SafeArea(
              child: Row(
                children: [
                  _ShellSideRail(
                    selectedIndex: selectedIndex,
                    onSelect: onSelect,
                    onScan: onScan,
                    onTarget: onTarget,
                    scanPulsing: scanPulsing,
                  ),
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: LayoutBuilder(
                        builder: (context, contentConstraints) {
                          final contentWidth = min(
                            contentConstraints.maxWidth,
                            _tabletContentMaxWidth,
                          );

                          return Center(
                            child: SizedBox(
                              width: contentWidth,
                              height: contentConstraints.maxHeight,
                              child: _AnimatedShellContent(
                                selectedIndex: selectedIndex,
                                child: child,
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                  ),
                ],
              ),
            ),
          );
        }

        return Scaffold(
          body: Stack(
            children: [
              Positioned.fill(
                child: _AnimatedShellContent(
                  selectedIndex: selectedIndex,
                  child: child,
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
      },
    );
  }
}

class _AnimatedShellContent extends StatelessWidget {
  const _AnimatedShellContent({
    required this.selectedIndex,
    required this.child,
  });

  final int selectedIndex;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 240),
      transitionBuilder: (child, animation) {
        final slide =
            Tween<Offset>(
              begin: const Offset(0.03, 0),
              end: Offset.zero,
            ).animate(
              CurvedAnimation(parent: animation, curve: Curves.easeOutCubic),
            );
        return FadeTransition(
          opacity: animation,
          child: SlideTransition(position: slide, child: child),
        );
      },
      child: KeyedSubtree(key: ValueKey<int>(selectedIndex), child: child),
    );
  }
}

class _ShellSideRail extends StatelessWidget {
  const _ShellSideRail({
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

    return Material(
      color: colors.surfaceCard.withValues(alpha: 0.82),
      child: Container(
        width: 104,
        padding: const EdgeInsets.fromLTRB(10, 14, 10, 14),
        decoration: BoxDecoration(
          border: Border(right: BorderSide(color: colors.border, width: 0.6)),
        ),
        child: Column(
          children: [
            const Spacer(),
            _ShellRailButton(
              label: 'Today',
              icon: Icons.home_rounded,
              selected: selectedIndex == 0,
              onTap: () => onSelect(0),
            ),
            const SizedBox(height: 8),
            _ShellRailButton(
              label: 'Journal',
              icon: Icons.calendar_month_rounded,
              selected: selectedIndex == 1,
              onTap: () => onSelect(1),
            ),
            const SizedBox(height: 10),
            _ShellRailScanButton(onTap: onScan, pulsing: scanPulsing),
            const SizedBox(height: 10),
            _ShellRailButton(
              label: 'Target',
              icon: Icons.track_changes_rounded,
              selected: false,
              onTap: onTarget,
            ),
            const SizedBox(height: 8),
            _ShellRailButton(
              label: 'Profile',
              icon: Icons.person_rounded,
              selected: selectedIndex == 2,
              onTap: () => onSelect(2),
            ),
            const Spacer(),
          ],
        ),
      ),
    );
  }
}

class _ShellRailButton extends StatelessWidget {
  const _ShellRailButton({
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

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(18),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 10),
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
              size: 21,
              color: selected ? colors.accentText : colors.textSecondary,
            ),
            const SizedBox(height: 4),
            Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                color: selected ? colors.accentText : colors.textSecondary,
                letterSpacing: 0,
                fontSize: 11,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ShellRailScanButton extends StatelessWidget {
  const _ShellRailScanButton({required this.onTap, required this.pulsing});

  final VoidCallback onTap;
  final bool pulsing;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;

    return InkWell(
      key: const ValueKey('shell-scan-action'),
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: LogMyPlateColors.accent.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: LogMyPlateColors.accent.withValues(alpha: 0.28),
            width: 0.6,
          ),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Stack(
              alignment: Alignment.center,
              children: [
                if (pulsing)
                  Container(
                    width: 52,
                    height: 52,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: LogMyPlateColors.accent.withValues(alpha: 0.22),
                      ),
                    ),
                  ),
                Container(
                  width: 46,
                  height: 46,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: const LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [Color(0xFFFFE3A3), LogMyPlateColors.accent],
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: LogMyPlateColors.accent.withValues(alpha: 0.20),
                        blurRadius: 18,
                        offset: const Offset(0, 8),
                      ),
                    ],
                  ),
                  child: Center(
                    child: PrimitiveCameraIcon(
                      color: colors.accentOn,
                      size: 22,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 5),
            Text(
              'Scan',
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                color: colors.accentText,
                letterSpacing: 0,
                fontSize: 11,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
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
    required this.bottomPadding,
    required this.onRetry,
  });

  final bool loading;
  final String? message;
  final double bottomPadding;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: EdgeInsets.fromLTRB(16, 18, 16, bottomPadding),
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

class _ReviewPromptSheet extends StatelessWidget {
  const _ReviewPromptSheet({required this.policy});

  final EngagementReviewPromptPolicy policy;

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
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.18),
              blurRadius: 24,
              offset: const Offset(0, 14),
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 42,
                  height: 42,
                  decoration: BoxDecoration(
                    color: LogMyPlateColors.accent.withValues(alpha: 0.16),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    Icons.favorite_rounded,
                    color: colors.accentText,
                    size: 21,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        policy.copy.title,
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      const SizedBox(height: 6),
                      Text(
                        policy.copy.body,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: colors.textSecondary,
                          height: 1.38,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 18),
            FilledButton(
              onPressed: () => Navigator.of(context).pop(true),
              style: FilledButton.styleFrom(
                backgroundColor: colors.primaryAction,
                foregroundColor: colors.primaryActionText,
                padding: const EdgeInsets.symmetric(vertical: 15),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
              child: Text(policy.copy.positiveLabel),
            ),
            const SizedBox(height: 8),
            TextButton(
              onPressed: () => Navigator.of(context).pop(false),
              child: Text(policy.copy.negativeLabel),
            ),
          ],
        ),
      ),
    );
  }
}

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
    final usesSingleAd = progress.adsPerScan <= 1;
    final title = usesSingleAd || adsNeeded != 1
        ? 'No scans left'
        : 'Almost there';
    final description = progress.dailyLimitReached
        ? 'You have reached today\'s ad unlock limit. Add this meal manually or refresh later.'
        : usesSingleAd
        ? 'Watch one rewarded ad to unlock 1 scan. You can unlock up to ${progress.dailyScanLimit} scans per day.'
        : adsNeeded == 1
        ? 'Watch 1 more rewarded ad to unlock 1 scan.'
        : 'Watch $adsNeeded rewarded ads to unlock 1 scan. You can unlock up to ${progress.dailyScanLimit} scans per day.';
    final buttonLabel = usesSingleAd
        ? 'Watch ad'
        : adsNeeded == 1
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
              if (!progress.dailyLimitReached && !usesSingleAd) ...[
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

class _RewardedAdLoadingOverlay extends StatelessWidget {
  const _RewardedAdLoadingOverlay();

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;

    return Positioned.fill(
      child: Material(
        color: Colors.black.withValues(alpha: 0.42),
        child: Center(
          child: DecoratedBox(
            decoration: BoxDecoration(
              color: colors.surfaceCard,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: colors.border),
            ),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 18),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  SizedBox(
                    width: 26,
                    height: 26,
                    child: CircularProgressIndicator(
                      strokeWidth: 2.6,
                      color: colors.primaryAction,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Loading rewarded ad',
                    style: Theme.of(context).textTheme.titleSmall,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Your scan unlock starts after the ad completes.',
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: colors.textSecondary,
                      height: 1.35,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _AppUpdateGate extends StatelessWidget {
  const _AppUpdateGate({
    required this.policy,
    required this.dismissedOptionalKey,
    required this.onDismissOptional,
    required this.child,
  });

  final AppUpdatePolicy policy;
  final String? dismissedOptionalKey;
  final ValueChanged<String> onDismissOptional;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final shouldShow =
        policy.isPromptable &&
        (policy.isMandatory || dismissedOptionalKey != policy.promptKey);

    return Stack(
      children: [
        child,
        if (shouldShow)
          Positioned.fill(
            child: PopScope(
              canPop: !policy.isMandatory,
              child: _AppUpdateOverlay(
                policy: policy,
                onDismissOptional: () => onDismissOptional(policy.promptKey),
              ),
            ),
          ),
      ],
    );
  }
}

class _AppUpdateOverlay extends StatelessWidget {
  const _AppUpdateOverlay({
    required this.policy,
    required this.onDismissOptional,
  });

  final AppUpdatePolicy policy;
  final VoidCallback onDismissOptional;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;
    final storeUrl = policy.storeUrl == null
        ? null
        : Uri.tryParse(policy.storeUrl!);

    return Material(
      color: Colors.black.withValues(alpha: 0.54),
      child: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 420),
            child: Container(
              margin: const EdgeInsets.all(20),
              padding: const EdgeInsets.fromLTRB(22, 22, 22, 18),
              decoration: BoxDecoration(
                color: colors.surfaceCard,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: colors.border),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.18),
                    blurRadius: 28,
                    offset: const Offset(0, 18),
                  ),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          color: LogMyPlateColors.accent.withValues(
                            alpha: 0.16,
                          ),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          policy.isMandatory
                              ? Icons.system_update_alt_rounded
                              : Icons.new_releases_rounded,
                          color: colors.accentText,
                          size: 22,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              policy.displayTitle,
                              style: Theme.of(context).textTheme.titleLarge,
                            ),
                            if (policy.latestVersion != null) ...[
                              const SizedBox(height: 2),
                              Text(
                                'Version ${policy.latestVersion}',
                                style: Theme.of(context).textTheme.bodySmall
                                    ?.copyWith(color: colors.textSecondary),
                              ),
                            ],
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  Text(
                    policy.displayMessage,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: colors.textSecondary,
                      height: 1.42,
                    ),
                  ),
                  const SizedBox(height: 18),
                  FilledButton.icon(
                    onPressed: storeUrl == null
                        ? null
                        : () => openLogMyPlateLink(
                            context,
                            storeUrl,
                            copiedMessage: 'Store link copied',
                          ),
                    icon: const Icon(Icons.open_in_new_rounded, size: 18),
                    label: const Text('Update app'),
                    style: FilledButton.styleFrom(
                      backgroundColor: colors.primaryAction,
                      foregroundColor: colors.primaryActionText,
                      padding: const EdgeInsets.symmetric(vertical: 15),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                    ),
                  ),
                  if (!policy.isMandatory) ...[
                    const SizedBox(height: 8),
                    TextButton(
                      onPressed: onDismissOptional,
                      child: const Text('Later'),
                    ),
                  ],
                ],
              ),
            ),
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
