import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:logmyplate_mobile/src/services/app_build_info.dart';
import 'package:logmyplate_mobile/src/services/device_identity_store.dart';
import 'package:logmyplate_mobile/src/services/install_attribution.dart';
import 'package:logmyplate_mobile/src/services/logmyplate_analytics.dart';
import 'package:logmyplate_mobile/src/services/logmyplate_api_client.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late List<Map<String, dynamic>> sent;
  late bool deviceRowExists;

  LogMyPlateApiClient apiClient() => LogMyPlateApiClient(
    baseUrl: 'http://api.test',
    loadDeviceIdentity: () async => const DeviceIdentity(
      installId: 'test-install',
      platform: 'ios',
      locale: 'en-GB',
      region: 'GB',
      timezone: 'Europe/London',
    ),
    loadAppBuildInfo: () async => const AppBuildInfo(
      platform: 'ios',
      version: '1.0.4',
      buildNumber: '30',
    ),
    httpClient: MockClient((request) async {
      expect(request.url.path, '/v1/devices/attribution');
      final body = jsonDecode(request.body) as Map<String, dynamic>;
      sent.add(body);
      return http.Response(jsonEncode({'recorded': deviceRowExists}), 200);
    }),
  );

  InstallAttributionReporter reporter({DateTime Function()? clock}) =>
      InstallAttributionReporter(
        apiClient: apiClient(),
        analytics: const NoopLogMyPlateAnalytics(),
        platform: TargetPlatform.iOS,
        clock: clock,
      );

  setUp(() {
    SharedPreferences.setMockInitialValues({});
    sent = [];
    deviceRowExists = true;
  });

  test('reads utm params from a link that opened the app', () {
    final attribution = InstallAttribution.fromLink(
      Uri.parse(
        'https://www.logmyplate.com/open?utm_source=instagram&utm_medium=social&utm_campaign=uk_launch',
      ),
    );
    expect(attribution.source, 'instagram');
    expect(attribution.medium, 'social');
    expect(attribution.campaign, 'uk_launch');
    expect(attribution.hasCampaign, isTrue);

    final plain = InstallAttribution.fromLink(
      Uri.parse('logmyplate://delete-account'),
    );
    expect(plain.hasCampaign, isFalse);
  });

  test('reports a campaign link and only the first one', () async {
    final subject = reporter();
    await subject.captureLink(
      Uri.parse('logmyplate://open?utm_source=website&utm_campaign=paneer'),
    );
    await subject.captureLink(
      Uri.parse('logmyplate://open?utm_source=instagram&utm_campaign=later'),
    );

    expect(sent, hasLength(1));
    expect(sent.single['source'], 'website');
    expect(sent.single['campaign'], 'paneer');
  });

  test('keeps a link campaign until the device row exists', () async {
    deviceRowExists = false;
    final subject = reporter();
    await subject.captureLink(
      Uri.parse('logmyplate://open?utm_source=website&utm_campaign=roti'),
    );
    expect(sent, hasLength(1));

    // Next launch, after bootstrap has created the device row.
    deviceRowExists = true;
    await subject.reportIfNeeded();
    expect(sent.last['campaign'], 'roti');

    await subject.reportIfNeeded();
    expect(sent, hasLength(2), reason: 'nothing left to send once stored');
  });

  test('ignores campaign links long after install', () async {
    var now = DateTime(2026, 11, 1);
    final subject = reporter(clock: () => now);
    await subject.reportIfNeeded(); // first launch, nothing to send on iOS
    expect(sent, isEmpty);

    now = DateTime(2026, 11, 20);
    await subject.captureLink(
      Uri.parse('logmyplate://open?utm_source=newsletter'),
    );
    expect(sent, isEmpty);
  });
}
