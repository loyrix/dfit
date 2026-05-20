import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';

import 'app_diagnostics.dart';

abstract class RewardedAdGateway {
  Future<RewardedAdOutcome> showScanUnlockAd();
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

class GoogleRewardedAdService implements RewardedAdGateway {
  RewardedAd? _loadedAd;
  Future<RewardedAd?>? _loadingAd;

  @override
  Future<RewardedAdOutcome> showScanUnlockAd() async {
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

    ad.fullScreenContentCallback = FullScreenContentCallback(
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

class LogMyPlateAdConfig {
  static const androidTestAppId = 'ca-app-pub-3940256099942544~3347511713';
  static const iosTestAppId = 'ca-app-pub-3940256099942544~1458002511';
  static const androidTestRewardedAdUnitId =
      'ca-app-pub-3940256099942544/5224354917';
  static const iosTestRewardedAdUnitId =
      'ca-app-pub-3940256099942544/1712485313';

  static String get rewardedAdUnitId {
    const configured = String.fromEnvironment('LOGMYPLATE_REWARDED_AD_UNIT_ID');
    if (configured.trim().isNotEmpty) return configured.trim();

    return switch (defaultTargetPlatform) {
      TargetPlatform.android => androidTestRewardedAdUnitId,
      TargetPlatform.iOS => iosTestRewardedAdUnitId,
      _ => iosTestRewardedAdUnitId,
    };
  }
}
