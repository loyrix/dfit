import 'dart:math';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

class DeviceIdentity {
  const DeviceIdentity({
    required this.installId,
    required this.platform,
    required this.locale,
    required this.region,
    required this.timezone,
  });

  final String installId;
  final String platform;
  final String locale;
  final String region;
  final String timezone;

  Map<String, String> toHeaders() => {
    'x-dfit-install-id': installId,
    'x-dfit-platform': platform,
    if (locale.isNotEmpty) 'x-dfit-locale': locale,
    if (region.isNotEmpty) 'x-dfit-region': region,
    if (timezone.isNotEmpty) 'x-dfit-timezone': timezone,
  };
}

class DeviceIdentityStore {
  static const _installIdKey = 'dfit.install_id';
  static String? _memoryInstallId;

  Future<DeviceIdentity> load() async {
    final installId = await _loadInstallId();
    final locale = PlatformDispatcher.instance.locale;

    return DeviceIdentity(
      installId: installId,
      platform: defaultTargetPlatform == TargetPlatform.android
          ? 'android'
          : 'ios',
      locale: locale.toLanguageTag(),
      region: locale.countryCode ?? '',
      timezone: DateTime.now().timeZoneName,
    );
  }

  Future<String> _loadInstallId() async {
    try {
      final preferences = await SharedPreferences.getInstance();
      final existing = preferences.getString(_installIdKey);
      if (existing != null && existing.isNotEmpty) return existing;

      final created = _createInstallId();
      await preferences.setString(_installIdKey, created);
      return created;
    } catch (_) {
      _memoryInstallId ??= _createInstallId();
      return _memoryInstallId!;
    }
  }

  static String _createInstallId() {
    final random = Random.secure();
    final bytes = List<int>.generate(16, (_) => random.nextInt(256));
    final hex = bytes.map((byte) => byte.toRadixString(16).padLeft(2, '0'));
    return 'inst_${hex.join()}';
  }
}
