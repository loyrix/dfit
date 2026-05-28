enum MealType { breakfast, lunch, snack, dinner }

extension MealTypeLabel on MealType {
  String get label {
    switch (this) {
      case MealType.breakfast:
        return 'Breakfast';
      case MealType.lunch:
        return 'Lunch';
      case MealType.snack:
        return 'Snack';
      case MealType.dinner:
        return 'Dinner';
    }
  }
}

class MacroTotals {
  const MacroTotals({
    required this.calories,
    required this.proteinG,
    required this.carbsG,
    required this.fatG,
  });

  final int calories;
  final double proteinG;
  final double carbsG;
  final double fatG;

  static const zero = MacroTotals(calories: 0, proteinG: 0, carbsG: 0, fatG: 0);

  MacroTotals operator +(MacroTotals other) {
    return MacroTotals(
      calories: calories + other.calories,
      proteinG: proteinG + other.proteinG,
      carbsG: carbsG + other.carbsG,
      fatG: fatG + other.fatG,
    );
  }

  factory MacroTotals.fromJson(Map<String, dynamic> json) {
    return MacroTotals(
      calories: (json['calories'] as num).round(),
      proteinG: (json['proteinG'] as num).toDouble(),
      carbsG: (json['carbsG'] as num).toDouble(),
      fatG: (json['fatG'] as num).toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'calories': calories,
      'proteinG': proteinG,
      'carbsG': carbsG,
      'fatG': fatG,
    };
  }

  MacroTotals scaledBy(double factor) {
    return MacroTotals(
      calories: (calories * factor).round(),
      proteinG: proteinG * factor,
      carbsG: carbsG * factor,
      fatG: fatG * factor,
    );
  }
}

class MealItem {
  const MealItem({
    required this.name,
    required this.quantity,
    required this.unit,
    required this.grams,
    required this.nutrition,
    this.foodId,
    this.confidence = 1,
  });

  final String name;
  final double quantity;
  final String unit;
  final int grams;
  final MacroTotals nutrition;
  final String? foodId;
  final double confidence;

  MealItem copyWith({
    String? name,
    double? quantity,
    String? unit,
    int? grams,
    MacroTotals? nutrition,
    String? foodId,
    double? confidence,
  }) {
    return MealItem(
      name: name ?? this.name,
      quantity: quantity ?? this.quantity,
      unit: unit ?? this.unit,
      grams: grams ?? this.grams,
      nutrition: nutrition ?? this.nutrition,
      foodId: foodId ?? this.foodId,
      confidence: confidence ?? this.confidence,
    );
  }

  factory MealItem.fromJson(Map<String, dynamic> json) {
    return MealItem(
      name: json['displayName'] as String,
      quantity: (json['quantity'] as num).toDouble(),
      unit: json['unit'] as String,
      grams: (json['grams'] as num).round(),
      nutrition: MacroTotals.fromJson(
        json['nutrition'] as Map<String, dynamic>,
      ),
      foodId: json['foodId'] as String?,
      confidence: 1,
    );
  }

  factory MealItem.fromAnalysisJson(Map<String, dynamic> json) {
    return MealItem(
      name: json['name'] as String,
      quantity: (json['quantity'] as num).toDouble(),
      unit: json['unit'] as String,
      grams: (json['estimatedGrams'] as num).round(),
      nutrition: MacroTotals.fromJson(
        json['nutrition'] as Map<String, dynamic>,
      ),
      foodId: json['foodId'] as String?,
      confidence: (json['confidence'] as num).toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'displayName': name,
      'quantity': quantity,
      'unit': unit,
      'grams': grams,
      'nutrition': nutrition.toJson(),
      if (foodId != null) 'foodId': foodId,
      'confidence': confidence,
    };
  }

  MealItem scaledToQuantity(double nextQuantity) {
    if (quantity <= 0) return copyWith(quantity: nextQuantity);
    final factor = nextQuantity / quantity;
    return copyWith(
      quantity: nextQuantity,
      grams: (grams * factor).round(),
      nutrition: nutrition.scaledBy(factor),
    );
  }

  MealItem scaledToGrams(int nextGrams) {
    if (grams <= 0) return copyWith(grams: nextGrams);
    final factor = nextGrams / grams;
    return copyWith(
      quantity: quantity * factor,
      grams: nextGrams,
      nutrition: nutrition.scaledBy(factor),
    );
  }
}

