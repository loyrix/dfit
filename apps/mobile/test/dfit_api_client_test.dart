import 'dart:convert';
import 'dart:typed_data';

import 'package:dfit_mobile/src/models/captured_meal_photo.dart';
import 'package:dfit_mobile/src/models/meal.dart';
import 'package:dfit_mobile/src/services/device_identity_store.dart';
import 'package:dfit_mobile/src/services/dfit_api_client.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';

void main() {
  Future<DeviceIdentity> testIdentity() async => const DeviceIdentity(
    installId: 'test-install',
    platform: 'ios',
    locale: 'en-IN',
    region: 'IN',
    timezone: 'Asia/Kolkata',
  );

  group('DFitApiConfig', () {
    test('uses explicit dart define value first', () {
      expect(
        DFitApiConfig.resolveBaseUrl(configured: ' https://example.test/api/ '),
        'https://example.test/api',
      );
    });

    test('uses production API by default', () {
      expect(
        DFitApiConfig.resolveBaseUrl(configured: ''),
        'https://dfit-api.vercel.app',
      );
    });
  });

  test('prepares and analyzes a scan', () async {
    final requests = <http.Request>[];
    final client = DFitApiClient(
      baseUrl: 'http://api.test',
      loadDeviceIdentity: testIdentity,
      httpClient: MockClient((request) async {
        requests.add(request);
        expect(request.headers['x-dfit-install-id'], 'test-install');
        if (request.url.path == '/v1/scans/prepare') {
          return http.Response(
            jsonEncode({
              'scanId': 'scan_1',
              'status': 'prepared',
              'quota': {
                'freeRemaining': 1,
                'rewardedRemaining': 2,
                'premiumRemaining': 0,
              },
            }),
            201,
          );
        }

        return http.Response(
          jsonEncode({
            'scanId': 'scan_1',
            'status': 'ready_for_review',
            'mealType': 'lunch',
            'mealName': 'Dal rice',
            'detectedLanguage': 'en-IN',
            'totals': {
              'calories': 390,
              'proteinG': 15,
              'carbsG': 70,
              'fatG': 6,
            },
            'items': [
              {
                'id': 'item_1',
                'name': 'Dal',
                'aliases': ['daal'],
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
          }),
          200,
        );
      }),
    );

    final prepared = await client.prepareScan(idempotencyKey: 'prepare-key');
    final analysis = await client.analyzeScan(
      scanId: prepared.scanId,
      idempotencyKey: 'analyze-key',
      photo: CapturedMealPhoto(
        bytes: Uint8List.fromList([1, 2, 3]),
        mimeType: 'image/jpeg',
        fileName: 'plate.jpg',
      ),
    );

    expect(prepared.scanId, 'scan_1');
    expect(prepared.quota.freeRemaining, 1);
    expect(analysis.mealType, MealType.lunch);
    expect(analysis.items.single.name, 'Dal');
    expect(jsonDecode(requests.last.body) as Map<String, dynamic>, {
      'image': {'mimeType': 'image/jpeg', 'base64': 'AQID', 'byteSize': 3},
    });
    expect(requests.map((request) => request.headers['idempotency-key']), [
      'prepare-key',
      'analyze-key',
    ]);
  });

  test('fetches quota with device identity headers', () async {
    final client = DFitApiClient(
      baseUrl: 'http://api.test',
      loadDeviceIdentity: testIdentity,
      httpClient: MockClient((request) async {
        expect(request.url.path, '/v1/quota');
        expect(request.headers['x-dfit-install-id'], 'test-install');
        return http.Response(
          jsonEncode({
            'freeRemaining': 2,
            'rewardedRemaining': 1,
            'premiumRemaining': 0,
          }),
          200,
        );
      }),
    );

    final quota = await client.fetchQuota();

    expect(quota.freeRemaining, 2);
    expect(quota.rewardedRemaining, 1);
    expect(quota.totalRemaining, 3);
  });

  test('confirms a scan meal', () async {
    final client = DFitApiClient(
      baseUrl: 'http://api.test',
      loadDeviceIdentity: testIdentity,
      httpClient: MockClient((request) async {
        expect(request.url.path, '/v1/scans/scan_1/confirm');
        expect(request.headers['idempotency-key'], 'confirm-key');

        final body = jsonDecode(request.body) as Map<String, dynamic>;
        expect(body['mealType'], 'lunch');
        expect((body['items'] as List<dynamic>).single['estimatedGrams'], 180);

        return http.Response(
          jsonEncode({
            'mealId': 'meal_1',
            'totals': {
              'calories': 180,
              'proteinG': 10.8,
              'carbsG': 25.2,
              'fatG': 5.4,
            },
          }),
          201,
        );
      }),
    );

    final confirmed = await client.confirmScan(
      scanId: 'scan_1',
      type: MealType.lunch,
      title: 'Dal rice',
      items: const [
        MealItem(
          name: 'Dal',
          quantity: 1,
          unit: 'katori',
          grams: 180,
          nutrition: MacroTotals(
            calories: 180,
            proteinG: 10.8,
            carbsG: 25.2,
            fatG: 5.4,
          ),
        ),
      ],
      idempotencyKey: 'confirm-key',
    );

    expect(confirmed.mealId, 'meal_1');
    expect(confirmed.totals.calories, 180);
  });
}
