import 'package:flutter_test/flutter_test.dart';
import 'package:logmyplate_mobile/src/services/app_review_service.dart';

void main() {
  group('AppReviewService.writeReviewUrl', () {
    test('appends action=write-review to App Store URLs', () {
      final url = Uri.parse('https://apps.apple.com/app/id6770872606');
      final result = AppReviewService.writeReviewUrl(url);
      expect(result.host, 'apps.apple.com');
      expect(result.queryParameters['action'], 'write-review');
      expect(result.path, '/app/id6770872606');
    });

    test('preserves existing query parameters on App Store URLs', () {
      final url = Uri.parse('https://apps.apple.com/in/app/id6770872606?l=en');
      final result = AppReviewService.writeReviewUrl(url);
      expect(result.queryParameters['l'], 'en');
      expect(result.queryParameters['action'], 'write-review');
    });

    test('returns Play Store URLs unchanged', () {
      final url = Uri.parse(
        'https://play.google.com/store/apps/details?id=com.logmyplate.app',
      );
      expect(AppReviewService.writeReviewUrl(url), url);
    });
  });
}
