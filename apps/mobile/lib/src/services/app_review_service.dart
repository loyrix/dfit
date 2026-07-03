import 'package:in_app_review/in_app_review.dart';

/// Platform-native app rating flows.
///
/// Android: the Play In-App Review dialog lets the user rate without leaving
/// the app. iOS: a `?action=write-review` App Store link opens the review
/// composer directly — deterministic, unlike `SKStoreReviewController`, which
/// may silently show nothing when the yearly quota is spent (a poor response
/// to an explicit "Rate" tap).
class AppReviewService {
  AppReviewService({InAppReview? inAppReview})
    : _inAppReview = inAppReview ?? InAppReview.instance;

  final InAppReview _inAppReview;

  /// Attempts the native in-app review dialog. Returns false when the
  /// platform reports it unavailable (or errors) so callers can fall back to
  /// the store page.
  Future<bool> tryNativeReview() async {
    try {
      if (!await _inAppReview.isAvailable()) return false;
      await _inAppReview.requestReview();
      return true;
    } catch (_) {
      return false;
    }
  }

  /// Rewrites an App Store listing URL so it opens the write-review composer
  /// instead of the listing. Non-App Store URLs are returned unchanged.
  static Uri writeReviewUrl(Uri storeUrl) {
    if (!storeUrl.host.contains('apps.apple.com')) return storeUrl;
    return storeUrl.replace(
      queryParameters: {...storeUrl.queryParameters, 'action': 'write-review'},
    );
  }
}
