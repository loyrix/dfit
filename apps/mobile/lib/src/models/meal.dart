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

class FoodPortion {
  const FoodPortion({
    required this.unit,
    required this.grams,
    required this.confidence,
  });

  final String unit;
  final double grams;
  final double confidence;

  factory FoodPortion.fromJson(Map<String, dynamic> json) {
    return FoodPortion(
      unit: json['unit'] as String? ?? 'serving',
      grams: (json['grams'] as num? ?? 0).toDouble(),
      confidence: (json['confidence'] as num? ?? 0).toDouble(),
    );
  }
}

class FoodSearchResult {
  const FoodSearchResult({
    required this.id,
    required this.canonicalName,
    required this.nutritionPer100g,
    required this.portions,
    required this.score,
    this.matchedAlias,
  });

  final String id;
  final String canonicalName;
  final MacroTotals nutritionPer100g;
  final List<FoodPortion> portions;
  final double score;
  final String? matchedAlias;

  FoodPortion get bestPortion {
    final usefulPortions = portions.where((portion) => portion.grams > 0);
    if (usefulPortions.isEmpty) {
      return const FoodPortion(unit: 'serving', grams: 100, confidence: 0);
    }
    return usefulPortions.reduce(
      (best, portion) => portion.confidence > best.confidence ? portion : best,
    );
  }

  MealItem toMealItem() {
    final portion = bestPortion;
    final grams = portion.grams.round().clamp(1, 5000);
    return MealItem(
      foodId: id,
      name: canonicalName,
      quantity: 1,
      unit: portion.unit,
      grams: grams,
      nutrition: nutritionPer100g.scaledBy(grams / 100),
      confidence: score >= 90 ? 1 : 0.9,
    );
  }

