import 'package:flutter/foundation.dart';

import '../models/auth_session.dart';
import '../services/account_session_store.dart';
import '../services/app_diagnostics.dart';
import '../services/logmyplate_api_client.dart';
import '../services/oauth_sign_in_service.dart';

class AuthController extends ChangeNotifier {
  AuthController({
    AccountAuthGateway? gateway,
    AccountSessionStore? store,
    OAuthSignInService? oauthSignInService,
  }) : _gateway = gateway ?? LogMyPlateAccountAuthGateway(),
       _store = store ?? AccountSessionStore(),
       _oauthSignInService = oauthSignInService ?? NativeOAuthSignInService();

  final AccountAuthGateway _gateway;
  final AccountSessionStore _store;
  final OAuthSignInService _oauthSignInService;
  AuthSession? _session;
  bool _loading = false;
  String? _error;

  AuthSession? get session => _session;
  bool get isSignedIn => _session != null;
  bool get loading => _loading;
  String? get error => _error;

  void clearError() {
    if (_error == null) return;
    _error = null;
    notifyListeners();
  }

  Future<void> load() async {
    _session = await _store.load();
    notifyListeners();
  }

  Future<AuthSession?> signIn(AuthProvider provider) async {
    if (_loading) return null;
    _loading = true;
    _error = null;
    notifyListeners();

    try {
      final credential = await _oauthSignInService.signIn(provider);
      final session = await _gateway.signIn(credential);
      await _store.save(session);
      _session = session;
      return session;
    } catch (error, stackTrace) {
      AppDiagnostics.instance.record(
        'auth.provider',
        error,
        stackTrace: stackTrace,
        context: {'provider': provider.name},
      );
      _error = _providerAuthErrorMessage(error, provider);
      return null;
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<AuthSession?> signInWithEmail({
    required EmailAuthMode mode,
    required String email,
    required String password,
  }) async {
    if (_loading) return null;
    _loading = true;
    _error = null;
    notifyListeners();

    try {
      final session = await _gateway.signInWithEmail(
        mode: mode,
        email: email,
        password: password,
      );
      await _store.save(session);
      _session = session;
      return session;
    } catch (error, stackTrace) {
      AppDiagnostics.instance.record(
        'auth.email',
        error,
        stackTrace: stackTrace,
        context: {'mode': mode.name},
      );
      _error = _emailAuthErrorMessage(error, mode);
      return null;
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<void> signOut() async {
    await _gateway.signOut();
    await _oauthSignInService.signOut();
    await _store.clear();
    _session = null;
    notifyListeners();
  }

  Future<bool> deactivateProfile() async {
    return _runProfileLifecycleAction(
      actionName: 'auth.deactivate_profile',
      operation: _gateway.deactivateProfile,
      fallbackMessage: 'Could not deactivate this profile. Please try again.',
    );
  }

  Future<bool> deleteProfile() async {
    return _runProfileLifecycleAction(
      actionName: 'auth.delete_profile',
      operation: _gateway.deleteProfile,
      fallbackMessage: 'Could not delete this profile. Please try again.',
    );
  }

  Future<bool> _runProfileLifecycleAction({
    required String actionName,
    required Future<void> Function() operation,
    required String fallbackMessage,
  }) async {
    if (_loading) return false;
    _loading = true;
    _error = null;
    notifyListeners();

    try {
      await operation();
      await _store.clear();
      _session = null;
      return true;
    } catch (error, stackTrace) {
      AppDiagnostics.instance.record(actionName, error, stackTrace: stackTrace);
      _error = _profileLifecycleErrorMessage(error, fallbackMessage);
      return false;
    } finally {
      _loading = false;
      notifyListeners();
    }
  }
}

String _providerAuthErrorMessage(Object error, AuthProvider provider) {
  if (error is LogMyPlateApiException) {
    switch (error.errorCode) {
      case 'invalid_oauth_auth':
      case 'invalid_oauth_token':
        return '${provider.label} sign-in could not be verified. Please try again.';
      case 'oauth_provider_not_configured':
      case 'oauth_provider_unavailable':
        return '${provider.label} sign-in is temporarily unavailable. Try again later.';
      case 'provider_already_linked':
        return 'This ${provider.label} account is already linked elsewhere.';
      case 'email_already_registered':
        return 'This email is already registered. Log in first, then link ${provider.label}.';
      case 'account_deactivated':
        return 'This profile is deactivated. Contact support to reactivate it.';
    }

    if (error.statusCode >= 500 || error.retryable) {
      return 'LogMyPlate is taking longer than expected. Try again.';
    }

    final message = error.message;
    if (message != null && message.trim().isNotEmpty) return message.trim();
  }

  if (error is UnsupportedError && provider == AuthProvider.apple) {
    return 'Apple sign-in is not available on this device.';
  }

  if (error is OAuthSignInFailure) {
    switch (error.kind) {
      case OAuthSignInFailureKind.configuration:
        return '${provider.label} sign-in is not configured for this build. Use email login for now.';
      case OAuthSignInFailureKind.canceled:
        return '${provider.label} sign-in stopped before verification. Try again or use email login.';
      case OAuthSignInFailureKind.unavailable:
        return '${provider.label} sign-in is unavailable on this device. Use email login for now.';
      case OAuthSignInFailureKind.unknown:
        return '${provider.label} sign-in could not start. Try again or use email login.';
    }
  }

  return '${provider.label} sign-in could not be completed. Please try again.';
}

String _emailAuthErrorMessage(Object error, EmailAuthMode mode) {
  if (error is LogMyPlateApiException) {
    switch (error.errorCode) {
      case 'email_already_registered':
        return 'This email is already registered. Log in instead.';
      case 'account_not_found':
        return 'User does not exist.';
      case 'invalid_credentials':
        return 'Email or password is incorrect.';
      case 'account_deactivated':
        return 'This profile is deactivated. Contact support to reactivate it.';
      case 'invalid_email_auth':
        return mode == EmailAuthMode.signUp
            ? 'Enter a valid email and a password with 6 or more characters.'
            : 'Enter your email and password to log in.';
    }

    if (error.statusCode >= 500 || error.retryable) {
      return 'LogMyPlate is taking longer than expected. Try again.';
    }

    final message = error.message;
    if (message != null && message.trim().isNotEmpty) return message.trim();
  }

  return mode == EmailAuthMode.signUp
      ? 'Could not create this account. Please try again.'
      : 'Could not log in. Please try again.';
}

String _profileLifecycleErrorMessage(Object error, String fallbackMessage) {
  if (error is LogMyPlateApiException) {
    switch (error.errorCode) {
      case 'account_required':
        return 'Log in again to manage this profile.';
      case 'profile_storage_delete_unavailable':
      case 'profile_storage_delete_failed':
        return 'Stored photos could not be removed. Please try again.';
    }

    if (error.statusCode >= 500 || error.retryable) {
      return 'LogMyPlate is taking longer than expected. Try again.';
    }

    final message = error.message;
    if (message != null && message.trim().isNotEmpty) return message.trim();
  }

  return fallbackMessage;
}

abstract class AccountAuthGateway {
  Future<AuthSession> signIn(OAuthProviderCredential credential);
  Future<AuthSession> signInWithEmail({
    required EmailAuthMode mode,
    required String email,
    required String password,
  });
  Future<void> signOut();
  Future<void> deactivateProfile();
  Future<void> deleteProfile();
}

class LogMyPlateAccountAuthGateway implements AccountAuthGateway {
  LogMyPlateAccountAuthGateway({LogMyPlateApiClient? apiClient})
    : _apiClient = apiClient ?? LogMyPlateApiClient();

  final LogMyPlateApiClient _apiClient;

  @override
  Future<AuthSession> signIn(OAuthProviderCredential credential) async {
    return _apiClient.signInWithOAuth(
      provider: credential.provider,
      idToken: credential.idToken,
      authorizationCode: credential.authorizationCode,
      nonce: credential.nonce,
      displayName: credential.displayName,
    );
  }

  @override
  Future<AuthSession> signInWithEmail({
    required EmailAuthMode mode,
    required String email,
    required String password,
  }) async {
    return mode == EmailAuthMode.signUp
        ? _apiClient.signUpWithEmail(email: email, password: password)
        : _apiClient.loginWithEmail(email: email, password: password);
  }

  @override
  Future<void> signOut() async {
    try {
      await _apiClient.logout();
    } catch (error, stackTrace) {
      AppDiagnostics.instance.record(
        'auth.logout',
        error,
        stackTrace: stackTrace,
      );
      // Local sign-out must still work if the token is already expired.
    }
  }

  @override
  Future<void> deactivateProfile() {
    return _apiClient.deactivateProfile(
      idempotencyKey:
          'deactivate-profile-${DateTime.now().microsecondsSinceEpoch}',
    );
  }

  @override
  Future<void> deleteProfile() {
    return _apiClient.deleteProfile(
      idempotencyKey: 'delete-profile-${DateTime.now().microsecondsSinceEpoch}',
    );
  }
}
