import 'dart:async';
import 'dart:ui';

import 'package:flutter/material.dart';

import 'src/app.dart';
import 'src/screens/startup_error_screen.dart';
import 'src/services/app_diagnostics.dart';

void main() {
  runZonedGuarded(
    () {
      WidgetsFlutterBinding.ensureInitialized();

      ErrorWidget.builder = (details) {
        return DFitStartupErrorSurface(message: details.exceptionAsString());
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
            library: 'dfit mobile',
          ),
        );
        runApp(DFitStartupErrorApp(message: error.toString()));
        return true;
      };

      runApp(const DFitApp());
    },
    (error, stack) {
      AppDiagnostics.instance.record('zone.error', error, stackTrace: stack);
      FlutterError.presentError(
        FlutterErrorDetails(
          exception: error,
          stack: stack,
          library: 'dfit mobile',
        ),
      );
      runApp(DFitStartupErrorApp(message: error.toString()));
    },
  );
}
