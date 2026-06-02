import 'dart:async';
import 'dart:math';

import 'package:firebase_analytics/firebase_analytics.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart';

import '../models/meal.dart';
import 'app_diagnostics.dart';

abstract class LogMyPlateAnalytics {
  Future<void> initialize();

  Future<void> applyPolicy(EngagementAnalyticsPolicy policy);

  Future<void> logEvent(
    String name, {
    Map<String, Object?> parameters = const {},
    bool oncePerSession = false,
  });
}

class NoopLogMyPlateAnalytics implements LogMyPlateAnalytics {
  const NoopLogMyPlateAnalytics();

  @override
  Future<void> initialize() async {}

  @override
  Future<void> applyPolicy(EngagementAnalyticsPolicy policy) async {}

  @override
  Future<void> logEvent(
    String name, {
    Map<String, Object?> parameters = const {},
    bool oncePerSession = false,
  }) async {}
}

class LogMyPlateFirebaseAnalytics implements LogMyPlateAnalytics {
  LogMyPlateFirebaseAnalytics({
    LogMyPlateFirebaseConfig? config,
    Random? random,
  }) : _config = config ?? LogMyPlateFirebaseConfig.fromEnvironment(),
       _random = random ?? Random();

  final LogMyPlateFirebaseConfig _config;
  final Random _random;
  final Set<String> _sessionEvents = {};

  FirebaseAnalytics? _analytics;
  EngagementAnalyticsPolicy _policy = EngagementAnalyticsPolicy.disabled();
  bool _initializing = false;
  bool _initialized = false;

  @override
  Future<void> initialize() async {
    if (_initialized || _initializing || !_config.isConfigured) return;
    _initializing = true;
    try {
      if (Firebase.apps.isEmpty) {
        await Firebase.initializeApp(options: _config.options);
      }
      _analytics = FirebaseAnalytics.instance;
      await _analytics!.setAnalyticsCollectionEnabled(false);
      _initialized = true;
    } catch (error, stackTrace) {
      AppDiagnostics.instance.record(
        'analytics.initialize',
        error,
        stackTrace: stackTrace,
      );
    } finally {
      _initializing = false;
    }
  }

  @override
  Future<void> applyPolicy(EngagementAnalyticsPolicy policy) async {
    _policy = policy;
    if (!_initialized) await initialize();
    final analytics = _analytics;
    if (analytics == null) return;

    try {
      await analytics.setAnalyticsCollectionEnabled(_canReport);
    } catch (error, stackTrace) {
      AppDiagnostics.instance.record(
        'analytics.apply_policy',
        error,
        stackTrace: stackTrace,
      );
    }
  }

  @override
  Future<void> logEvent(
    String name, {
    Map<String, Object?> parameters = const {},
    bool oncePerSession = false,
  }) async {
    if (!_canReport || !_policy.events.isEnabled(name)) return;
    if (oncePerSession && !_sessionEvents.add(name)) return;
    if (!_sampleEvent()) return;

    final sanitized = _sanitizeParameters(parameters);
    if (_policy.debugLogging) {
      debugPrint('[LogMyPlate][analytics] $name $sanitized');
    }

    try {
      await _analytics!.logEvent(name: name, parameters: sanitized);
    } catch (error, stackTrace) {
      AppDiagnostics.instance.record(
        'analytics.log_event',
        error,
        stackTrace: stackTrace,
        context: {'event': name},
      );
    }
  }

  bool get _canReport {
    return _initialized &&
        _analytics != null &&
        _config.isConfigured &&
        _policy.canReport;
  }

  bool _sampleEvent() {
    if (_policy.sampleRatePercent >= 100) return true;
    if (_policy.sampleRatePercent <= 0) return false;
    return _random.nextInt(100) < _policy.sampleRatePercent;
  }

  Map<String, Object> _sanitizeParameters(Map<String, Object?> parameters) {
    final sanitized = <String, Object>{};
    for (final entry in parameters.entries) {
      final key = _sanitizeKey(entry.key);
      if (key.isEmpty) continue;
      final value = _sanitizeValue(entry.value);
      if (value == null) continue;
      sanitized[key] = value;
    }
    return sanitized;
  }

  String _sanitizeKey(String key) {
    final normalized = key
        .trim()
        .replaceAll(RegExp('[^a-zA-Z0-9_]'), '_')
        .replaceAll(RegExp('_+'), '_');
    if (normalized.isEmpty) return '';
    return normalized.length <= 40 ? normalized : normalized.substring(0, 40);
  }

