import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

import '../models/captured_meal_photo.dart';
import '../models/auth_session.dart';
import '../models/chat.dart';
import '../models/meal.dart';
import 'account_session_store.dart';
import 'app_build_info.dart';
import 'device_identity_store.dart';

class LogMyPlateApiClient {
  LogMyPlateApiClient({
    http.Client? httpClient,
    String? baseUrl,
    Future<DeviceIdentity> Function()? loadDeviceIdentity,
    Future<AppBuildInfo> Function()? loadAppBuildInfo,
    Future<AuthSession?> Function()? loadAuthSession,
  }) : _httpClient = httpClient ?? http.Client(),
       _loadDeviceIdentity = loadDeviceIdentity ?? DeviceIdentityStore().load,
       _loadAppBuildInfo = loadAppBuildInfo ?? AppBuildInfoStore().load,
       _loadAuthSession = loadAuthSession ?? AccountSessionStore().load,
       baseUrl = LogMyPlateApiConfig.normalizeBaseUrl(
         baseUrl ?? LogMyPlateApiConfig.defaultBaseUrl,
       );

  final http.Client _httpClient;
  final Future<DeviceIdentity> Function() _loadDeviceIdentity;
  final Future<AppBuildInfo> Function() _loadAppBuildInfo;
  final Future<AuthSession?> Function() _loadAuthSession;
  final String baseUrl;

  void close() {
    _httpClient.close();
  }

  Future<TodayJournalData> fetchToday() async {
    final response = await _httpClient.get(
      Uri.parse('$baseUrl/v1/journal/today'),
      headers: await _headers(),
    );
    _throwIfBad(response);
    return TodayJournalData.fromJson(
      jsonDecode(response.body) as Map<String, dynamic>,
    );
  }

  Future<AppBootstrapData> fetchBootstrap() async {
    final response = await _httpClient.get(
      Uri.parse('$baseUrl/v1/app/bootstrap'),
      headers: await _headers(),
    );
    _throwIfBad(response);
    return AppBootstrapData.fromJson(
      jsonDecode(response.body) as Map<String, dynamic>,
    );
  }

  Future<void> registerPushToken({
    required String token,
    required String provider,
    required String platform,
    required String permissionStatus,
    bool? apnsSandbox,
  }) async {
    final body = <String, dynamic>{
      'provider': provider,
      'token': token,
      'platform': platform,
      'permissionStatus': permissionStatus,
    };
    if (apnsSandbox != null) body['apnsSandbox'] = apnsSandbox;
    final response = await _httpClient.put(
      Uri.parse('$baseUrl/v1/devices/push-token'),
      headers: await _headers(contentTypeJson: true),
      body: jsonEncode(body),
    );
    _throwIfBad(response);
  }

  Future<JournalRangeData> fetchJournalRange({
    int days = 7,
    int weekOffset = 0,
  }) async {
    final response = await _httpClient.get(
      Uri.parse('$baseUrl/v1/journal/range?days=$days&weekOffset=$weekOffset'),
      headers: await _headers(),
    );
    _throwIfBad(response);
    return JournalRangeData.fromJson(
      jsonDecode(response.body) as Map<String, dynamic>,
    );
  }

  Future<List<JournalWeekOption>> fetchJournalWeeks() async {
    final response = await _httpClient.get(
      Uri.parse('$baseUrl/v1/journal/weeks'),
      headers: await _headers(),
    );
    _throwIfBad(response);
    final payload = jsonDecode(response.body) as Map<String, dynamic>;
    return (payload['weeks'] as List<dynamic>)
        .map((week) => JournalWeekOption.fromJson(week as Map<String, dynamic>))
        .where((week) => week.activeDays > 0)
        .toList();
  }

  Future<ScanQuota> fetchQuota() async {
    final response = await _httpClient.get(
      Uri.parse('$baseUrl/v1/quota'),
      headers: await _headers(),
    );
    _throwIfBad(response);
    return ScanQuota.fromJson(
      jsonDecode(response.body) as Map<String, dynamic>,
    );
  }

