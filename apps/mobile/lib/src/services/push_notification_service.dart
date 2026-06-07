import 'dart:async';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';

import '../models/meal.dart';
import 'app_diagnostics.dart';
import 'logmyplate_analytics.dart';
import 'logmyplate_api_client.dart';

abstract class PushNotificationRegistrar {
  Future<void> sync(EngagementNotificationsPolicy policy);

  void dispose();
}

class NoopPushNotificationRegistrar implements PushNotificationRegistrar {
  const NoopPushNotificationRegistrar();

  @override
  Future<void> sync(EngagementNotificationsPolicy policy) async {}

  @override
  void dispose() {}
}

class FirebasePushNotificationRegistrar implements PushNotificationRegistrar {
  FirebasePushNotificationRegistrar({
    LogMyPlateFirebaseConfig? config,
    LogMyPlateApiClient? apiClient,
    FirebaseMessaging? messaging,
  }) : _config = config ?? LogMyPlateFirebaseConfig.fromEnvironment(),
       _apiClient = apiClient ?? LogMyPlateApiClient(),
       _messaging = messaging;

  final LogMyPlateFirebaseConfig _config;
  final LogMyPlateApiClient _apiClient;
  final FirebaseMessaging? _messaging;

  StreamSubscription<String>? _tokenRefreshSubscription;
  String? _lastRegisteredToken;
  String? _lastPermissionStatus;
  bool _policyEnabled = false;
  bool _syncing = false;

  @override
  Future<void> sync(EngagementNotificationsPolicy policy) async {
    _policyEnabled = policy.enabled;
    if (!policy.enabled || !_config.isConfigured || !_isMobilePlatform) return;
    if (_syncing) return;

    _syncing = true;
    try {
      final messaging = await _firebaseMessaging();
      final settings = await messaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
        provisional: false,
      );
      final permissionStatus = _permissionStatusName(
        settings.authorizationStatus,
      );
      if (!_canReceivePush(settings.authorizationStatus)) {
        _lastPermissionStatus = permissionStatus;
        return;
      }

      await messaging.setForegroundNotificationPresentationOptions(
        alert: true,
        badge: true,
        sound: true,
      );

      if (_isIos) {
        // iOS: Register the raw APNs device token for direct APNs delivery,
        // bypassing Firebase's broken APNs key handling.
        final apnsToken = await messaging.getAPNSToken();
        if (apnsToken == null || apnsToken.trim().isEmpty) return;

        // Detect APNs sandbox: debug/profile builds always use sandbox.
        // Release builds use production unless the API points at a non-prod URL,
        // which covers TestFlight testing against staging environments.
        final isSandbox = kDebugMode ||
            kProfileMode ||
            _apiClient.baseUrl.contains('staging') ||
            _apiClient.baseUrl.contains('sandbox') ||
            _apiClient.baseUrl.contains('localhost') ||
            _apiClient.baseUrl.contains('127.0.0.1');

        await _registerToken(
          apnsToken.trim(),
          permissionStatus,
          provider: 'apns',
          apnsSandbox: isSandbox,
        );
        // No token refresh listener for APNs tokens — they are re-fetched on
        // each sync call (triggered by app lifecycle).
      } else {
        // Android: Keep using FCM tokens as before.
        final token = await messaging.getToken();
        if (token == null || token.trim().isEmpty) return;
        await _registerToken(token.trim(), permissionStatus);
        _listenForTokenRefresh(messaging);
      }
    } catch (error, stackTrace) {
      AppDiagnostics.instance.record(
        'push_notifications.sync',
        error,
        stackTrace: stackTrace,
      );
    } finally {
      _syncing = false;
    }
  }

  @override
  void dispose() {
    _tokenRefreshSubscription?.cancel();
    _apiClient.close();
  }

  Future<FirebaseMessaging> _firebaseMessaging() async {
    if (Firebase.apps.isEmpty) {
      await Firebase.initializeApp(options: _config.options);
    }
    return _messaging ?? FirebaseMessaging.instance;
  }

  Future<void> _registerToken(
    String token,
    String permissionStatus, {
    String provider = 'fcm',
    bool? apnsSandbox,
  }) async {
    if (_lastRegisteredToken == token &&
        _lastPermissionStatus == permissionStatus) {
      return;
    }
    await _apiClient.registerPushToken(
      token: token,
      provider: provider,
      platform: _platformName,
      permissionStatus: permissionStatus,
      apnsSandbox: apnsSandbox,
    );
    _lastRegisteredToken = token;
    _lastPermissionStatus = permissionStatus;
  }

  void _listenForTokenRefresh(FirebaseMessaging messaging) {
    if (_tokenRefreshSubscription != null) return;
    _tokenRefreshSubscription = messaging.onTokenRefresh.listen(
      (token) async {
        if (!_policyEnabled || token.trim().isEmpty) return;
        try {
          await _registerToken(
            token.trim(),
            _lastPermissionStatus ?? 'authorized',
          );
        } catch (error, stackTrace) {
          AppDiagnostics.instance.record(
            'push_notifications.token_refresh',
            error,
            stackTrace: stackTrace,
          );
        }
      },
      onError: (Object error, StackTrace stackTrace) {
        AppDiagnostics.instance.record(
          'push_notifications.token_refresh_stream',
          error,
          stackTrace: stackTrace,
        );
      },
    );
  }

  bool get _isMobilePlatform =>
      defaultTargetPlatform == TargetPlatform.iOS ||
      defaultTargetPlatform == TargetPlatform.android;

  bool get _isIos => defaultTargetPlatform == TargetPlatform.iOS;

  String get _platformName =>
      defaultTargetPlatform == TargetPlatform.android ? 'android' : 'ios';

  bool _canReceivePush(AuthorizationStatus status) {
    return status == AuthorizationStatus.authorized ||
        status == AuthorizationStatus.provisional;
  }

  String _permissionStatusName(AuthorizationStatus status) {
    return switch (status) {
      AuthorizationStatus.authorized => 'authorized',
      AuthorizationStatus.provisional => 'provisional',
      AuthorizationStatus.denied => 'denied',
      AuthorizationStatus.notDetermined => 'not_determined',
    };
  }
}

