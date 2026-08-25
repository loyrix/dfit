import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:play_install_referrer/play_install_referrer.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'app_diagnostics.dart';
import 'logmyplate_analytics.dart';
import 'logmyplate_api_client.dart';

/// Where an install came from.
///
/// Every field is nullable because "we do not know" is the honest and common
/// answer — an organic App Store install carries no campaign at all. Inventing
/// a channel for those would quietly turn unattributed installs into organic
/// ones in the growth numbers.
@immutable
class InstallAttribution {
  const InstallAttribution({
    this.source,
    this.medium,
    this.campaign,
    this.referrerRaw,
  });

  final String? source;
  final String? medium;
  final String? campaign;
  final String? referrerRaw;

  bool get isEmpty =>
      source == null &&
      medium == null &&
      campaign == null &&
      referrerRaw == null;

  /// Parses a Play install referrer, which is a query string in its own right:
  /// `utm_source=website&utm_medium=badge&utm_campaign=web_download`.
  ///
  /// Play sends `utm_source=google-play&utm_medium=organic` for installs that
  /// came straight from the store, which is real information and is kept.
  static InstallAttribution fromReferrer(String referrer) {
    final trimmed = referrer.trim();
    if (trimmed.isEmpty) return const InstallAttribution();

    final params = Uri.splitQueryString(trimmed);
    String? read(String key) {
      final value = params[key]?.trim();
      return (value == null || value.isEmpty) ? null : value;
    }

    return InstallAttribution(
      source: read('utm_source'),
      medium: read('utm_medium'),
      campaign: read('utm_campaign'),
      referrerRaw: trimmed,
    );
  }
}

/// Captures install attribution once and hands it to the API.
///
/// Runs at most once per install: the Play referrer never changes, and a repeat
/// report would only risk overwriting a real campaign with a later blank. The
/// server enforces the same rule independently, so a duplicate call is harmless
/// rather than merely unlikely.
class InstallAttributionReporter {
  InstallAttributionReporter({
    required LogMyPlateApiClient apiClient,
    required LogMyPlateAnalytics analytics,
    TargetPlatform? platform,
  }) : _apiClient = apiClient,
       _analytics = analytics,
       _platform = platform ?? defaultTargetPlatform;

  static const _reportedKey = 'logmyplate.install_attribution.reported.v1';

  final LogMyPlateApiClient _apiClient;
  final LogMyPlateAnalytics _analytics;
  final TargetPlatform _platform;

  /// Best effort throughout: attribution is never worth failing a launch over,
  /// so every step swallows its own errors and the caller does not await this.
  Future<void> reportIfNeeded() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      if (prefs.getBool(_reportedKey) ?? false) return;

      final attribution = await _resolve();
      final instanceId = await _analytics.appInstanceId();

      // Nothing to say and no join key: leave the row untouched so it stays
      // honestly unattributed, and try again on a later launch in case
      // analytics simply had not initialised yet.
      if (attribution.isEmpty && instanceId == null) return;

      await _apiClient.recordInstallAttribution(
        source: attribution.source,
        medium: attribution.medium,
        campaign: attribution.campaign,
        referrerRaw: attribution.referrerRaw,
        analyticsInstanceId: instanceId,
      );

      await prefs.setBool(_reportedKey, true);
    } catch (error, stackTrace) {
      AppDiagnostics.instance.record(
        'attribution.report',
        error,
        stackTrace: stackTrace,
      );
    }
  }

  /// Reads the install source the platform can actually give us.
  ///
  /// Android exposes the Play install referrer, which carries whatever
  /// `&referrer=` the store link was built with. iOS has no equivalent an app
  /// can read — App Store campaign data lives in App Store Connect and never
  /// reaches the device — so iOS installs stay unattributed here by design.
  Future<InstallAttribution> _resolve() async {
    if (_platform != TargetPlatform.android) return const InstallAttribution();

    try {
      final details = await PlayInstallReferrer.installReferrer;
      final referrer = details.installReferrer;
      if (referrer == null || referrer.trim().isEmpty) {
        return const InstallAttribution();
      }
      return InstallAttribution.fromReferrer(referrer);
    } on MissingPluginException {
      // No Play Install Referrer implementation on this side: a non-Play build,
      // a device without Play Services, or a widget test. Expected rather than
      // exceptional, so it stays out of diagnostics — recording it would fire on
      // every launch of every such device and bury real faults.
      return const InstallAttribution();
    } catch (error, stackTrace) {
      // A genuine failure talking to a referrer service that does exist.
      AppDiagnostics.instance.record(
        'attribution.play_referrer',
        error,
        stackTrace: stackTrace,
      );
      return const InstallAttribution();
    }
  }
}
