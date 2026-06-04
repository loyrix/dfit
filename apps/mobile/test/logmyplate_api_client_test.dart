import 'dart:convert';
import 'dart:typed_data';

import 'package:logmyplate_mobile/src/models/captured_meal_photo.dart';
import 'package:logmyplate_mobile/src/models/auth_session.dart';
import 'package:logmyplate_mobile/src/models/meal.dart';
import 'package:logmyplate_mobile/src/services/app_build_info.dart';
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
  Future<AppBuildInfo> testBuildInfo() async =>
      const AppBuildInfo(platform: 'ios', version: '1.0.0', buildNumber: '12');

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

  test('registers push tokens with device headers', () async {
    late http.Request seenRequest;
    final client = LogMyPlateApiClient(
      baseUrl: 'http://api.test',
      loadDeviceIdentity: testIdentity,
      loadAppBuildInfo: testBuildInfo,
      httpClient: MockClient((request) async {
        seenRequest = request;
        return http.Response(jsonEncode({'registered': true}), 200);
      }),
    );

    await client.registerPushToken(
      token: 'fcm-token-with-enough-length',
      provider: 'fcm',
      platform: 'ios',
      permissionStatus: 'authorized',
    );

    expect(seenRequest.method, 'PUT');
    expect(seenRequest.url.path, '/v1/devices/push-token');
    expect(seenRequest.headers['x-logmyplate-install-id'], 'test-install');
    expect(seenRequest.headers['content-type'], 'application/json');
    expect(jsonDecode(seenRequest.body), {
      'provider': 'fcm',
      'token': 'fcm-token-with-enough-length',
      'platform': 'ios',
      'permissionStatus': 'authorized',
    });
  });

  test('prepares and analyzes a scan', () async {
    final requests = <http.Request>[];
    final client = LogMyPlateApiClient(
      baseUrl: 'http://api.test',
      loadDeviceIdentity: testIdentity,
      loadAppBuildInfo: testBuildInfo,
      httpClient: MockClient((request) async {
        requests.add(request);
        expect(request.headers['x-logmyplate-install-id'], 'test-install');
        expect(request.headers['x-logmyplate-app-version'], '1.0.0');
        expect(request.headers['x-logmyplate-app-build'], '12');
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

  test('searches foods and parses portion nutrition', () async {
    final client = LogMyPlateApiClient(
      baseUrl: 'http://api.test',
      loadDeviceIdentity: testIdentity,
      httpClient: MockClient((request) async {
        expect(request.url.path, '/v1/foods');
        expect(request.url.queryParameters['q'], 'chicken curry');
        expect(request.headers['x-logmyplate-install-id'], 'test-install');
        return http.Response(
          jsonEncode({
            'query': 'chicken curry',
            'results': [
              {
                'id': 'food-chicken-curry',
                'canonicalName': 'Chicken Curry',
                'region': 'IN',
                'aliases': ['chicken masala'],
                'source': 'seed',
                'nutritionPer100g': {
                  'calories': 180,
                  'proteinG': 16,
                  'carbsG': 5,
                  'fatG': 11,
                },
                'portions': [
                  {'unit': 'serving', 'grams': 180, 'confidence': 0.86},
                ],
                'matchedAlias': 'chicken curry',
                'score': 100,
              },
            ],
          }),
          200,
        );
      }),
    );

    final results = await client.searchFoods(' chicken curry ');

    expect(results.single.canonicalName, 'Chicken Curry');
    expect(results.single.bestPortion.grams, 180);
    expect(results.single.toMealItem().nutrition.calories, 324);
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
          'verificationToken': 'reward-token-123456',
          'rewardType': 'coin',
          'rewardAmount': 1,
        });
        return http.Response(
          jsonEncode({
            'grantedScan': true,
            'adsWatchedToday': 1,
            'adsNeededForNextScan': 1,
            'scansGrantedToday': 1,
            'dailyScanLimit': 5,
            'adsPerScan': 1,
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
      verificationToken: 'reward-token-123456',
      rewardType: 'coin',
      rewardAmount: 1,
    );

    expect(reward.grantedScan, isTrue);
    expect(reward.adsWatchedToday, 1);
    expect(reward.adsPerScan, 1);
    expect(reward.dailyScanLimit, 5);
    expect(reward.quota.rewardedRemaining, 1);
  });

  test('fetches app bootstrap data in one request', () async {
    final client = LogMyPlateApiClient(
      baseUrl: 'http://api.test',
      loadDeviceIdentity: testIdentity,
      loadAppBuildInfo: testBuildInfo,
      httpClient: MockClient((request) async {
        expect(request.url.path, '/v1/app/bootstrap');
        expect(request.headers['x-logmyplate-install-id'], 'test-install');
        expect(request.headers['x-logmyplate-app-version'], '1.0.0');
        expect(request.headers['x-logmyplate-app-build'], '12');
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
            'updatePolicy': {
              'status': 'optional',
              'platform': 'ios',
              'currentBuild': 12,
              'latestBuild': 14,
              'minSupportedBuild': 10,
              'latestVersion': '1.0.1',
              'storeUrl': 'https://apps.apple.com/app/id6770872606',
              'title': 'Update available',
              'message': 'A newer LogMyPlate version is ready.',
            },
            'engagementPolicy': {
              'analytics': {
                'enabled': true,
                'firebaseEnabled': true,
                'debugLogging': true,
                'sampleRatePercent': 25,
                'events': {
                  'appOpen': true,
                  'bootstrapLoaded': true,
                  'tabSelected': true,
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
              'reviewPrompt': {
                'enabled': true,
                'minConfirmedScans': 4,
                'minActiveDays': 3,
                'cooldownDays': 45,
                'oncePerAppVersion': true,
                'storeUrls': {
                  'ios': 'https://apps.apple.com/app/id6770872606',
                  'android':
                      'https://play.google.com/store/apps/details?id=com.logmyplate.app',
                },
                'copy': {
                  'title': 'Enjoying LogMyPlate?',
                  'body': 'A quick review helps us improve.',
                  'positiveLabel': 'Rate now',
                  'negativeLabel': 'Maybe later',
                },
              },
              'interstitialAds': {
                'enabled': true,
                'freeUsersOnly': true,
                'premiumExcluded': true,
                'minConfirmedScansBeforeFirstAd': 3,
                'scansBetweenAds': 4,
                'cooldownMinutes': 15,
                'dailyCap': 2,
                'adUnitIds': {
                  'ios': 'ca-app-pub-123/ios-interstitial',
                  'android': 'ca-app-pub-123/android-interstitial',
                },
              },
              'notifications': {
                'enabled': true,
                'dailyCap': 1,
                'quietHours': {'start': '21:30', 'end': '06:30'},
                'scenarios': {
                  'breakfast': {
                    'enabled': true,
                    'windowStart': '08:00',
                    'windowEnd': '09:30',
                    'title': 'Breakfast?',
                    'body': 'Log breakfast before the day runs away.',
                    'requiresTarget': false,
                    'onlyIfTargetNotReached': true,
                  },
                  'lunch': {
                    'enabled': true,
                    'windowStart': '13:00',
                    'windowEnd': '14:30',
                    'title': 'Lunch?',
                    'body': 'Log lunch while it is fresh.',
                    'requiresTarget': true,
                    'onlyIfTargetNotReached': true,
                  },
                },
              },
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
    expect(bootstrap.updatePolicy.status, AppUpdateStatus.optional);
    expect(bootstrap.updatePolicy.latestBuild, 14);
    expect(bootstrap.engagementPolicy.analytics.enabled, isTrue);
    expect(bootstrap.engagementPolicy.analytics.firebaseEnabled, isTrue);
    expect(bootstrap.engagementPolicy.analytics.debugLogging, isTrue);
    expect(bootstrap.engagementPolicy.analytics.sampleRatePercent, 25);
    expect(
      bootstrap.engagementPolicy.analytics.events.isEnabled('tab_selected'),
      isTrue,
    );
    expect(bootstrap.engagementPolicy.reviewPrompt.enabled, isTrue);
    expect(bootstrap.engagementPolicy.reviewPrompt.minConfirmedScans, 4);
    expect(bootstrap.engagementPolicy.reviewPrompt.minActiveDays, 3);
    expect(bootstrap.engagementPolicy.reviewPrompt.cooldownDays, 45);
    expect(
      bootstrap.engagementPolicy.reviewPrompt.storeUrls.android,
      'https://play.google.com/store/apps/details?id=com.logmyplate.app',
    );
    expect(
      bootstrap.engagementPolicy.reviewPrompt.copy.positiveLabel,
      'Rate now',
    );
    expect(bootstrap.engagementPolicy.interstitialAds.enabled, isTrue);
    expect(
      bootstrap.engagementPolicy.interstitialAds.minConfirmedScansBeforeFirstAd,
      3,
    );
    expect(bootstrap.engagementPolicy.interstitialAds.scansBetweenAds, 4);
    expect(bootstrap.engagementPolicy.interstitialAds.cooldownMinutes, 15);
    expect(bootstrap.engagementPolicy.interstitialAds.dailyCap, 2);
    expect(
      bootstrap.engagementPolicy.interstitialAds.adUnitIds.ios,
      'ca-app-pub-123/ios-interstitial',
    );
    expect(bootstrap.engagementPolicy.notifications.enabled, isTrue);
    expect(bootstrap.engagementPolicy.notifications.dailyCap, 1);
    expect(bootstrap.engagementPolicy.notifications.quietHours.start, '21:30');
    expect(
      bootstrap.engagementPolicy.notifications.scenarios.breakfast.title,
      'Breakfast?',
    );
    expect(
      bootstrap.engagementPolicy.notifications.scenarios.lunch.requiresTarget,
      isTrue,
    );
    expect(bootstrap.today.target?.calories, 2238);
    expect(bootstrap.weeklyRange.target?.calories, 2238);
    expect(bootstrap.today.meals.single.title, 'Dal rice');
    expect(bootstrap.weeklyRange.summary.trackedDayAverage.calories, 180);
  });

  test(
    'uses disabled engagement policy defaults for legacy bootstrap payloads',
    () {
      final bootstrap = AppBootstrapData.fromJson({
        'serverTime': '2026-05-12T10:00:00.000Z',
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
          'totals': {'calories': 0, 'proteinG': 0, 'carbsG': 0, 'fatG': 0},
          'meals': [],
        },
        'weeklyRange': {
          'startDate': '2026-05-06',
          'endDate': '2026-05-12',
          'days': [],
          'summary': {
            'windowDays': 7,
            'activeDays': 0,
            'mealCount': 0,
            'totals': {'calories': 0, 'proteinG': 0, 'carbsG': 0, 'fatG': 0},
            'trackedDayAverage': {
              'calories': 0,
              'proteinG': 0,
              'carbsG': 0,
              'fatG': 0,
            },
            'calendarDayAverage': {
              'calories': 0,
              'proteinG': 0,
              'carbsG': 0,
              'fatG': 0,
            },
          },
        },
      });

      expect(bootstrap.engagementPolicy.analytics.enabled, isFalse);
      expect(bootstrap.engagementPolicy.analytics.firebaseEnabled, isFalse);
      expect(bootstrap.engagementPolicy.reviewPrompt.enabled, isFalse);
      expect(bootstrap.engagementPolicy.reviewPrompt.minConfirmedScans, 3);
      expect(bootstrap.engagementPolicy.interstitialAds.enabled, isFalse);
      expect(bootstrap.engagementPolicy.interstitialAds.dailyCap, 3);
      expect(bootstrap.engagementPolicy.notifications.enabled, isFalse);
      expect(bootstrap.engagementPolicy.notifications.dailyCap, 2);
      expect(
        bootstrap.engagementPolicy.notifications.scenarios.lunch.requiresTarget,
        isTrue,
      );
      expect(
        bootstrap.engagementPolicy.analytics.events.isEnabled('scan_started'),
        isTrue,
      );
    },
  );

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

  test('sends password reset request and confirmation payloads', () async {
    var requestCount = 0;
    final client = LogMyPlateApiClient(
      baseUrl: 'http://api.test',
      loadDeviceIdentity: testIdentity,
      httpClient: MockClient((request) async {
        requestCount += 1;

        if (requestCount == 1) {
          expect(request.url.path, '/v1/auth/email/password-reset/request');
          expect(jsonDecode(request.body), {'email': 'friend@test.com'});
          return http.Response(jsonEncode({'status': 'accepted'}), 202);
        }

        expect(request.url.path, '/v1/auth/email/password-reset/confirm');
        expect(jsonDecode(request.body), {
          'email': 'friend@test.com',
          'code': '123456',
          'password': 'secret2',
        });
        return http.Response(
          jsonEncode({
            'profile': {
              'id': 'profile_2',
              'authMethod': 'email',
              'email': 'friend@test.com',
              'timezone': 'Asia/Kolkata',
              'linkedAt': '2026-05-28T10:00:00.000Z',
              'createdAt': '2026-05-13T10:00:00.000Z',
            },
            'accessToken': 'token_reset',
            'expiresAt': '2026-06-27T10:00:00.000Z',
          }),
          200,
        );
      }),
    );

    await client.requestPasswordReset(email: 'friend@test.com');
    final session = await client.confirmPasswordReset(
      email: 'friend@test.com',
      code: '123456',
      password: 'secret2',
    );

    expect(requestCount, 2);
    expect(session.accessToken, 'token_reset');
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
