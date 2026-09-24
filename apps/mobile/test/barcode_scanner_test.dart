import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:logmyplate_mobile/src/models/meal.dart';
import 'package:logmyplate_mobile/src/screens/analyzing_screen.dart';
import 'package:logmyplate_mobile/src/screens/camera_screen.dart';
import 'package:logmyplate_mobile/src/screens/settings_screen.dart';
import 'package:logmyplate_mobile/src/services/logmyplate_api_client.dart';
import 'package:logmyplate_mobile/src/theme/logmyplate_theme.dart';

void main() {
  Widget testFrame({required Widget child}) {
    return MaterialApp(
      theme: LogMyPlateTheme.light(),
      home: child,
    );
  }

  group('CameraScreen barcode mode', () {
    testWidgets('renders scan mode selector with Plate Photo and Barcode', (
      tester,
    ) async {
      await tester.pumpWidget(
        testFrame(
          child: CameraScreen(
            onCaptured: (_) {},
            onBarcodeScanned: (_) {},
          ),
        ),
      );

      expect(find.text('Plate Photo'), findsOneWidget);
      expect(find.text('Barcode'), findsOneWidget);
      expect(find.text('AI powered meal scan'), findsOneWidget);
    });

    testWidgets('switches to barcode mode and reveals manual entry button', (
      tester,
    ) async {
      await tester.pumpWidget(
        testFrame(
          child: CameraScreen(
            onCaptured: (_) {},
            onBarcodeScanned: (_) {},
          ),
        ),
      );

      await tester.tap(find.text('Barcode'));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));

      expect(find.text('Scan barcode to log food'), findsOneWidget);
      expect(find.text('Enter barcode manually'), findsOneWidget);
    });

    testWidgets('entering barcode manually triggers onBarcodeScanned callback', (
      tester,
    ) async {
      String? scannedBarcode;

      await tester.pumpWidget(
        testFrame(
          child: CameraScreen(
            initialMode: CameraScanMode.barcode,
            onCaptured: (_) {},
            onBarcodeScanned: (code) => scannedBarcode = code,
          ),
        ),
      );

      expect(find.text('Enter barcode manually'), findsOneWidget);
      await tester.tap(find.text('Enter barcode manually'));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));

      expect(find.text('Enter barcode'), findsOneWidget);
      await tester.enterText(find.byType(TextField), '737628064500');
      await tester.tap(find.text('Look up'));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));

      expect(scannedBarcode, '737628064500');
    });
  });

  group('AnalyzingScreen barcode flow', () {
    testWidgets('renders barcode lookup preview with custom timeline steps', (
      tester,
    ) async {
      final completer = Completer<ScanAnalysis>();

      await tester.pumpWidget(
        testFrame(
          child: AnalyzingScreen(
            barcode: '737628064500',
            onAnalyzeBarcode: (_) => completer.future,
            onAnalyzed: (_) {},
          ),
        ),
      );

      await tester.pump();
      await tester.pump(const Duration(milliseconds: 100));

      expect(find.text('737628064500'), findsOneWidget);
      expect(find.text('Open Food Facts Lookup'), findsOneWidget);
      expect(find.text('Looking up barcode'), findsOneWidget);
      expect(find.text('Searching food database'), findsOneWidget);

      completer.completeError(
        LogMyPlateApiException(
          422,
          jsonEncode({'error': 'no_food_detected'}),
        ),
      );
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 250));

      await tester.pumpWidget(const SizedBox.shrink());
    });

    testWidgets('handles non-food rejection with photo switch and retry actions', (
      tester,
    ) async {
      var switchedToPhoto = false;

      await tester.pumpWidget(
        testFrame(
          child: AnalyzingScreen(
            barcode: '0000000000',
            onAnalyzeBarcode: (_) async {
              throw LogMyPlateApiException(
                422,
                jsonEncode({'error': 'no_food_detected'}),
              );
            },
            onAnalyzed: (_) {},
            onSwitchToPhoto: () => switchedToPhoto = true,
          ),
        ),
      );

      await tester.pump();
      await tester.pump(const Duration(milliseconds: 250));

      expect(find.text('No food found'), findsOneWidget);
      expect(find.text('Barcode was not recognized as food'), findsOneWidget);
      expect(find.text('Take plate photo'), findsOneWidget);
      expect(find.text('Retry barcode'), findsOneWidget);

      await tester.tap(find.text('Take plate photo'));
      expect(switchedToPhoto, isTrue);

      await tester.pumpWidget(const SizedBox.shrink());
    });
  });

  group('SettingsScreen attributions', () {
    testWidgets('displays Open Food Facts ODbL data attribution', (
      tester,
    ) async {
      await tester.pumpWidget(
        testFrame(
          child: SettingsScreen(
            themeMode: ThemeMode.system,
            onThemeChanged: (_) {},
            session: null,
            onOpenAccount: () {},
          ),
        ),
      );

      await tester.drag(find.byType(ListView), const Offset(0, -500));
      await tester.pump();

      expect(find.text('Data & Attributions'), findsOneWidget);
      expect(
        find.text('Packaged food data provided by Open Food Facts (ODbL)'),
        findsOneWidget,
      );
    });
  });
}
