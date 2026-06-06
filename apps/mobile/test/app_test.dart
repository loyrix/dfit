import 'dart:async';
import 'dart:convert';

import 'package:logmyplate_mobile/src/app.dart';
import 'package:logmyplate_mobile/src/models/auth_session.dart';
import 'package:logmyplate_mobile/src/models/captured_meal_photo.dart';
import 'package:logmyplate_mobile/src/models/meal.dart';
import 'package:logmyplate_mobile/src/screens/account_gate_screen.dart';
import 'package:logmyplate_mobile/src/screens/account_profile_screen.dart';
import 'package:logmyplate_mobile/src/screens/analyzing_screen.dart';
import 'package:logmyplate_mobile/src/screens/health_target_screen.dart';
import 'package:logmyplate_mobile/src/screens/meal_detail_screen.dart';
import 'package:logmyplate_mobile/src/screens/profile_screen.dart';
import 'package:logmyplate_mobile/src/screens/review_meal_screen.dart';
import 'package:logmyplate_mobile/src/screens/settings_screen.dart';
import 'package:logmyplate_mobile/src/screens/startup_error_screen.dart';
import 'package:logmyplate_mobile/src/screens/today_screen.dart';
import 'package:logmyplate_mobile/src/screens/weekly_journal_screen.dart';
import 'package:logmyplate_mobile/src/services/account_session_store.dart';
import 'package:logmyplate_mobile/src/services/app_links.dart';
import 'package:logmyplate_mobile/src/services/app_diagnostics.dart';
import 'package:logmyplate_mobile/src/services/logmyplate_api_client.dart';
import 'package:logmyplate_mobile/src/services/oauth_sign_in_service.dart';
import 'package:logmyplate_mobile/src/services/rewarded_ad_service.dart';
import 'package:logmyplate_mobile/src/state/auth_controller.dart';
import 'package:logmyplate_mobile/src/state/journal_controller.dart';
import 'package:logmyplate_mobile/src/theme/logmyplate_theme.dart';
import 'package:logmyplate_mobile/src/widgets/primitive_icons.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  const appLinksMessages = MethodChannel('com.llfbandit.app_links/messages');
  const appLinksEvents = EventChannel('com.llfbandit.app_links/events');

  setUp(() {
    SharedPreferences.setMockInitialValues({});
    AppDiagnostics.instance.clear();
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(appLinksMessages, (_) async => null);
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockStreamHandler(
          appLinksEvents,
          MockStreamHandler.inline(onListen: (_, _) {}),
        );
  });

  testWidgets('renders LogMyPlate welcome screen', (tester) async {
    await tester.pumpWidget(const LogMyPlateApp());
    await tester.pump();

    expect(find.text('LogMyPlate'), findsOneWidget);
    expect(
      find.text('AI-powered food tracking, without the hassle.'),
      findsOneWidget,
    );
    expect(find.text('Start first scan'), findsOneWidget);
  });

  test('parses LogMyPlate account deletion deep links', () {
    expect(
      parseLogMyPlateDeepLink(Uri.parse('logmyplate://delete-account')),
      LogMyPlateDeepLink.deleteAccount,
    );
    expect(
      parseLogMyPlateDeepLink(Uri.parse('logmyplate:///account/delete')),
      LogMyPlateDeepLink.deleteAccount,
    );
    expect(
      parseLogMyPlateDeepLink(
        Uri.parse('https://www.logmyplate.com/delete-account'),
      ),
      LogMyPlateDeepLink.deleteAccount,
    );
    expect(
      parseLogMyPlateDeepLink(Uri.parse('https://example.com/delete-account')),
      isNull,
    );
  });

  testWidgets('enters camera flow from welcome', (tester) async {
    await tester.pumpWidget(
      LogMyPlateApp(journalController: _testJournalController()),
    );
    await tester.pump();

    await tester.tap(find.text('Start first scan'));
    await tester.pump();
    await _pumpAppFrame(tester);

    expect(find.text('AI Meal Scan'), findsOneWidget);
    expect(find.byType(TodayScreen, skipOffstage: false), findsNothing);
    expect(find.text('Start first scan', skipOffstage: false), findsOneWidget);
    expect(find.text('Photo plus food note'), findsOneWidget);
    expect(find.text('Food note'), findsOneWidget);
    expect(find.text('Gallery'), findsOneWidget);
    expect(find.byIcon(Icons.mic_rounded), findsOneWidget);
  });

  testWidgets('skips welcome after onboarding is seen', (tester) async {
    SharedPreferences.setMockInitialValues({
      'logmyplate.has_seen_welcome': true,
    });

    await tester.pumpWidget(const LogMyPlateApp());
    await tester.pump();

    expect(find.text('Start first scan'), findsNothing);
    expect(find.byType(TodayScreen), findsOneWidget);
  });

  testWidgets('uses side navigation on tablet sized screens', (tester) async {
    await tester.binding.setSurfaceSize(const Size(1024, 768));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    SharedPreferences.setMockInitialValues({
      'logmyplate.has_seen_welcome': true,
    });

    await tester.pumpWidget(
      LogMyPlateApp(journalController: _testJournalController()),
    );
    await _pumpAppFrame(tester);

    final scanAction = find.byKey(const ValueKey('shell-scan-action'));
    final profileNavLabel = find.text('Profile');
    expect(scanAction, findsOneWidget);
    expect(profileNavLabel, findsOneWidget);
    expect(tester.getCenter(scanAction).dx, lessThan(130));
    expect(tester.getCenter(profileNavLabel).dx, lessThan(130));
    expect(find.byType(TodayScreen), findsOneWidget);

    await tester.tap(profileNavLabel);
    await _pumpAppFrame(tester);

    expect(find.byType(ProfileScreen), findsOneWidget);
  });

  testWidgets('renders controlled startup error screen', (tester) async {
    await tester.pumpWidget(
      const LogMyPlateStartupErrorApp(message: 'Missing configuration'),
    );

    expect(find.text('LogMyPlate paused'), findsOneWidget);
    expect(find.text('Missing configuration'), findsOneWidget);
  });

  testWidgets('optional app update prompt can be dismissed for the session', (
    tester,
  ) async {
    SharedPreferences.setMockInitialValues({
      'logmyplate.has_seen_welcome': true,
    });

    final journalController = _testJournalController(
      updatePolicy: {
        'status': 'optional',
        'platform': 'ios',
        'currentBuild': 12,
        'latestBuild': 14,
        'minSupportedBuild': 10,
        'title': 'Update available',
        'message': 'A newer LogMyPlate version is ready.',
        'storeUrl': 'https://apps.apple.com/app/id6770872606',
      },
    );

    await tester.pumpWidget(
      LogMyPlateApp(journalController: journalController),
    );
    await tester.pump();
    await tester.runAsync(() async {
      await Future<void>.delayed(const Duration(milliseconds: 10));
    });
    await tester.pump();

    expect(journalController.updatePolicy.status, AppUpdateStatus.optional);
    expect(find.text('Update available'), findsOneWidget);
    expect(find.text('Later'), findsOneWidget);

    await tester.tap(find.text('Later'));
    await tester.pump();

    expect(find.text('Update available'), findsNothing);
  });

  testWidgets('mandatory app update prompt blocks dismissal', (tester) async {
    SharedPreferences.setMockInitialValues({
      'logmyplate.has_seen_welcome': true,
    });

    final journalController = _testJournalController(
      updatePolicy: {
        'status': 'mandatory',
        'platform': 'android',
        'currentBuild': 11,
        'latestBuild': 14,
        'minSupportedBuild': 12,
        'title': 'Update required',
        'message': 'Please update LogMyPlate to continue.',
        'storeUrl':
            'https://play.google.com/store/apps/details?id=com.logmyplate.app',
      },
    );

    await tester.pumpWidget(
      LogMyPlateApp(journalController: journalController),
    );
    await tester.pump();
    await tester.runAsync(() async {
      await Future<void>.delayed(const Duration(milliseconds: 10));
    });
    await tester.pump();

    expect(journalController.updatePolicy.status, AppUpdateStatus.mandatory);
    expect(find.text('Update required'), findsOneWidget);
    expect(find.text('Update app'), findsOneWidget);
    expect(find.text('Later'), findsNothing);
  });

  testWidgets('custom item editor does not show seeded quick items', (
    tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        home: ReviewMealScreen(
          initialItems: const [],
          onConfirm: (_, _) async {},
        ),
      ),
    );

    await tester.tap(find.text('Add custom item'));
    await tester.pumpAndSettle();

    expect(find.text('Edit item'), findsOneWidget);
    expect(find.text('Dal'), findsNothing);
    expect(find.text('Rice'), findsNothing);
    expect(
      tester
          .widget<TextField>(
            find.descendant(
              of: find.byKey(const ValueKey('edit-item-name')),
              matching: find.byType(TextField),
            ),
          )
          .controller
          ?.text,
      isEmpty,
    );
  });

  testWidgets('adds a custom review item only after editor save', (
    tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        home: ReviewMealScreen(
          initialItems: sampleDetectedItems().take(1).toList(),
          onConfirm: (_, _) async {},
        ),
      ),
    );

    await tester.tap(find.text('Add custom item'));
    await tester.pumpAndSettle();

    expect(find.text('Edit item'), findsOneWidget);

    await tester.tapAt(const Offset(20, 20));
    await tester.pumpAndSettle();

    expect(find.text('Lunch - 1 item'), findsOneWidget);
    expect(find.text('Custom item'), findsNothing);

    await tester.tap(find.text('Add custom item'));
    await tester.pumpAndSettle();
    await tester.enterText(
      find.byKey(const ValueKey('edit-item-name')),
      'Paneer tikka',
    );
    await tester.tap(find.text('Save changes'));
    await tester.pumpAndSettle();

    expect(find.text('Lunch - 2 items'), findsOneWidget);
    expect(find.text('Paneer tikka'), findsOneWidget);
  });

  testWidgets('custom item editor applies food database suggestions', (
    tester,
  ) async {
    List<MealItem>? confirmedItems;

    await tester.pumpWidget(
      MaterialApp(
        home: ReviewMealScreen(
          initialItems: const [],
          onFoodSearch: (query) async {
            if (!query.toLowerCase().contains('chicken')) return const [];
            return const [
              FoodSearchResult(
                id: 'food-chicken-curry',
                canonicalName: 'Chicken Curry',
                nutritionPer100g: MacroTotals(
                  calories: 180,
                  proteinG: 16,
                  carbsG: 5,
                  fatG: 11,
                ),
                portions: [
                  FoodPortion(unit: 'serving', grams: 180, confidence: 0.86),
                ],
                score: 100,
              ),
            ];
          },
          onConfirm: (_, items) async {
            confirmedItems = items;
          },
        ),
      ),
    );

    await tester.tap(find.text('Add custom item'));
    await tester.pumpAndSettle();
    await tester.enterText(
      find.byKey(const ValueKey('edit-item-name')),
      'chicken',
    );
    await tester.pump(const Duration(milliseconds: 320));
    await tester.pumpAndSettle();

    expect(find.text('Suggested foods'), findsOneWidget);
    expect(find.text('Chicken Curry'), findsOneWidget);

    await tester.tap(find.text('Chicken Curry'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Save changes'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Confirm meal'));
    await tester.pump();

    expect(confirmedItems, isNotNull);
    expect(confirmedItems!.single.foodId, 'food-chicken-curry');
    expect(confirmedItems!.single.name, 'Chicken Curry');
    expect(confirmedItems!.single.grams, 180);
    expect(confirmedItems!.single.nutrition.calories, 324);
    expect(confirmedItems!.single.nutrition.proteinG, 28.8);
  });

  testWidgets('captured meal review can add a custom item', (tester) async {
    final photo = CapturedMealPhoto(
      bytes: base64Decode(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
      ),
      mimeType: 'image/png',
      fileName: 'meal.png',
    );

    await tester.pumpWidget(
      MaterialApp(
        theme: LogMyPlateTheme.dark(),
        home: ReviewMealScreen(
          initialItems: sampleDetectedItems().take(1).toList(),
          lockInitialItems: true,
          photo: photo,
          onConfirm: (_, _) async {},
        ),
      ),
    );

    expect(find.text('Review estimate'), findsOneWidget);
    expect(find.byType(Image), findsOneWidget);
    expect(find.text('Add custom item'), findsOneWidget);

    await tester.tap(find.text('Add custom item'));
    await tester.pumpAndSettle();
    await tester.enterText(
      find.byKey(const ValueKey('edit-item-name')),
      'Solkadhi',
    );
    await tester.tap(find.text('Save changes'));
    await tester.pumpAndSettle();

    expect(find.text('Lunch - 2 items'), findsOneWidget);
    expect(find.text('Solkadhi'), findsOneWidget);
  });

  testWidgets('scales AI review item details from portion changes', (
    tester,
  ) async {
    List<MealItem>? confirmedItems;

    await tester.pumpWidget(
      MaterialApp(
        theme: LogMyPlateTheme.dark(),
        home: ReviewMealScreen(
          initialItems: sampleDetectedItems().take(1).toList(),
          lockInitialItems: true,
          onConfirm: (_, items) async {
            confirmedItems = items;
          },
        ),
      ),
    );

    await tester.tap(find.text('Dal'));
    await tester.pumpAndSettle();

    await tester.enterText(
      find.byKey(const ValueKey('edit-item-quantity')),
      '2',
    );
    await tester.tap(find.text('Save changes'));
    await tester.pumpAndSettle();

    expect(find.text('Dal'), findsOneWidget);
    expect(find.text('360 kCal'), findsWidgets);

    await tester.tap(find.text('Confirm meal'));
    await tester.pump();

    expect(confirmedItems, isNotNull);
    expect(confirmedItems!.single.name, 'Dal');
    expect(confirmedItems!.single.quantity, 2);
    expect(confirmedItems!.single.grams, 360);
    expect(confirmedItems!.single.nutrition.calories, 360);
  });

  testWidgets('renders meal review controls in dark mode', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: ThemeData.dark(useMaterial3: true),
        home: ReviewMealScreen(
          initialItems: sampleDetectedItems().toList(),
          onConfirm: (_, _) async {},
        ),
      ),
    );

    expect(find.text('Lunch'), findsOneWidget);
    await tester.drag(find.byType(ListView), const Offset(0, -420));
    await tester.pumpAndSettle();
    expect(find.text('Add custom item'), findsOneWidget);
    expect(find.text('Confirm meal'), findsOneWidget);
  });

  testWidgets('confirmed manual meal opens result then back returns to today', (
    tester,
  ) async {
    SharedPreferences.setMockInitialValues({
      'logmyplate.has_seen_welcome': true,
    });

    await tester.pumpWidget(
      LogMyPlateApp(journalController: _testJournalController()),
    );
    await _pumpAppFrame(tester);

    await tester.tap(find.text('Add manually'));
    await _pumpAppFrame(tester);

    expect(find.byType(ReviewMealScreen), findsOneWidget);
    expect(find.textContaining(' - 0 items'), findsOneWidget);
    expect(find.text('Dal'), findsNothing);
    expect(find.text('Rice'), findsNothing);

    await tester.tap(find.text('Add custom item'));
    await tester.pumpAndSettle();
    await tester.enterText(
      find.byKey(const ValueKey('edit-item-name')),
      'Paneer tikka',
    );
    await tester.tap(find.text('Save changes'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Confirm meal'));
    await tester.pump();
    await _pumpAppFrame(tester);

    expect(find.byType(MealDetailScreen), findsOneWidget);
    expect(find.text('Paneer tikka'), findsWidgets);

    await tester.pump(const Duration(seconds: 4));
    await _pumpAppFrame(tester);
    await tester.tap(find.byTooltip('Back').last);
    await _pumpAppFrame(tester);
    await tester.pump(const Duration(seconds: 1));

    expect(find.byType(TodayScreen), findsOneWidget);
    expect(find.byType(MealDetailScreen), findsNothing);
  });

  testWidgets('primitive icons inherit dark theme color', (tester) async {
    late Color resolvedColor;

    await tester.pumpWidget(
      MaterialApp(
        theme: LogMyPlateTheme.dark(),
        home: Builder(
          builder: (context) {
            resolvedColor = logmyplatePrimitiveIconColor(context, null);
            return const Scaffold(
              body: Row(children: [BackMark(), PrimitiveGearIcon()]),
            );
          },
        ),
      ),
    );

    expect(resolvedColor, Colors.white);
    expect(find.byType(BackMark), findsOneWidget);
    expect(find.byType(PrimitiveGearIcon), findsOneWidget);
  });

  testWidgets('filled dark journal keeps scan action out of meal cards', (
    tester,
  ) async {
    var scanTapped = false;
    final meal = MealLog(
      id: 'meal-1',
      type: MealType.lunch,
      title: 'Lunch',
      loggedAt: DateTime(2026, 5, 12, 12),
      items: sampleDetectedItems(),
    );

    await tester.pumpWidget(
      MaterialApp(
        theme: LogMyPlateTheme.dark(),
        home: TodayScreen(
          meals: [meal],
          totals: const MacroTotals(
            calories: 2004,
            proteinG: 70,
            carbsG: 355,
            fatG: 39,
          ),
          onRefresh: () async {},
          onScan: () => scanTapped = true,
          onAddManually: () {},
          onOpenSettings: () {},
          onOpenMeal: (_) {},
          onDeleteMeal: (_) async {},
          onOpenWeeklyJournal: () {},
        ),
      ),
    );

    expect(find.byType(FloatingActionButton), findsOneWidget);
    expect(find.byType(PrimitiveCameraIcon), findsOneWidget);
    expect(find.text('2004'), findsOneWidget);
    expect(find.text('1 meal logged'), findsOneWidget);
    expect(find.text('MACRO PROFILE'), findsNothing);
    expect(find.text('70g'), findsOneWidget);
    expect(find.text('355g'), findsOneWidget);
    expect(find.text('39g'), findsOneWidget);

    await tester.tap(find.byType(FloatingActionButton));
    expect(scanTapped, isTrue);
  });

  testWidgets('weekly summary opens the full journal flow', (tester) async {
    var openedWeeklyJournal = false;

    await tester.pumpWidget(
      MaterialApp(
        theme: LogMyPlateTheme.dark(),
        home: TodayScreen(
          meals: const [],
          totals: MacroTotals.zero,
          weeklyRange: const JournalRangeData(
            startDate: '2026-05-06',
            endDate: '2026-05-12',
            days: [],
            summary: JournalRangeSummary(
              windowDays: 7,
              activeDays: 1,
              mealCount: 1,
              totals: MacroTotals.zero,
              trackedDayAverage: MacroTotals.zero,
              calendarDayAverage: MacroTotals.zero,
            ),
          ),
          onRefresh: () async {},
          onScan: () {},
          onAddManually: () {},
          onOpenSettings: () {},
          onOpenMeal: (_) {},
          onDeleteMeal: (_) async {},
          onOpenWeeklyJournal: () => openedWeeklyJournal = true,
        ),
      ),
    );

    await tester.tap(find.text('Weekly rhythm'));
    await tester.pump();

    expect(openedWeeklyJournal, isTrue);
  });

  testWidgets('weekly summary blocks repeat taps while opening', (
    tester,
  ) async {
    var openedWeeklyJournal = false;

    await tester.pumpWidget(
      MaterialApp(
        theme: LogMyPlateTheme.dark(),
        home: TodayScreen(
          meals: const [],
          totals: MacroTotals.zero,
          weeklyRange: const JournalRangeData(
            startDate: '2026-05-06',
            endDate: '2026-05-12',
            days: [],
            summary: JournalRangeSummary(
              windowDays: 7,
              activeDays: 1,
              mealCount: 1,
              totals: MacroTotals.zero,
              trackedDayAverage: MacroTotals.zero,
              calendarDayAverage: MacroTotals.zero,
            ),
          ),
          weeklyJournalOpening: true,
          onRefresh: () async {},
          onScan: () {},
          onAddManually: () {},
          onOpenSettings: () {},
          onOpenMeal: (_) {},
          onDeleteMeal: (_) async {},
          onOpenWeeklyJournal: () => openedWeeklyJournal = true,
        ),
      ),
    );

    await tester.tap(find.text('Weekly rhythm'));
    await tester.pump();

    expect(openedWeeklyJournal, isFalse);
    expect(find.text('Loading details'), findsOneWidget);
    expect(find.byKey(const ValueKey('weekly-card-spinner')), findsOneWidget);
  });

  testWidgets('today meal rows delete by swipe after confirmation', (
    tester,
  ) async {
    final meal = MealLog(
      id: 'today-delete',
      type: MealType.lunch,
      title: 'Lunch',
      loggedAt: DateTime(2026, 5, 12, 12),
      items: sampleDetectedItems().take(1).toList(),
    );
    var deleted = false;
    var meals = [meal];

    await tester.pumpWidget(
      MaterialApp(
        theme: LogMyPlateTheme.dark(),
        home: StatefulBuilder(
          builder: (context, setState) {
            return TodayScreen(
              meals: meals,
              totals: meals.fold<MacroTotals>(
                MacroTotals.zero,
                (total, entry) => total + entry.totals,
              ),
              onRefresh: () async {},
              onScan: () {},
              onAddManually: () {},
              onOpenSettings: () {},
              onOpenMeal: (_) {},
              onDeleteMeal: (_) async {
                deleted = true;
                setState(() => meals = []);
              },
              onOpenWeeklyJournal: () {},
              showScanAction: false,
            );
          },
        ),
      ),
    );

    await tester.fling(
      find.byType(Dismissible).first,
      const Offset(-520, 0),
      1200,
    );
    await tester.pumpAndSettle();

    expect(find.text('Delete this meal?'), findsOneWidget);

    await tester.tap(find.text('Delete meal'));
    await tester.pumpAndSettle();

    expect(deleted, isTrue);
  });

  testWidgets('weekly journal analyses day rows and opens meals', (
    tester,
  ) async {
    MealLog? openedMeal;
    final olderMeal = MealLog(
      id: 'older-meal',
      type: MealType.dinner,
      title: 'Yesterday dal bowl',
      loggedAt: DateTime(2026, 5, 11, 20),
      items: sampleDetectedItems().take(1).toList(),
    );

    await tester.pumpWidget(
      MaterialApp(
        theme: LogMyPlateTheme.dark(),
        home: WeeklyJournalScreen(
          range: JournalRangeData(
            startDate: '2026-05-06',
            endDate: '2026-05-12',
            days: [
              const JournalDayData(
                date: '2026-05-10',
                mealCount: 0,
                totals: MacroTotals.zero,
                meals: [],
              ),
              JournalDayData(
                date: '2026-05-11',
                mealCount: 1,
                totals: olderMeal.totals,
                meals: [olderMeal],
              ),
            ],
            summary: const JournalRangeSummary(
              windowDays: 7,
              activeDays: 1,
              mealCount: 1,
              totals: MacroTotals(
                calories: 180,
                proteinG: 10.8,
                carbsG: 25.2,
                fatG: 5.4,
              ),
              trackedDayAverage: MacroTotals(
                calories: 180,
                proteinG: 10.8,
                carbsG: 25.2,
                fatG: 5.4,
              ),
              calendarDayAverage: MacroTotals(
                calories: 26,
                proteinG: 1.5,
                carbsG: 3.6,
                fatG: 0.8,
              ),
            ),
          ),
          onLoadWeek: (_) async => throw UnimplementedError(),
          onLoadWeeks: () async => const [
            JournalWeekOption(
              weekOffset: 0,
              startDate: '2026-05-06',
              endDate: '2026-05-12',
              activeDays: 1,
            ),
          ],
          onDeleteMeal: (_) async {},
          onOpenMeal: (meal) async {
            openedMeal = meal;
            return false;
          },
        ),
      ),
    );

    expect(find.text('7 Day Journal'), findsOneWidget);
    expect(find.text('SUN 10 MAY'), findsNothing);
    await tester.scrollUntilVisible(find.text('MON 11 MAY'), 220);
    expect(find.text('MON 11 MAY'), findsOneWidget);

    await tester.tap(find.text('MON 11 MAY'));
    await tester.pumpAndSettle();

    expect(find.text('Day Analysis'), findsOneWidget);
    expect(find.text('Yesterday dal bowl'), findsWidgets);

    await tester.tap(find.text('Yesterday dal bowl').first);
    await tester.pumpAndSettle();

    expect(openedMeal?.id, 'older-meal');
  });

  testWidgets('weekly journal covers empty and syncing states in light mode', (
    tester,
  ) async {
    var retried = false;

    await tester.pumpWidget(
      MaterialApp(
        theme: LogMyPlateTheme.light(),
        home: WeeklyJournalScreen(
          range: const JournalRangeData(
            startDate: '2026-05-06',
            endDate: '2026-05-12',
            days: [],
            summary: JournalRangeSummary(
              windowDays: 7,
              activeDays: 0,
              mealCount: 0,
              totals: MacroTotals.zero,
              trackedDayAverage: MacroTotals.zero,
              calendarDayAverage: MacroTotals.zero,
            ),
          ),
          onLoadWeek: (_) async => throw UnimplementedError(),
          onLoadWeeks: () async => const [
            JournalWeekOption(
              weekOffset: 0,
              startDate: '2026-05-06',
              endDate: '2026-05-12',
              activeDays: 0,
            ),
          ],
          isSyncing: true,
          syncMessage: 'Could not refresh journal.',
          onRefresh: () async {
            retried = true;
          },
          onDeleteMeal: (_) async {},
          onOpenMeal: (_) async => false,
        ),
      ),
    );

    expect(find.text('Could not refresh journal.'), findsOneWidget);
    await tester.tap(find.text('Retry'));
    await tester.pump();

    expect(retried, isTrue);

    await tester.drag(find.byType(ListView).first, const Offset(0, -320));
    await tester.pump(const Duration(milliseconds: 250));
    expect(find.text('No journal days yet'), findsOneWidget);
  });

  testWidgets('day detail rows delete by swipe and refresh totals locally', (
    tester,
  ) async {
    final meal = MealLog(
      id: 'day-delete',
      type: MealType.dinner,
      title: 'Dinner',
      loggedAt: DateTime(2026, 5, 11, 20),
      items: sampleDetectedItems().take(1).toList(),
    );
    var deleted = false;
    var refreshed = false;

    await tester.pumpWidget(
      MaterialApp(
        theme: LogMyPlateTheme.dark(),
        home: DayJournalDetailScreen(
          day: JournalDayData(
            date: '2026-05-11',
            mealCount: 1,
            totals: meal.totals,
            meals: [meal],
          ),
          onOpenMeal: (_) async => false,
          onDeleteMeal: (_) async {
            deleted = true;
          },
          onMealDeleted: () async {
            refreshed = true;
          },
        ),
      ),
    );

    await tester.fling(
      find.byType(Dismissible).first,
      const Offset(-520, 0),
      1200,
    );
    await tester.pumpAndSettle();
    await tester.tap(find.text('Delete meal'));
    await tester.pumpAndSettle();

    expect(deleted, isTrue);
    expect(refreshed, isTrue);
    expect(find.text('No meals logged'), findsWidgets);
  });

  testWidgets('meal detail owns meal-level macro profile', (tester) async {
    final meal = MealLog(
      id: 'meal-1',
      type: MealType.lunch,
      title: 'Lunch',
      loggedAt: DateTime(2026, 5, 12, 12),
      items: sampleDetectedItems(),
    );

    await tester.pumpWidget(
      MaterialApp(
        theme: LogMyPlateTheme.dark(),
        home: MealDetailScreen(meal: meal),
      ),
    );

    expect(find.text('Macro profile'), findsOneWidget);
    expect(find.text('Item Contribution'), findsOneWidget);
    expect(find.text('Protein density'), findsOneWidget);
    expect(find.text('Dal'), findsWidgets);
  });

  testWidgets('meal detail previews inline edits before saving them', (
    tester,
  ) async {
    final meal = MealLog(
      id: 'meal-1',
      type: MealType.lunch,
      title: 'Lunch',
      loggedAt: DateTime(2026, 5, 12, 12),
      items: sampleDetectedItems().take(1).toList(),
    );
    MealLog? savedMeal;

    await tester.pumpWidget(
      MaterialApp(
        theme: LogMyPlateTheme.dark(),
        home: MealDetailScreen(
          meal: meal,
          onUpdateMeal: (_, items) async {
            savedMeal = MealLog(
              id: meal.id,
              type: meal.type,
              title: meal.title,
              loggedAt: meal.loggedAt,
              items: items,
            );
            return savedMeal!;
          },
        ),
      ),
    );

    await tester.drag(find.byType(ListView), const Offset(0, -420));
    await tester.pumpAndSettle();
    await tester.tap(find.byIcon(Icons.edit_rounded));
    await tester.pumpAndSettle();

    expect(find.text('Edit item'), findsOneWidget);
    await tester.enterText(
      find.byKey(const ValueKey('edit-item-grams')),
      '225',
    );
    await tester.tap(find.text('Save changes'));
    await tester.pumpAndSettle();

    expect(find.text('225'), findsWidgets);
    expect(find.text('1.3 katori - 225g'), findsOneWidget);
    expect(savedMeal, isNull);

    await tester.tap(find.text('Save updated meal'));
    await tester.pumpAndSettle();

    expect(savedMeal, isNotNull);
    expect(savedMeal!.items.single.quantity, 1.25);
    expect(savedMeal!.items.single.grams, 225);
    expect(savedMeal!.totals.calories, 225);
    expect(find.byType(MealDetailScreen), findsOneWidget);
    expect(find.text('225'), findsWidgets);
  });

  testWidgets('meal detail deletes after explicit confirmation', (
    tester,
  ) async {
    final meal = MealLog(
      id: 'meal-delete',
      type: MealType.lunch,
      title: 'Lunch',
      loggedAt: DateTime(2026, 5, 12, 12),
      items: sampleDetectedItems().take(1).toList(),
    );
    var deleted = false;

    await tester.pumpWidget(
      MaterialApp(
        theme: LogMyPlateTheme.dark(),
        home: Builder(
          builder: (context) {
            return Scaffold(
              body: Center(
                child: FilledButton(
                  onPressed: () {
                    Navigator.of(context).push(
                      MaterialPageRoute<void>(
                        builder: (_) => MealDetailScreen(
                          meal: meal,
                          onDeleteMeal: (_) async {
                            deleted = true;
                          },
                        ),
                      ),
                    );
                  },
                  child: const Text('Open meal'),
                ),
              ),
            );
          },
        ),
      ),
    );

    await tester.tap(find.text('Open meal'));
    await tester.pumpAndSettle();
    await tester.tap(find.byIcon(Icons.more_horiz_rounded));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Delete meal'));
    await tester.pumpAndSettle();

    expect(find.text('Delete this meal?'), findsOneWidget);

    await tester.tap(find.text('Delete meal').last);
    await tester.pumpAndSettle();

    expect(deleted, isTrue);
    expect(find.text('Open meal'), findsOneWidget);
  });

  testWidgets('initial journal loading shows premium skeleton', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: LogMyPlateTheme.dark(),
        home: TodayScreen(
          meals: const [],
          totals: MacroTotals.zero,
          loading: true,
          initialLoading: true,
          onRefresh: () async {},
          onScan: () {},
          onAddManually: () {},
          onOpenSettings: () {},
          onOpenMeal: (_) {},
          onDeleteMeal: (_) async {},
          onOpenWeeklyJournal: () {},
        ),
      ),
    );

    expect(
      find.byKey(const ValueKey('today-loading-skeleton')),
      findsOneWidget,
    );
    expect(find.text('0'), findsNothing);
    expect(find.byType(FloatingActionButton), findsNothing);
  });

  testWidgets('analysis screen follows the active light theme', (tester) async {
    final completer = Completer<ScanAnalysis>();

    await tester.pumpWidget(
      MaterialApp(
        theme: LogMyPlateTheme.light(),
        home: AnalyzingScreen(
          photo: CapturedMealPhoto(
            bytes: Uint8List(0),
            mimeType: 'image/jpeg',
            fileName: 'meal.jpg',
            userHint: 'Dal and rice',
          ),
          onAnalyze: (_) => completer.future,
          onAnalyzed: (_) {},
        ),
      ),
    );

    final scaffold = tester.widget<Scaffold>(find.byType(Scaffold));
    expect(scaffold.backgroundColor, LogMyPlateThemeColors.light().background);
  });

  testWidgets('analysis quota failure offers account handoff', (tester) async {
    var accountOpened = false;

    await tester.pumpWidget(
      MaterialApp(
        theme: LogMyPlateTheme.dark(),
        home: AnalyzingScreen(
          photo: CapturedMealPhoto(
            bytes: Uint8List.fromList([1, 2, 3]),
            mimeType: 'image/jpeg',
            fileName: 'plate.jpg',
            userHint: 'dal rice',
          ),
          onAnalyze: (_) async {
            throw LogMyPlateApiException(
              402,
              jsonEncode({'error': 'scan_credit_required'}),
            );
          },
          onAnalyzed: (_) {},
          onScanCreditRequired: () async {
            accountOpened = true;
          },
          onAddManually: () {},
        ),
      ),
    );

    await tester.pump();
    await tester.pump(const Duration(milliseconds: 250));

    expect(find.text('Unlock scans'), findsOneWidget);
    expect(find.text('Open account'), findsOneWidget);
    expect(find.text('dal rice'), findsOneWidget);

    await tester.ensureVisible(find.text('Open account'));
    await tester.tap(find.text('Open account'));
    await tester.pump();

    expect(accountOpened, isTrue);
  });

  testWidgets('analysis server failures hide raw backend internals', (
    tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: LogMyPlateTheme.light(),
        home: AnalyzingScreen(
          photo: CapturedMealPhoto(
            bytes: Uint8List.fromList([1, 2, 3]),
            mimeType: 'image/jpeg',
            fileName: 'plate.jpg',
            userHint: 'test',
          ),
          onAnalyze: (_) async {
            throw LogMyPlateApiException(
              500,
              jsonEncode({
                'message':
                    'duplicate key value violates unique constraint "devices_install_id_unique_idx"',
              }),
            );
          },
          onAnalyzed: (_) {},
        ),
      ),
    );

    await tester.pump();
    await tester.pump(const Duration(milliseconds: 250));

    expect(find.text('Still thinking'), findsOneWidget);
    expect(
      find.text(
        'LogMyPlate is taking longer than expected. Retry in a moment.',
      ),
      findsOneWidget,
    );
    expect(find.textContaining('devices_install_id_unique_idx'), findsNothing);
  });

  testWidgets('account gate offers Google and email auth on Android', (
    tester,
  ) async {
    EmailAuthMode? submittedMode;
    String? submittedEmail;

    await tester.pumpWidget(
      MaterialApp(
        theme: LogMyPlateTheme.dark().copyWith(
          platform: TargetPlatform.android,
        ),
        home: AccountGateScreen(
          reason: AccountGateReason.quotaExhausted,
          loading: false,
          onSignIn: (provider) async => AuthSession(
            provider: provider,
            displayName: provider.label,
            linkedAt: DateTime(2026, 5, 12),
          ),
          onEmailAuth: (mode, email, password) async {
            submittedMode = mode;
            submittedEmail = email;
            return AuthSession(
              provider: AuthProvider.email,
              displayName: email,
              linkedAt: DateTime(2026, 5, 12),
            );
          },
          onPasswordResetRequest: (_) async => true,
          onPasswordResetConfirm: (_, _, _) async => null,
          onManualLog: () {},
        ),
      ),
    );

    expect(find.text('No scans left'), findsOneWidget);
    expect(find.text('Create account to keep scanning'), findsOneWidget);
    expect(find.text('Apple'), findsNothing);
    expect(find.text('Google'), findsOneWidget);
    expect(find.text('Create account'), findsOneWidget);

    await tester.enterText(find.byType(TextField).at(0), 'friend@test.com');
    await tester.enterText(find.byType(TextField).at(1), 'secret1');
    await tester.drag(find.byType(ListView), const Offset(0, -420));
    await tester.pump(const Duration(milliseconds: 300));
    await tester.ensureVisible(find.text('Create account'));
    await tester.tap(find.text('Create account'));
    await tester.pump(const Duration(milliseconds: 100));

    expect(submittedMode, EmailAuthMode.signUp);
    expect(submittedEmail, 'friend@test.com');
  });

  testWidgets('account gate offers Apple auth on iOS', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: LogMyPlateTheme.dark().copyWith(platform: TargetPlatform.iOS),
        home: AccountGateScreen(
          reason: AccountGateReason.quotaExhausted,
          loading: false,
          onSignIn: (provider) async => AuthSession(
            provider: provider,
            displayName: provider.label,
            linkedAt: DateTime(2026, 5, 12),
          ),
          onEmailAuth: (mode, email, password) async => null,
          onPasswordResetRequest: (_) async => true,
          onPasswordResetConfirm: (_, _, _) async => null,
          onManualLog: () {},
        ),
      ),
    );

    expect(find.text('Apple'), findsOneWidget);
    expect(find.text('Google'), findsOneWidget);
  });

  testWidgets('account gate shows focused email validation messages', (
    tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: LogMyPlateTheme.dark(),
        home: AccountGateScreen(
          reason: AccountGateReason.quotaExhausted,
          loading: false,
          onSignIn: (_) async => null,
          onEmailAuth: (_, _, _) async => null,
          onPasswordResetRequest: (_) async => true,
          onPasswordResetConfirm: (_, _, _) async => null,
          onManualLog: () {},
        ),
      ),
    );

    await tester.ensureVisible(find.text('Create account'));
    await tester.tap(find.text('Create account'));
    await tester.pump();
    expect(find.text('Enter your email address.'), findsOneWidget);

    await tester.enterText(find.byType(TextField).at(0), 'friend@test.com');
    await tester.drag(find.byType(ListView), const Offset(0, -420));
    await tester.pump(const Duration(milliseconds: 300));
    await tester.ensureVisible(find.text('Create account'));
    await tester.tap(find.text('Create account'));
    await tester.pump();
    expect(
      find.text('Create a password with at least 6 characters.'),
      findsOneWidget,
    );
  });

  testWidgets('account gate supports forgot password code reset', (
    tester,
  ) async {
    String? requestedEmail;
    String? confirmedCode;

    await tester.pumpWidget(
      MaterialApp(
        theme: LogMyPlateTheme.dark(),
        home: AccountGateScreen(
          reason: AccountGateReason.saveJournal,
          loading: false,
          onSignIn: (_) async => null,
          onEmailAuth: (_, _, _) async => null,
          onPasswordResetRequest: (email) async {
            requestedEmail = email;
            return true;
          },
          onPasswordResetConfirm: (email, code, password) async {
            confirmedCode = code;
            return AuthSession(
              provider: AuthProvider.email,
              displayName: email,
              linkedAt: DateTime(2026, 5, 28),
            );
          },
          onManualLog: () {},
        ),
      ),
    );

    await tester.tap(find.text('Log in'));
    await tester.enterText(find.byType(TextField).at(0), 'friend@test.com');
    await tester.tap(find.text('Forgot password?'));
    await tester.pump();

    expect(requestedEmail, 'friend@test.com');
    expect(find.text('Reset password'), findsWidgets);
    expect(find.text('Save your journal'), findsNothing);
    expect(find.text('Google'), findsNothing);
    expect(find.text('Maybe later'), findsNothing);

    await tester.drag(find.byType(ListView), const Offset(0, -240));
    await tester.pump(const Duration(milliseconds: 100));
    expect(find.text('Code sent to friend@test.com'), findsOneWidget);

    await tester.enterText(find.byType(TextField).at(0), '123456');
    await tester.enterText(find.byType(TextField).at(1), 'newpass1');
    await tester.drag(find.byType(ListView), const Offset(0, -180));
    await tester.pump(const Duration(milliseconds: 100));
    await tester.tap(find.widgetWithText(FilledButton, 'Reset password'));
    await tester.pump();

    expect(confirmedCode, '123456');
  });

  testWidgets('account gate offers support for deactivated profiles', (
    tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: LogMyPlateTheme.dark(),
        home: AccountGateScreen(
          reason: AccountGateReason.saveJournal,
          loading: false,
          error:
              'This profile is deactivated. Contact support to reactivate it.',
          onSignIn: (_) async => null,
          onEmailAuth: (_, _, _) async => null,
          onPasswordResetRequest: (_) async => true,
          onPasswordResetConfirm: (_, _, _) async => null,
          onManualLog: () {},
        ),
      ),
    );

    expect(
      find.text(
        'This profile is deactivated. Contact support to reactivate it.',
      ),
      findsOneWidget,
    );
    expect(find.text('Contact support'), findsOneWidget);
  });

  testWidgets('email auth from profile returns to the main journal', (
    tester,
  ) async {
    SharedPreferences.setMockInitialValues({
      'logmyplate.has_seen_welcome': true,
    });
    final authGateway = _SuccessfulAuthGateway();

    await tester.pumpWidget(
      LogMyPlateApp(
        authController: AuthController(gateway: authGateway),
        journalController: _testJournalController(),
      ),
    );
    await _pumpAppFrame(tester);

    await tester.tap(find.text('Profile').last);
    await _pumpAppFrame(tester);
    expect(find.byType(ProfileScreen), findsOneWidget);

    await tester.tap(find.text('Save your journal'));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 500));
    expect(find.byType(AccountGateScreen), findsOneWidget);

    await tester.enterText(find.byType(TextField).at(0), 'friend@test.com');
    await tester.enterText(find.byType(TextField).at(1), 'secret1');
    await tester.ensureVisible(find.text('Create account'));
    await tester.tap(find.text('Create account'));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 500));

    expect(authGateway.emailAuthCount, 1);
    expect(find.byType(HealthTargetScreen), findsOneWidget);
    await tester.tap(find.text('Set later'));
    await _pumpAppFrame(tester);

    expect(find.byType(TodayScreen), findsOneWidget);
    expect(find.byType(AccountGateScreen), findsNothing);
    expect(find.byType(AccountProfileScreen), findsNothing);
  });

  testWidgets('health target setup previews BMI and saves a daily target', (
    tester,
  ) async {
    HealthTargetInput? submitted;

    await tester.pumpWidget(
      MaterialApp(
        theme: LogMyPlateTheme.dark(),
        home: HealthTargetScreen(
          onSave: (input) async {
            submitted = input;
            return const HealthTarget(
              profileId: 'profile_test',
              heightCm: 170,
              weightKg: 70,
              ageYears: 28,
              sex: HealthSex.notSpecified,
              activityLevel: ActivityLevel.light,
              goal: HealthGoal.maintain,
              bmi: 24.2,
              bmiCategory: 'healthy',
              bmrCalories: 1545,
              dailyCalorieTarget: 2124,
              formula: 'mifflin_st_jeor_v1',
            );
          },
        ),
      ),
    );

    expect(find.text('Set your daily target'), findsOneWidget);
    expect(find.text('BMI overview'), findsOneWidget);
    expect(find.text('BMI'), findsOneWidget);
    expect(find.text('Low < 18.5'), findsOneWidget);
    expect(find.text('Balanced 18.5-24.9'), findsOneWidget);
    expect(find.text('Above 25-29.9'), findsOneWidget);
    expect(find.text('High 30+'), findsOneWidget);
    expect(find.text('Sources'), findsOneWidget);
    await tester.tap(find.text('Sources'));
    await tester.pumpAndSettle();
    expect(find.text('Calculation sources'), findsOneWidget);
    expect(find.text('CDC BMI ranges'), findsOneWidget);
    expect(find.text('Calorie formula'), findsOneWidget);
    await tester.tap(find.byTooltip('Close sources'));
    await tester.pumpAndSettle();
    expect(find.text('Save target'), findsOneWidget);

    await tester.tap(find.byKey(const ValueKey('height-unit-imperial')));
    await tester.pumpAndSettle();
    await tester.enterText(
      find.byKey(const ValueKey('target-height-feet-input')),
      '5',
    );
    await tester.enterText(
      find.byKey(const ValueKey('target-height-inches-input')),
      '8',
    );
    await tester.testTextInput.receiveAction(TextInputAction.done);
    await tester.pump();

    final weightInput = find.byKey(const ValueKey('target-weight-input'));
    await tester.scrollUntilVisible(
      weightInput,
      300,
      scrollable: find.byType(Scrollable).first,
    );
    await tester.pumpAndSettle();

    await tester.enterText(weightInput, '64.5');
    await tester.testTextInput.receiveAction(TextInputAction.done);
    await tester.pump();

    final ageInput = find.byKey(const ValueKey('target-age-input'));
    await tester.scrollUntilVisible(
      ageInput,
      300,
      scrollable: find.byType(Scrollable).first,
    );
    await tester.pumpAndSettle();
    await tester.enterText(ageInput, '31');
    await tester.testTextInput.receiveAction(TextInputAction.done);
    await tester.pump();

    await tester.tap(find.text('Save target'));
    await tester.pumpAndSettle();

    expect(submitted?.heightCm, closeTo(172.7, 0.1));
    expect(submitted?.weightKg, 64.5);
    expect(submitted?.ageYears, 31);
  });

  testWidgets('health target edit enables save only after changes', (
    tester,
  ) async {
    var saveCount = 0;

    await tester.pumpWidget(
      MaterialApp(
        theme: LogMyPlateTheme.light(),
        home: HealthTargetScreen(
          initialTarget: const HealthTarget(
            profileId: 'profile_test',
            heightCm: 155,
            weightKg: 66,
            ageYears: 30,
            sex: HealthSex.male,
            activityLevel: ActivityLevel.light,
            goal: HealthGoal.maintain,
            bmi: 27.5,
            bmiCategory: 'overweight',
            bmrCalories: 1512,
            dailyCalorieTarget: 2040,
            formula: 'mifflin_st_jeor_v1',
          ),
          onSave: (input) async {
            saveCount += 1;
            return HealthTarget(
              profileId: 'profile_test',
              heightCm: input.heightCm,
              weightKg: input.weightKg,
              ageYears: input.ageYears,
              sex: input.sex,
              activityLevel: input.activityLevel,
              goal: input.goal,
              bmi: 27.5,
              bmiCategory: 'overweight',
              bmrCalories: 1512,
              dailyCalorieTarget: 2040,
              formula: 'mifflin_st_jeor_v1',
            );
          },
        ),
      ),
    );

    expect(find.text('Edit daily target'), findsOneWidget);
    var saveButton = tester.widget<FilledButton>(
      find.widgetWithText(FilledButton, 'Save target'),
    );
    expect(saveButton.onPressed, isNull);

    await tester.tap(find.text('Save target'), warnIfMissed: false);
    await tester.pump();
    expect(saveCount, 0);

    final ageInput = find.byKey(const ValueKey('target-age-input'));
    await tester.scrollUntilVisible(
      ageInput,
      300,
      scrollable: find.byType(Scrollable).first,
    );
    await tester.pumpAndSettle();
    await tester.enterText(ageInput, '31');
    await tester.pump();

    saveButton = tester.widget<FilledButton>(
      find.widgetWithText(FilledButton, 'Save target'),
    );
    expect(saveButton.onPressed, isNotNull);
  });

  testWidgets('health target save surfaces API messages', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: LogMyPlateTheme.dark(),
        home: HealthTargetScreen(
          onSave: (_) async {
            throw LogMyPlateApiException(
              401,
              jsonEncode({
                'error': 'account_required',
                'message': 'Create an account to save a daily target.',
              }),
            );
          },
        ),
      ),
    );

    await tester.tap(find.text('Save target'));
    await tester.pumpAndSettle();

    await tester.scrollUntilVisible(
      find.text('Create an account to save a daily target.'),
      300,
      scrollable: find.byType(Scrollable).first,
    );
    expect(
      find.text('Create an account to save a daily target.'),
      findsOneWidget,
    );
  });

  testWidgets('profile keeps target editing in the dedicated target tab', (
    tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: LogMyPlateTheme.dark(),
        home: ProfileScreen(
          themeMode: ThemeMode.dark,
          session: AuthSession(
            provider: AuthProvider.email,
            displayName: 'friend@test.com',
            linkedAt: DateTime(2026, 5, 12),
          ),
          onThemeChanged: (_) {},
          onOpenAccount: () {},
          onDeleteAccount: () async => false,
          onSignOut: () async {},
        ),
      ),
    );

    expect(find.text('friend@test.com'), findsOneWidget);
    expect(find.text('Theme'), findsOneWidget);
    expect(find.text('Privacy & legal'), findsOneWidget);
    expect(find.text('Support'), findsOneWidget);
    expect(find.text('Contact support'), findsOneWidget);
    expect(find.text('Privacy policy'), findsOneWidget);
    expect(find.text('Delete account and data'), findsOneWidget);
    expect(find.text('Legal terms'), findsOneWidget);
    expect(find.text('Food photos are saved with meal logs'), findsNothing);
    expect(find.text('Nutrition estimates are approximate'), findsNothing);
    expect(find.text('Daily target'), findsNothing);
    expect(find.text('2124 kCal'), findsNothing);
  });

  testWidgets('profile tab deletes signed-in account data in app', (
    tester,
  ) async {
    var deleted = false;

    await tester.pumpWidget(
      MaterialApp(
        theme: LogMyPlateTheme.dark(),
        home: ProfileScreen(
          themeMode: ThemeMode.dark,
          session: AuthSession(
            provider: AuthProvider.email,
            displayName: 'friend@test.com',
            linkedAt: DateTime(2026, 5, 12),
          ),
          onThemeChanged: (_) {},
          onOpenAccount: () {},
          onDeleteAccount: () async {
            deleted = true;
            return true;
          },
          onSignOut: () async {},
        ),
      ),
    );

    await tester.tap(find.text('Delete account and data'));
    await tester.pumpAndSettle();

    expect(find.text('Delete account and data?'), findsOneWidget);

    await tester.tap(find.widgetWithText(FilledButton, 'Delete account'));
    await tester.pumpAndSettle();

    expect(deleted, isTrue);
  });

  testWidgets('logout returns the user to the anonymous dashboard', (
    tester,
  ) async {
    final session = AuthSession(
      provider: AuthProvider.email,
      displayName: 'friend@test.com',
      linkedAt: DateTime(2026, 5, 20),
      profileId: 'profile_test',
      accessToken: 'token_test',
    );
    SharedPreferences.setMockInitialValues({
      'logmyplate.has_seen_welcome': true,
      AccountSessionStore.sessionKey: jsonEncode(session.toJson()),
    });
    final authGateway = _SuccessfulAuthGateway();

    await tester.pumpWidget(
      LogMyPlateApp(
        authController: AuthController(gateway: authGateway),
        journalController: _testJournalController(),
      ),
    );
    await _pumpAppFrame(tester);

    expect(find.byType(TodayScreen), findsOneWidget);

    await tester.tap(find.text('Profile').last);
    await _pumpAppFrame(tester);

    await tester.drag(find.byType(ListView), const Offset(0, -360));
    await tester.pump(const Duration(milliseconds: 100));
    await tester.tap(find.text('Log out'));
    await _pumpAppFrame(tester);

    expect(find.byType(TodayScreen), findsOneWidget);
    expect(find.byType(AccountProfileScreen), findsNothing);

    final preferences = await SharedPreferences.getInstance();
    expect(preferences.getBool('logmyplate.has_seen_welcome'), isTrue);
    expect(preferences.getString(AccountSessionStore.sessionKey), isNull);
  });

  testWidgets(
    'exhausted anonymous users stay on dashboard before account gate',
    (tester) async {
      SharedPreferences.setMockInitialValues({
        'logmyplate.has_seen_welcome': true,
      });

      await tester.pumpWidget(
        LogMyPlateApp(
          journalController: _testJournalController(
            quota: const {
              'freeRemaining': 0,
              'rewardedRemaining': 0,
              'premiumRemaining': 0,
            },
          ),
        ),
      );
      await _pumpAppFrame(tester);

      expect(find.byType(TodayScreen), findsOneWidget);
      expect(find.text('Start first scan'), findsNothing);

      await tester.tap(find.byKey(const ValueKey('shell-scan-action')));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 500));

      expect(find.byType(AccountGateScreen), findsOneWidget);
      expect(find.text('Create account to keep scanning'), findsOneWidget);
    },
  );

  testWidgets('signed-in users can unlock scanning with rewarded ads', (
    tester,
  ) async {
    final session = AuthSession(
      provider: AuthProvider.email,
      displayName: 'friend@test.com',
      linkedAt: DateTime(2026, 5, 20),
      profileId: 'profile_test',
      accessToken: 'token_test',
    );
    SharedPreferences.setMockInitialValues({
      'logmyplate.has_seen_welcome': true,
      AccountSessionStore.sessionKey: jsonEncode(session.toJson()),
    });
    final adGateway = _FakeRewardedAdGateway(
      outcomes: const [
        RewardedAdOutcome(
          earnedReward: true,
          adUnitId: 'ca-app-pub-3940256099942544/1712485313',
          rewardType: 'coin',
          rewardAmount: 1,
        ),
      ],
    );

    final rewardResponses = [
      {
        'grantedScan': true,
        'adsWatchedToday': 1,
        'adsNeededForNextScan': 1,
        'scansGrantedToday': 1,
        'dailyScanLimit': 5,
        'adsPerScan': 1,
        'quota': {
          'freeRemaining': 0,
          'rewardedRemaining': 1,
          'premiumRemaining': 0,
        },
      },
    ];

    final controller = _testJournalController(
      quota: const {
        'freeRemaining': 0,
        'rewardedRemaining': 0,
        'premiumRemaining': 0,
      },
      rewardedAdResponses: rewardResponses,
    );

    await tester.pumpWidget(
      LogMyPlateApp(
        rewardedAdGateway: adGateway,
        journalController: controller,
      ),
    );
    await _pumpAppFrame(tester);

    await tester.tap(find.byKey(const ValueKey('shell-scan-action')));
    await _pumpAppFrame(tester);
    expect(find.text('Watch ad'), findsOneWidget);

    await tester.tap(find.text('Watch ad'));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 600));

    expect(adGateway.showCount, 1);
    expect(adGateway.lastServerSideUserId, 'profile_test');
    expect(adGateway.lastVerificationToken, isNotNull);
    expect(adGateway.lastVerificationToken!.length, greaterThanOrEqualTo(16));
    expect(find.text('AI Meal Scan'), findsOneWidget);
  });

  testWidgets('today quota pill does not offer ad unlock while scans remain', (
    tester,
  ) async {
    final session = AuthSession(
      provider: AuthProvider.email,
      displayName: 'friend@test.com',
      linkedAt: DateTime(2026, 5, 20),
      profileId: 'profile_test',
      accessToken: 'token_test',
    );
    SharedPreferences.setMockInitialValues({
      'logmyplate.has_seen_welcome': true,
      AccountSessionStore.sessionKey: jsonEncode(session.toJson()),
    });
    final adGateway = _FakeRewardedAdGateway(
      outcomes: const [
        RewardedAdOutcome(
          earnedReward: true,
          adUnitId: 'ca-app-pub-3940256099942544/1712485313',
          rewardType: 'coin',
          rewardAmount: 1,
        ),
      ],
    );

    await tester.pumpWidget(
      LogMyPlateApp(
        rewardedAdGateway: adGateway,
        journalController: _testJournalController(
          quota: const {
            'freeRemaining': 2,
            'rewardedRemaining': 0,
            'premiumRemaining': 0,
          },
        ),
      ),
    );
    await _pumpAppFrame(tester);

    expect(find.text('2 scans'), findsOneWidget);
    expect(find.text('2 scans +'), findsNothing);
    expect(find.text('ad unlock'), findsNothing);

    await tester.tap(find.text('2 scans'));
    await tester.pump(const Duration(milliseconds: 300));

    expect(adGateway.showCount, 0);
    expect(find.text('Preparing ad'), findsNothing);
  });

  testWidgets('saved rewarded ad progress unlocks with one ad', (tester) async {
    final session = AuthSession(
      provider: AuthProvider.email,
      displayName: 'friend@test.com',
      linkedAt: DateTime(2026, 5, 20),
      profileId: 'profile_test',
      accessToken: 'token_test',
    );
    SharedPreferences.setMockInitialValues({
      'logmyplate.has_seen_welcome': true,
      AccountSessionStore.sessionKey: jsonEncode(session.toJson()),
    });
    final adGateway = _FakeRewardedAdGateway(
      outcomes: const [
        RewardedAdOutcome(
          earnedReward: true,
          adUnitId: 'ca-app-pub-3940256099942544/1712485313',
          rewardType: 'coin',
          rewardAmount: 1,
        ),
      ],
    );

    await tester.pumpWidget(
      LogMyPlateApp(
        rewardedAdGateway: adGateway,
        journalController: _testJournalController(
          quota: const {
            'freeRemaining': 0,
            'rewardedRemaining': 0,
            'premiumRemaining': 0,
          },
          rewardedAdProgress: const {
            'adsWatchedToday': 0,
            'adsNeededForNextScan': 1,
            'scansGrantedToday': 0,
            'dailyScanLimit': 5,
            'adsPerScan': 1,
          },
          rewardedAdResponses: const [
            {
              'grantedScan': true,
              'adsWatchedToday': 1,
              'adsNeededForNextScan': 1,
              'scansGrantedToday': 1,
              'dailyScanLimit': 5,
              'adsPerScan': 1,
              'quota': {
                'freeRemaining': 0,
                'rewardedRemaining': 1,
                'premiumRemaining': 0,
              },
            },
          ],
        ),
      ),
    );
    await _pumpAppFrame(tester);

    await tester.tap(find.byKey(const ValueKey('shell-scan-action')));
    await _pumpAppFrame(tester);
    expect(find.text('Watch ad'), findsOneWidget);

    await tester.tap(find.text('Watch ad'));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 600));

    expect(adGateway.showCount, 1);
    expect(adGateway.lastServerSideUserId, 'profile_test');
    expect(adGateway.lastVerificationToken, isNotNull);
    expect(find.text('AI Meal Scan'), findsOneWidget);
  });

  testWidgets('rewarded unlock does not chain ads when no scan is granted', (
    tester,
  ) async {
    final session = AuthSession(
      provider: AuthProvider.email,
      displayName: 'friend@test.com',
      linkedAt: DateTime(2026, 5, 20),
      profileId: 'profile_test',
      accessToken: 'token_test',
    );
    SharedPreferences.setMockInitialValues({
      'logmyplate.has_seen_welcome': true,
      AccountSessionStore.sessionKey: jsonEncode(session.toJson()),
    });
    final adGateway = _FakeRewardedAdGateway(
      outcomes: const [
        RewardedAdOutcome(
          earnedReward: true,
          adUnitId: 'ca-app-pub-3940256099942544/1712485313',
          rewardType: 'coin',
          rewardAmount: 1,
        ),
        RewardedAdOutcome(
          earnedReward: false,
          adUnitId: 'ca-app-pub-3940256099942544/1712485313',
          errorMessage: 'Ad was closed before reward.',
        ),
      ],
    );

    await tester.pumpWidget(
      LogMyPlateApp(
        rewardedAdGateway: adGateway,
        journalController: _testJournalController(
          quota: const {
            'freeRemaining': 0,
            'rewardedRemaining': 0,
            'premiumRemaining': 0,
          },
          rewardedAdResponses: const [
            {
              'grantedScan': false,
              'adsWatchedToday': 1,
              'adsNeededForNextScan': 1,
              'scansGrantedToday': 0,
              'dailyScanLimit': 5,
              'adsPerScan': 1,
              'quota': {
                'freeRemaining': 0,
                'rewardedRemaining': 0,
                'premiumRemaining': 0,
              },
            },
          ],
        ),
      ),
    );
    await _pumpAppFrame(tester);

    await tester.tap(find.byKey(const ValueKey('shell-scan-action')));
    await _pumpAppFrame(tester);

    await tester.tap(find.text('Watch ad'));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 600));

    expect(adGateway.showCount, 1);
    expect(find.text('AI Meal Scan'), findsNothing);
  });

  testWidgets('rewarded unlock retries while server verification is pending', (
    tester,
  ) async {
    final session = AuthSession(
      provider: AuthProvider.email,
      displayName: 'friend@test.com',
      linkedAt: DateTime(2026, 5, 20),
      profileId: 'profile_test',
      accessToken: 'token_test',
    );
    SharedPreferences.setMockInitialValues({
      'logmyplate.has_seen_welcome': true,
      AccountSessionStore.sessionKey: jsonEncode(session.toJson()),
    });
    final adGateway = _FakeRewardedAdGateway(
      outcomes: const [
        RewardedAdOutcome(
          earnedReward: true,
          adUnitId: 'ca-app-pub-3940256099942544/1712485313',
          rewardType: 'scan',
          rewardAmount: 1,
        ),
      ],
    );

    await tester.pumpWidget(
      LogMyPlateApp(
        rewardedAdGateway: adGateway,
        journalController: _testJournalController(
          quota: const {
            'freeRemaining': 0,
            'rewardedRemaining': 0,
            'premiumRemaining': 0,
          },
          rewardedAdHttpResponses: [
            http.Response(
              jsonEncode({
                'error': 'rewarded_ad_verification_pending',
                'message': 'pending',
              }),
              409,
            ),
            http.Response(
              jsonEncode({
                'grantedScan': true,
                'adsWatchedToday': 1,
                'adsNeededForNextScan': 1,
                'scansGrantedToday': 1,
                'dailyScanLimit': 5,
                'adsPerScan': 1,
                'quota': {
                  'freeRemaining': 0,
                  'rewardedRemaining': 1,
                  'premiumRemaining': 0,
                },
              }),
              200,
            ),
          ],
        ),
      ),
    );
    await _pumpAppFrame(tester);

    await tester.tap(find.byKey(const ValueKey('shell-scan-action')));
    await _pumpAppFrame(tester);
    await tester.tap(find.text('Watch ad'));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 900));
    await tester.pump(const Duration(milliseconds: 600));

    expect(adGateway.showCount, 1);
    expect(find.text('AI Meal Scan'), findsOneWidget);
  });

  testWidgets('save journal account gate backs out without manual review', (
    tester,
  ) async {
    var manualOpened = false;

    await tester.pumpWidget(
      MaterialApp(
        theme: LogMyPlateTheme.dark(),
        home: const Scaffold(body: Text('Main journal')),
        routes: {
          '/account': (_) => AccountGateScreen(
            reason: AccountGateReason.saveJournal,
            loading: false,
            onSignIn: (_) async => null,
            onEmailAuth: (_, _, _) async => null,
            onPasswordResetRequest: (_) async => true,
            onPasswordResetConfirm: (_, _, _) async => null,
            onManualLog: () {
              manualOpened = true;
            },
          ),
        },
      ),
    );

    final context = tester.element(find.text('Main journal'));
    unawaited(Navigator.of(context).pushNamed('/account'));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 500));

    expect(find.byType(AccountGateScreen), findsOneWidget);
    await tester.drag(find.byType(ListView), const Offset(0, -520));
    await tester.pump();

    expect(find.text('Maybe later'), findsOneWidget);
    expect(find.text('Log manually instead'), findsNothing);

    await tester.tap(find.text('Maybe later'));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 500));

    expect(find.text('Main journal'), findsOneWidget);
    expect(manualOpened, isFalse);
  });

  testWidgets('settings shows profile entry when signed in', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: LogMyPlateTheme.dark(),
        home: SettingsScreen(
          themeMode: ThemeMode.dark,
          session: AuthSession(
            provider: AuthProvider.email,
            displayName: 'friend@test.com',
            linkedAt: DateTime(2026, 5, 12),
          ),
          onThemeChanged: (_) {},
          onOpenAccount: () {},
        ),
      ),
    );

    expect(find.text('Profile'), findsOneWidget);
    expect(find.text('friend@test.com - Email'), findsOneWidget);
    expect(find.text('Save your journal'), findsNothing);
  });

  testWidgets('profile page exposes logout action', (tester) async {
    var loggedOut = false;

    await tester.pumpWidget(
      MaterialApp(
        theme: LogMyPlateTheme.dark(),
        home: AccountProfileScreen(
          session: AuthSession(
            provider: AuthProvider.google,
            displayName: 'Google account',
            linkedAt: DateTime(2026, 5, 12),
          ),
          loading: false,
          onSignOut: () async {
            loggedOut = true;
            return true;
          },
          onDeactivateProfile: () async => false,
          onDeleteProfile: () async => false,
        ),
      ),
    );

    expect(find.text('Profile'), findsOneWidget);
    expect(find.text('Google account'), findsWidgets);

    await tester.drag(find.byType(ListView), const Offset(0, -360));
    await tester.pump(const Duration(milliseconds: 100));

    expect(find.text('Log out'), findsOneWidget);

    await tester.tap(find.text('Log out'));
    await tester.pumpAndSettle();

    expect(loggedOut, isTrue);
  });

  testWidgets('profile page confirms destructive lifecycle actions', (
    tester,
  ) async {
    var deleted = false;

    await tester.pumpWidget(
      MaterialApp(
        theme: LogMyPlateTheme.dark(),
        home: AccountProfileScreen(
          session: AuthSession(
            provider: AuthProvider.email,
            displayName: 'friend@test.com',
            linkedAt: DateTime(2026, 5, 12),
          ),
          loading: false,
          onSignOut: () async => false,
          onDeactivateProfile: () async => false,
          onDeleteProfile: () async {
            deleted = true;
            return true;
          },
        ),
      ),
    );

    await tester.drag(find.byType(ListView), const Offset(0, -360));
    await tester.pump(const Duration(milliseconds: 100));
    await tester.tap(find.text('Delete account and data'));
    await tester.pumpAndSettle();

    expect(find.text('Delete account and data?'), findsOneWidget);

    await tester.tap(find.widgetWithText(FilledButton, 'Delete account'));
    await tester.pumpAndSettle();

    expect(deleted, isTrue);
  });
}

