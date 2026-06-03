import 'package:flutter_test/flutter_test.dart';
import 'package:logmyplate_mobile/src/models/meal.dart';
import 'package:logmyplate_mobile/src/services/interstitial_ad_store.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  test(
    'tracks confirmed scans before first interstitial is eligible',
    () async {
      final store = InterstitialAdStore();
      final policy = const EngagementInterstitialAdsPolicy(
        enabled: true,
        minConfirmedScansBeforeFirstAd: 2,
        scansBetweenAds: 2,
        cooldownMinutes: 10,
        dailyCap: 3,
      );

      final first = await store.recordConfirmedScan(
        now: DateTime(2026, 6, 3, 10),
      );
      expect(
        first.isEligible(
          policy: policy,
          isPremiumUser: false,
          now: DateTime(2026, 6, 3, 10),
        ),
        isFalse,
      );

      final second = await store.recordConfirmedScan(
        now: DateTime(2026, 6, 3, 10, 5),
      );
      expect(second.confirmedScans, 2);
      expect(
        second.isEligible(
          policy: policy,
          isPremiumUser: false,
          now: DateTime(2026, 6, 3, 10, 5),
        ),
        isTrue,
      );
    },
  );

  test(
    'respects scan spacing, cooldown, daily cap, and premium exclusion',
    () async {
      final store = InterstitialAdStore();
      final policy = const EngagementInterstitialAdsPolicy(
        enabled: true,
        minConfirmedScansBeforeFirstAd: 1,
        scansBetweenAds: 2,
        cooldownMinutes: 10,
        dailyCap: 1,
        premiumExcluded: true,
      );

      final first = await store.recordConfirmedScan(
        now: DateTime(2026, 6, 3, 10),
      );
      expect(
        first.isEligible(
          policy: policy,
          isPremiumUser: true,
          now: DateTime(2026, 6, 3, 10),
        ),
        isFalse,
      );
      expect(
        first.isEligible(
          policy: policy,
          isPremiumUser: false,
          now: DateTime(2026, 6, 3, 10),
        ),
        isTrue,
      );

      await store.markShown(
        confirmedScanCount: first.confirmedScans,
        now: DateTime(2026, 6, 3, 10),
      );

      final afterOneMoreScan = await store.recordConfirmedScan(
        now: DateTime(2026, 6, 3, 10, 20),
      );
      expect(
        afterOneMoreScan.isEligible(
          policy: policy,
          isPremiumUser: false,
          now: DateTime(2026, 6, 3, 10, 20),
        ),
        isFalse,
      );

      final nextDay = await store.recordConfirmedScan(
        now: DateTime(2026, 6, 4, 10, 20),
      );
      expect(
        nextDay.isEligible(
          policy: policy,
          isPremiumUser: false,
          now: DateTime(2026, 6, 4, 10, 20),
        ),
        isTrue,
      );
    },
  );
}
