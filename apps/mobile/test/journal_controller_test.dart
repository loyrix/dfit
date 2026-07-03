import 'dart:convert';

import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:logmyplate_mobile/src/models/captured_meal_photo.dart';
import 'package:logmyplate_mobile/src/models/meal.dart';
import 'package:logmyplate_mobile/src/services/logmyplate_analytics.dart';
import 'package:logmyplate_mobile/src/services/logmyplate_api_client.dart';
import 'package:logmyplate_mobile/src/state/journal_controller.dart';

void main() {
  test(
    'applies analytics policy from bootstrap and logs bootstrap event',
    () async {
      TestWidgetsFlutterBinding.ensureInitialized();
      TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
          .setMockMethodCallHandler(
        const MethodChannel('plugins.flutter.io/google_mobile_ads'),
        (_) async => null,
      );

      final analytics = _RecordingAnalytics();
      final controller = JournalController(
        analytics: analytics,
        apiClient: LogMyPlateApiClient(
          baseUrl: 'http://api.test',
          httpClient: MockClient((request) async {
            expect(request.url.path, '/v1/app/bootstrap');
            return http.Response(jsonEncode(_bootstrapPayload()), 200);
          }),
        ),
      );
      addTearDown(controller.dispose);

      await controller.loadToday();

      expect(analytics.initialized, isFalse);
      expect(analytics.policies, hasLength(1));
      expect(analytics.policies.single.enabled, isTrue);
      expect(analytics.policies.single.firebaseEnabled, isTrue);
      expect(analytics.events.single.name, 'bootstrap_loaded');
      expect(
        analytics.events.single.parameters,
        containsPair('auth_method', 'anonymous'),
      );
    },
  );

  test('warm-up scan preparation is reused by analyzeCapturedMeal', () async {
    TestWidgetsFlutterBinding.ensureInitialized();
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(
      const MethodChannel('plugins.flutter.io/google_mobile_ads'),
      (_) async => null,
    );

    var prepareCalls = 0;
    final controller = JournalController(
      analytics: _RecordingAnalytics(),
      apiClient: LogMyPlateApiClient(
        baseUrl: 'http://api.test',
        httpClient: MockClient((request) async {
          if (request.url.path == '/v1/scans/prepare') {
            prepareCalls += 1;
            return http.Response(
              jsonEncode({
                'scanId': 'scan_1',
                'status': 'prepared',
                'quota': {
                  'freeRemaining': 3,
                  'rewardedRemaining': 0,
                  'premiumRemaining': 0,
                },
              }),
              201,
            );
          }
          if (request.url.path == '/v1/scans/scan_1/analyze') {
            return http.Response(jsonEncode(_analyzePayload()), 200);
          }
          if (request.url.path == '/v1/quota') {
            return http.Response(
              jsonEncode({
                'freeRemaining': 2,
                'rewardedRemaining': 0,
                'premiumRemaining': 0,
              }),
              200,
            );
          }
          fail('Unexpected request: ${request.url.path}');
        }),
      ),
    );
    addTearDown(controller.dispose);

    controller.warmUpScanPreparation();
    final analysis = await controller.analyzeCapturedMeal(
      CapturedMealPhoto(
        bytes: Uint8List.fromList([1, 2, 3]),
        mimeType: 'image/jpeg',
        fileName: 'plate.jpg',
      ),
    );

    expect(prepareCalls, 1, reason: 'warm-up prepare must be reused');
    expect(analysis.scanId, 'scan_1');
  });
}

Map<String, dynamic> _analyzePayload() {
  return {
    'scanId': 'scan_1',
    'status': 'ready_for_review',
    'mealType': 'lunch',
    'mealName': 'Dal rice',
    'detectedLanguage': 'en',
    'imageStored': true,
    'totals': {'calories': 180, 'proteinG': 10.8, 'carbsG': 25.2, 'fatG': 5.4},
    'items': [
      {
        'id': 'item_1',
        'name': 'Dal',
        'aliases': <String>[],
        'quantity': 1,
        'unit': 'katori',
        'estimatedGrams': 180,
        'preparation': 'home',
        'confidence': 0.84,
        'nutrition': {
          'calories': 180,
          'proteinG': 10.8,
          'carbsG': 25.2,
          'fatG': 5.4,
        },
      },
    ],
  };
}

Map<String, dynamic> _bootstrapPayload() {
  const zeroTotals = {'calories': 0, 'proteinG': 0, 'carbsG': 0, 'fatG': 0};
  return {
    'serverTime': '2026-06-02T10:00:00.000Z',
    'profile': {
      'id': 'profile_test',
      'authMethod': 'anonymous',
      'timezone': 'Asia/Kolkata',
      'createdAt': '2026-06-02T10:00:00.000Z',
    },
    'engagementPolicy': {
      'analytics': {
        'enabled': true,
        'firebaseEnabled': true,
        'debugLogging': false,
        'sampleRatePercent': 100,
        'events': {
          'appOpen': true,
          'bootstrapLoaded': true,
          'tabSelected': false,
          'scanStarted': true,
          'scanAnalysisSucceeded': true,
          'scanAnalysisFailed': true,
          'scanConfirmed': true,
          'manualMealSaved': true,
          'mealUpdated': true,
          'mealDeleted': true,
          'rewardedAdStarted': true,
          'rewardedAdEarned': true,
          'rewardedAdFailed': true,
          'accountGateShown': true,
          'accountLinked': true,
          'healthTargetSaved': true,
        },
      },
      'admob': {
        'testDeviceIds': [],
      },
    },
    'quota': {
      'freeRemaining': 3,
      'rewardedRemaining': 0,
      'premiumRemaining': 0,
    },
    'rewardedAdProgress': {
      'adsWatchedToday': 0,
      'adsNeededForNextScan': 1,
      'scansGrantedToday': 0,
      'dailyScanLimit': 5,
      'adsPerScan': 1,
    },
    'today': {'totals': zeroTotals, 'meals': []},
    'weeklySummary': {
      'startDate': '2026-05-27',
      'endDate': '2026-06-02',
      'timezone': 'Asia/Kolkata',
      'summary': {
        'windowDays': 7,
        'activeDays': 0,
        'mealCount': 0,
        'totals': zeroTotals,
        'trackedDayAverage': zeroTotals,
        'calendarDayAverage': zeroTotals,
      },
    },
  };
}

class _AnalyticsEvent {
  const _AnalyticsEvent(this.name, this.parameters);

  final String name;
  final Map<String, Object?> parameters;
}

class _RecordingAnalytics implements LogMyPlateAnalytics {
  bool initialized = false;
  final policies = <EngagementAnalyticsPolicy>[];
  final events = <_AnalyticsEvent>[];

  @override
  Future<void> initialize() async {
    initialized = true;
  }

  @override
  Future<void> applyPolicy(EngagementAnalyticsPolicy policy) async {
    policies.add(policy);
  }

  @override
  Future<void> logEvent(
    String name, {
    Map<String, Object?> parameters = const {},
    bool oncePerSession = false,
  }) async {
    events.add(_AnalyticsEvent(name, parameters));
  }
}