  Future<SubscriptionStatus> fetchSubscription() async {
    final response = await _httpClient.get(
      Uri.parse('$baseUrl/v1/subscription'),
      headers: await _headers(),
    );
    _throwIfBad(response);
    return SubscriptionStatus.fromJson(
      jsonDecode(response.body) as Map<String, dynamic>,
    );
  }

  Future<SubscriptionStatus> syncRevenueCatSubscription({
    String? appUserId,
  }) async {
    final response = await _httpClient.post(
      Uri.parse('$baseUrl/v1/subscription/revenuecat/sync'),
      headers: await _headers(
        contentTypeJson: true,
        idempotencyKey:
            'subscription-sync-${DateTime.now().microsecondsSinceEpoch}',
      ),
      body: jsonEncode({
        if (appUserId != null && appUserId.trim().isNotEmpty)
          'appUserId': appUserId.trim(),
      }),
    );
    _throwIfBad(response);
    return SubscriptionStatus.fromJson(
      jsonDecode(response.body) as Map<String, dynamic>,
    );
  }

  Future<List<FoodSearchResult>> searchFoods(String query) async {
    final normalized = query.trim();
    if (normalized.length < 2) return const [];
    final uri = Uri.parse(
      '$baseUrl/v1/foods',
    ).replace(queryParameters: {'q': normalized});
    final response = await _httpClient.get(uri, headers: await _headers());
    _throwIfBad(response);
    final payload = jsonDecode(response.body) as Map<String, dynamic>;
    return (payload['results'] as List<dynamic>? ?? const [])
        .whereType<Map<String, dynamic>>()
        .map(FoodSearchResult.fromJson)
        .toList();
  }

  Future<RewardedAdCredit> completeRewardedAd({
    required String adUnitId,
    required String idempotencyKey,
    String? verificationToken,
    String? rewardType,
    int? rewardAmount,
  }) async {
    final payload = <String, dynamic>{
      'provider': 'admob',
      'placement': 'scan_unlock',
      if (adUnitId.isNotEmpty) 'adUnitId': adUnitId,
    };
    if (verificationToken != null && verificationToken.trim().isNotEmpty) {
      payload['verificationToken'] = verificationToken.trim();
    }
    if (rewardType != null) payload['rewardType'] = rewardType;
    if (rewardAmount != null) payload['rewardAmount'] = rewardAmount;

    final response = await _httpClient.post(
      Uri.parse('$baseUrl/v1/ads/rewarded/complete'),
      headers: await _headers(
        contentTypeJson: true,
        idempotencyKey: idempotencyKey,
      ),
      body: jsonEncode(payload),
    );
    _throwIfBad(response);
    return RewardedAdCredit.fromJson(
      jsonDecode(response.body) as Map<String, dynamic>,
    );
  }

  Future<AuthSession> signUpWithEmail({
    required String email,
    required String password,
  }) async {
    return _emailAuth(
      '/v1/auth/email/signup',
      email: email,
      password: password,
    );
  }

  Future<AuthSession> loginWithEmail({
    required String email,
    required String password,
  }) async {
    return _emailAuth('/v1/auth/email/login', email: email, password: password);
  }

  Future<void> requestPasswordReset({required String email}) async {
    final response = await _httpClient.post(
      Uri.parse('$baseUrl/v1/auth/email/password-reset/request'),
      headers: await _headers(contentTypeJson: true),
      body: jsonEncode({'email': email}),
    );
    _throwIfBad(response);
  }

  Future<AuthSession> confirmPasswordReset({
    required String email,
    required String code,
    required String password,
  }) async {
    final response = await _httpClient.post(
      Uri.parse('$baseUrl/v1/auth/email/password-reset/confirm'),
      headers: await _headers(contentTypeJson: true),
      body: jsonEncode({'email': email, 'code': code, 'password': password}),
    );
    _throwIfBad(response);
    return AuthSession.fromApiJson(
      jsonDecode(response.body) as Map<String, dynamic>,
    );
  }