enum MealSyncState { synced, pending }

class MealImage {
  const MealImage({
    required this.url,
    required this.mimeType,
    required this.byteSize,
    this.width,
    this.height,
  });

  final String url;
  final String mimeType;
  final int byteSize;
  final int? width;
  final int? height;

  factory MealImage.fromJson(Map<String, dynamic> json) {
    return MealImage(
      url: json['url'] as String,
      mimeType: json['mimeType'] as String,
      byteSize: json['byteSize'] as int,
      width: json['width'] as int?,
      height: json['height'] as int?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'url': url,
      'mimeType': mimeType,
      'byteSize': byteSize,
      if (width != null) 'width': width,
      if (height != null) 'height': height,
    };
  }
}

class MealLog {
  const MealLog({
    required this.id,
    required this.type,
    required this.title,
    required this.loggedAt,
    required this.items,
    this.image,
    this.syncState = MealSyncState.synced,
  });

  final String id;
  final MealType type;
  final String title;
  final DateTime loggedAt;
  final List<MealItem> items;
  final MealImage? image;
  final MealSyncState syncState;

  MacroTotals get totals {
    return items.fold<MacroTotals>(MacroTotals.zero, (total, item) {
      return total + item.nutrition;
    });
  }

  factory MealLog.fromJson(Map<String, dynamic> json) {
    return MealLog(
      id: json['id'] as String,
      type: MealType.values.byName(json['mealType'] as String),
      title: json['title'] as String,
      loggedAt: DateTime.parse(json['loggedAt'] as String).toLocal(),
      items: (json['items'] as List<dynamic>)
          .map((item) => MealItem.fromJson(item as Map<String, dynamic>))
          .toList(),
      image: json['image'] == null
          ? null
          : MealImage.fromJson(json['image'] as Map<String, dynamic>),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'mealType': type.name,
      'title': title,
      'loggedAt': loggedAt.toUtc().toIso8601String(),
      'items': items.map((item) => item.toJson()).toList(),
      'totals': totals.toJson(),
      if (image != null) 'image': image!.toJson(),
    };
  }
}

class TodayJournalData {
  const TodayJournalData({
    required this.meals,
    required this.totals,
    this.target,
  });

  final List<MealLog> meals;
  final MacroTotals totals;
  final MacroTotals? target;

  factory TodayJournalData.fromJson(Map<String, dynamic> json) {
    return TodayJournalData(
      totals: MacroTotals.fromJson(json['totals'] as Map<String, dynamic>),
      target: json['target'] == null
          ? null
          : MacroTotals.fromJson(json['target'] as Map<String, dynamic>),
      meals: (json['meals'] as List<dynamic>)
          .map((meal) => MealLog.fromJson(meal as Map<String, dynamic>))
          .toList(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'totals': totals.toJson(),
      'target': target?.toJson(),
      'meals': meals.map((meal) => meal.toJson()).toList(),
    };
  }
}

class JournalDayData {
  const JournalDayData({
    required this.date,
    required this.mealCount,
    required this.totals,
    required this.meals,
  });

  final String date;
  final int mealCount;
  final MacroTotals totals;
  final List<MealLog> meals;

  factory JournalDayData.fromJson(Map<String, dynamic> json) {
    return JournalDayData(
      date: json['date'] as String,
      mealCount: json['mealCount'] as int,
      totals: MacroTotals.fromJson(json['totals'] as Map<String, dynamic>),
      meals: (json['meals'] as List<dynamic>)
          .map((meal) => MealLog.fromJson(meal as Map<String, dynamic>))
          .toList(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'date': date,
      'mealCount': mealCount,
      'totals': totals.toJson(),
      'meals': meals.map((meal) => meal.toJson()).toList(),
    };
  }
}

class JournalRangeSummary {
  const JournalRangeSummary({
    required this.windowDays,
    required this.activeDays,
    required this.mealCount,
    required this.totals,
    required this.trackedDayAverage,
    required this.calendarDayAverage,
  });

  final int windowDays;
  final int activeDays;
  final int mealCount;
  final MacroTotals totals;
  final MacroTotals trackedDayAverage;
  final MacroTotals calendarDayAverage;

