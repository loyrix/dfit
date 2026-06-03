import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';

import 'app_diagnostics.dart';

abstract class RewardedAdGateway {
  Future<RewardedAdOutcome> showScanUnlockAd({
    VoidCallback? onAdShowed,
    String? serverSideUserId,
    String? verificationToken,
  });
  void dispose();
}

abstract class InterstitialAdGateway {
  Future<InterstitialAdOutcome> showPostConfirmAd({
    required String adUnitId,
    VoidCallback? onAdShowed,
  });
  void dispose();
}

class RewardedAdOutcome {
  const RewardedAdOutcome({
    required this.earnedReward,
    required this.adUnitId,
    this.rewardType,
    this.rewardAmount,
    this.errorMessage,
  });

  final bool earnedReward;
  final String adUnitId;
  final String? rewardType;
  final int? rewardAmount;
  final String? errorMessage;
}

class InterstitialAdOutcome {
  const InterstitialAdOutcome({
    required this.shown,
    required this.adUnitId,
    this.errorMessage,
  });

  final bool shown;
  final String adUnitId;
  final String? errorMessage;
}

class GoogleRewardedAdService implements RewardedAdGateway {
  RewardedAd? _loadedAd;
  Future<RewardedAd?>? _loadingAd;

  @override
  Future<RewardedAdOutcome> showScanUnlockAd({
    VoidCallback? onAdShowed,
    String? serverSideUserId,
    String? verificationToken,
  }) async {
    final adUnitId = LogMyPlateAdConfig.rewardedAdUnitId;
    final ad = _loadedAd ?? await _loadAd(adUnitId);
    _loadedAd = null;

    if (ad == null) {
      unawaited(_loadAd(adUnitId));
      return RewardedAdOutcome(
        earnedReward: false,
        adUnitId: adUnitId,
        errorMessage: 'Ad is not ready. Please try again.',
      );
    }

    final completer = Completer<RewardedAdOutcome>();
    var earnedReward = false;
    String? rewardType;
    int? rewardAmount;

    final ssvUserId = serverSideUserId?.trim();
    final ssvCustomData = verificationToken?.trim();
    if ((ssvUserId?.isNotEmpty ?? false) ||
        (ssvCustomData?.isNotEmpty ?? false)) {
      try {
        await ad.setServerSideOptions(
          ServerSideVerificationOptions(
            userId: (ssvUserId?.isNotEmpty ?? false) ? ssvUserId : null,
            customData: (ssvCustomData?.isNotEmpty ?? false)
                ? ssvCustomData
                : null,
          ),
        );
      } catch (error, stackTrace) {
        ad.dispose();
        unawaited(_loadAd(adUnitId));
        AppDiagnostics.instance.record(
          'ads.rewarded.ssv_options_failed',
          error,
          stackTrace: stackTrace,
        );
        return RewardedAdOutcome(
          earnedReward: false,
          adUnitId: adUnitId,
          errorMessage: 'Could not prepare ad verification. Please try again.',
        );
      }
    }

    ad.fullScreenContentCallback = FullScreenContentCallback(
      onAdShowedFullScreenContent: (_) => onAdShowed?.call(),
      onAdDismissedFullScreenContent: (ad) {
        ad.dispose();
        unawaited(_loadAd(adUnitId));
        if (!completer.isCompleted) {
          completer.complete(
            RewardedAdOutcome(
              earnedReward: earnedReward,
              adUnitId: adUnitId,
              rewardType: rewardType,
              rewardAmount: rewardAmount,
              errorMessage: earnedReward
                  ? null
                  : 'Ad was closed before reward.',
            ),
          );
        }
      },
      onAdFailedToShowFullScreenContent: (ad, error) {
        ad.dispose();
        unawaited(_loadAd(adUnitId));
        AppDiagnostics.instance.record(
          'ads.rewarded.show_failed',
          error,
          context: {'code': error.code, 'message': error.message},
        );
        if (!completer.isCompleted) {
          completer.complete(
            RewardedAdOutcome(
              earnedReward: false,
              adUnitId: adUnitId,
              errorMessage: 'Could not show ad. Please try again.',
            ),
          );
        }
      },
    );

    ad.show(
      onUserEarnedReward: (_, reward) {
        earnedReward = true;
        rewardType = reward.type;
        rewardAmount = reward.amount.toInt();
      },
    );

    return completer.future.timeout(
      const Duration(seconds: 90),
      onTimeout: () {
        ad.dispose();
        return RewardedAdOutcome(
          earnedReward: earnedReward,
          adUnitId: adUnitId,
          rewardType: rewardType,
          rewardAmount: rewardAmount,
          errorMessage: earnedReward ? null : 'Ad timed out. Please try again.',
        );
      },
    );
  }