  Future<AuthSession> signInWithOAuth({
    required AuthProvider provider,
    required String idToken,
    String? authorizationCode,
    String? nonce,
    String? displayName,
  }) async {
    final payload = <String, dynamic>{
      'provider': provider.name,
      'idToken': idToken,
    };
    if (authorizationCode != null) {
      payload['authorizationCode'] = authorizationCode;
    }
    if (nonce != null) payload['nonce'] = nonce;
    if (displayName != null) payload['displayName'] = displayName;

    final response = await _httpClient.post(
      Uri.parse('$baseUrl/v1/auth/oauth'),
      headers: await _headers(contentTypeJson: true),
      body: jsonEncode(payload),
    );
    _throwIfBad(response);
    return AuthSession.fromApiJson(
      jsonDecode(response.body) as Map<String, dynamic>,
    );
  }

  Future<void> logout() async {
    final response = await _httpClient.post(
      Uri.parse('$baseUrl/v1/auth/logout'),
      headers: await _headers(),
    );
    _throwIfBad(response);
  }

  Future<void> deactivateProfile({required String idempotencyKey}) async {
    final response = await _httpClient.post(
      Uri.parse('$baseUrl/v1/profiles/me/deactivate'),
      headers: await _headers(idempotencyKey: idempotencyKey),
    );
    _throwIfBad(response);
  }

  Future<void> deleteProfile({required String idempotencyKey}) async {
    final response = await _httpClient.delete(
      Uri.parse('$baseUrl/v1/profiles/me'),
      headers: await _headers(idempotencyKey: idempotencyKey),
    );
    _throwIfBad(response);
  }

  Future<HealthTarget> saveHealthTarget(
    HealthTargetInput input, {
    required String idempotencyKey,
  }) async {
    final response = await _httpClient.put(
      Uri.parse('$baseUrl/v1/profiles/me/health'),
      headers: await _headers(
        contentTypeJson: true,
        idempotencyKey: idempotencyKey,
      ),
      body: jsonEncode(input.toJson()),
    );
    _throwIfBad(response);
    final payload = jsonDecode(response.body) as Map<String, dynamic>;
    return HealthTarget.fromJson(
      payload['healthTarget'] as Map<String, dynamic>,
    );
  }

  Future<MealLog> createMeal({
    required MealType type,
    required String title,
    required List<MealItem> items,
    required String idempotencyKey,
  }) async {
    final response = await _httpClient.post(
      Uri.parse('$baseUrl/v1/meals'),
      headers: await _headers(
        contentTypeJson: true,
        idempotencyKey: idempotencyKey,
      ),
      body: jsonEncode({
        'mealType': type.name,
        'title': title,
        'loggedAt': DateTime.now().toUtc().toIso8601String(),
        'items': items
            .map(
              (item) => {
                'displayName': item.name,
                if (item.foodId != null) 'foodId': item.foodId,
                'quantity': item.quantity,
                'unit': item.unit,
                'grams': item.grams,
                'nutrition': item.nutrition.toJson(),
                'userEdited': true,
              },
            )
            .toList(),
      }),
    );
    _throwIfBad(response);
    return MealLog.fromJson(jsonDecode(response.body) as Map<String, dynamic>);
  }

  Future<MealLog> updateMeal({
    required String mealId,
    required MealType type,
    required String title,
    required List<MealItem> items,
    required String idempotencyKey,
  }) async {
    final response = await _httpClient.patch(
      Uri.parse('$baseUrl/v1/meals/$mealId'),
      headers: await _headers(
        contentTypeJson: true,
        idempotencyKey: idempotencyKey,
      ),
      body: jsonEncode({
        'mealType': type.name,
        'title': title,
        'items': items
            .map(
              (item) => {
                'displayName': item.name,
                if (item.foodId != null) 'foodId': item.foodId,
                'quantity': item.quantity,
                'unit': item.unit,
                'grams': item.grams,
                'nutrition': item.nutrition.toJson(),
                'userEdited': true,
              },
            )
            .toList(),
      }),
    );
    _throwIfBad(response);
    return MealLog.fromJson(jsonDecode(response.body) as Map<String, dynamic>);
  }

