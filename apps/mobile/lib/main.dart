import 'dart:async';

import 'package:app_tracking_transparency/app_tracking_transparency.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';

import 'src/app.dart';
import 'src/screens/startup_error_screen.dart';
import 'src/services/app_diagnostics.dart';
import 'src/services/journal_cache_store.dart';
import 'src/services/rewarded_ad_service.dart';

Future<void> _printAdvertisingId() async {
  // The ATT prompt is only shown once the app is active; give the first
  // frame a moment to land before requesting.
  await Future<void>.delayed(const Duration(seconds: 1));
  final status = await AppTrackingTransparency.trackingAuthorizationStatus;
  if (status == TrackingStatus.notDetermined) {
    await AppTrackingTransparency.requestTrackingAuthorization();
  }
  final adId = await AppTrackingTransparency.getAdvertisingIdentifier();
  debugPrint('==============================================');
  debugPrint('Advertising ID (IDFA/AAID): $adId');
  debugPrint('==============================================');
}

void main() {
  runZonedGuarded<Future<void>>(
    () async {
      WidgetsFlutterBinding.ensureInitialized();

      ErrorWidget.builder = (details) {
        return LogMyPlateStartupErrorSurface(
          message: details.exceptionAsString(),
        );
      };

      FlutterError.onError = (details) {
        AppDiagnostics.instance.record(
          'flutter.error',
          details.exception,
          stackTrace: details.stack,
          context: {'library': details.library},
        );
        FlutterError.presentError(details);
      };

      PlatformDispatcher.instance.onError = (error, stack) {
        AppDiagnostics.instance.record(
          'platform.error',
          error,
          stackTrace: stack,
        );
        FlutterError.presentError(
          FlutterErrorDetails(
            exception: error,
            stack: stack,
            library: 'logmyplate mobile',
          ),
        );
        runApp(LogMyPlateStartupErrorApp(message: error.toString()));
        return true;
      };

      await LogMyPlateAdConfig.detectInstallSource();
      LogMyPlateAdConfig.validateForCurrentBuild();
      
      runApp(const LogMyPlateApp());

      if (kDebugMode) {
        unawaited(_printAdvertisingId());
      }

      unawaited(
        JournalCacheStore().load().then((cachedBootstrap) async {
          final testDeviceIds =
              cachedBootstrap?.engagementPolicy.admob.testDeviceIds ?? const [];
          await MobileAds.instance.updateRequestConfiguration(
            RequestConfiguration(
              testDeviceIds: testDeviceIds,
              tagForUnderAgeOfConsent: TagForUnderAgeOfConsent.unspecified,
              tagForChildDirectedTreatment:
                  TagForChildDirectedTreatment.unspecified,
            ),
          );
          await MobileAds.instance.initialize();
        }),
      );
    },
    (error, stack) {
      AppDiagnostics.instance.record('zone.error', error, stackTrace: stack);
      FlutterError.presentError(
        FlutterErrorDetails(
          exception: error,
          stack: stack,
          library: 'logmyplate mobile',
        ),
      );
      runApp(LogMyPlateStartupErrorApp(message: error.toString()));
    },
  );
}
