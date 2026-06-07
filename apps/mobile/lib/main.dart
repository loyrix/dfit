import 'dart:async';
import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';

import 'src/app.dart';
import 'src/screens/startup_error_screen.dart';
import 'src/services/app_diagnostics.dart';
import 'src/services/journal_cache_store.dart';
import 'src/services/rewarded_ad_service.dart';

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

      LogMyPlateAdConfig.validateForCurrentBuild();
      
      final cachedBootstrap = await JournalCacheStore().load();
      final testDeviceIds = cachedBootstrap?.engagementPolicy.admob.testDeviceIds ?? const [];

      await MobileAds.instance.updateRequestConfiguration(
        RequestConfiguration(
          testDeviceIds: testDeviceIds,
          tagForUnderAgeOfConsent: TagForUnderAgeOfConsent.unspecified,
          tagForChildDirectedTreatment: TagForChildDirectedTreatment.unspecified,
        ),
      );
      await MobileAds.instance.initialize();

      runApp(const LogMyPlateApp());
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
