import 'package:flutter/foundation.dart';

import '../models/auth_session.dart';
import '../services/account_session_store.dart';
import '../services/app_diagnostics.dart';
import '../services/dfit_api_client.dart';

class AuthController extends ChangeNotifier {
  AuthController({AccountAuthGateway? gateway, AccountSessionStore? store})
    : _gateway = gateway ?? DFitAccountAuthGateway(),
      _store = store ?? AccountSessionStore();

  final AccountAuthGateway _gateway;
  final AccountSessionStore _store;
  AuthSession? _session;
  bool _loading = false;
  String? _error;

  AuthSession? get session => _session;
  bool get isSignedIn => _session != null;
  bool get loading => _loading;
  String? get error => _error;

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
      final session = await _gateway.signIn(provider);
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
      _error = 'Use email login for this test build.';
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
      _error = mode == EmailAuthMode.signUp
          ? 'Could not create this account right now.'
          : 'Could not log in with those details.';
      return null;
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<void> signOut() async {
    await _gateway.signOut();
    await _store.clear();
    _session = null;
    notifyListeners();
  }
}

abstract class AccountAuthGateway {
  Future<AuthSession> signIn(AuthProvider provider);
  Future<AuthSession> signInWithEmail({
    required EmailAuthMode mode,
    required String email,
    required String password,
  });
  Future<void> signOut();
}

class DFitAccountAuthGateway implements AccountAuthGateway {
  DFitAccountAuthGateway({DFitApiClient? apiClient})
    : _apiClient = apiClient ?? DFitApiClient();

  final DFitApiClient _apiClient;

  @override
  Future<AuthSession> signIn(AuthProvider provider) async {
    throw UnsupportedError('${provider.label} login is not wired yet.');
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
}