  factory JournalRangeSummary.fromJson(Map<String, dynamic> json) {
    final totals = MacroTotals.fromJson(json['totals'] as Map<String, dynamic>);
    final activeDays = json['activeDays'] as int;
    final windowDays = json['windowDays'] as int;
    final legacyDailyAverage = json['dailyAverage'];

    return JournalRangeSummary(
      windowDays: windowDays,
      activeDays: activeDays,
      mealCount: json['mealCount'] as int,
      totals: totals,
      trackedDayAverage: _summaryAverageFromJson(
        json['trackedDayAverage'],
        fallback: legacyDailyAverage,
        totals: totals,
        divisor: activeDays,
      ),
      calendarDayAverage: _summaryAverageFromJson(
        json['calendarDayAverage'],
        totals: totals,
        divisor: windowDays,
      ),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'windowDays': windowDays,
      'activeDays': activeDays,
      'mealCount': mealCount,
      'totals': totals.toJson(),
      'trackedDayAverage': trackedDayAverage.toJson(),
      'calendarDayAverage': calendarDayAverage.toJson(),
    };
  }

  static MacroTotals _summaryAverageFromJson(
    Object? value, {
    Object? fallback,
    required MacroTotals totals,
    required int divisor,
  }) {
    final raw = value ?? fallback;
    if (raw is Map<String, dynamic>) return MacroTotals.fromJson(raw);
    return totals.scaledBy(1 / (divisor <= 0 ? 1 : divisor));
  }
}

class JournalRangeData {
  const JournalRangeData({
    required this.startDate,
    required this.endDate,
    required this.days,
    required this.summary,
    this.target,
  });

  final String startDate;
  final String endDate;
  final List<JournalDayData> days;
  final JournalRangeSummary summary;
  final MacroTotals? target;

  factory JournalRangeData.fromJson(Map<String, dynamic> json) {
    return JournalRangeData(
      startDate: json['startDate'] as String,
      endDate: json['endDate'] as String,
      target: json['target'] == null
          ? null
          : MacroTotals.fromJson(json['target'] as Map<String, dynamic>),
      days: ((json['days'] as List<dynamic>?) ?? const [])
          .map((day) => JournalDayData.fromJson(day as Map<String, dynamic>))
          .toList(),
      summary: JournalRangeSummary.fromJson(
        json['summary'] as Map<String, dynamic>,
      ),
    );
  }

  factory JournalRangeData.fromSummaryJson(Map<String, dynamic> json) {
    return JournalRangeData(
      startDate: json['startDate'] as String,
      endDate: json['endDate'] as String,
      target: json['target'] == null
          ? null
          : MacroTotals.fromJson(json['target'] as Map<String, dynamic>),
      days: const [],
      summary: JournalRangeSummary.fromJson(
        json['summary'] as Map<String, dynamic>,
      ),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'startDate': startDate,
      'endDate': endDate,
      'target': target?.toJson(),
      'days': days.map((day) => day.toJson()).toList(),
      'summary': summary.toJson(),
    };
  }
}

enum HealthSex { female, male, notSpecified }

extension HealthSexApi on HealthSex {
  String get apiName {
    switch (this) {
      case HealthSex.female:
        return 'female';
      case HealthSex.male:
        return 'male';
      case HealthSex.notSpecified:
        return 'not_specified';
    }
  }

  String get label {
    switch (this) {
      case HealthSex.female:
        return 'Female';
      case HealthSex.male:
        return 'Male';
      case HealthSex.notSpecified:
        return 'Prefer not to say';
    }
  }

  static HealthSex fromApi(String value) {
    return switch (value) {
      'female' => HealthSex.female,
      'male' => HealthSex.male,
      _ => HealthSex.notSpecified,
    };
  }
}

enum ActivityLevel { sedentary, light, moderate, active }

extension ActivityLevelApi on ActivityLevel {
  String get apiName => name;

  String get label {
    switch (this) {
      case ActivityLevel.sedentary:
        return 'Mostly sitting';
      case ActivityLevel.light:
        return 'Light movement';
      case ActivityLevel.moderate:
        return 'Active routine';
      case ActivityLevel.active:
        return 'Very active';
    }
  }

  static ActivityLevel fromApi(String value) {
    return ActivityLevel.values.firstWhere(
      (level) => level.apiName == value,
      orElse: () => ActivityLevel.light,
    );
  }
}

enum HealthGoal { maintain, loseGently, gainGently }

extension HealthGoalApi on HealthGoal {
  String get apiName {
    switch (this) {
      case HealthGoal.maintain:
        return 'maintain';
      case HealthGoal.loseGently:
        return 'lose_gently';
      case HealthGoal.gainGently:
        return 'gain_gently';
    }
  }