  Future<void> deleteMeal({
    required String mealId,
    required String idempotencyKey,
  }) async {
    final response = await _httpClient.delete(
      Uri.parse('$baseUrl/v1/meals/$mealId'),
      headers: await _headers(idempotencyKey: idempotencyKey),
    );
    _throwIfBad(response);
  }

  Future<PreparedScan> prepareScan({required String idempotencyKey}) async {
    final response = await _httpClient.post(
      Uri.parse('$baseUrl/v1/scans/prepare'),
      headers: await _headers(
        contentTypeJson: true,
        idempotencyKey: idempotencyKey,
      ),
      body: jsonEncode({}),
    );
    _throwIfBad(response);
    return PreparedScan.fromJson(
      jsonDecode(response.body) as Map<String, dynamic>,
    );
  }

  Future<ScanAnalysis> analyzeScan({
    required String scanId,
    required String idempotencyKey,
    CapturedMealPhoto? photo,
  }) async {
    final hint = photo?.userHint?.trim();
    final response = await _httpClient.post(
      Uri.parse('$baseUrl/v1/scans/$scanId/analyze'),
      headers: await _headers(
        contentTypeJson: true,
        idempotencyKey: idempotencyKey,
      ),
      body: jsonEncode({
        if (hint != null && hint.isNotEmpty) 'hint': hint,
        if (photo != null)
          'image': {
            'mimeType': photo.mimeType,
            'base64': base64Encode(photo.bytes),
            'byteSize': photo.byteSize,
          },
      }),
    );
    _throwIfBad(response);
    return ScanAnalysis.fromJson(
      jsonDecode(response.body) as Map<String, dynamic>,
    );
  }

  Future<ConfirmedScanMeal> confirmScan({
    required String scanId,
    required MealType type,
    required String title,
    required List<MealItem> items,
    required String idempotencyKey,
    CapturedMealPhoto? photo,
  }) async {
    final response = await _httpClient.post(
      Uri.parse('$baseUrl/v1/scans/$scanId/confirm'),
      headers: await _headers(
        contentTypeJson: true,
        idempotencyKey: idempotencyKey,
      ),
      body: jsonEncode({
        'mealType': type.name,
        'title': title,
        'items': items
            .map(
              (item) => {
                'name': item.name,
                'quantity': item.quantity,
                'unit': item.unit,
                'estimatedGrams': item.grams,
                'nutrition': item.nutrition.toJson(),
              },
            )
            .toList(),
        if (photo != null)
          'image': {
            'mimeType': photo.mimeType,
            'base64': base64Encode(photo.bytes),
            'byteSize': photo.byteSize,
          },
      }),
    );
    _throwIfBad(response);
    return ConfirmedScanMeal.fromJson(
      jsonDecode(response.body) as Map<String, dynamic>,
    );
  }

