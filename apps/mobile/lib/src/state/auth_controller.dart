import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../models/auth_session.dart';

class AuthController extends ChangeNotifier {
  static const _sessionKey = 'dfit.auth_session';

  AuthController({AccountAuthGateway? gateway})
    : _gateway = gateway ?? DeviceAccountAuthGateway();

  final AccountAuthGateway _gateway;
  AuthSession? _session;
  bool _loading = false;
  String? _error;

  AuthSession? get session => _session;
  bool get isSignedIn => _session != null;
  bool get loading => _loading;
  String? get error => _error;

  Future<void> load() async {
    try {
      final preferences = await SharedPreferences.getInstance();
      final raw = preferences.getString(_sessionKey);
      if (raw == null || raw.isEmpty) return;
      _session = AuthSession.fromJson(jsonDecode(raw) as Map<String, dynamic>);
    } catch (_) {
      _session = null;
    }
    notifyListeners();
  }

  Future<AuthSession?> signIn(AuthProvider provider) async {
    if (_loading) return null;
    _loading = true;
    _error = null;
    notifyListeners();

    try {
      final session = await _gateway.signIn(provider);
      final preferences = await SharedPreferences.getInstance();
      await preferences.setString(_sessionKey, jsonEncode(session.toJson()));
      _session = session;
      return session;
    } catch (_) {
      _error = 'Account linking is unavailable right now.';
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
      final preferences = await SharedPreferences.getInstance();
      await preferences.setString(_sessionKey, jsonEncode(session.toJson()));
      _session = session;
      return session;
    } catch (_) {
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
    final preferences = await SharedPreferences.getInstance();
    await preferences.remove(_sessionKey);
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
}

class DeviceAccountAuthGateway implements AccountAuthGateway {
  @override
  Future<AuthSession> signIn(AuthProvider provider) async {
    await Future<void>.delayed(const Duration(milliseconds: 500));
    return AuthSession(
      provider: provider,
      displayName: '${provider.label} account',
      linkedAt: DateTime.now(),
    );
  }

  @override
  Future<AuthSession> signInWithEmail({
    required EmailAuthMode mode,
    required String email,
    required String password,
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 500));
    return AuthSession(
      provider: AuthProvider.email,
      displayName: email.trim().toLowerCase(),
      linkedAt: DateTime.now(),
    );
  }
}