  String get label {
    switch (this) {
      case HealthGoal.maintain:
        return 'Maintain';
      case HealthGoal.loseGently:
        return 'Lose gently';
      case HealthGoal.gainGently:
        return 'Gain gently';
    }
  }

  static HealthGoal fromApi(String value) {
    return switch (value) {
      'lose_gently' => HealthGoal.loseGently,
      'gain_gently' => HealthGoal.gainGently,
      _ => HealthGoal.maintain,
    };
  }
}

class HealthTargetInput {
  const HealthTargetInput({
    required this.heightCm,
    required this.weightKg,
    required this.ageYears,
    required this.sex,
    required this.activityLevel,
    required this.goal,
  });

  final double heightCm;
  final double weightKg;
  final int ageYears;
  final HealthSex sex;
  final ActivityLevel activityLevel;
  final HealthGoal goal;

  Map<String, dynamic> toJson() {
    return {
      'heightCm': heightCm,
      'weightKg': weightKg,
      'ageYears': ageYears,
      'sex': sex.apiName,
      'activityLevel': activityLevel.apiName,
      'goal': goal.apiName,
    };
  }
}

class HealthTarget {
  const HealthTarget({
    required this.profileId,
    required this.heightCm,
    required this.weightKg,
    required this.ageYears,
    required this.sex,
    required this.activityLevel,
    required this.goal,
    required this.bmi,
    required this.bmiCategory,
    required this.bmrCalories,
    required this.dailyCalorieTarget,
    required this.formula,
  });

  final String profileId;
  final double heightCm;
  final double weightKg;
  final int ageYears;
  final HealthSex sex;
  final ActivityLevel activityLevel;
  final HealthGoal goal;
  final double bmi;
  final String bmiCategory;
  final int bmrCalories;
  final int dailyCalorieTarget;
  final String formula;

  String get friendlyBmiCategory {
    switch (bmiCategory) {
      case 'underweight':
        return 'Below range';
      case 'healthy':
        return 'Balanced range';
      case 'overweight':
        return 'Above range';
      case 'obese':
        return 'High range';
      default:
        return 'Screening range';
    }
  }

  factory HealthTarget.fromJson(Map<String, dynamic> json) {
    return HealthTarget(
      profileId: json['profileId'] as String,
      heightCm: (json['heightCm'] as num).toDouble(),
      weightKg: (json['weightKg'] as num).toDouble(),
      ageYears: json['ageYears'] as int,
      sex: HealthSexApi.fromApi(json['sex'] as String),
      activityLevel: ActivityLevelApi.fromApi(json['activityLevel'] as String),
      goal: HealthGoalApi.fromApi(json['goal'] as String),
      bmi: (json['bmi'] as num).toDouble(),
      bmiCategory: json['bmiCategory'] as String,
      bmrCalories: json['bmrCalories'] as int,
      dailyCalorieTarget: json['dailyCalorieTarget'] as int,
      formula: json['formula'] as String? ?? '',
    );
  }

  MacroTotals get dailyTargetTotals {
    return MacroTotals(
      calories: dailyCalorieTarget,
      proteinG: 0,
      carbsG: 0,
      fatG: 0,
    );
  }
}

class JournalWeekOption {
  const JournalWeekOption({
    required this.weekOffset,
    required this.startDate,
    required this.endDate,
    required this.activeDays,
  });

  final int weekOffset;
  final String startDate;
  final String endDate;
  final int activeDays;

  factory JournalWeekOption.fromJson(Map<String, dynamic> json) {
    return JournalWeekOption(
      weekOffset: json['weekOffset'] as int,
      startDate: json['startDate'] as String,
      endDate: json['endDate'] as String,
      activeDays: json['activeDays'] as int,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'weekOffset': weekOffset,
      'startDate': startDate,
      'endDate': endDate,
      'activeDays': activeDays,
    };
  }
}

class AppProfile {
  const AppProfile({
    required this.id,
    required this.authMethod,
    required this.timezone,
    this.email,
    this.linkedAt,
    this.createdAt,
  });

  final String id;
  final String authMethod;
  final String timezone;
  final String? email;
  final String? linkedAt;
  final String? createdAt;

