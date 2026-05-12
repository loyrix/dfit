enum MealType { breakfast, lunch, snack, dinner }

extension MealTypeLabel on MealType {
  String get label {
    switch (this) {
      case MealType.breakfast:
        return 'BREAKFAST';
      case MealType.lunch:
        return 'LUNCH';
      case MealType.snack:
        return 'SNACK';
      case MealType.dinner:
        return 'DINNER';
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
}

class MealItem {
  const MealItem({
    required this.name,
    required this.quantity,
    required this.unit,
    required this.grams,
    required this.nutrition,
    this.confidence = 1,
  });

  final String name;
  final double quantity;
  final String unit;
  final int grams;
  final MacroTotals nutrition;
  final double confidence;

  MealItem copyWith({
    String? name,
    double? quantity,
    String? unit,
    int? grams,
    MacroTotals? nutrition,
    double? confidence,
  }) {
    return MealItem(
      name: name ?? this.name,
      quantity: quantity ?? this.quantity,
      unit: unit ?? this.unit,
      grams: grams ?? this.grams,
      nutrition: nutrition ?? this.nutrition,
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
      confidence: (json['confidence'] as num).toDouble(),
    );
  }
}

enum MealSyncState { synced, pending }

class MealLog {
  const MealLog({
    required this.id,
    required this.type,
    required this.title,
    required this.loggedAt,
    required this.items,
    this.syncState = MealSyncState.synced,
  });

  final String id;
  final MealType type;
  final String title;
  final DateTime loggedAt;
  final List<MealItem> items;
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
    );
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
}

class JournalRangeSummary {
  const JournalRangeSummary({
    required this.windowDays,
    required this.activeDays,
    required this.mealCount,
    required this.totals,
    required this.dailyAverage,
  });

  final int windowDays;
  final int activeDays;
  final int mealCount;
  final MacroTotals totals;
  final MacroTotals dailyAverage;

  factory JournalRangeSummary.fromJson(Map<String, dynamic> json) {
    return JournalRangeSummary(
      windowDays: json['windowDays'] as int,
      activeDays: json['activeDays'] as int,
      mealCount: json['mealCount'] as int,
      totals: MacroTotals.fromJson(json['totals'] as Map<String, dynamic>),
      dailyAverage: MacroTotals.fromJson(
        json['dailyAverage'] as Map<String, dynamic>,
      ),
    );
  }
}

class JournalRangeData {
  const JournalRangeData({
    required this.startDate,
    required this.endDate,
    required this.days,
    required this.summary,
  });

  final String startDate;
  final String endDate;
  final List<JournalDayData> days;
  final JournalRangeSummary summary;

  factory JournalRangeData.fromJson(Map<String, dynamic> json) {
    return JournalRangeData(
      startDate: json['startDate'] as String,
      endDate: json['endDate'] as String,
      days: (json['days'] as List<dynamic>)
          .map((day) => JournalDayData.fromJson(day as Map<String, dynamic>))
          .toList(),
      summary: JournalRangeSummary.fromJson(
        json['summary'] as Map<String, dynamic>,
      ),
    );
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
}

class ScanAnalysis {
  const ScanAnalysis({
    required this.scanId,
    required this.mealType,
    required this.mealName,
    required this.detectedLanguage,
    required this.items,
  });

  final String scanId;
  final MealType mealType;
  final String mealName;
  final String detectedLanguage;
  final List<MealItem> items;

  factory ScanAnalysis.fromJson(Map<String, dynamic> json) {
    return ScanAnalysis(
      scanId: json['scanId'] as String,
      mealType: MealType.values.byName(json['mealType'] as String),
      mealName: json['mealName'] as String,
      detectedLanguage: json['detectedLanguage'] as String? ?? 'en',
      items: (json['items'] as List<dynamic>)
          .map(
            (item) => MealItem.fromAnalysisJson(item as Map<String, dynamic>),
          )
          .toList(),
    );
  }
}

class ConfirmedScanMeal {
  const ConfirmedScanMeal({required this.mealId, required this.totals});

  final String mealId;
  final MacroTotals totals;

  factory ConfirmedScanMeal.fromJson(Map<String, dynamic> json) {
    return ConfirmedScanMeal(
      mealId: json['mealId'] as String,
      totals: MacroTotals.fromJson(json['totals'] as Map<String, dynamic>),
    );
  }
}

const defaultTarget = MacroTotals(
  calories: 1900,
  proteinG: 120,
  carbsG: 220,
  fatG: 65,
);

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
