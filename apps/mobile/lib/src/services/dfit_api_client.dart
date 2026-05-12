import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

import '../models/captured_meal_photo.dart';
import '../models/meal.dart';
import 'device_identity_store.dart';

class DFitApiClient {
  DFitApiClient({
    http.Client? httpClient,
    String? baseUrl,
    Future<DeviceIdentity> Function()? loadDeviceIdentity,
  }) : _httpClient = httpClient ?? http.Client(),
       _loadDeviceIdentity = loadDeviceIdentity ?? DeviceIdentityStore().load,
       baseUrl = DFitApiConfig.normalizeBaseUrl(
         baseUrl ?? DFitApiConfig.defaultBaseUrl,
       );

  final http.Client _httpClient;
  final Future<DeviceIdentity> Function() _loadDeviceIdentity;
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
    final response = await _httpClient.post(
      Uri.parse('$baseUrl/v1/scans/$scanId/analyze'),
      headers: await _headers(
        contentTypeJson: true,
        idempotencyKey: idempotencyKey,
      ),
      body: jsonEncode({
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
      }),
    );
    _throwIfBad(response);
    return ConfirmedScanMeal.fromJson(
      jsonDecode(response.body) as Map<String, dynamic>,
    );
  }

  void _throwIfBad(http.Response response) {
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw DFitApiException(response.statusCode, response.body);
    }
  }

  Future<Map<String, String>> _headers({
    bool contentTypeJson = false,
    String? idempotencyKey,
  }) async {
    final identity = await _loadDeviceIdentity();
    final headers = {
      ...identity.toHeaders(),
      if (contentTypeJson) 'content-type': 'application/json',
    };
    if (idempotencyKey != null) {
      headers['idempotency-key'] = idempotencyKey;
    }
    return headers;
  }
}

class DFitApiConfig {
  static const productionBaseUrl = 'https://dfit-api.vercel.app';

  static String get defaultBaseUrl {
    const configured = String.fromEnvironment('DFIT_API_BASE_URL');
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

class DFitApiException implements Exception {
  DFitApiException(this.statusCode, this.body);

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

  bool get isScanCreditRequired {
    return statusCode == 402 || errorCode == 'scan_credit_required';
  }

  @override
  String toString() => 'DFitApiException($statusCode): $body';
}
