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

  ScanAnalysis analysisFor(String scanId) {
    return ScanAnalysis(
      scanId: scanId,
      mealType: MealType.snack,
      mealName: 'Masala oats',
      detectedLanguage: 'en',
      items: const [],
    );
  }

  LogMyPlateApiException apiError(int status, Map<String, Object?> body) {
    return LogMyPlateApiException(status, jsonEncode(body));
  }

  Future<void> enterBarcodeManually(WidgetTester tester, String barcode) async {
    await tester.tap(find.text('Enter barcode manually'));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));
    await tester.enterText(find.byType(TextField), barcode);
    await tester.tap(find.text('Look up'));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));
  }

  group('CameraScreen barcode mode', () {
    testWidgets('renders scan mode selector with Plate Photo and Barcode', (
      tester,
    ) async {
      await tester.pumpWidget(
        testFrame(
          child: CameraScreen(
            onCaptured: (_) {},
            onAnalyzeBarcode: (_) async => analysisFor('scan_1'),
          ),
        ),
      );

      expect(find.text('Plate Photo'), findsOneWidget);
      expect(find.text('Barcode'), findsOneWidget);
      expect(find.text('AI powered meal scan'), findsOneWidget);
    });

    testWidgets('hides the mode selector when no barcode lookup is provided', (
      tester,
    ) async {
      await tester.pumpWidget(
        testFrame(child: CameraScreen(onCaptured: (_) {})),
      );

      expect(find.text('Plate Photo'), findsNothing);
      expect(find.text('Barcode'), findsNothing);
    });

    testWidgets('mode selector leads the screen at a full tap target height', (
      tester,
    ) async {
      await tester.pumpWidget(
        testFrame(
          child: CameraScreen(
            onCaptured: (_) {},
            onAnalyzeBarcode: (_) async => analysisFor('scan_1'),
          ),
        ),
      );

      final barcodeTab = tester.getRect(
        find.ancestor(
          of: find.text('Barcode'),
          matching: find.byType(InkWell),
        ),
      );
      expect(barcodeTab.height, greaterThanOrEqualTo(44));
      expect(barcodeTab.width, greaterThan(300));
      expect(
        barcodeTab.bottom,
        lessThan(tester.getRect(find.text('AI powered meal scan')).top),
      );
    });

    testWidgets('switches to barcode mode and reveals manual entry button', (
      tester,
    ) async {
      await tester.pumpWidget(
        testFrame(
          child: CameraScreen(
            onCaptured: (_) {},
            onAnalyzeBarcode: (_) async => analysisFor('scan_1'),
          ),
        ),
      );

      await tester.tap(find.text('Barcode'));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));

      expect(find.text('Scan barcode to log food'), findsOneWidget);
      expect(find.text('Enter barcode manually'), findsOneWidget);
      expect(find.textContaining('Open Food Facts'), findsNothing);
    });

    testWidgets('looks up a manually entered barcode on the scanner screen', (
      tester,
    ) async {
      final lookup = Completer<ScanAnalysis>();
      String? lookedUp;
      ScanAnalysis? delivered;

      await tester.pumpWidget(
        testFrame(
          child: CameraScreen(
            initialMode: CameraScanMode.barcode,
            onCaptured: (_) {},
            onAnalyzeBarcode: (code) {
              lookedUp = code;
              return lookup.future;
            },
            onBarcodeAnalyzed: (analysis) => delivered = analysis,
          ),
        ),
      );

      await enterBarcodeManually(tester, '737628064500');

      expect(lookedUp, '737628064500');
      expect(find.text('Looking up product'), findsOneWidget);
      // Switching mode mid-lookup would strand the result, so the switch and
      // the scanner copy stay put while the screen is still the scanner.
      expect(find.text('Scan barcode to log food'), findsOneWidget);
      expect(find.text('Plate Photo'), findsNothing);
      expect(delivered, isNull);

      lookup.complete(analysisFor('scan_42'));
      await tester.pump();

      expect(delivered?.scanId, 'scan_42');
    });

    testWidgets('a barcode with no food match stays on the scanner and can '
        'scan again', (tester) async {
      var lookups = 0;
      var addedManually = false;

      await tester.pumpWidget(
        testFrame(
          child: CameraScreen(
            initialMode: CameraScanMode.barcode,
            onCaptured: (_) {},
            onAnalyzeBarcode: (_) async {
              lookups += 1;
              throw apiError(422, {'error': 'no_food_detected'});
            },
            onAddManually: () => addedManually = true,
          ),
        ),
      );

      await enterBarcodeManually(tester, '0000000000');

      expect(find.text('No food found'), findsOneWidget);
      expect(find.textContaining('No scan credit was used'), findsOneWidget);
      expect(find.text('Try again'), findsNothing);
      expect(find.text('Plate photo'), findsOneWidget);

      await tester.tap(find.text('Add manually'));
      expect(addedManually, isTrue);

      await tester.tap(find.text('Scan again'));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));

      // Back to a live scanner without re-sending the barcode that missed.
      expect(lookups, 1);
      expect(find.text('No food found'), findsNothing);
      expect(find.text('Enter barcode manually'), findsOneWidget);
      expect(find.text('Barcode'), findsOneWidget);
    });

    testWidgets('a miss offers a switch to plate photo', (tester) async {
      await tester.pumpWidget(
        testFrame(
          child: CameraScreen(
            initialMode: CameraScanMode.barcode,
            onCaptured: (_) {},
            onAnalyzeBarcode: (_) async {
              throw apiError(422, {'error': 'no_food_detected'});
            },
          ),
        ),
      );

      await enterBarcodeManually(tester, '0000000000');
      await tester.tap(find.text('Plate photo'));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));

      expect(find.text('AI powered meal scan'), findsOneWidget);
      expect(find.text('No food found'), findsNothing);
    });

    testWidgets('a server failure retries the same barcode', (tester) async {
      final seen = <String>[];
      ScanAnalysis? delivered;

      await tester.pumpWidget(
        testFrame(
          child: CameraScreen(
            initialMode: CameraScanMode.barcode,
            onCaptured: (_) {},
            onAnalyzeBarcode: (code) async {
              seen.add(code);
              if (seen.length == 1) {
                throw apiError(503, {
                  'message': 'connect ECONNREFUSED 10.0.0.4:5432',
                });
              }
              return analysisFor('scan_retry');
            },
            onBarcodeAnalyzed: (analysis) => delivered = analysis,
          ),
        ),
      );

      await enterBarcodeManually(tester, '8901058000290');

      expect(find.text('Lookup took too long'), findsOneWidget);
      expect(find.textContaining('ECONNREFUSED'), findsNothing);

      await tester.tap(find.text('Try again'));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));

      expect(seen, ['8901058000290', '8901058000290']);
      expect(delivered?.scanId, 'scan_retry');
    });

    testWidgets('a used-up quota offers the account handoff', (tester) async {
      var accountOpened = false;

      await tester.pumpWidget(
        testFrame(
          child: CameraScreen(
            initialMode: CameraScanMode.barcode,
            onCaptured: (_) {},
            onAnalyzeBarcode: (_) async {
              throw apiError(402, {'error': 'scan_credit_required'});
            },
            onScanCreditRequired: () async => accountOpened = true,
          ),
        ),
      );

      await enterBarcodeManually(tester, '8901058000290');

      expect(find.text('Unlock scans'), findsOneWidget);

      await tester.tap(find.text('Open account'));
      await tester.pump();

      expect(accountOpened, isTrue);
    });

    testWidgets('an unreachable API reports a connection problem', (
      tester,
    ) async {
      await tester.pumpWidget(
        testFrame(
          child: CameraScreen(
            initialMode: CameraScanMode.barcode,
            onCaptured: (_) {},
            onAnalyzeBarcode: (_) async => throw TimeoutException('offline'),
          ),
        ),
      );

      await enterBarcodeManually(tester, '8901058000290');

      expect(find.text('Connection paused'), findsOneWidget);
      expect(find.text('Try again'), findsOneWidget);
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
      expect(find.textContaining('Open Food Facts'), findsNothing);
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
