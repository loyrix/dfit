import 'package:flutter/foundation.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:logmyplate_mobile/src/services/rewarded_ad_service.dart';

void main() {
  group('LogMyPlateAdConfig', () {
    test('uses configured rewarded ad unit first', () {
      expect(
        LogMyPlateAdConfig.resolveRewardedAdUnitId(
          configured: ' ca-app-pub-6936425975956435/1234567890 ',
          platform: TargetPlatform.iOS,
          releaseMode: true,
        ),
        'ca-app-pub-6936425975956435/1234567890',
      );
    });

    test('uses platform demo units outside release builds', () {
      expect(
        LogMyPlateAdConfig.resolveRewardedAdUnitId(
          configured: '',
          platform: TargetPlatform.iOS,
          releaseMode: false,
        ),
        LogMyPlateAdConfig.iosTestRewardedAdUnitId,
      );
      expect(
        LogMyPlateAdConfig.resolveRewardedAdUnitId(
          configured: '',
          platform: TargetPlatform.android,
          releaseMode: false,
        ),
        LogMyPlateAdConfig.androidTestRewardedAdUnitId,
      );
    });

    test('uses platform production units in release builds', () {
      expect(
        LogMyPlateAdConfig.resolveRewardedAdUnitId(
          configured: '',
          platform: TargetPlatform.iOS,
          releaseMode: true,
        ),
        LogMyPlateAdConfig.iosRewardedAdUnitId,
      );
      expect(
        LogMyPlateAdConfig.resolveRewardedAdUnitId(
          configured: '',
          platform: TargetPlatform.android,
          releaseMode: true,
        ),
        LogMyPlateAdConfig.androidRewardedAdUnitId,
      );
    });
  });
}