class _FakeRewardedAdGateway implements RewardedAdGateway {
  _FakeRewardedAdGateway({
    RewardedAdOutcome? outcome,
    List<RewardedAdOutcome>? outcomes,
  }) : outcomes = outcomes ?? [outcome!];

  final List<RewardedAdOutcome> outcomes;
  int showCount = 0;
  String? lastServerSideUserId;
  String? lastVerificationToken;

  @override
  Future<RewardedAdOutcome> showScanUnlockAd({
    VoidCallback? onAdShowed,
    String? serverSideUserId,
    String? verificationToken,
  }) async {
    showCount += 1;
    lastServerSideUserId = serverSideUserId;
    lastVerificationToken = verificationToken;
    onAdShowed?.call();
    final index = showCount - 1;
    return outcomes[index.clamp(0, outcomes.length - 1)];
  }

  @override
  void dispose() {}
}

class _SuccessfulAuthGateway implements AccountAuthGateway {
  int emailAuthCount = 0;

  @override
  Future<AuthSession> signIn(OAuthProviderCredential credential) async {
    return AuthSession(
      provider: credential.provider,
      displayName: credential.provider.label,
      linkedAt: DateTime(2026, 5, 19),
      profileId: 'profile_test',
      accessToken: 'token_test',
    );
  }

