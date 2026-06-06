import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:purchases_flutter/purchases_flutter.dart';

enum PremiumPlanKind {
  monthly,
  quarterly,
  annual;

  String get displayName {
    return switch (this) {
      PremiumPlanKind.monthly => 'Monthly',
      PremiumPlanKind.quarterly => 'Quarterly',
      PremiumPlanKind.annual => 'Annual',
    };
  }
}

class PremiumPlan {
  const PremiumPlan({
    required this.kind,
    required this.productId,
    required this.packageId,
    required this.price,
    required this.cadence,
    this.pricePerMonth,
    this.badge,
    this.valueCopy,
    this.revenueCatPackage,
  });

  final PremiumPlanKind kind;
  final String productId;
  final String packageId;
  final String price;
  final String cadence;
  final String? pricePerMonth;
  final String? badge;
  final String? valueCopy;
  final Package? revenueCatPackage;
}

class PremiumOffering {
  const PremiumOffering({required this.identifier, required this.plans});

  final String identifier;
  final List<PremiumPlan> plans;

  bool get hasPlans => plans.isNotEmpty;

  PremiumPlan? get defaultPlan {
    final quarterly = _planByKind(PremiumPlanKind.quarterly);
    if (quarterly != null) return quarterly;
    final annual = _planByKind(PremiumPlanKind.annual);
    if (annual != null) return annual;
    return plans.isEmpty ? null : plans.first;
  }

  PremiumPlan? _planByKind(PremiumPlanKind kind) {
    for (final plan in plans) {
      if (plan.kind == kind) return plan;
    }
    return null;
  }
}

abstract class RevenueCatSubscriptionGateway {
  bool get hasPlatformKey;

  Future<PremiumOffering> loadOffering({required String appUserId});

  Future<bool> purchasePlan(PremiumPlan plan);

  Future<bool> restorePurchases({required String appUserId});

  Future<void> logOut();
}

class RevenueCatSubscriptionService implements RevenueCatSubscriptionGateway {
  RevenueCatSubscriptionService({
    TargetPlatform? platform,
    String? iosApiKey,
    String? androidApiKey,
    String? testApiKey,
    String? offeringId,
    String? entitlementId,
  }) : _platform = platform ?? defaultTargetPlatform,
       _iosApiKey = iosApiKey ?? RevenueCatSubscriptionConfig.iosApiKey,
       _androidApiKey =
           androidApiKey ?? RevenueCatSubscriptionConfig.androidApiKey,
       _testApiKey = testApiKey ?? RevenueCatSubscriptionConfig.testApiKey,
       _offeringId = offeringId ?? RevenueCatSubscriptionConfig.offeringId,
       _entitlementId =
           entitlementId ?? RevenueCatSubscriptionConfig.entitlementId;

  final TargetPlatform _platform;
  final String _iosApiKey;
  final String _androidApiKey;
  final String _testApiKey;
  final String _offeringId;
  final String _entitlementId;
  String? _configuredAppUserId;

  @override
  bool get hasPlatformKey => _apiKeyForPlatform().isNotEmpty;

  @override
  Future<PremiumOffering> loadOffering({required String appUserId}) async {
    await _ensureConfigured(appUserId);
    final offerings = await Purchases.getOfferings();
    final offering = offerings.getOffering(_offeringId) ?? offerings.current;
    if (offering == null) {
      return PremiumOffering(identifier: _offeringId, plans: const []);
    }

    final threeMonth = offering.threeMonth;
    final plans = <PremiumPlan>[
      if (offering.monthly != null)
        _planFromPackage(offering.monthly!, PremiumPlanKind.monthly),
      if (threeMonth != null)
        _planFromPackage(threeMonth, PremiumPlanKind.quarterly),
      if (offering.annual != null)
        _planFromPackage(offering.annual!, PremiumPlanKind.annual),
    ];

    return PremiumOffering(identifier: offering.identifier, plans: plans);
  }

  @override
  Future<bool> purchasePlan(PremiumPlan plan) async {
    final package = plan.revenueCatPackage;
    if (package == null) {
      throw const RevenueCatSubscriptionException(
        'This plan is not connected to a store product.',
      );
    }

    try {
      final result = await Purchases.purchase(PurchaseParams.package(package));
      return _hasPremiumEntitlement(result.customerInfo);
    } on PlatformException catch (error) {
      _throwMappedPlatformException(error);
    }
  }

  @override
  Future<bool> restorePurchases({required String appUserId}) async {
    await _ensureConfigured(appUserId);
    try {
      final info = await Purchases.restorePurchases();
      return _hasPremiumEntitlement(info);
    } on PlatformException catch (error) {
      _throwMappedPlatformException(error);
    }
  }