  factory AppProfile.fromJson(Map<String, dynamic> json) {
    return AppProfile(
      id: json['id'] as String,
      authMethod: json['authMethod'] as String? ?? 'anonymous',
      timezone: json['timezone'] as String? ?? '',
      email: json['email'] as String?,
      linkedAt: json['linkedAt'] as String?,
      createdAt: json['createdAt'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'authMethod': authMethod,
      'timezone': timezone,
      if (email != null) 'email': email,
      if (linkedAt != null) 'linkedAt': linkedAt,
      if (createdAt != null) 'createdAt': createdAt,
    };
  }
}

enum AppUpdateStatus { current, optional, mandatory }

class AppUpdatePolicy {
  const AppUpdatePolicy({
    required this.status,
    this.platform,
    this.currentBuild,
    this.currentVersion,
    this.latestBuild,
    this.latestVersion,
    this.minSupportedBuild,
    this.storeUrl,
    this.title,
    this.message,
  });

  final AppUpdateStatus status;
  final String? platform;
  final int? currentBuild;
  final String? currentVersion;
  final int? latestBuild;
  final String? latestVersion;
  final int? minSupportedBuild;
  final String? storeUrl;
  final String? title;
  final String? message;

  bool get isPromptable =>
      status == AppUpdateStatus.optional || status == AppUpdateStatus.mandatory;

  bool get isMandatory => status == AppUpdateStatus.mandatory;

  String get displayTitle => title?.trim().isNotEmpty == true
      ? title!.trim()
      : isMandatory
      ? 'Update required'
      : 'Update available';

  String get displayMessage => message?.trim().isNotEmpty == true
      ? message!.trim()
      : isMandatory
      ? 'Please update LogMyPlate to continue.'
      : 'A newer LogMyPlate version is available.';

  String get promptKey =>
      '${status.name}:${platform ?? 'unknown'}:${latestBuild ?? 0}:${minSupportedBuild ?? 0}';

  factory AppUpdatePolicy.current() {
    return const AppUpdatePolicy(status: AppUpdateStatus.current);
  }

  factory AppUpdatePolicy.fromJson(Map<String, dynamic>? json) {
    if (json == null) return AppUpdatePolicy.current();
    return AppUpdatePolicy(
      status: _appUpdateStatusFromApi(json['status'] as String?),
      platform: json['platform'] as String?,
      currentBuild: _nullableInt(json['currentBuild']),
      currentVersion: json['currentVersion'] as String?,
      latestBuild: _nullableInt(json['latestBuild']),
      latestVersion: json['latestVersion'] as String?,
      minSupportedBuild: _nullableInt(json['minSupportedBuild']),
      storeUrl: json['storeUrl'] as String?,
      title: json['title'] as String?,
      message: json['message'] as String?,
    );
  }
}

AppUpdateStatus _appUpdateStatusFromApi(String? value) {
  return switch (value) {
    'optional' => AppUpdateStatus.optional,
    'mandatory' => AppUpdateStatus.mandatory,
    _ => AppUpdateStatus.current,
  };
}

int? _nullableInt(Object? value) {
  if (value == null) return null;
  if (value is int) return value;
  if (value is num) return value.round();
  return int.tryParse(value.toString());
}

class AppBootstrapData {
  const AppBootstrapData({
    required this.serverTime,
    required this.profile,
    this.healthTarget,
    required this.updatePolicy,
    required this.quota,
    required this.rewardedAdProgress,
    required this.today,
    required this.weeklyRange,
  });

  final String serverTime;
  final AppProfile profile;
  final HealthTarget? healthTarget;
  final AppUpdatePolicy updatePolicy;
  final ScanQuota quota;
  final RewardedAdProgress rewardedAdProgress;
  final TodayJournalData today;
  final JournalRangeData weeklyRange;