  @override
  Future<AuthSession> signInWithEmail({
    required EmailAuthMode mode,
    required String email,
    required String password,
  }) async {
    emailAuthCount += 1;
    return AuthSession(
      provider: AuthProvider.email,
      displayName: email,
      linkedAt: DateTime(2026, 5, 19),
      profileId: 'profile_test',
      accessToken: 'token_test',
    );
  }

  @override
  Future<void> requestPasswordReset({required String email}) async {}

  @override
  Future<AuthSession> confirmPasswordReset({
    required String email,
    required String code,
    required String password,
  }) async {
    return AuthSession(
      provider: AuthProvider.email,
      displayName: email,
      linkedAt: DateTime(2026, 5, 19),
      profileId: 'profile_test',
      accessToken: 'token_test',
    );
  }

  @override
  Future<void> signOut() async {}

  @override
  Future<void> deactivateProfile() async {}

  @override
  Future<void> deleteProfile() async {}
}

Future<void> _pumpAppFrame(WidgetTester tester) async {
  await tester.pump();
  await tester.runAsync(() async {
    await Future<void>.delayed(const Duration(milliseconds: 10));
  });
  await tester.pump();
  await tester.pump(const Duration(milliseconds: 450));
}

JournalController _testJournalController({
  Map<String, int>? quota,
  Map<String, dynamic>? rewardedAdResponse,
  List<Map<String, dynamic>>? rewardedAdResponses,
  List<http.Response>? rewardedAdHttpResponses,
  Map<String, int>? rewardedAdProgress,
  Map<String, dynamic>? updatePolicy,
}) {
  final quotaPayload =
      quota ??
      const {'freeRemaining': 3, 'rewardedRemaining': 0, 'premiumRemaining': 0};

  final adResponses =
      rewardedAdResponses ??
      (rewardedAdResponse == null ? null : [rewardedAdResponse]);
  var rewardedAdResponseIndex = 0;
  var rewardedAdHttpResponseIndex = 0;

  return JournalController(
    apiClient: LogMyPlateApiClient(
      baseUrl: 'http://api.test',
      httpClient: MockClient((request) async {
        if (request.url.path == '/v1/app/bootstrap') {
          return http.Response(
            jsonEncode(
              _emptyBootstrapPayload(
                quota: quotaPayload,
                rewardedAdProgress: rewardedAdProgress,
                updatePolicy: updatePolicy,
              ),
            ),
            200,
          );
        }
        if (request.url.path == '/v1/quota') {
          return http.Response(jsonEncode(quotaPayload), 200);
        }
        if (request.url.path == '/v1/meals' && request.method == 'POST') {
          final body = jsonDecode(request.body) as Map<String, dynamic>;
          final items = (body['items'] as List<dynamic>)
              .map(
                (item) => {
                  'displayName': (item as Map<String, dynamic>)['displayName'],
                  'quantity': item['quantity'],
                  'unit': item['unit'],
                  'grams': item['grams'],
                  'nutrition': item['nutrition'],
                },
              )
              .toList();

          return http.Response(
            jsonEncode({
              'id': 'meal-created',
              'mealType': body['mealType'],
              'title': body['title'],
              'loggedAt': '2026-05-19T10:10:00.000Z',
              'items': items,
              'totals': const {
                'calories': 390,
                'proteinG': 15,
                'carbsG': 70.3,
                'fatG': 6.1,
              },
            }),
            201,
          );
        }
        if (request.url.path == '/v1/ads/rewarded/complete' &&
            rewardedAdHttpResponses != null &&
            rewardedAdHttpResponses.isNotEmpty) {
          final response =
              rewardedAdHttpResponses[rewardedAdHttpResponseIndex.clamp(
                0,
                rewardedAdHttpResponses.length - 1,
              )];
          rewardedAdHttpResponseIndex += 1;
          return response;
        }
        if (request.url.path == '/v1/ads/rewarded/complete' &&
            adResponses != null &&
            adResponses.isNotEmpty) {
          final response =
              adResponses[rewardedAdResponseIndex.clamp(
                0,
                adResponses.length - 1,
              )];
          rewardedAdResponseIndex += 1;
          return http.Response(jsonEncode(response), 200);
        }
        return http.Response(jsonEncode({'error': 'not_found'}), 404);
      }),
    ),
  );
}

