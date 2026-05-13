import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../models/auth_session.dart';

class AccountSessionStore {
  static const sessionKey = 'dfit.auth_session';

  Future<AuthSession?> load() async {
    try {
      final preferences = await SharedPreferences.getInstance();
      final raw = preferences.getString(sessionKey);
      if (raw == null || raw.isEmpty) return null;
      return AuthSession.fromJson(jsonDecode(raw) as Map<String, dynamic>);
    } catch (_) {
      return null;
    }
  }

  Future<void> save(AuthSession session) async {
    final preferences = await SharedPreferences.getInstance();
    await preferences.setString(sessionKey, jsonEncode(session.toJson()));
  }

  Future<void> clear() async {
    final preferences = await SharedPreferences.getInstance();
    await preferences.remove(sessionKey);
  }
}