  factory AppBootstrapData.fromJson(Map<String, dynamic> json) {
    return AppBootstrapData(
      serverTime: json['serverTime'] as String? ?? '',
      profile: AppProfile.fromJson(json['profile'] as Map<String, dynamic>),
      healthTarget: json['healthTarget'] == null
          ? null
          : HealthTarget.fromJson(json['healthTarget'] as Map<String, dynamic>),
      updatePolicy: AppUpdatePolicy.fromJson(
        json['updatePolicy'] as Map<String, dynamic>?,
      ),
      quota: ScanQuota.fromJson(json['quota'] as Map<String, dynamic>),
      rewardedAdProgress: json['rewardedAdProgress'] == null
          ? RewardedAdProgress.initial()
          : RewardedAdProgress.fromJson(
              json['rewardedAdProgress'] as Map<String, dynamic>,
            ),
      today: TodayJournalData.fromJson(json['today'] as Map<String, dynamic>),
      weeklyRange: json['weeklySummary'] == null
          ? JournalRangeData.fromJson(
              json['weeklyRange'] as Map<String, dynamic>,
            )
          : JournalRangeData.fromSummaryJson(
              json['weeklySummary'] as Map<String, dynamic>,
            ),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'serverTime': serverTime,
      'profile': profile.toJson(),
      'healthTarget': healthTarget == null
          ? null
          : {
              'profileId': healthTarget!.profileId,
              'heightCm': healthTarget!.heightCm,
              'weightKg': healthTarget!.weightKg,
              'ageYears': healthTarget!.ageYears,
              'sex': healthTarget!.sex.apiName,
              'activityLevel': healthTarget!.activityLevel.apiName,
              'goal': healthTarget!.goal.apiName,
              'bmi': healthTarget!.bmi,
              'bmiCategory': healthTarget!.bmiCategory,
              'bmrCalories': healthTarget!.bmrCalories,
              'dailyCalorieTarget': healthTarget!.dailyCalorieTarget,
              'formula': healthTarget!.formula,
            },
      'quota': quota.toJson(),
      'rewardedAdProgress': rewardedAdProgress.toJson(),
      'today': today.toJson(),
      'weeklySummary': {
        'startDate': weeklyRange.startDate,
        'endDate': weeklyRange.endDate,
        'target': weeklyRange.target?.toJson(),
        'summary': weeklyRange.summary.toJson(),
      },
    };
  }
}

class PreparedScan {
  const PreparedScan({
    required this.scanId,
    required this.status,
    required this.quota,
  });

  final String scanId;
  final String status;
  final ScanQuota quota;

  factory PreparedScan.fromJson(Map<String, dynamic> json) {
    return PreparedScan(
      scanId: json['scanId'] as String,
      status: json['status'] as String,
      quota: ScanQuota.fromJson(json['quota'] as Map<String, dynamic>),
    );
  }
}

class ScanQuota {
  const ScanQuota({
    required this.freeRemaining,
    required this.rewardedRemaining,
    required this.premiumRemaining,
  });

  final int freeRemaining;
  final int rewardedRemaining;
  final int premiumRemaining;

  int get totalRemaining =>
      freeRemaining + rewardedRemaining + premiumRemaining;

  factory ScanQuota.fromJson(Map<String, dynamic> json) {
    return ScanQuota(
      freeRemaining: json['freeRemaining'] as int,
      rewardedRemaining: json['rewardedRemaining'] as int,
      premiumRemaining: json['premiumRemaining'] as int,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'freeRemaining': freeRemaining,
      'rewardedRemaining': rewardedRemaining,
      'premiumRemaining': premiumRemaining,
    };
  }
}

class RewardedAdCredit {
  const RewardedAdCredit({
    required this.grantedScan,
    required this.adsWatchedToday,
    required this.adsNeededForNextScan,
    required this.scansGrantedToday,
    required this.dailyScanLimit,
    required this.adsPerScan,
    required this.quota,
  });

  final bool grantedScan;
  final int adsWatchedToday;
  final int adsNeededForNextScan;
  final int scansGrantedToday;
  final int dailyScanLimit;
  final int adsPerScan;
  final ScanQuota quota;

  factory RewardedAdCredit.fromJson(Map<String, dynamic> json) {
    return RewardedAdCredit(
      grantedScan: json['grantedScan'] == true,
      adsWatchedToday: json['adsWatchedToday'] as int,
      adsNeededForNextScan: json['adsNeededForNextScan'] as int,
      scansGrantedToday: json['scansGrantedToday'] as int,
      dailyScanLimit: json['dailyScanLimit'] as int,
      adsPerScan: json['adsPerScan'] as int,
      quota: ScanQuota.fromJson(json['quota'] as Map<String, dynamic>),
    );
  }

  RewardedAdProgress get progress => RewardedAdProgress(
    adsWatchedToday: adsWatchedToday,
    adsNeededForNextScan: adsNeededForNextScan,
    scansGrantedToday: scansGrantedToday,
    dailyScanLimit: dailyScanLimit,
    adsPerScan: adsPerScan,
  );
}

class RewardedAdProgress {
  const RewardedAdProgress({
    required this.adsWatchedToday,
    required this.adsNeededForNextScan,
    required this.scansGrantedToday,
    required this.dailyScanLimit,
    required this.adsPerScan,
  });

