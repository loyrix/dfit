import 'package:flutter/foundation.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:logmyplate_mobile/src/services/revenuecat_subscription_service.dart';

void main() {
  test('test store key enables non-release subscription setup', () {
    final service = RevenueCatSubscriptionService(
      platform: TargetPlatform.iOS,
      iosApiKey: '',
      androidApiKey: '',
      testApiKey: 'test_public_key',
    );

    expect(service.hasPlatformKey, isTrue);
  });
}