  factory FoodSearchResult.fromJson(Map<String, dynamic> json) {
    return FoodSearchResult(
      id: json['id'] as String,
      canonicalName: json['canonicalName'] as String,
      nutritionPer100g: MacroTotals.fromJson(
        json['nutritionPer100g'] as Map<String, dynamic>,
      ),
      portions: (json['portions'] as List<dynamic>? ?? const [])
          .whereType<Map<String, dynamic>>()
          .map(FoodPortion.fromJson)
          .toList(),
      score: (json['score'] as num? ?? 0).toDouble(),
      matchedAlias: json['matchedAlias'] as String?,
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

class StreakSummary {
  const StreakSummary({
    required this.enabled,
    required this.currentStreakDays,
    required this.longestStreakDays,
    required this.todayLogged,
    required this.daysUntilNextMilestone,
    required this.nextRewardScans,
    this.lastLoggedDate,
    this.nextMilestoneDays,
    this.achievedMilestoneDays,
    this.achievedMilestoneTitle,
    this.achievedMilestoneBody,
  });

  final bool enabled;
  final int currentStreakDays;
  final int longestStreakDays;
  final bool todayLogged;
  final String? lastLoggedDate;
  final int? nextMilestoneDays;
  final int daysUntilNextMilestone;
  final int nextRewardScans;
  final int? achievedMilestoneDays;
  final String? achievedMilestoneTitle;
  final String? achievedMilestoneBody;

  bool get hasHistory =>
      todayLogged || currentStreakDays > 0 || longestStreakDays > 0;

  factory StreakSummary.fromJson(Map<String, dynamic>? json) {
    if (json == null) return StreakSummary.disabled();
    return StreakSummary(
      enabled: _boolValue(json['enabled']),
      currentStreakDays: _boundedInt(
        json['currentStreakDays'],
        fallback: 0,
        min: 0,
        max: 3650,
      ),
      longestStreakDays: _boundedInt(
        json['longestStreakDays'],
        fallback: 0,
        min: 0,
        max: 3650,
      ),
      todayLogged: _boolValue(json['todayLogged']),
      lastLoggedDate: _nullableString(json['lastLoggedDate']),
      nextMilestoneDays: _nullableInt(json['nextMilestoneDays']),
      daysUntilNextMilestone: _boundedInt(
        json['daysUntilNextMilestone'],
        fallback: 0,
        min: 0,
        max: 3650,
      ),
      nextRewardScans: _boundedInt(
        json['nextRewardScans'],
        fallback: 0,
        min: 0,
        max: 100,
      ),
      achievedMilestoneDays: _nullableInt(json['achievedMilestoneDays']),
      achievedMilestoneTitle: _nullableString(json['achievedMilestoneTitle']),
      achievedMilestoneBody: _nullableString(json['achievedMilestoneBody']),
    );
  }

  factory StreakSummary.disabled() {
    return const StreakSummary(
      enabled: false,
      currentStreakDays: 0,
      longestStreakDays: 0,
      todayLogged: false,
      daysUntilNextMilestone: 0,
      nextRewardScans: 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'enabled': enabled,
      'currentStreakDays': currentStreakDays,
      'longestStreakDays': longestStreakDays,
      'todayLogged': todayLogged,
      'lastLoggedDate': lastLoggedDate,
      'nextMilestoneDays': nextMilestoneDays,
      'daysUntilNextMilestone': daysUntilNextMilestone,
      'nextRewardScans': nextRewardScans,
      'achievedMilestoneDays': achievedMilestoneDays,
      'achievedMilestoneTitle': achievedMilestoneTitle,
      'achievedMilestoneBody': achievedMilestoneBody,
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

class EngagementAnalyticsEvents {
  const EngagementAnalyticsEvents({
    this.appOpen = true,
    this.bootstrapLoaded = true,
    this.tabSelected = false,
    this.scanStarted = true,
    this.scanAnalysisSucceeded = true,
    this.scanAnalysisFailed = true,
    this.scanConfirmed = true,
    this.manualMealSaved = true,
    this.mealUpdated = true,
    this.mealDeleted = true,
    this.rewardedAdStarted = true,
    this.rewardedAdEarned = true,
    this.rewardedAdFailed = true,
    this.accountGateShown = true,
    this.accountLinked = true,
    this.healthTargetSaved = true,
  });

  final bool appOpen;
  final bool bootstrapLoaded;
  final bool tabSelected;
  final bool scanStarted;
  final bool scanAnalysisSucceeded;
  final bool scanAnalysisFailed;
  final bool scanConfirmed;
  final bool manualMealSaved;
  final bool mealUpdated;
  final bool mealDeleted;
  final bool rewardedAdStarted;
  final bool rewardedAdEarned;
  final bool rewardedAdFailed;
  final bool accountGateShown;
  final bool accountLinked;
  final bool healthTargetSaved;

  factory EngagementAnalyticsEvents.fromJson(Map<String, dynamic>? json) {
    return EngagementAnalyticsEvents(
      appOpen: _boolValue(json?['appOpen'], fallback: true),
      bootstrapLoaded: _boolValue(json?['bootstrapLoaded'], fallback: true),
      tabSelected: _boolValue(json?['tabSelected']),
      scanStarted: _boolValue(json?['scanStarted'], fallback: true),
      scanAnalysisSucceeded: _boolValue(
        json?['scanAnalysisSucceeded'],
        fallback: true,
      ),
      scanAnalysisFailed: _boolValue(
        json?['scanAnalysisFailed'],
        fallback: true,
      ),
      scanConfirmed: _boolValue(json?['scanConfirmed'], fallback: true),
      manualMealSaved: _boolValue(json?['manualMealSaved'], fallback: true),
      mealUpdated: _boolValue(json?['mealUpdated'], fallback: true),
      mealDeleted: _boolValue(json?['mealDeleted'], fallback: true),
      rewardedAdStarted: _boolValue(json?['rewardedAdStarted'], fallback: true),
      rewardedAdEarned: _boolValue(json?['rewardedAdEarned'], fallback: true),
      rewardedAdFailed: _boolValue(json?['rewardedAdFailed'], fallback: true),
      accountGateShown: _boolValue(json?['accountGateShown'], fallback: true),
      accountLinked: _boolValue(json?['accountLinked'], fallback: true),
      healthTargetSaved: _boolValue(json?['healthTargetSaved'], fallback: true),
    );
  }

  bool isEnabled(String eventName) {
    return switch (eventName) {
      'app_open' => appOpen,
      'bootstrap_loaded' => bootstrapLoaded,
      'tab_selected' => tabSelected,
      'scan_started' => scanStarted,
      'scan_analysis_succeeded' => scanAnalysisSucceeded,
      'scan_analysis_failed' => scanAnalysisFailed,
      'scan_confirmed' => scanConfirmed,
      'manual_meal_saved' => manualMealSaved,
      'meal_updated' => mealUpdated,
      'meal_deleted' => mealDeleted,
      'rewarded_ad_started' => rewardedAdStarted,
      'rewarded_ad_earned' => rewardedAdEarned,
      'rewarded_ad_failed' => rewardedAdFailed,
      'account_gate_shown' => accountGateShown,
      'account_linked' => accountLinked,
      'health_target_saved' => healthTargetSaved,
      _ => false,
    };
  }

  Map<String, dynamic> toJson() {
    return {
      'appOpen': appOpen,
      'bootstrapLoaded': bootstrapLoaded,
      'tabSelected': tabSelected,
      'scanStarted': scanStarted,
      'scanAnalysisSucceeded': scanAnalysisSucceeded,
      'scanAnalysisFailed': scanAnalysisFailed,
      'scanConfirmed': scanConfirmed,
      'manualMealSaved': manualMealSaved,
      'mealUpdated': mealUpdated,
      'mealDeleted': mealDeleted,
      'rewardedAdStarted': rewardedAdStarted,
      'rewardedAdEarned': rewardedAdEarned,
      'rewardedAdFailed': rewardedAdFailed,
      'accountGateShown': accountGateShown,
      'accountLinked': accountLinked,
      'healthTargetSaved': healthTargetSaved,
    };
  }
}

class EngagementAnalyticsPolicy {
  const EngagementAnalyticsPolicy({
    this.enabled = false,
    this.firebaseEnabled = false,
    this.debugLogging = false,
    this.sampleRatePercent = 100,
    this.events = const EngagementAnalyticsEvents(),
  });

  final bool enabled;
  final bool firebaseEnabled;
  final bool debugLogging;
  final int sampleRatePercent;
  final EngagementAnalyticsEvents events;

  bool get canReport => enabled && firebaseEnabled && sampleRatePercent > 0;

  factory EngagementAnalyticsPolicy.disabled() {
    return const EngagementAnalyticsPolicy();
  }

  factory EngagementAnalyticsPolicy.fromJson(Map<String, dynamic>? json) {
    if (json == null) return EngagementAnalyticsPolicy.disabled();
    return EngagementAnalyticsPolicy(
      enabled: _boolValue(json['enabled']),
      firebaseEnabled: _boolValue(json['firebaseEnabled']),
      debugLogging: _boolValue(json['debugLogging']),
      sampleRatePercent: _boundedInt(
        json['sampleRatePercent'],
        fallback: 100,
        min: 0,
        max: 100,
      ),
      events: EngagementAnalyticsEvents.fromJson(
        json['events'] as Map<String, dynamic>?,
      ),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'enabled': enabled,
      'firebaseEnabled': firebaseEnabled,
      'debugLogging': debugLogging,
      'sampleRatePercent': sampleRatePercent,
      'events': events.toJson(),
    };
  }
}

class EngagementReviewPromptCopy {
  const EngagementReviewPromptCopy({
    this.title = 'Enjoying LogMyPlate?',
    this.body =
        'A quick review helps more people discover simple meal tracking.',
    this.positiveLabel = 'Rate LogMyPlate',
    this.negativeLabel = 'Not now',
  });

  final String title;
  final String body;
  final String positiveLabel;
  final String negativeLabel;

  factory EngagementReviewPromptCopy.fromJson(Map<String, dynamic>? json) {
    if (json == null) return const EngagementReviewPromptCopy();
    return EngagementReviewPromptCopy(
      title: _stringValue(json['title'], fallback: 'Enjoying LogMyPlate?'),
      body: _stringValue(
        json['body'],
        fallback:
            'A quick review helps more people discover simple meal tracking.',
      ),
      positiveLabel: _stringValue(
        json['positiveLabel'],
        fallback: 'Rate LogMyPlate',
      ),
      negativeLabel: _stringValue(json['negativeLabel'], fallback: 'Not now'),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'title': title,
      'body': body,
      'positiveLabel': positiveLabel,
      'negativeLabel': negativeLabel,
    };
  }
}

class EngagementStoreUrls {
  const EngagementStoreUrls({
    this.ios = 'https://apps.apple.com/app/id6770872606',
    this.android =
        'https://play.google.com/store/apps/details?id=com.logmyplate.app',
  });

  final String? ios;
  final String? android;

  factory EngagementStoreUrls.fromJson(Map<String, dynamic>? json) {
    if (json == null) return const EngagementStoreUrls();
    return EngagementStoreUrls(
      ios: _nullableString(json['ios']),
      android: _nullableString(json['android']),
    );
  }

  Map<String, dynamic> toJson() {
    return {'ios': ios, 'android': android};
  }
}

class EngagementReviewPromptPolicy {
  const EngagementReviewPromptPolicy({
    this.enabled = false,
    this.minConfirmedScans = 3,
    this.minActiveDays = 2,
    this.cooldownDays = 90,
    this.oncePerAppVersion = true,
    this.storeUrls = const EngagementStoreUrls(),
    this.copy = const EngagementReviewPromptCopy(),
  });

  final bool enabled;
  final int minConfirmedScans;
  final int minActiveDays;
  final int cooldownDays;
  final bool oncePerAppVersion;
  final EngagementStoreUrls storeUrls;
  final EngagementReviewPromptCopy copy;

  factory EngagementReviewPromptPolicy.disabled() {
    return const EngagementReviewPromptPolicy();
  }

  factory EngagementReviewPromptPolicy.fromJson(Map<String, dynamic>? json) {
    if (json == null) return EngagementReviewPromptPolicy.disabled();
    return EngagementReviewPromptPolicy(
      enabled: _boolValue(json['enabled']),
      minConfirmedScans: _boundedInt(
        json['minConfirmedScans'],
        fallback: 3,
        min: 0,
        max: 1000,
      ),
      minActiveDays: _boundedInt(
        json['minActiveDays'],
        fallback: 2,
        min: 0,
        max: 365,
      ),
      cooldownDays: _boundedInt(
        json['cooldownDays'],
        fallback: 90,
        min: 1,
        max: 365,
      ),
      oncePerAppVersion: _boolValue(json['oncePerAppVersion'], fallback: true),
      storeUrls: EngagementStoreUrls.fromJson(
        json['storeUrls'] as Map<String, dynamic>?,
      ),
      copy: EngagementReviewPromptCopy.fromJson(
        json['copy'] as Map<String, dynamic>?,
      ),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'enabled': enabled,
      'minConfirmedScans': minConfirmedScans,
      'minActiveDays': minActiveDays,
      'cooldownDays': cooldownDays,
      'oncePerAppVersion': oncePerAppVersion,
      'storeUrls': storeUrls.toJson(),
      'copy': copy.toJson(),
    };
  }
}

class EngagementAdUnitIds {
  const EngagementAdUnitIds({this.ios, this.android});

  final String? ios;
  final String? android;

  factory EngagementAdUnitIds.fromJson(Map<String, dynamic>? json) {
    if (json == null) return const EngagementAdUnitIds();
    return EngagementAdUnitIds(
      ios: _nullableString(json['ios']),
      android: _nullableString(json['android']),
    );
  }

  Map<String, dynamic> toJson() {
    return {'ios': ios, 'android': android};
  }
}

class EngagementInterstitialAdsPolicy {
  const EngagementInterstitialAdsPolicy({
    this.enabled = false,
    this.freeUsersOnly = true,
    this.premiumExcluded = true,
    this.minConfirmedScansBeforeFirstAd = 2,
    this.scansBetweenAds = 2,
    this.cooldownMinutes = 10,
    this.dailyCap = 3,
    this.adUnitIds = const EngagementAdUnitIds(),
  });

  final bool enabled;
  final bool freeUsersOnly;
  final bool premiumExcluded;
  final int minConfirmedScansBeforeFirstAd;
  final int scansBetweenAds;
  final int cooldownMinutes;
  final int dailyCap;
  final EngagementAdUnitIds adUnitIds;

  factory EngagementInterstitialAdsPolicy.disabled() {
    return const EngagementInterstitialAdsPolicy();
  }

  factory EngagementInterstitialAdsPolicy.fromJson(Map<String, dynamic>? json) {
    if (json == null) return EngagementInterstitialAdsPolicy.disabled();
    return EngagementInterstitialAdsPolicy(
      enabled: _boolValue(json['enabled']),
      freeUsersOnly: _boolValue(json['freeUsersOnly'], fallback: true),
      premiumExcluded: _boolValue(json['premiumExcluded'], fallback: true),
      minConfirmedScansBeforeFirstAd: _boundedInt(
        json['minConfirmedScansBeforeFirstAd'],
        fallback: 2,
        min: 0,
        max: 1000,
      ),
      scansBetweenAds: _boundedInt(
        json['scansBetweenAds'],
        fallback: 2,
        min: 1,
        max: 1000,
      ),
      cooldownMinutes: _boundedInt(
        json['cooldownMinutes'],
        fallback: 10,
        min: 0,
        max: 1440,
      ),
      dailyCap: _boundedInt(json['dailyCap'], fallback: 3, min: 0, max: 100),
      adUnitIds: EngagementAdUnitIds.fromJson(
        json['adUnitIds'] as Map<String, dynamic>?,
      ),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'enabled': enabled,
      'freeUsersOnly': freeUsersOnly,
      'premiumExcluded': premiumExcluded,
      'minConfirmedScansBeforeFirstAd': minConfirmedScansBeforeFirstAd,
      'scansBetweenAds': scansBetweenAds,
      'cooldownMinutes': cooldownMinutes,
      'dailyCap': dailyCap,
      'adUnitIds': adUnitIds.toJson(),
    };
  }
}

class EngagementAdmobPolicy {
  const EngagementAdmobPolicy({this.testDeviceIds = const []});

  final List<String> testDeviceIds;

  factory EngagementAdmobPolicy.fromJson(Map<String, dynamic>? json) {
    if (json == null) return const EngagementAdmobPolicy();
    final ids = json['testDeviceIds'] as List<dynamic>?;
    return EngagementAdmobPolicy(
      testDeviceIds: ids?.map((e) => e.toString()).toList() ?? const [],
    );
  }

  Map<String, dynamic> toJson() {
    return {'testDeviceIds': testDeviceIds};
  }
}

class EngagementRewardedAdsPolicy {
  const EngagementRewardedAdsPolicy({this.dailyScanLimit = 5});

  final int dailyScanLimit;

  factory EngagementRewardedAdsPolicy.fromJson(Map<String, dynamic>? json) {
    if (json == null) return const EngagementRewardedAdsPolicy();
    return EngagementRewardedAdsPolicy(
      dailyScanLimit: _boundedInt(
        json['dailyScanLimit'],
        fallback: 5,
        min: 1,
        max: 100,
      ),
    );
  }

  Map<String, dynamic> toJson() {
    return {'dailyScanLimit': dailyScanLimit};
  }
}

class EngagementQuietHours {
  const EngagementQuietHours({this.start = '22:00', this.end = '07:00'});

  final String start;
  final String end;

  factory EngagementQuietHours.fromJson(Map<String, dynamic>? json) {
    if (json == null) return const EngagementQuietHours();
    return EngagementQuietHours(
      start: _stringValue(json['start'], fallback: '22:00'),
      end: _stringValue(json['end'], fallback: '07:00'),
    );
  }

  Map<String, dynamic> toJson() {
    return {'start': start, 'end': end};
  }
}

class EngagementNotificationScenarioPolicy {
  const EngagementNotificationScenarioPolicy({
    this.enabled = false,
    this.windowStart = '12:00',
    this.windowEnd = '13:00',
    this.title = 'Meal reminder',
    this.body = 'Log your meal when it fits.',
    this.requiresTarget = false,
    this.onlyIfTargetNotReached = true,
  });

  final bool enabled;
  final String windowStart;
  final String windowEnd;
  final String title;
  final String body;
  final bool requiresTarget;
  final bool onlyIfTargetNotReached;

  factory EngagementNotificationScenarioPolicy.fromJson(
    Map<String, dynamic>? json, {
    required EngagementNotificationScenarioPolicy fallback,
  }) {
    if (json == null) return fallback;
    return EngagementNotificationScenarioPolicy(
      enabled: _boolValue(json['enabled']),
      windowStart: _stringValue(
        json['windowStart'],
        fallback: fallback.windowStart,
      ),
      windowEnd: _stringValue(json['windowEnd'], fallback: fallback.windowEnd),
      title: _stringValue(json['title'], fallback: fallback.title),
      body: _stringValue(json['body'], fallback: fallback.body),
      requiresTarget: _boolValue(
        json['requiresTarget'],
        fallback: fallback.requiresTarget,
      ),
      onlyIfTargetNotReached: _boolValue(
        json['onlyIfTargetNotReached'],
        fallback: fallback.onlyIfTargetNotReached,
      ),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'enabled': enabled,
      'windowStart': windowStart,
      'windowEnd': windowEnd,
      'title': title,
      'body': body,
      'requiresTarget': requiresTarget,
      'onlyIfTargetNotReached': onlyIfTargetNotReached,
    };
  }
}

class EngagementNotificationScenarios {
  const EngagementNotificationScenarios({
    this.breakfast = _defaultBreakfast,
    this.lunch = _defaultLunch,
    this.snack = _defaultSnack,
    this.dinner = _defaultDinner,
    this.targetSetup = _defaultTargetSetup,
  });

  static const _defaultBreakfast = EngagementNotificationScenarioPolicy(
    windowStart: '08:30',
    windowEnd: '10:00',
    title: 'Breakfast check-in',
    body: 'A quick breakfast log keeps today on track.',
  );
  static const _defaultLunch = EngagementNotificationScenarioPolicy(
    windowStart: '13:00',
    windowEnd: '14:30',
    title: 'Lunch reminder',
    body: 'Still no lunch logged. Add it before the day gets busy.',
    requiresTarget: true,
  );
  static const _defaultSnack = EngagementNotificationScenarioPolicy(
    windowStart: '17:00',
    windowEnd: '18:30',
    title: 'Snack check-in',
    body: 'If you had a snack, log it now while it is fresh.',
    requiresTarget: true,
  );
  static const _defaultDinner = EngagementNotificationScenarioPolicy(
    windowStart: '20:00',
    windowEnd: '21:30',
    title: 'Dinner reminder',
    body: 'Dinner not logged yet. Capture it before wrapping up.',
    requiresTarget: true,
  );
  static const _defaultTargetSetup = EngagementNotificationScenarioPolicy(
    windowStart: '18:00',
    windowEnd: '19:00',
    title: 'Set your calorie target',
    body: 'Set a target once so LogMyPlate can guide your day better.',
    onlyIfTargetNotReached: false,
  );

  final EngagementNotificationScenarioPolicy breakfast;
  final EngagementNotificationScenarioPolicy lunch;
  final EngagementNotificationScenarioPolicy snack;
  final EngagementNotificationScenarioPolicy dinner;
  final EngagementNotificationScenarioPolicy targetSetup;

  factory EngagementNotificationScenarios.fromJson(Map<String, dynamic>? json) {
    if (json == null) return const EngagementNotificationScenarios();
    return EngagementNotificationScenarios(
      breakfast: EngagementNotificationScenarioPolicy.fromJson(
        json['breakfast'] as Map<String, dynamic>?,
        fallback: _defaultBreakfast,
      ),
      lunch: EngagementNotificationScenarioPolicy.fromJson(
        json['lunch'] as Map<String, dynamic>?,
        fallback: _defaultLunch,
      ),
      snack: EngagementNotificationScenarioPolicy.fromJson(
        json['snack'] as Map<String, dynamic>?,
        fallback: _defaultSnack,
      ),
      dinner: EngagementNotificationScenarioPolicy.fromJson(
        json['dinner'] as Map<String, dynamic>?,
        fallback: _defaultDinner,
      ),
      targetSetup: EngagementNotificationScenarioPolicy.fromJson(
        json['targetSetup'] as Map<String, dynamic>?,
        fallback: _defaultTargetSetup,
      ),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'breakfast': breakfast.toJson(),
      'lunch': lunch.toJson(),
      'snack': snack.toJson(),
      'dinner': dinner.toJson(),
      'targetSetup': targetSetup.toJson(),
    };
  }
}

class EngagementNotificationsPolicy {
  const EngagementNotificationsPolicy({
    this.enabled = false,
    this.dailyCap = 2,
    this.quietHours = const EngagementQuietHours(),
    this.scenarios = const EngagementNotificationScenarios(),
  });

  final bool enabled;
  final int dailyCap;
  final EngagementQuietHours quietHours;
  final EngagementNotificationScenarios scenarios;

  factory EngagementNotificationsPolicy.disabled() {
    return const EngagementNotificationsPolicy();
  }

  factory EngagementNotificationsPolicy.fromJson(Map<String, dynamic>? json) {
    if (json == null) return EngagementNotificationsPolicy.disabled();
    return EngagementNotificationsPolicy(
      enabled: _boolValue(json['enabled']),
      dailyCap: _boundedInt(json['dailyCap'], fallback: 2, min: 0, max: 10),
      quietHours: EngagementQuietHours.fromJson(
        json['quietHours'] as Map<String, dynamic>?,
      ),
      scenarios: EngagementNotificationScenarios.fromJson(
        json['scenarios'] as Map<String, dynamic>?,
      ),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'enabled': enabled,
      'dailyCap': dailyCap,
      'quietHours': quietHours.toJson(),
      'scenarios': scenarios.toJson(),
    };
  }
}

class EngagementStreakMilestone {
  const EngagementStreakMilestone({
    required this.days,
    required this.title,
    required this.body,
    this.scanRewardAmount = 0,
  });

  final int days;
  final String title;
  final String body;
  final int scanRewardAmount;

  factory EngagementStreakMilestone.fromJson(Map<String, dynamic> json) {
    return EngagementStreakMilestone(
      days: _boundedInt(json['days'], fallback: 3, min: 1, max: 3650),
      title: _stringValue(json['title'], fallback: 'Streak milestone'),
      body: _stringValue(json['body'], fallback: 'Keep your logging rhythm.'),
      scanRewardAmount: _boundedInt(
        json['scanRewardAmount'],
        fallback: 0,
        min: 0,
        max: 100,
      ),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'days': days,
      'title': title,
      'body': body,
      'scanRewardAmount': scanRewardAmount,
    };
  }
}

class EngagementStreakScanRewardsPolicy {
  const EngagementStreakScanRewardsPolicy({this.enabled = false});

  final bool enabled;

  factory EngagementStreakScanRewardsPolicy.fromJson(
    Map<String, dynamic>? json,
  ) {
    if (json == null) return const EngagementStreakScanRewardsPolicy();
    return EngagementStreakScanRewardsPolicy(
      enabled: _boolValue(json['enabled']),
    );
  }

  Map<String, dynamic> toJson() {
    return {'enabled': enabled};
  }
}

class EngagementStreaksPolicy {
  const EngagementStreaksPolicy({
    this.enabled = false,
    this.milestones = _defaultMilestones,
    this.scanRewards = const EngagementStreakScanRewardsPolicy(),
  });

  static const _defaultMilestones = [
    EngagementStreakMilestone(
      days: 3,
      title: '3-day streak',
      body: 'You logged meals for 3 days. Nice rhythm.',
    ),
    EngagementStreakMilestone(
      days: 7,
      title: '7-day streak',
      body: 'A full week of logging. Your pattern is getting clearer.',
    ),
    EngagementStreakMilestone(
      days: 14,
      title: '14-day streak',
      body: 'Two steady weeks. This is how awareness becomes a habit.',
    ),
    EngagementStreakMilestone(
      days: 30,
      title: '30-day streak',
      body: 'A month of consistency. That is real progress.',
    ),
  ];

  final bool enabled;
  final List<EngagementStreakMilestone> milestones;
  final EngagementStreakScanRewardsPolicy scanRewards;

  factory EngagementStreaksPolicy.disabled() {
    return const EngagementStreaksPolicy();
  }

  factory EngagementStreaksPolicy.fromJson(Map<String, dynamic>? json) {
    if (json == null) return EngagementStreaksPolicy.disabled();
    final milestones = (json['milestones'] as List<dynamic>?)
        ?.whereType<Map<String, dynamic>>()
        .map(EngagementStreakMilestone.fromJson)
        .toList();
    return EngagementStreaksPolicy(
      enabled: _boolValue(json['enabled']),
      milestones: milestones == null || milestones.isEmpty
          ? _defaultMilestones
          : milestones,
      scanRewards: EngagementStreakScanRewardsPolicy.fromJson(
        json['scanRewards'] as Map<String, dynamic>?,
      ),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'enabled': enabled,
      'milestones': milestones.map((milestone) => milestone.toJson()).toList(),
      'scanRewards': scanRewards.toJson(),
    };
  }
}

class EngagementPolicy {
  const EngagementPolicy({
    this.analytics = const EngagementAnalyticsPolicy(),
    this.reviewPrompt = const EngagementReviewPromptPolicy(),
    this.interstitialAds = const EngagementInterstitialAdsPolicy(),
    this.rewardedAds = const EngagementRewardedAdsPolicy(),
    this.admob = const EngagementAdmobPolicy(),
    this.notifications = const EngagementNotificationsPolicy(),
    this.streaks = const EngagementStreaksPolicy(),
  });

  final EngagementAnalyticsPolicy analytics;
  final EngagementReviewPromptPolicy reviewPrompt;
  final EngagementInterstitialAdsPolicy interstitialAds;
  final EngagementRewardedAdsPolicy rewardedAds;
  final EngagementAdmobPolicy admob;
  final EngagementNotificationsPolicy notifications;
  final EngagementStreaksPolicy streaks;

  factory EngagementPolicy.disabled() {
    return const EngagementPolicy();
  }

  factory EngagementPolicy.fromJson(Map<String, dynamic>? json) {
    if (json == null) return EngagementPolicy.disabled();
    return EngagementPolicy(
      analytics: EngagementAnalyticsPolicy.fromJson(
        json['analytics'] as Map<String, dynamic>?,
      ),
      reviewPrompt: EngagementReviewPromptPolicy.fromJson(
        json['reviewPrompt'] as Map<String, dynamic>?,
      ),
      interstitialAds: EngagementInterstitialAdsPolicy.fromJson(
        json['interstitialAds'] as Map<String, dynamic>?,
      ),
      rewardedAds: EngagementRewardedAdsPolicy.fromJson(
        json['rewardedAds'] as Map<String, dynamic>?,
      ),
      admob: EngagementAdmobPolicy.fromJson(
        json['admob'] as Map<String, dynamic>?,
      ),
      notifications: EngagementNotificationsPolicy.fromJson(
        json['notifications'] as Map<String, dynamic>?,
      ),
      streaks: EngagementStreaksPolicy.fromJson(
        json['streaks'] as Map<String, dynamic>?,
      ),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'analytics': analytics.toJson(),
      'reviewPrompt': reviewPrompt.toJson(),
      'interstitialAds': interstitialAds.toJson(),
      'rewardedAds': rewardedAds.toJson(),
      'admob': admob.toJson(),
      'notifications': notifications.toJson(),
      'streaks': streaks.toJson(),
    };
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

bool _boolValue(Object? value, {bool fallback = false}) {
  if (value is bool) return value;
  if (value is num) return value != 0;
  if (value is String) {
    final normalized = value.trim().toLowerCase();
    if (normalized == 'true') return true;
    if (normalized == 'false') return false;
  }
  return fallback;
}

String _stringValue(Object? value, {required String fallback}) {
  if (value == null) return fallback;
  final text = value.toString().trim();
  return text.isEmpty ? fallback : text;
}

String? _nullableString(Object? value) {
  if (value == null) return null;
  final text = value.toString().trim();
  return text.isEmpty ? null : text;
}

int _boundedInt(
  Object? value, {
  required int fallback,
  required int min,
  required int max,
}) {
  final parsed = _nullableInt(value) ?? fallback;
  if (parsed < min) return min;
  if (parsed > max) return max;
  return parsed;
}

int _intFromJson(Object? value, {int fallback = 0}) {
  return _nullableInt(value) ?? fallback;
}

String _stringFromJson(Object? value, {String fallback = ''}) {
  return _stringValue(value, fallback: fallback);
}

String? _optionalStringFromJson(Object? value) {
  return _nullableString(value);
}

DateTime? _dateTimeFromJson(Object? value) {
  final text = _nullableString(value);
  if (text == null) return null;
  return DateTime.tryParse(text)?.toLocal();
}

SubscriptionAccessStatus _subscriptionAccessStatusFromJson(Object? value) {
  return switch (_nullableString(value)) {
    'active' => SubscriptionAccessStatus.active,
    'inactive' => SubscriptionAccessStatus.inactive,
    'expired' => SubscriptionAccessStatus.expired,
    'cancelled' => SubscriptionAccessStatus.cancelled,
    'billing_issue' => SubscriptionAccessStatus.billingIssue,
    _ => SubscriptionAccessStatus.unknown,
  };
}

SubscriptionStore _subscriptionStoreFromJson(Object? value) {
  return switch (_nullableString(value)) {
    'app_store' => SubscriptionStore.appStore,
    'play_store' => SubscriptionStore.playStore,
    'stripe' => SubscriptionStore.stripe,
    'promotional' => SubscriptionStore.promotional,
    _ => SubscriptionStore.unknown,
  };
}

class AppBootstrapData {
  const AppBootstrapData({
    required this.serverTime,
    required this.profile,
    this.healthTarget,
    required this.updatePolicy,
    required this.engagementPolicy,
    required this.subscription,
    required this.quota,
    required this.rewardedAdProgress,
    required this.today,
    required this.weeklyRange,
    required this.streakSummary,
  });

  final String serverTime;
  final AppProfile profile;
  final HealthTarget? healthTarget;
  final AppUpdatePolicy updatePolicy;
  final EngagementPolicy engagementPolicy;
  final SubscriptionStatus subscription;
  final ScanQuota quota;
  final RewardedAdProgress rewardedAdProgress;
  final TodayJournalData today;
  final JournalRangeData weeklyRange;
  final StreakSummary streakSummary;

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
      engagementPolicy: EngagementPolicy.fromJson(
        json['engagementPolicy'] as Map<String, dynamic>?,
      ),
      subscription: SubscriptionStatus.fromJson(
        json['subscription'] as Map<String, dynamic>?,
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
      streakSummary: StreakSummary.fromJson(
        json['streakSummary'] as Map<String, dynamic>?,
      ),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'serverTime': serverTime,
      'profile': profile.toJson(),
      'updatePolicy': {
        'status': updatePolicy.status.name,
        if (updatePolicy.platform != null) 'platform': updatePolicy.platform,
        if (updatePolicy.currentBuild != null)
          'currentBuild': updatePolicy.currentBuild,
        if (updatePolicy.currentVersion != null)
          'currentVersion': updatePolicy.currentVersion,
        if (updatePolicy.latestBuild != null)
          'latestBuild': updatePolicy.latestBuild,
        if (updatePolicy.latestVersion != null)
          'latestVersion': updatePolicy.latestVersion,
        if (updatePolicy.minSupportedBuild != null)
          'minSupportedBuild': updatePolicy.minSupportedBuild,
        if (updatePolicy.storeUrl != null) 'storeUrl': updatePolicy.storeUrl,
        if (updatePolicy.title != null) 'title': updatePolicy.title,
        if (updatePolicy.message != null) 'message': updatePolicy.message,
      },
      'engagementPolicy': engagementPolicy.toJson(),
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
      'streakSummary': streakSummary.toJson(),
      'subscription': subscription.toJson(),
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

enum SubscriptionAccessStatus {
  active,
  inactive,
  expired,
  cancelled,
  billingIssue,
  unknown;

  String get apiName {
    return switch (this) {
      SubscriptionAccessStatus.active => 'active',
      SubscriptionAccessStatus.inactive => 'inactive',
      SubscriptionAccessStatus.expired => 'expired',
      SubscriptionAccessStatus.cancelled => 'cancelled',
      SubscriptionAccessStatus.billingIssue => 'billing_issue',
      SubscriptionAccessStatus.unknown => 'unknown',
    };
  }
}

enum SubscriptionStore {
  appStore,
  playStore,
  stripe,
  promotional,
  unknown;

  String get apiName {
    return switch (this) {
      SubscriptionStore.appStore => 'app_store',
      SubscriptionStore.playStore => 'play_store',
      SubscriptionStore.stripe => 'stripe',
      SubscriptionStore.promotional => 'promotional',
      SubscriptionStore.unknown => 'unknown',
    };
  }
}

class SubscriptionUsage {
  const SubscriptionUsage({
    required this.monthlyLimit,
    required this.dailyLimit,
    required this.usedThisPeriod,
    required this.usedToday,
    required this.remainingThisPeriod,
    required this.remainingToday,
    required this.premiumRemaining,
  });

  final int monthlyLimit;
  final int dailyLimit;
  final int usedThisPeriod;
  final int usedToday;
  final int remainingThisPeriod;
  final int remainingToday;
  final int premiumRemaining;

  factory SubscriptionUsage.inactive() {
    return const SubscriptionUsage(
      monthlyLimit: 300,
      dailyLimit: 10,
      usedThisPeriod: 0,
      usedToday: 0,
      remainingThisPeriod: 0,
      remainingToday: 0,
      premiumRemaining: 0,
    );
  }

  factory SubscriptionUsage.fromJson(Map<String, dynamic>? json) {
    if (json == null) return SubscriptionUsage.inactive();
    return SubscriptionUsage(
      monthlyLimit: _intFromJson(json['monthlyLimit'], fallback: 300),
      dailyLimit: _intFromJson(json['dailyLimit'], fallback: 10),
      usedThisPeriod: _intFromJson(json['usedThisPeriod']),
      usedToday: _intFromJson(json['usedToday']),
      remainingThisPeriod: _intFromJson(json['remainingThisPeriod']),
      remainingToday: _intFromJson(json['remainingToday']),
      premiumRemaining: _intFromJson(json['premiumRemaining']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'monthlyLimit': monthlyLimit,
      'dailyLimit': dailyLimit,
      'usedThisPeriod': usedThisPeriod,
      'usedToday': usedToday,
      'remainingThisPeriod': remainingThisPeriod,
      'remainingToday': remainingToday,
      'premiumRemaining': premiumRemaining,
    };
  }
}

class SubscriptionStatus {
  const SubscriptionStatus({
    required this.appUserId,
    required this.entitlementId,
    required this.active,
    required this.status,
    required this.store,
    this.productId,
    this.currentPeriodStart,
    this.currentPeriodEnd,
    this.willRenew,
    required this.usage,
  });

  final String appUserId;
  final String entitlementId;
  final bool active;
  final SubscriptionAccessStatus status;
  final SubscriptionStore store;
  final String? productId;
  final DateTime? currentPeriodStart;
  final DateTime? currentPeriodEnd;
  final bool? willRenew;
  final SubscriptionUsage usage;

  bool get hasPremiumAccess => active && usage.premiumRemaining > 0;

  String get shortLabel {
    if (!active) return 'Not active';
    if (currentPeriodEnd == null) return 'Active';
    final date = _formatPeriodEnd(currentPeriodEnd!);
    return willRenew == false ? 'Active until $date · not renewing' : 'Active · renews $date';
  }

  static String _formatPeriodEnd(DateTime value) {
    final local = value.toLocal();
    final y = local.year.toString().padLeft(4, '0');
    final m = local.month.toString().padLeft(2, '0');
    final d = local.day.toString().padLeft(2, '0');
    return '$y-$m-$d';
  }

  factory SubscriptionStatus.inactive({
    String appUserId = '',
    String entitlementId = 'premium',
  }) {
    return SubscriptionStatus(
      appUserId: appUserId,
      entitlementId: entitlementId,
      active: false,
      status: SubscriptionAccessStatus.inactive,
      store: SubscriptionStore.unknown,
      usage: SubscriptionUsage.inactive(),
    );
  }

  factory SubscriptionStatus.fromJson(Map<String, dynamic>? json) {
    if (json == null) return SubscriptionStatus.inactive();
    return SubscriptionStatus(
      appUserId: _stringFromJson(json['appUserId']),
      entitlementId: _stringFromJson(
        json['entitlementId'],
        fallback: 'premium',
      ),
      active: json['active'] == true,
      status: _subscriptionAccessStatusFromJson(json['status']),
      store: _subscriptionStoreFromJson(json['store']),
      productId: _optionalStringFromJson(json['productId']),
      currentPeriodStart: _dateTimeFromJson(json['currentPeriodStart']),
      currentPeriodEnd: _dateTimeFromJson(json['currentPeriodEnd']),
      willRenew: json['willRenew'] is bool ? json['willRenew'] as bool : null,
      usage: SubscriptionUsage.fromJson(json['usage'] as Map<String, dynamic>?),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'appUserId': appUserId,
      'entitlementId': entitlementId,
      'active': active,
      'status': status.apiName,
      'store': store.apiName,
      if (productId != null) 'productId': productId,
      if (currentPeriodStart != null)
        'currentPeriodStart': currentPeriodStart!.toUtc().toIso8601String(),
      if (currentPeriodEnd != null)
        'currentPeriodEnd': currentPeriodEnd!.toUtc().toIso8601String(),
      if (willRenew != null) 'willRenew': willRenew,
      'usage': usage.toJson(),
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

  MacroTotals get totals {
    return items.fold<MacroTotals>(
      MacroTotals.zero,
      (total, item) => total + item.nutrition,
    );
  }

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