  final int adsWatchedToday;
  final int adsNeededForNextScan;
  final int scansGrantedToday;
  final int dailyScanLimit;
  final int adsPerScan;

  int get adsCompletedTowardNextScan =>
      adsPerScan == 0 ? 0 : adsWatchedToday % adsPerScan;

  bool get dailyLimitReached => scansGrantedToday >= dailyScanLimit;

  factory RewardedAdProgress.initial() {
    return const RewardedAdProgress(
      adsWatchedToday: 0,
      adsNeededForNextScan: 1,
      scansGrantedToday: 0,
      dailyScanLimit: 5,
      adsPerScan: 1,
    );
  }

  factory RewardedAdProgress.fromJson(Map<String, dynamic> json) {
    return RewardedAdProgress(
      adsWatchedToday: json['adsWatchedToday'] as int? ?? 0,
      adsNeededForNextScan: json['adsNeededForNextScan'] as int? ?? 1,
      scansGrantedToday: json['scansGrantedToday'] as int? ?? 0,
      dailyScanLimit: json['dailyScanLimit'] as int? ?? 5,
      adsPerScan: json['adsPerScan'] as int? ?? 1,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'adsWatchedToday': adsWatchedToday,
      'adsNeededForNextScan': adsNeededForNextScan,
      'scansGrantedToday': scansGrantedToday,
      'dailyScanLimit': dailyScanLimit,
      'adsPerScan': adsPerScan,
    };
  }
}

class ScanAnalysis {
  const ScanAnalysis({
    required this.scanId,
    required this.mealType,
    required this.mealName,
    required this.detectedLanguage,
    required this.items,
    this.imageStored = false,
  });

  final String scanId;
  final MealType mealType;
  final String mealName;
  final String detectedLanguage;
  final List<MealItem> items;
  final bool imageStored;

  factory ScanAnalysis.fromJson(Map<String, dynamic> json) {
    return ScanAnalysis(
      scanId: json['scanId'] as String,
      mealType: MealType.values.byName(json['mealType'] as String),
      mealName: json['mealName'] as String,
      detectedLanguage: json['detectedLanguage'] as String? ?? 'en',
      imageStored: json['imageStored'] == true,
      items: (json['items'] as List<dynamic>)
          .map(
            (item) => MealItem.fromAnalysisJson(item as Map<String, dynamic>),
          )
          .toList(),
    );
  }
}

class ConfirmedScanMeal {
  const ConfirmedScanMeal({
    required this.mealId,
    required this.totals,
    this.meal,
  });

  final String mealId;
  final MacroTotals totals;
  final MealLog? meal;

  factory ConfirmedScanMeal.fromJson(Map<String, dynamic> json) {
    return ConfirmedScanMeal(
      mealId: json['mealId'] as String,
      totals: MacroTotals.fromJson(json['totals'] as Map<String, dynamic>),
      meal: json['meal'] == null
          ? null
          : MealLog.fromJson(json['meal'] as Map<String, dynamic>),
    );
  }
}

List<MealItem> sampleDetectedItems() {
  return const [
    MealItem(
      name: 'Dal',
      quantity: 1,
      unit: 'katori',
      grams: 180,
      confidence: 0.84,
      nutrition: MacroTotals(
        calories: 180,
        proteinG: 10.8,
        carbsG: 25.2,
        fatG: 5.4,
      ),
    ),
    MealItem(
      name: 'Rice',
      quantity: 1,
      unit: 'bowl',
      grams: 150,
      confidence: 0.78,
      nutrition: MacroTotals(
        calories: 210,
        proteinG: 4.2,
        carbsG: 45.1,
        fatG: 0.7,
      ),
    ),
    MealItem(
      name: 'Roti',
      quantity: 2,
      unit: 'piece',
      grams: 60,
      confidence: 0.68,
      nutrition: MacroTotals(
        calories: 160,
        proteinG: 5.2,
        carbsG: 32,
        fatG: 1.6,
      ),
    ),
    MealItem(
      name: 'Sabzi',
      quantity: 1,
      unit: 'katori',
      grams: 120,
      confidence: 0.73,
      nutrition: MacroTotals(
        calories: 118,
        proteinG: 3.1,
        carbsG: 16,
        fatG: 5.3,
      ),
    ),
  ];
}
