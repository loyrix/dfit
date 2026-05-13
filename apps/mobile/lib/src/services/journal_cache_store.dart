import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../models/meal.dart';
import 'account_session_store.dart';

class JournalCacheStore {
  static const _bootstrapKey = 'dfit.journal_bootstrap_cache';

  JournalCacheStore({AccountSessionStore? sessionStore})
    : _sessionStore = sessionStore ?? AccountSessionStore();

  final AccountSessionStore _sessionStore;

  Future<AppBootstrapData?> load() async {
    try {
      final preferences = await SharedPreferences.getInstance();
      final cached = preferences.getString(await _cacheKey());
      if (cached == null || cached.isEmpty) return null;
      return AppBootstrapData.fromJson(
        jsonDecode(cached) as Map<String, dynamic>,
      );
    } catch (_) {
      return null;
    }
  }

  Future<void> save(AppBootstrapData data) async {
    try {
      final preferences = await SharedPreferences.getInstance();
      await preferences.setString(await _cacheKey(), jsonEncode(data.toJson()));
    } catch (_) {
      // Cache is a speed layer only; the live journal flow should not depend on it.
    }
  }

  Future<String> _cacheKey() async {
    final session = await _sessionStore.load();
    return session?.profileId == null
        ? '${_bootstrapKey}_anonymous'
        : '${_bootstrapKey}_${session!.profileId}';
  }
}