  Future<RewardedAd?> _loadAd(String adUnitId) {
    final existingLoad = _loadingAd;
    if (existingLoad != null) return existingLoad;

    final completer = Completer<RewardedAd?>();
    _loadingAd = completer.future;
    RewardedAd.load(
      adUnitId: adUnitId,
      request: const AdRequest(),
      rewardedAdLoadCallback: RewardedAdLoadCallback(
        onAdLoaded: (ad) {
          _loadedAd = ad;
          _loadingAd = null;
          completer.complete(ad);
        },
        onAdFailedToLoad: (error) {
          _loadingAd = null;
          AppDiagnostics.instance.record(
            'ads.rewarded.load_failed',
            error,
            context: {'code': error.code, 'message': error.message},
          );
          completer.complete(null);
        },
      ),
    );
    return completer.future;
  }

  @override
  void dispose() {
    _loadedAd?.dispose();
    _loadedAd = null;
  }
}

class GoogleInterstitialAdService implements InterstitialAdGateway {
  InterstitialAd? _loadedAd;
  Future<InterstitialAd?>? _loadingAd;

  @override
  Future<InterstitialAdOutcome> showPostConfirmAd({
    required String adUnitId,
    VoidCallback? onAdShowed,
  }) async {
    final resolvedAdUnitId = adUnitId.trim();
    if (resolvedAdUnitId.isEmpty) {
      return const InterstitialAdOutcome(
        shown: false,
        adUnitId: '',
        errorMessage: 'Interstitial ad unit is not configured.',
      );
    }

    final ad = _loadedAd ?? await _loadAd(resolvedAdUnitId);
    _loadedAd = null;

    if (ad == null) {
      unawaited(_loadAd(resolvedAdUnitId));
      return InterstitialAdOutcome(
        shown: false,
        adUnitId: resolvedAdUnitId,
        errorMessage: 'Interstitial ad is not ready.',
      );
    }

    final completer = Completer<InterstitialAdOutcome>();

    ad.fullScreenContentCallback = FullScreenContentCallback(
      onAdShowedFullScreenContent: (_) => onAdShowed?.call(),
      onAdDismissedFullScreenContent: (ad) {
        ad.dispose();
        unawaited(_loadAd(resolvedAdUnitId));
        if (!completer.isCompleted) {
          completer.complete(
            InterstitialAdOutcome(shown: true, adUnitId: resolvedAdUnitId),
          );
        }
      },
      onAdFailedToShowFullScreenContent: (ad, error) {
        ad.dispose();
        unawaited(_loadAd(resolvedAdUnitId));
        AppDiagnostics.instance.record(
          'ads.interstitial.show_failed',
          error,
          context: {'code': error.code, 'message': error.message},
        );
        if (!completer.isCompleted) {
          completer.complete(
            InterstitialAdOutcome(
              shown: false,
              adUnitId: resolvedAdUnitId,
              errorMessage: 'Could not show interstitial ad.',
            ),
          );
        }
      },
    );

    ad.show();

    return completer.future.timeout(
      const Duration(seconds: 45),
      onTimeout: () {
        ad.dispose();
        return InterstitialAdOutcome(
          shown: false,
          adUnitId: resolvedAdUnitId,
          errorMessage: 'Interstitial ad timed out.',
        );
      },
    );
  }

