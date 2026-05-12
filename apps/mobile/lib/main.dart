import 'dart:async';
import 'dart:ui';

import 'package:flutter/material.dart';

import 'src/app.dart';
import 'src/screens/startup_error_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();

  ErrorWidget.builder = (details) {
    return DFitStartupErrorSurface(message: details.exceptionAsString());
  };

  FlutterError.onError = (details) {
    FlutterError.presentError(details);
  };

  PlatformDispatcher.instance.onError = (error, stack) {
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

  runZonedGuarded(() => runApp(const DFitApp()), (error, stack) {
    FlutterError.presentError(
      FlutterErrorDetails(
        exception: error,
        stack: stack,
        library: 'dfit mobile',
      ),
    );
    runApp(DFitStartupErrorApp(message: error.toString()));
  });
}