  @override
  Future<void> logOut() async {
    if (!hasPlatformKey) return;
    try {
      if (!await Purchases.isConfigured) return;
      await Purchases.logOut();
      _configuredAppUserId = null;
    } catch (_) {
      _configuredAppUserId = null;
    }
  }

  Future<void> _ensureConfigured(String appUserId) async {
    final normalizedAppUserId = appUserId.trim();
    if (normalizedAppUserId.isEmpty) {
      throw const RevenueCatSubscriptionException(
        'A signed-in profile is required for subscriptions.',
      );
    }

    final apiKey = _apiKeyForPlatform();
    if (apiKey.isEmpty) {
      throw RevenueCatSubscriptionException(
        _platform == TargetPlatform.android
            ? 'RevenueCat Android key is not configured yet.'
            : 'RevenueCat iOS key is not configured yet.',
      );
    }

    final isConfigured = await Purchases.isConfigured;
    if (!isConfigured) {
      await Purchases.configure(
        PurchasesConfiguration(apiKey)..appUserID = normalizedAppUserId,
      );
      _configuredAppUserId = normalizedAppUserId;
      return;
    }

    if (_configuredAppUserId != normalizedAppUserId) {
      await Purchases.logIn(normalizedAppUserId);
      _configuredAppUserId = normalizedAppUserId;
    }
  }

  String _apiKeyForPlatform() {
    final testApiKey = _testApiKey.trim();
    if (!kReleaseMode && testApiKey.isNotEmpty) {
      return testApiKey;
    }

    return switch (_platform) {
      TargetPlatform.android => _androidApiKey.trim(),
      TargetPlatform.iOS => _iosApiKey.trim(),
      _ => '',
    };
  }

  PremiumPlan _planFromPackage(Package package, PremiumPlanKind kind) {
    final product = package.storeProduct;
    final pricePerMonth = switch (kind) {
      PremiumPlanKind.monthly => null,
      PremiumPlanKind.quarterly => product.pricePerMonthString,
      PremiumPlanKind.annual => product.pricePerMonthString,
    };
    return PremiumPlan(
      kind: kind,
      productId: product.identifier,
      packageId: package.identifier,
      price: product.priceString,
      pricePerMonth: pricePerMonth,
      cadence: switch (kind) {
        PremiumPlanKind.monthly => 'per month',
        PremiumPlanKind.quarterly => 'every 3 months',
        PremiumPlanKind.annual => 'per year',
      },
      badge: switch (kind) {
        PremiumPlanKind.monthly => null,
        PremiumPlanKind.quarterly => 'Most Popular',
        PremiumPlanKind.annual => 'Best Value',
      },
      valueCopy: switch (kind) {
        PremiumPlanKind.monthly => 'Flexible monthly access',
        PremiumPlanKind.quarterly => 'Lower commitment, better savings',
        PremiumPlanKind.annual => 'Lowest effective monthly price',
      },
      revenueCatPackage: package,
    );
  }

  bool _hasPremiumEntitlement(CustomerInfo info) {
    return info.entitlements.active[_entitlementId]?.isActive == true;
  }

  Never _throwMappedPlatformException(PlatformException error) {
    final code = PurchasesErrorHelper.getErrorCode(error);
    if (code == PurchasesErrorCode.purchaseCancelledError) {
      throw const RevenueCatPurchaseCancelledException();
    }
    throw RevenueCatSubscriptionException(
      error.message?.trim().isNotEmpty == true
          ? error.message!.trim()
          : 'The purchase could not be completed.',
    );
  }
}

class RevenueCatSubscriptionConfig {
  const RevenueCatSubscriptionConfig._();

  static const offeringId = String.fromEnvironment(
    'LOGMYPLATE_REVENUECAT_OFFERING_ID',
    defaultValue: 'default',
  );
  static const entitlementId = String.fromEnvironment(
    'LOGMYPLATE_REVENUECAT_ENTITLEMENT_ID',
    defaultValue: 'premium',
  );
  static const iosApiKey = String.fromEnvironment(
    'LOGMYPLATE_REVENUECAT_IOS_API_KEY',
  );
  static const androidApiKey = String.fromEnvironment(
    'LOGMYPLATE_REVENUECAT_ANDROID_API_KEY',
  );
  static const testApiKey = String.fromEnvironment(
    'LOGMYPLATE_REVENUECAT_TEST_API_KEY',
  );
}

class RevenueCatSubscriptionException implements Exception {
  const RevenueCatSubscriptionException(this.message);

  final String message;

  @override
  String toString() => message;
}

class RevenueCatPurchaseCancelledException implements Exception {
  const RevenueCatPurchaseCancelledException();
}
