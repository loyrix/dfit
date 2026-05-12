import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../models/meal.dart';

class JournalCacheStore {
  static const _bootstrapKey = 'dfit.journal_bootstrap_cache';

  Future<AppBootstrapData?> load() async {
    try {
      final preferences = await SharedPreferences.getInstance();
      final cached = preferences.getString(_bootstrapKey);
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
      await preferences.setString(_bootstrapKey, jsonEncode(data.toJson()));
    } catch (_) {
      // Cache is a speed layer only; the live journal flow should not depend on it.
    }
  }
}
