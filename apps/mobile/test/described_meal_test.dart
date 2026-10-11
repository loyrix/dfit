import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:logmyplate_mobile/src/models/meal.dart';
import 'package:logmyplate_mobile/src/screens/analyzing_screen.dart';
import 'package:logmyplate_mobile/src/screens/camera_screen.dart';
import 'package:logmyplate_mobile/src/screens/review_meal_screen.dart';
import 'package:logmyplate_mobile/src/services/app_build_info.dart';
import 'package:logmyplate_mobile/src/services/device_identity_store.dart';
import 'package:logmyplate_mobile/src/services/logmyplate_api_client.dart';
import 'package:logmyplate_mobile/src/theme/logmyplate_theme.dart';

/// A meal logged from words alone, with no photo.
void main() {
  Widget testFrame({required Widget child}) {
    return MaterialApp(theme: LogMyPlateTheme.light(), home: child);
  }

  test('sends the description as the hint, with no image', () async {
    final requests = <http.Request>[];
    final client = LogMyPlateApiClient(
      baseUrl: 'http://api.test',
      loadDeviceIdentity: () async => const DeviceIdentity(
        installId: 'test-install',
        platform: 'ios',
        locale: 'en-IN',
        region: 'IN',
        timezone: 'Asia/Kolkata',
      ),
      loadAppBuildInfo: () async => const AppBuildInfo(
        platform: 'ios',
        version: '1.0.0',
        buildNumber: '12',
      ),
      httpClient: MockClient((request) async {
        requests.add(request);
        return http.Response(
          jsonEncode({
            'scanId': 'scan_1',
            'status': 'ready_for_review',
            'mealType': 'lunch',
            'mealName': 'Roti and dal',
            'detectedLanguage': 'en-IN',
            'imageStored': false,
            'totals': {'calories': 160, 'proteinG': 5, 'carbsG': 32, 'fatG': 2},
            'items': [
              {
                'id': 'item_1',
                'name': 'Roti',
                'aliases': <String>[],
                'quantity': 2,
                'unit': 'roti',
                'estimatedGrams': 60,
                'preparation': 'home',
                'confidence': 0.8,
                'nutrition': {
                  'calories': 160,
                  'proteinG': 5,
                  'carbsG': 32,
                  'fatG': 2,
                },
              },
            ],
          }),
          200,
        );
      }),
    );

    final analysis = await client.analyzeScan(
      scanId: 'scan_1',
      idempotencyKey: 'analyze-key',
      description: '  2 rotis and a bowl of dal  ',
    );

    expect(analysis.items.single.name, 'Roti');
    expect(analysis.imageStored, isFalse);
    expect(jsonDecode(requests.single.body) as Map<String, dynamic>, {
      'hint': '2 rotis and a bowl of dal',
    });
  });

  group('AnalyzingScreen described meal', () {
    testWidgets('runs the description analyzer with its own wording', (
      tester,
    ) async {
      final completer = Completer<ScanAnalysis>();
      String? analyzed;

      await tester.pumpWidget(
        testFrame(
          child: AnalyzingScreen(
            description: '2 rotis and a bowl of dal',
            onAnalyzeDescription: (description) {
              analyzed = description;
              return completer.future;
            },
            onAnalyzed: (_) {},
          ),
        ),
      );
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 100));

      expect(analyzed, '2 rotis and a bowl of dal');
      expect(find.text('Reading your meal'), findsOneWidget);
      expect(find.text('Reading what you described'), findsOneWidget);
      // The user's own words stay on screen while they wait.
      expect(find.text('2 rotis and a bowl of dal'), findsOneWidget);
      expect(find.text('Reading your plate'), findsNothing);

      completer.completeError(
        LogMyPlateApiException(422, jsonEncode({'error': 'no_food_detected'})),
      );
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 250));
      await tester.pumpWidget(const SizedBox.shrink());
    });

    testWidgets('a non-food description asks for a rewrite, not a photo', (
      tester,
    ) async {
      await tester.pumpWidget(
        testFrame(
          child: AnalyzingScreen(
            description: 'hello there',
            onAnalyzeDescription: (_) async {
              throw LogMyPlateApiException(
                422,
                jsonEncode({'error': 'no_food_detected'}),
              );
            },
            onAnalyzed: (_) {},
          ),
        ),
      );
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 250));

      expect(find.text('No food found'), findsOneWidget);
      expect(find.text('Try describing the meal again'), findsOneWidget);
      expect(find.text('Edit description'), findsOneWidget);
      expect(find.text('Try another plate photo'), findsNothing);
      expect(find.text('Retry scan'), findsNothing);

      await tester.pumpWidget(const SizedBox.shrink());
    });
  });

  group('CameraScreen food note without a photo', () {
    testWidgets('offers to log from the note once one is typed', (
      tester,
    ) async {
      String? described;
      await tester.pumpWidget(
        testFrame(
          child: CameraScreen(
            onCaptured: (_) {},
            onDescribed: (description) => described = description,
          ),
        ),
      );
      await tester.pump();

      // Nothing to log from yet, so the photo buttons stand alone.
      expect(find.byKey(const ValueKey('log-from-note')), findsNothing);

      await tester.enterText(find.byType(TextField), 'paneer tikka, 6 pieces');
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));

      final button = find.byKey(const ValueKey('log-from-note'));
      expect(button, findsOneWidget);
      await tester.ensureVisible(button);
      await tester.tap(button);
      await tester.pump();

      expect(described, 'paneer tikka, 6 pieces');
    });

    testWidgets('does not offer it when no handler is supplied', (
      tester,
    ) async {
      await tester.pumpWidget(
        testFrame(child: CameraScreen(onCaptured: (_) {})),
      );
      await tester.pump();
      await tester.enterText(find.byType(TextField), 'paneer tikka');
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));

      expect(find.byKey(const ValueKey('log-from-note')), findsNothing);
    });
  });

  group('manual screen describe-your-meal card', () {
    testWidgets('submits the typed description', (tester) async {
      String? described;
      await tester.pumpWidget(
        testFrame(
          child: ReviewMealScreen(
            initialItems: const [],
            onDescribeMeal: (description) => described = description,
            onConfirm: (_, _, {bool analyzeWithAI = false}) async {},
          ),
        ),
      );

      expect(find.text('Describe your meal'), findsOneWidget);

      // Nothing typed: there is nothing to estimate.
      await tester.tap(find.byKey(const ValueKey('describe-meal-submit')));
      await tester.pump();
      expect(described, isNull);

      await tester.enterText(
        find.byKey(const ValueKey('describe-meal-field')),
        '2 rotis, 1 bowl dal',
      );
      await tester.pump();
      await tester.tap(find.byKey(const ValueKey('describe-meal-submit')));
      await tester.pump();

      expect(described, '2 rotis, 1 bowl dal');
    });

    testWidgets('is absent on a review that came from a scan', (tester) async {
      await tester.pumpWidget(
        testFrame(
          child: ReviewMealScreen(
            initialItems: const [],
            onConfirm: (_, _, {bool analyzeWithAI = false}) async {},
          ),
        ),
      );

      expect(find.text('Describe your meal'), findsNothing);
    });
  });
}
