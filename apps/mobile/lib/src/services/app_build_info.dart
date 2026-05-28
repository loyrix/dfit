import 'package:flutter/foundation.dart';
import 'package:package_info_plus/package_info_plus.dart';

class AppBuildInfo {
  const AppBuildInfo({
    required this.platform,
    required this.version,
    required this.buildNumber,
  });

  final String platform;
  final String version;
  final String buildNumber;

  Map<String, String> toHeaders() => {
    'x-logmyplate-app-platform': platform,
    if (version.isNotEmpty) 'x-logmyplate-app-version': version,
    if (buildNumber.isNotEmpty) 'x-logmyplate-app-build': buildNumber,
  };
}

class AppBuildInfoStore {
  AppBuildInfo? _cached;

  Future<AppBuildInfo> load() async {
    final cached = _cached;
    if (cached != null) return cached;

    try {
      final info = await PackageInfo.fromPlatform();
      _cached = AppBuildInfo(
        platform: _currentPlatform(),
        version: info.version,
        buildNumber: info.buildNumber,
      );
      return _cached!;
    } catch (_) {
      _cached = const AppBuildInfo(
        platform: _fallbackPlatform,
        version: _fallbackVersion,
        buildNumber: _fallbackBuildNumber,
      );
      return _cached!;
    }
  }

  static String _currentPlatform() {
    return defaultTargetPlatform == TargetPlatform.android ? 'android' : 'ios';
  }

  static const _fallbackPlatform = String.fromEnvironment(
    'LOGMYPLATE_APP_PLATFORM',
    defaultValue: 'ios',
  );
  static const _fallbackVersion = String.fromEnvironment(
    'LOGMYPLATE_APP_VERSION',
    defaultValue: '1.0.0',
  );
  static const _fallbackBuildNumber = String.fromEnvironment(
    'LOGMYPLATE_APP_BUILD',
    defaultValue: '12',
  );
}
