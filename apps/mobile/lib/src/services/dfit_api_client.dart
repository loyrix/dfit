import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

import '../models/meal.dart';

class DFitApiClient {
  DFitApiClient({http.Client? httpClient, String? baseUrl})
    : _httpClient = httpClient ?? http.Client(),
      baseUrl = baseUrl ?? _defaultBaseUrl;

  final http.Client _httpClient;
  final String baseUrl;

  void close() {
    _httpClient.close();
  }

  static String get _defaultBaseUrl {
    const configured = String.fromEnvironment('DFIT_API_BASE_URL');
    if (configured.isNotEmpty) {
      return configured;
    }

    if (defaultTargetPlatform == TargetPlatform.android) {
      return 'http://10.0.2.2:4000';
    }

    return 'http://127.0.0.1:4000';
  }

  Future<TodayJournalData> fetchToday() async {
    final response = await _httpClient.get(
      Uri.parse('$baseUrl/v1/journal/today'),
    );
    _throwIfBad(response);
    return TodayJournalData.fromJson(
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
      headers: {
        'content-type': 'application/json',
        'idempotency-key': idempotencyKey,
      },
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
      headers: {
        'content-type': 'application/json',
        'idempotency-key': idempotencyKey,
      },
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
  }) async {
    final response = await _httpClient.post(
      Uri.parse('$baseUrl/v1/scans/$scanId/analyze'),
      headers: {
        'content-type': 'application/json',
        'idempotency-key': idempotencyKey,
      },
      body: jsonEncode({}),
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
      headers: {
        'content-type': 'application/json',
        'idempotency-key': idempotencyKey,
      },
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
}

class DFitApiException implements Exception {
  DFitApiException(this.statusCode, this.body);

  final int statusCode;
  final String body;

  @override
  String toString() => 'DFitApiException($statusCode): $body';
}
