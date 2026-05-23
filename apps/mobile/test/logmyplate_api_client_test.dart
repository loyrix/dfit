import 'dart:convert';
import 'dart:typed_data';

import 'package:logmyplate_mobile/src/models/captured_meal_photo.dart';
import 'package:logmyplate_mobile/src/models/auth_session.dart';
import 'package:logmyplate_mobile/src/models/meal.dart';
import 'package:logmyplate_mobile/src/services/device_identity_store.dart';
import 'package:logmyplate_mobile/src/services/logmyplate_api_client.dart';
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

  group('LogMyPlateApiConfig', () {
    test('uses explicit dart define value first', () {
      expect(
        LogMyPlateApiConfig.resolveBaseUrl(
          configured: ' https://example.test/api/ ',
        ),
        'https://example.test/api',
      );
    });

    test('uses production API by default', () {
      expect(
        LogMyPlateApiConfig.resolveBaseUrl(configured: ''),
        'https://logmyplate-api.vercel.app',
      );
    });
  });

  test('classifies scan credit required API errors', () {
    final error = LogMyPlateApiException(
      402,
      jsonEncode({'error': 'scan_credit_required'}),
    );

    expect(error.errorCode, 'scan_credit_required');
    expect(error.isScanCreditRequired, isTrue);
  });

  test('reads API error messages and retry hints', () {
    final error = LogMyPlateApiException(
      504,
      jsonEncode({
        'error': 'ai_provider_timeout',
        'message': 'Gemini analysis timed out.',
        'retryable': true,
      }),
    );

    expect(error.errorCode, 'ai_provider_timeout');
    expect(error.message, 'Gemini analysis timed out.');
    expect(error.retryable, isTrue);
  });

  test('prepares and analyzes a scan', () async {
    final requests = <http.Request>[];
    final client = LogMyPlateApiClient(
      baseUrl: 'http://api.test',
      loadDeviceIdentity: testIdentity,
      httpClient: MockClient((request) async {
        requests.add(request);
        expect(request.headers['x-logmyplate-install-id'], 'test-install');
        if (request.url.path == '/v1/scans/prepare') {
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

        return http.Response(
          jsonEncode({
            'scanId': 'scan_1',
            'status': 'ready_for_review',
            'mealType': 'lunch',
            'mealName': 'Dal rice',
            'detectedLanguage': 'en-IN',
            'imageStored': true,
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
        userHint: 'dal rice roti',
      ),
    );

    expect(prepared.scanId, 'scan_1');
    expect(prepared.quota.freeRemaining, 3);
    expect(analysis.mealType, MealType.lunch);
    expect(analysis.imageStored, isTrue);
    expect(analysis.items.single.name, 'Dal');
    expect(jsonDecode(requests.last.body) as Map<String, dynamic>, {
      'hint': 'dal rice roti',
      'image': {'mimeType': 'image/jpeg', 'base64': 'AQID', 'byteSize': 3},
    });
    expect(requests.map((request) => request.headers['idempotency-key']), [
      'prepare-key',
      'analyze-key',
    ]);
  });

  test('fetches quota with device identity headers', () async {
    final client = LogMyPlateApiClient(
      baseUrl: 'http://api.test',
      loadDeviceIdentity: testIdentity,
      httpClient: MockClient((request) async {
        expect(request.url.path, '/v1/quota');
        expect(request.headers['x-logmyplate-install-id'], 'test-install');
        return http.Response(
          jsonEncode({
            'freeRemaining': 3,
            'rewardedRemaining': 0,
            'premiumRemaining': 0,
          }),
          200,
        );
      }),
    );

    final quota = await client.fetchQuota();

    expect(quota.freeRemaining, 3);
    expect(quota.rewardedRemaining, 0);
    expect(quota.totalRemaining, 3);
  });

  test('records rewarded ad completion with idempotency headers', () async {
    final client = LogMyPlateApiClient(
      baseUrl: 'http://api.test',
      loadDeviceIdentity: testIdentity,
      httpClient: MockClient((request) async {
        expect(request.url.path, '/v1/ads/rewarded/complete');
        expect(request.headers['x-logmyplate-install-id'], 'test-install');
        expect(request.headers['idempotency-key'], 'ad-reward-key');
        expect(jsonDecode(request.body), {
          'provider': 'admob',
          'placement': 'scan_unlock',
          'adUnitId': 'ca-app-pub-3940256099942544/1712485313',
          'rewardType': 'coin',
          'rewardAmount': 1,
        });
        return http.Response(
          jsonEncode({
            'grantedScan': true,
            'adsWatchedToday': 3,
            'adsNeededForNextScan': 3,
            'scansGrantedToday': 1,
            'dailyScanLimit': 5,
            'adsPerScan': 3,
            'quota': {
              'freeRemaining': 0,
              'rewardedRemaining': 1,
              'premiumRemaining': 0,
            },
          }),
          200,
        );
      }),
    );

    final reward = await client.completeRewardedAd(
      adUnitId: 'ca-app-pub-3940256099942544/1712485313',
      idempotencyKey: 'ad-reward-key',
      rewardType: 'coin',
      rewardAmount: 1,
    );

    expect(reward.grantedScan, isTrue);
    expect(reward.adsWatchedToday, 3);
    expect(reward.adsPerScan, 3);
    expect(reward.dailyScanLimit, 5);
    expect(reward.quota.rewardedRemaining, 1);
  });

  test('fetches app bootstrap data in one request', () async {
    final client = LogMyPlateApiClient(
      baseUrl: 'http://api.test',
      loadDeviceIdentity: testIdentity,
      httpClient: MockClient((request) async {
        expect(request.url.path, '/v1/app/bootstrap');
        expect(request.headers['x-logmyplate-install-id'], 'test-install');
        return http.Response(
          jsonEncode({
            'serverTime': '2026-05-12T10:00:00.000Z',
            'profile': {
              'id': 'profile_1',
              'authMethod': 'anonymous',
              'timezone': 'Asia/Kolkata',
              'createdAt': '2026-05-12T10:00:00.000Z',
            },
            'quota': {
              'freeRemaining': 3,
              'rewardedRemaining': 0,
              'premiumRemaining': 0,
            },
            'healthTarget': {
              'profileId': 'profile_1',
              'heightCm': 170,
              'weightKg': 70,
              'ageYears': 28,
              'sex': 'male',
              'activityLevel': 'light',
              'goal': 'maintain',
              'bmi': 24.2,
              'bmiCategory': 'healthy',
              'bmrCalories': 1628,
              'dailyCalorieTarget': 2238,
              'formula': 'mifflin_st_jeor_v1',
            },
            'today': {
              'date': '2026-05-12',
              'timezone': 'Asia/Kolkata',
              'totals': {
                'calories': 180,
                'proteinG': 10.8,
                'carbsG': 25.2,
                'fatG': 5.4,
              },
              'target': {
                'calories': 2238,
                'proteinG': 0,
                'carbsG': 0,
                'fatG': 0,
              },
              'meals': [
                {
                  'id': 'meal_1',
                  'mealType': 'lunch',
                  'title': 'Dal rice',
                  'loggedAt': '2026-05-12T09:00:00.000Z',
                  'items': [
                    {
                      'displayName': 'Dal',
                      'quantity': 1,
                      'unit': 'katori',
                      'grams': 180,
                      'nutrition': {
                        'calories': 180,
                        'proteinG': 10.8,
                        'carbsG': 25.2,
                        'fatG': 5.4,
                      },
                    },
                  ],
                },
              ],
            },
            'weeklySummary': {
              'startDate': '2026-05-06',
              'endDate': '2026-05-12',
              'timezone': 'Asia/Kolkata',
              'target': {
                'calories': 2238,
                'proteinG': 0,
                'carbsG': 0,
                'fatG': 0,
              },
              'summary': {
                'windowDays': 7,
                'activeDays': 1,
                'mealCount': 1,
                'totals': {
                  'calories': 180,
                  'proteinG': 10.8,
                  'carbsG': 25.2,
                  'fatG': 5.4,
                },
                'trackedDayAverage': {
                  'calories': 180,
                  'proteinG': 10.8,
                  'carbsG': 25.2,
                  'fatG': 5.4,
                },
                'calendarDayAverage': {
                  'calories': 26,
                  'proteinG': 1.5,
                  'carbsG': 3.6,
                  'fatG': 0.8,
                },
              },
            },
          }),
          200,
        );
      }),
    );

    final bootstrap = await client.fetchBootstrap();

    expect(bootstrap.profile.authMethod, 'anonymous');
    expect(bootstrap.quota.totalRemaining, 3);
    expect(bootstrap.healthTarget?.dailyCalorieTarget, 2238);
    expect(bootstrap.today.target?.calories, 2238);
    expect(bootstrap.weeklyRange.target?.calories, 2238);
    expect(bootstrap.today.meals.single.title, 'Dal rice');
    expect(bootstrap.weeklyRange.summary.trackedDayAverage.calories, 180);
  });

  test('saves health targets with account auth headers', () async {
    final client = LogMyPlateApiClient(
      baseUrl: 'http://api.test',
      loadDeviceIdentity: testIdentity,
      loadAuthSession: () async => AuthSession(
        provider: AuthProvider.email,
        displayName: 'friend@test.com',
        linkedAt: DateTime(2026, 5, 13),
        profileId: 'profile_1',
        accessToken: 'token_existing',
      ),
      httpClient: MockClient((request) async {
        expect(request.url.path, '/v1/profiles/me/health');
        expect(request.method, 'PUT');
        expect(request.headers['authorization'], 'Bearer token_existing');
        expect(request.headers['idempotency-key'], 'health-key');
        final body = jsonDecode(request.body) as Map<String, dynamic>;
        expect((body['heightCm'] as num).toDouble(), 170);
        expect((body['weightKg'] as num).toDouble(), 70);
        expect(body, containsPair('ageYears', 28));
        expect(body, containsPair('sex', 'male'));
        expect(body, containsPair('activityLevel', 'light'));
        expect(body, containsPair('goal', 'maintain'));

        return http.Response(
          jsonEncode({
            'healthTarget': {
              'profileId': 'profile_1',
              'heightCm': 170,
              'weightKg': 70,
              'ageYears': 28,
              'sex': 'male',
              'activityLevel': 'light',
              'goal': 'maintain',
              'bmi': 24.2,
              'bmiCategory': 'healthy',
              'bmrCalories': 1628,
              'dailyCalorieTarget': 2238,
              'formula': 'mifflin_st_jeor_v1',
            },
          }),
          200,
        );
      }),
    );

    final target = await client.saveHealthTarget(
      const HealthTargetInput(
        heightCm: 170,
        weightKg: 70,
        ageYears: 28,
        sex: HealthSex.male,
        activityLevel: ActivityLevel.light,
        goal: HealthGoal.maintain,
      ),
      idempotencyKey: 'health-key',
    );

    expect(target.bmi, 24.2);
    expect(target.friendlyBmiCategory, 'Balanced range');
    expect(target.dailyTargetTotals.calories, 2238);
  });

  test('sends account lifecycle requests with account auth headers', () async {
    final paths = <String>[];
    final client = LogMyPlateApiClient(
      baseUrl: 'http://api.test',
      loadDeviceIdentity: testIdentity,
      loadAuthSession: () async => AuthSession(
        provider: AuthProvider.email,
        displayName: 'friend@test.com',
        linkedAt: DateTime(2026, 5, 13),
        profileId: 'profile_1',
        accessToken: 'token_existing',
      ),
      httpClient: MockClient((request) async {
        paths.add('${request.method} ${request.url.path}');
        expect(request.headers['authorization'], 'Bearer token_existing');
        expect(request.headers['x-logmyplate-install-id'], 'test-install');
        expect(request.headers['idempotency-key'], isNotEmpty);
        return http.Response('', 204);
      }),
    );

    await client.deactivateProfile(idempotencyKey: 'deactivate-key');
    await client.deleteProfile(idempotencyKey: 'delete-profile-key');

    expect(paths, [
      'POST /v1/profiles/me/deactivate',
      'DELETE /v1/profiles/me',
    ]);
  });

  test('parses legacy journal summary payloads during API rollout', () async {
    final client = LogMyPlateApiClient(
      baseUrl: 'http://api.test',
      loadDeviceIdentity: testIdentity,
      httpClient: MockClient((request) async {
        expect(request.url.path, '/v1/app/bootstrap');
        return http.Response(
          jsonEncode({
            'serverTime': '2026-05-12T09:00:00.000Z',
            'profile': {
              'id': 'profile_1',
              'authMethod': 'anonymous',
              'timezone': 'Asia/Kolkata',
            },
            'quota': {
              'freeRemaining': 3,
              'rewardedRemaining': 0,
              'premiumRemaining': 0,
            },
            'today': {
              'date': '2026-05-12',
              'timezone': 'Asia/Kolkata',
              'totals': {
                'calories': 180,
                'proteinG': 10.8,
                'carbsG': 25.2,
                'fatG': 5.4,
              },
              'meals': [],
            },
            'weeklyRange': {
              'startDate': '2026-05-06',
              'endDate': '2026-05-12',
              'timezone': 'Asia/Kolkata',
              'days': [],
              'summary': {
                'windowDays': 7,
                'activeDays': 1,
                'mealCount': 1,
                'totals': {
                  'calories': 180,
                  'proteinG': 10.8,
                  'carbsG': 25.2,
                  'fatG': 5.4,
                },
                'dailyAverage': {
                  'calories': 180,
                  'proteinG': 10.8,
                  'carbsG': 25.2,
                  'fatG': 5.4,
                },
              },
            },
          }),
          200,
        );
      }),
    );

    final bootstrap = await client.fetchBootstrap();

    expect(bootstrap.weeklyRange.summary.trackedDayAverage.calories, 180);
    expect(bootstrap.weeklyRange.summary.calendarDayAverage.calories, 26);
  });

  test('sends account token and parses email signup sessions', () async {
    final client = LogMyPlateApiClient(
      baseUrl: 'http://api.test',
      loadDeviceIdentity: testIdentity,
      loadAuthSession: () async => AuthSession(
        provider: AuthProvider.email,
        displayName: 'friend@test.com',
        linkedAt: DateTime(2026, 5, 13),
        profileId: 'profile_1',
        accessToken: 'token_existing',
      ),
      httpClient: MockClient((request) async {
        expect(request.url.path, '/v1/auth/email/signup');
        expect(request.headers['authorization'], 'Bearer token_existing');
        expect(jsonDecode(request.body), {
          'email': 'friend@test.com',
          'password': 'secret1',
        });
        return http.Response(
          jsonEncode({
            'profile': {
              'id': 'profile_2',
              'authMethod': 'email',
              'email': 'friend@test.com',
              'timezone': 'Asia/Kolkata',
              'linkedAt': '2026-05-13T10:00:00.000Z',
              'createdAt': '2026-05-13T10:00:00.000Z',
            },
            'accessToken': 'token_created',
            'expiresAt': '2026-06-12T10:00:00.000Z',
          }),
          201,
        );
      }),
    );

    final session = await client.signUpWithEmail(
      email: 'friend@test.com',
      password: 'secret1',
    );

    expect(session.profileId, 'profile_2');
    expect(session.displayName, 'friend@test.com');
    expect(session.accessToken, 'token_created');
  });

  test('fetches seven day journal range', () async {
    final client = LogMyPlateApiClient(
      baseUrl: 'http://api.test',
      loadDeviceIdentity: testIdentity,
      httpClient: MockClient((request) async {
        expect(request.url.path, '/v1/journal/range');
        expect(request.url.queryParameters['days'], '7');
        expect(request.url.queryParameters['weekOffset'], '0');
        return http.Response(
          jsonEncode({
            'startDate': '2026-05-06',
            'endDate': '2026-05-12',
            'timezone': 'Asia/Kolkata',
            'days': [
              {
                'date': '2026-05-12',
                'mealCount': 1,
                'totals': {
                  'calories': 180,
                  'proteinG': 10.8,
                  'carbsG': 25.2,
                  'fatG': 5.4,
                },
                'meals': [],
              },
            ],
            'summary': {
              'windowDays': 7,
              'activeDays': 1,
              'mealCount': 1,
              'totals': {
                'calories': 180,
                'proteinG': 10.8,
                'carbsG': 25.2,
                'fatG': 5.4,
              },
              'trackedDayAverage': {
                'calories': 180,
                'proteinG': 10.8,
                'carbsG': 25.2,
                'fatG': 5.4,
              },
              'calendarDayAverage': {
                'calories': 26,
                'proteinG': 1.5,
                'carbsG': 3.6,
                'fatG': 0.8,
              },
            },
          }),
          200,
        );
      }),
    );

    final range = await client.fetchJournalRange();

    expect(range.summary.windowDays, 7);
    expect(range.summary.trackedDayAverage.calories, 180);
    expect(range.days.single.mealCount, 1);
  });

  test('fetches only available journal weeks', () async {
    final client = LogMyPlateApiClient(
      baseUrl: 'http://api.test',
      loadDeviceIdentity: testIdentity,
      httpClient: MockClient((request) async {
        expect(request.url.path, '/v1/journal/weeks');
        return http.Response(
          jsonEncode({
            'weeks': [
              {
                'weekOffset': 0,
                'startDate': '2026-05-06',
                'endDate': '2026-05-12',
                'activeDays': 1,
              },
              {
                'weekOffset': 1,
                'startDate': '2026-04-29',
                'endDate': '2026-05-05',
                'activeDays': 0,
              },
              {
                'weekOffset': 2,
                'startDate': '2026-04-22',
                'endDate': '2026-04-28',
                'activeDays': 3,
              },
            ],
          }),
          200,
        );
      }),
    );

    final weeks = await client.fetchJournalWeeks();

    expect(weeks, hasLength(2));
    expect(weeks.last.weekOffset, 2);
    expect(weeks.last.activeDays, 3);
  });

  test('confirms a scan meal', () async {
    final client = LogMyPlateApiClient(
      baseUrl: 'http://api.test',
      loadDeviceIdentity: testIdentity,
      httpClient: MockClient((request) async {
        expect(request.url.path, '/v1/scans/scan_1/confirm');
        expect(request.headers['idempotency-key'], 'confirm-key');

        final body = jsonDecode(request.body) as Map<String, dynamic>;
        expect(body['mealType'], 'lunch');
        expect((body['items'] as List<dynamic>).single['estimatedGrams'], 180);
        expect(body.containsKey('image'), isFalse);

        return http.Response(
          jsonEncode({
            'mealId': 'meal_1',
            'totals': {
              'calories': 180,
              'proteinG': 10.8,
              'carbsG': 25.2,
              'fatG': 5.4,
            },
            'meal': {
              'id': 'meal_1',
              'mealType': 'lunch',
              'title': 'Dal rice',
              'loggedAt': '2026-05-12T09:00:00.000Z',
              'items': [
                {
                  'displayName': 'Dal',
                  'quantity': 1,
                  'unit': 'katori',
                  'grams': 180,
                  'nutrition': {
                    'calories': 180,
                    'proteinG': 10.8,
                    'carbsG': 25.2,
                    'fatG': 5.4,
                  },
                },
              ],
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
    expect(confirmed.meal?.title, 'Dal rice');
    expect(confirmed.meal?.items.single.name, 'Dal');
  });
}