  Object? _sanitizeValue(Object? value) {
    if (value == null) return null;
    if (value is bool) return value ? 1 : 0;
    if (value is int) return value;
    if (value is double) return value.isFinite ? value : null;
    if (value is num) return value.toDouble();
    final normalized = value.toString().trim();
    if (normalized.isEmpty) return null;
    return normalized.length <= 96 ? normalized : normalized.substring(0, 96);
  }
}

class LogMyPlateFirebaseConfig {
  const LogMyPlateFirebaseConfig({
    required this.apiKey,
    required this.appId,
    required this.messagingSenderId,
    required this.projectId,
    this.storageBucket,
    this.measurementId,
    this.iosBundleId,
    this.iosClientId,
    this.androidClientId,
  });

  final String apiKey;
  final String appId;
  final String messagingSenderId;
  final String projectId;
  final String? storageBucket;
  final String? measurementId;
  final String? iosBundleId;
  final String? iosClientId;
  final String? androidClientId;

  bool get isConfigured {
    return apiKey.isNotEmpty &&
        appId.isNotEmpty &&
        messagingSenderId.isNotEmpty &&
        projectId.isNotEmpty;
  }

  FirebaseOptions get options {
    return FirebaseOptions(
      apiKey: apiKey,
      appId: appId,
      messagingSenderId: messagingSenderId,
      projectId: projectId,
      storageBucket: storageBucket,
      measurementId: measurementId,
      iosBundleId: iosBundleId,
      iosClientId: iosClientId,
      androidClientId: androidClientId,
    );
  }

  factory LogMyPlateFirebaseConfig.fromEnvironment({TargetPlatform? platform}) {
    final resolvedPlatform = platform ?? defaultTargetPlatform;
    final platformAppId = switch (resolvedPlatform) {
      TargetPlatform.android => const String.fromEnvironment(
        'LOGMYPLATE_FIREBASE_ANDROID_APP_ID',
      ),
      TargetPlatform.iOS => const String.fromEnvironment(
        'LOGMYPLATE_FIREBASE_IOS_APP_ID',
      ),
      _ => '',
    };

    return LogMyPlateFirebaseConfig(
      apiKey: const String.fromEnvironment(
        'LOGMYPLATE_FIREBASE_API_KEY',
      ).trim(),
      appId: platformAppId.trim().isNotEmpty
          ? platformAppId.trim()
          : const String.fromEnvironment('LOGMYPLATE_FIREBASE_APP_ID').trim(),
      messagingSenderId: const String.fromEnvironment(
        'LOGMYPLATE_FIREBASE_MESSAGING_SENDER_ID',
      ).trim(),
      projectId: const String.fromEnvironment(
        'LOGMYPLATE_FIREBASE_PROJECT_ID',
      ).trim(),
      storageBucket: _optionalEnv('LOGMYPLATE_FIREBASE_STORAGE_BUCKET'),
      measurementId: _optionalEnv('LOGMYPLATE_FIREBASE_MEASUREMENT_ID'),
      iosBundleId:
          _optionalEnv('LOGMYPLATE_FIREBASE_IOS_BUNDLE_ID') ??
          'com.logmyplate.app',
      iosClientId: _optionalEnv('LOGMYPLATE_FIREBASE_IOS_CLIENT_ID'),
      androidClientId: _optionalEnv('LOGMYPLATE_FIREBASE_ANDROID_CLIENT_ID'),
    );
  }
}

String? _optionalEnv(String key) {
  final value = switch (key) {
    'LOGMYPLATE_FIREBASE_STORAGE_BUCKET' => const String.fromEnvironment(
      'LOGMYPLATE_FIREBASE_STORAGE_BUCKET',
    ),
    'LOGMYPLATE_FIREBASE_MEASUREMENT_ID' => const String.fromEnvironment(
      'LOGMYPLATE_FIREBASE_MEASUREMENT_ID',
    ),
    'LOGMYPLATE_FIREBASE_IOS_BUNDLE_ID' => const String.fromEnvironment(
      'LOGMYPLATE_FIREBASE_IOS_BUNDLE_ID',
    ),
    'LOGMYPLATE_FIREBASE_IOS_CLIENT_ID' => const String.fromEnvironment(
      'LOGMYPLATE_FIREBASE_IOS_CLIENT_ID',
    ),
    'LOGMYPLATE_FIREBASE_ANDROID_CLIENT_ID' => const String.fromEnvironment(
      'LOGMYPLATE_FIREBASE_ANDROID_CLIENT_ID',
    ),
    _ => '',
  };
  final trimmed = value.trim();
  return trimmed.isEmpty ? null : trimmed;
}