Map<String, dynamic> _emptyBootstrapPayload({
  Map<String, int>? quota,
  Map<String, int>? rewardedAdProgress,
  Map<String, dynamic>? updatePolicy,
}) {
  final zeroTotals = {'calories': 0, 'proteinG': 0, 'carbsG': 0, 'fatG': 0};
  final quotaPayload =
      quota ??
      const {'freeRemaining': 3, 'rewardedRemaining': 0, 'premiumRemaining': 0};

  final payload = {
    'serverTime': '2026-05-19T10:00:00.000Z',
    'profile': {
      'id': 'profile_test',
      'authMethod': 'email',
      'email': 'friend@test.com',
      'timezone': 'Asia/Kolkata',
      'linkedAt': '2026-05-19T10:00:00.000Z',
      'createdAt': '2026-05-19T10:00:00.000Z',
    },
    'quota': quotaPayload,
    'rewardedAdProgress':
        rewardedAdProgress ??
        {
          'adsWatchedToday': 0,
          'adsNeededForNextScan': 1,
          'scansGrantedToday': 0,
          'dailyScanLimit': 5,
          'adsPerScan': 1,
        },
    'today': {'totals': zeroTotals, 'meals': []},
    'weeklyRange': {
      'startDate': '2026-05-13',
      'endDate': '2026-05-19',
      'days': [],
      'summary': {
        'windowDays': 7,
        'activeDays': 0,
        'mealCount': 0,
        'totals': zeroTotals,
        'trackedDayAverage': zeroTotals,
        'calendarDayAverage': zeroTotals,
      },
    },
  };

  if (updatePolicy != null) payload['updatePolicy'] = updatePolicy;
  return payload;
}