  Future<InterstitialAd?> _loadAd(String adUnitId) {
    final existingLoad = _loadingAd;
    if (existingLoad != null) return existingLoad;

    final completer = Completer<InterstitialAd?>();
    Timer? timeout;
    _loadingAd = completer.future;

    timeout = Timer(const Duration(seconds: 8), () {
      _loadingAd = null;
      if (!completer.isCompleted) completer.complete(null);
    });

    InterstitialAd.load(
      adUnitId: adUnitId,
      request: const AdRequest(),
      adLoadCallback: InterstitialAdLoadCallback(
        onAdLoaded: (ad) {
          timeout?.cancel();
          _loadedAd = ad;
          _loadingAd = null;
          if (!completer.isCompleted) {
            completer.complete(ad);
          } else {
            ad.dispose();
          }
        },
        onAdFailedToLoad: (error) {
          timeout?.cancel();
          _loadingAd = null;
          AppDiagnostics.instance.record(
            'ads.interstitial.load_failed',
            error,
            context: {'code': error.code, 'message': error.message},
          );
          if (!completer.isCompleted) completer.complete(null);
        },
      ),
    );
    return completer.future;
  }

  @override
  void dispose() {
    _loadedAd?.dispose();
    _loadedAd = null;
  }
}

class LogMyPlateAdConfig {
  static const androidTestAppId = 'ca-app-pub-3940256099942544~3347511713';
  static const iosTestAppId = 'ca-app-pub-3940256099942544~1458002511';
  static const androidTestRewardedAdUnitId =
      'ca-app-pub-3940256099942544/5224354917';
  static const iosTestRewardedAdUnitId =
      'ca-app-pub-3940256099942544/1712485313';
  static const androidTestInterstitialAdUnitId =
      'ca-app-pub-3940256099942544/1033173712';
  static const iosTestInterstitialAdUnitId =
      'ca-app-pub-3940256099942544/4411468910';
  static const androidRewardedAdUnitId =
      'ca-app-pub-6936425975956435/2997685695';
  static const iosRewardedAdUnitId = 'ca-app-pub-6936425975956435/9427362674';

  static String get rewardedAdUnitId {
    const configured = String.fromEnvironment('LOGMYPLATE_REWARDED_AD_UNIT_ID');
    return resolveRewardedAdUnitId(
      configured: configured,
      platform: defaultTargetPlatform,
      releaseMode: kReleaseMode,
    );
  }

  static String get interstitialAdUnitId {
    const configured = String.fromEnvironment(
      'LOGMYPLATE_INTERSTITIAL_AD_UNIT_ID',
    );
    return resolveInterstitialAdUnitId(
      configured: configured,
      platform: defaultTargetPlatform,
      releaseMode: kReleaseMode,
    );
  }

  static void validateForCurrentBuild() {
    rewardedAdUnitId;
  }

  @visibleForTesting
  static String resolveRewardedAdUnitId({
    required String configured,
    required TargetPlatform platform,
    required bool releaseMode,
  }) {
    final configuredAdUnitId = configured.trim();
    if (configuredAdUnitId.isNotEmpty) return configuredAdUnitId;

    if (releaseMode) {
      return switch (platform) {
        TargetPlatform.android => androidRewardedAdUnitId,
        TargetPlatform.iOS => iosRewardedAdUnitId,
        _ => iosRewardedAdUnitId,
      };
    }

    return switch (platform) {
      TargetPlatform.android => androidTestRewardedAdUnitId,
      TargetPlatform.iOS => iosTestRewardedAdUnitId,
      _ => iosTestRewardedAdUnitId,
    };
  }

  @visibleForTesting
  static String resolveInterstitialAdUnitId({
    required String configured,
    required TargetPlatform platform,
    required bool releaseMode,
  }) {
    final configuredAdUnitId = configured.trim();
    if (configuredAdUnitId.isNotEmpty) return configuredAdUnitId;

    if (releaseMode) return '';

    return switch (platform) {
      TargetPlatform.android => androidTestInterstitialAdUnitId,
      TargetPlatform.iOS => iosTestInterstitialAdUnitId,
      _ => iosTestInterstitialAdUnitId,
    };
  }
}
