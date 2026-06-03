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

  test('respects cooldown and once-per-version review prompt gates', () async {
    final store = ReviewPromptStore();
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
        now: DateTime(2026, 6, 8, 12),
      ),
      isFalse,
    );
    expect(
      afterPrompt.isEligible(
        policy: policy,
        appVersionKey: '1.0.1+2',
        now: DateTime(2026, 6, 7, 12),
      ),
      isFalse,
    );
    expect(
      afterPrompt.isEligible(
        policy: policy,
        appVersionKey: '1.0.1+2',
        now: DateTime(2026, 6, 9, 12),
      ),
      isTrue,
    );
  });
}