  void _throwIfBad(http.Response response) {
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw LogMyPlateApiException(response.statusCode, response.body);
    }
  }

  Future<ChatSession> createNutritionistSession({String? focusMealId}) async {
    final body = <String, dynamic>{};
    if (focusMealId != null) body['focusMealId'] = focusMealId;
    final response = await _httpClient.post(
      Uri.parse('$baseUrl/v1/chat/nutritionist/session'),
      headers: await _headers(contentTypeJson: true),
      body: jsonEncode(body),
    );
    _throwIfBad(response);
    return ChatSession.fromJson(
      jsonDecode(response.body) as Map<String, dynamic>,
    );
  }

  Future<ChatReply> sendNutritionistMessage({
    required String sessionId,
    required String message,
  }) async {
    final response = await _httpClient.post(
      Uri.parse('$baseUrl/v1/chat/nutritionist/message'),
      headers: await _headers(contentTypeJson: true),
      body: jsonEncode({
        'sessionId': sessionId,
        'message': message,
      }),
    );
    _throwIfBad(response);
    return ChatReply.fromJson(
      jsonDecode(response.body) as Map<String, dynamic>,
    );
  }

  Future<List<ChatSessionSummary>> listNutritionistSessions() async {
    final response = await _httpClient.get(
      Uri.parse('$baseUrl/v1/chat/nutritionist/sessions'),
      headers: await _headers(),
    );
    _throwIfBad(response);
    final body = jsonDecode(response.body) as Map<String, dynamic>;
    final list = body['sessions'] as List<dynamic>;
    return list
        .map((s) => ChatSessionSummary.fromJson(s as Map<String, dynamic>))
        .toList();
  }

  Future<List<ChatMessage>> getNutritionistSessionMessages(String sessionId) async {
    final response = await _httpClient.get(
      Uri.parse('$baseUrl/v1/chat/nutritionist/sessions/$sessionId/messages'),
      headers: await _headers(),
    );
    _throwIfBad(response);
    final body = jsonDecode(response.body) as Map<String, dynamic>;
    final list = body['messages'] as List<dynamic>;
    return list
        .map((m) => ChatMessage.fromJson(m as Map<String, dynamic>))
        .toList();
  }

  Future<Map<String, String>> _headers({
    bool contentTypeJson = false,
    String? idempotencyKey,
  }) async {
    final identity = await _loadDeviceIdentity();
    final appBuild = await _loadAppBuildInfo();
    final session = await _loadAuthSession();
    final headers = {
      ...identity.toHeaders(),
      ...appBuild.toHeaders(),
      if (session?.accessToken != null)
        'authorization': 'Bearer ${session!.accessToken}',
      if (contentTypeJson) 'content-type': 'application/json',
    };
    if (idempotencyKey != null) {
      headers['idempotency-key'] = idempotencyKey;
    }
    return headers;
  }

  Future<AuthSession> _emailAuth(
    String path, {
    required String email,
    required String password,
  }) async {
    final response = await _httpClient.post(
      Uri.parse('$baseUrl$path'),
      headers: await _headers(contentTypeJson: true),
      body: jsonEncode({'email': email, 'password': password}),
    );
    _throwIfBad(response);
    return AuthSession.fromApiJson(
      jsonDecode(response.body) as Map<String, dynamic>,
    );
  }
}

class LogMyPlateApiConfig {
  static const productionBaseUrl = 'https://logmyplate-api.vercel.app';

  static String get defaultBaseUrl {
    const configured = String.fromEnvironment('LOGMYPLATE_API_BASE_URL');
    return resolveBaseUrl(configured: configured);
  }

  @visibleForTesting
  static String resolveBaseUrl({required String configured}) {
    final configuredBaseUrl = normalizeBaseUrl(configured);
    if (configuredBaseUrl.isNotEmpty) return configuredBaseUrl;

    return productionBaseUrl;
  }

  static String normalizeBaseUrl(String value) {
    final trimmed = value.trim();
    if (trimmed.endsWith('/')) return trimmed.substring(0, trimmed.length - 1);
    return trimmed;
  }
}

class LogMyPlateApiException implements Exception {
  LogMyPlateApiException(this.statusCode, this.body);

  final int statusCode;
  final String body;

  String? get errorCode {
    try {
      final decoded = jsonDecode(body);
      if (decoded is Map<String, dynamic>) return decoded['error'] as String?;
    } catch (_) {
      return null;
    }
    return null;
  }

  String? get message {
    try {
      final decoded = jsonDecode(body);
      if (decoded is Map<String, dynamic>) return decoded['message'] as String?;
    } catch (_) {
      return null;
    }
    return null;
  }

  bool get retryable {
    try {
      final decoded = jsonDecode(body);
      if (decoded is Map<String, dynamic>) return decoded['retryable'] == true;
    } catch (_) {
      return statusCode >= 500;
    }
    return statusCode >= 500;
  }

  bool get isScanCreditRequired {
    return statusCode == 402 || errorCode == 'scan_credit_required';
  }

  @override
  String toString() => 'LogMyPlateApiException($statusCode): $body';
}
