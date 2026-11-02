import 'package:flutter_test/flutter_test.dart';
import 'package:logmyplate_mobile/src/models/meal.dart';
import 'package:logmyplate_mobile/src/services/review_prompt_store.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  test(
    'tracks confirmed scans and active days for review eligibility',
    () async {
      final store = ReviewPromptStore();
      final policy = const EngagementReviewPromptPolicy(
        enabled: true,
        minConfirmedScans: 2,
        minActiveDays: 2,
        cooldownDays: 30,
      );

      final first = await store.recordConfirmedScan(
        now: DateTime(2026, 6, 1, 12),
      );
      expect(
        first.isEligible(
          policy: policy,
          appVersionKey: '1.0.0+1',
          now: DateTime(2026, 6, 1, 12),
        ),
        isFalse,
      );

      final second = await store.recordConfirmedScan(
        now: DateTime(2026, 6, 2, 12),
      );
      expect(second.confirmedScans, 2);
      expect(second.activeDays, 2);
      expect(
        second.isEligible(
          policy: policy,
          appVersionKey: '1.0.0+1',
          now: DateTime(2026, 6, 2, 12),
        ),
        isTrue,
      );
    },
  );

  test('respects the 90-day floor and once-per-version gates', () async {
    final store = ReviewPromptStore();
    // A remote cooldown below 90 days is raised to 90 on the device.
    final policy = const EngagementReviewPromptPolicy(
      enabled: true,
      minConfirmedScans: 1,
      minActiveDays: 1,
      cooldownDays: 7,
      oncePerAppVersion: true,
    );

    final stats = await store.recordConfirmedScan(
      now: DateTime(2026, 6, 1, 12),
    );
    expect(
      stats.isEligible(
        policy: policy,
        appVersionKey: '1.0.0+1',
        now: DateTime(2026, 6, 1, 12),
      ),
      isTrue,
    );

    await store.markPromptShown(
      appVersionKey: '1.0.0+1',
      now: DateTime(2026, 6, 1, 12),
    );
    final afterPrompt = await store.load();
    expect(
      afterPrompt.isEligible(
        policy: policy,
        appVersionKey: '1.0.0+1',
        now: DateTime(2026, 12, 1, 12),
      ),
      isFalse,
      reason: 'already asked on this app version',
    );
    expect(
      afterPrompt.isEligible(
        policy: policy,
        appVersionKey: '1.0.1+2',
        now: DateTime(2026, 6, 9, 12),
      ),
      isFalse,
      reason: 'a 7-day remote cooldown is raised to 90 days',
    );
    expect(
      afterPrompt.isEligible(
        policy: policy,
        appVersionKey: '1.0.1+2',
        now: DateTime(2026, 8, 29, 12),
      ),
      isFalse,
    );
    expect(
      afterPrompt.isEligible(
        policy: policy,
        appVersionKey: '1.0.1+2',
        now: DateTime(2026, 8, 31, 12),
      ),
      isTrue,
    );
  });

  test('the first confirmed scan earns the prompt by default', () async {
    final store = ReviewPromptStore();
    const policy = EngagementReviewPromptPolicy(enabled: true);

    final stats = await store.recordConfirmedScan(
      now: DateTime(2026, 6, 1, 12),
    );
    expect(
      stats.triggerAt(policy: policy, now: DateTime(2026, 6, 1, 12)),
      ReviewPromptTrigger.confirmedScan,
    );
    expect(
      stats.isEligible(
        policy: policy,
        appVersionKey: '1.0.0+1',
        now: DateTime(2026, 6, 1, 12),
      ),
      isTrue,
    );
  });

  test(
    'a 3-day streak earns the prompt when scan thresholds are not met',
    () async {
      final store = ReviewPromptStore();
      const policy = EngagementReviewPromptPolicy(
        enabled: true,
        minConfirmedScans: 50,
        streakDays: 3,
      );

      await store.recordConfirmedScan(now: DateTime(2026, 6, 1, 9));
      final twoDays = await store.recordConfirmedScan(
        now: DateTime(2026, 6, 2, 9),
      );
      expect(twoDays.streakDaysAt(DateTime(2026, 6, 2, 20)), 2);
      expect(
        twoDays.triggerAt(policy: policy, now: DateTime(2026, 6, 2, 20)),
        isNull,
      );

      final threeDays = await store.recordConfirmedScan(
        now: DateTime(2026, 6, 3, 9),
      );
      expect(
        threeDays.triggerAt(policy: policy, now: DateTime(2026, 6, 3, 9)),
        ReviewPromptTrigger.streak,
      );

      // A gap resets the streak.
      final afterGap = await store.recordConfirmedScan(
        now: DateTime(2026, 6, 5, 9),
      );
      expect(afterGap.streakDaysAt(DateTime(2026, 6, 5, 9)), 1);
      expect(
        afterGap.triggerAt(policy: policy, now: DateTime(2026, 6, 5, 9)),
        isNull,
      );
    },
  );

  test('streak path can be switched off remotely', () async {
    final policy = EngagementReviewPromptPolicy.fromJson({
      'enabled': true,
      'minConfirmedScans': 50,
      'streakDays': 0,
    });
    expect(policy.streakDays, 0);
    final store = ReviewPromptStore();
    for (var day = 1; day <= 5; day++) {
      await store.recordConfirmedScan(now: DateTime(2026, 6, day, 9));
    }
    final stats = await store.load();
    expect(
      stats.triggerAt(policy: policy, now: DateTime(2026, 6, 5, 9)),
      isNull,
    );
  });
}
