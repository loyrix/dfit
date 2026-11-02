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

  /// Reads `utm_*` from a link that opened the app, e.g. a logmyplate.com
  /// universal link. This is the only campaign signal iOS hands an app: App
  /// Store campaign tokens (`pt`/`ct`) stay in App Store Connect. Returns an
  /// empty attribution when the link carries no campaign.
  static InstallAttribution fromLink(Uri uri) {
    String? read(String key) {
      final value = uri.queryParameters[key]?.trim();
      if (value == null || value.isEmpty) return null;
      return value.length <= 100 ? value : value.substring(0, 100);
    }

    final source = read('utm_source');
    final medium = read('utm_medium');
    final campaign = read('utm_campaign');
    if (source == null && medium == null && campaign == null) {
      return const InstallAttribution();
    }
    final raw = uri.toString();
    return InstallAttribution(
      source: source,
      medium: medium,
      campaign: campaign,
      referrerRaw: raw.length <= 1000 ? raw : raw.substring(0, 1000),
    );
  }

  bool get hasCampaign => source != null || medium != null || campaign != null;
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
    DateTime Function()? clock,
  }) : _apiClient = apiClient,
       _analytics = analytics,
       _platform = platform ?? defaultTargetPlatform,
       _now = clock ?? DateTime.now;

  static const _reportedKey = 'logmyplate.install_attribution.reported.v1';
  static const _sourceReportedKey =
      'logmyplate.install_attribution.source_reported.v1';
  static const _pendingLinkKey =
      'logmyplate.install_attribution.pending_link.v1';
  static const _firstSeenKey = 'logmyplate.install_attribution.first_seen_ms';

  /// A campaign link only counts as the install's source when it opens the app
  /// soon after install; a link tapped by a months-old user is re-engagement.
  static const linkAttributionWindow = Duration(days: 7);

  final LogMyPlateApiClient _apiClient;
  final LogMyPlateAnalytics _analytics;
  final TargetPlatform _platform;
  final DateTime Function() _now;

  /// Best effort throughout: attribution is never worth failing a launch over,
  /// so every step swallows its own errors and the caller does not await this.
  Future<void> reportIfNeeded() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      if (!prefs.containsKey(_firstSeenKey)) {
        await prefs.setInt(_firstSeenKey, _now().millisecondsSinceEpoch);
      }
      if (!(prefs.getBool(_reportedKey) ?? false)) {
        final attribution = await _resolve();
        final instanceId = await _analytics.appInstanceId();

        // Nothing to say and no join key: leave the row untouched so it stays
        // honestly unattributed, and try again on a later launch in case
        // analytics simply had not initialised yet.
        if (!attribution.isEmpty || instanceId != null) {
          final recorded = await _apiClient.recordInstallAttribution(
            source: attribution.source,
            medium: attribution.medium,
            campaign: attribution.campaign,
            referrerRaw: attribution.referrerRaw,
            analyticsInstanceId: instanceId,
          );
          // Only a stored row counts. `recorded: false` means the device row
          // was not there yet, and marking it done would lose this install's
          // attribution for good.
          if (recorded) {
            await prefs.setBool(_reportedKey, true);
            if (attribution.hasCampaign) {
              await prefs.setBool(_sourceReportedKey, true);
            }
          }
        }
      }
      await _flushPendingLink(prefs);
    } catch (error, stackTrace) {
      AppDiagnostics.instance.record(
        'attribution.report',
        error,
        stackTrace: stackTrace,
      );
    }
  }

  /// Remembers the campaign on a link that opened the app, if the install has
  /// no source yet, and reports it. Safe to call for every incoming link.
  Future<void> captureLink(Uri uri) async {
    try {
      final attribution = InstallAttribution.fromLink(uri);
      if (!attribution.hasCampaign) return;

      final prefs = await SharedPreferences.getInstance();
      if (prefs.getBool(_sourceReportedKey) ?? false) return;
      final firstSeenMs = prefs.getInt(_firstSeenKey);
      final now = _now();
      if (firstSeenMs != null &&
          now.difference(DateTime.fromMillisecondsSinceEpoch(firstSeenMs)) >
              linkAttributionWindow) {
        return;
      }
      // First touch wins: a second campaign link does not replace the first.
      if (prefs.getString(_pendingLinkKey) == null) {
        await prefs.setString(_pendingLinkKey, uri.toString());
      }
      await _flushPendingLink(prefs);
    } catch (error, stackTrace) {
      AppDiagnostics.instance.record(
        'attribution.link',
        error,
        stackTrace: stackTrace,
      );
    }
  }

  Future<void> _flushPendingLink(SharedPreferences prefs) async {
    if (prefs.getBool(_sourceReportedKey) ?? false) {
      await prefs.remove(_pendingLinkKey);
      return;
    }
    final pending = prefs.getString(_pendingLinkKey);
    if (pending == null) return;
    final uri = Uri.tryParse(pending);
    final attribution = uri == null
        ? const InstallAttribution()
        : InstallAttribution.fromLink(uri);
    if (!attribution.hasCampaign) {
      await prefs.remove(_pendingLinkKey);
      return;
    }

    final recorded = await _apiClient.recordInstallAttribution(
      source: attribution.source,
      medium: attribution.medium,
      campaign: attribution.campaign,
      referrerRaw: attribution.referrerRaw,
      analyticsInstanceId: await _analytics.appInstanceId(),
    );
    if (!recorded) return; // Device row not there yet; retried next launch.
    await prefs.setBool(_sourceReportedKey, true);
    await prefs.remove(_pendingLinkKey);
  }

  /// Reads the install source the platform can actually give us.
  ///
  /// Android exposes the Play install referrer, which carries whatever
  /// `&referrer=` the store link was built with. iOS has no equivalent an app
  /// can read — App Store campaign data lives in App Store Connect and never
  /// reaches the device. iOS installs get a source only from a campaign link
  /// that opens the app (see [captureLink]); otherwise they stay unattributed.
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
