import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';

import 'package:dfit_mobile/src/app.dart';
import 'package:dfit_mobile/src/models/auth_session.dart';
import 'package:dfit_mobile/src/models/captured_meal_photo.dart';
import 'package:dfit_mobile/src/models/meal.dart';
import 'package:dfit_mobile/src/screens/account_gate_screen.dart';
import 'package:dfit_mobile/src/screens/account_profile_screen.dart';
import 'package:dfit_mobile/src/screens/analyzing_screen.dart';
import 'package:dfit_mobile/src/screens/meal_detail_screen.dart';
import 'package:dfit_mobile/src/screens/review_meal_screen.dart';
import 'package:dfit_mobile/src/screens/settings_screen.dart';
import 'package:dfit_mobile/src/screens/startup_error_screen.dart';
import 'package:dfit_mobile/src/screens/today_screen.dart';
import 'package:dfit_mobile/src/screens/weekly_journal_screen.dart';
import 'package:dfit_mobile/src/services/app_diagnostics.dart';
import 'package:dfit_mobile/src/services/dfit_api_client.dart';
import 'package:dfit_mobile/src/theme/dfit_theme.dart';
import 'package:dfit_mobile/src/widgets/primitive_icons.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({});
    AppDiagnostics.instance.clear();
  });

  testWidgets('renders DFit welcome screen', (tester) async {
    await tester.pumpWidget(const DFitApp());
    await tester.pump();

    expect(find.text('DFit'), findsOneWidget);
    expect(
      find.text('AI-powered food tracking, without the hassle.'),
      findsOneWidget,
    );
    expect(find.text('Start first scan'), findsOneWidget);
  });

  testWidgets('enters camera flow from welcome', (tester) async {
    await tester.pumpWidget(const DFitApp());
    await tester.pump();

    await tester.tap(find.text('Start first scan'));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));

    expect(find.text('Meal Scan'), findsOneWidget);
    expect(find.text('Tell us what is on the plate'), findsOneWidget);
    expect(find.text('Food note'), findsOneWidget);
    expect(find.text('Add a meal photo'), findsOneWidget);
    expect(find.text('Upload'), findsOneWidget);
    expect(find.byIcon(Icons.mic_rounded), findsOneWidget);
  });

  testWidgets('skips welcome after onboarding is seen', (tester) async {
    SharedPreferences.setMockInitialValues({'dfit.has_seen_welcome': true});

    await tester.pumpWidget(const DFitApp());
    await tester.pump();

    expect(find.text('Start first scan'), findsNothing);
    expect(find.byType(TodayScreen), findsOneWidget);
  });

  testWidgets('renders controlled startup error screen', (tester) async {
    await tester.pumpWidget(
      const DFitStartupErrorApp(message: 'Missing configuration'),
    );

    expect(find.text('DFit paused'), findsOneWidget);
    expect(find.text('Missing configuration'), findsOneWidget);
  });

  testWidgets('adds a quick item during meal review', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: ReviewMealScreen(
          initialItems: sampleDetectedItems().take(1).toList(),
          onConfirm: (_, _) async {},
        ),
      ),
    );

    await tester.tap(find.text('Add item'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Rice'));
    await tester.pumpAndSettle();

    expect(find.text('kCal - 2 items'), findsOneWidget);
  });

  testWidgets('scales AI review item details from portion changes', (
    tester,
  ) async {
    List<MealItem>? confirmedItems;

    await tester.pumpWidget(
      MaterialApp(
        theme: DFitTheme.dark(),
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
    expect(find.text('Add item'), findsOneWidget);
    await tester.drag(find.byType(ListView), const Offset(0, -420));
    await tester.pumpAndSettle();
    expect(find.text('Confirm meal'), findsOneWidget);
  });

  testWidgets('primitive icons inherit dark theme color', (tester) async {
    late Color resolvedColor;

    await tester.pumpWidget(
      MaterialApp(
        theme: DFitTheme.dark(),
        home: Builder(
          builder: (context) {
            resolvedColor = dfitPrimitiveIconColor(context, null);
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
        theme: DFitTheme.dark(),
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
        theme: DFitTheme.dark(),
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
          onOpenWeeklyJournal: () => openedWeeklyJournal = true,
        ),
      ),
    );

    await tester.tap(find.text('7 Day Summary'));
    await tester.pump();

    expect(openedWeeklyJournal, isTrue);
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
        theme: DFitTheme.dark(),
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
          onOpenMeal: (meal) => openedMeal = meal,
        ),
      ),
    );

    expect(find.text('7 Day Journal'), findsOneWidget);
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
        theme: DFitTheme.light(),
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
          onOpenMeal: (_) {},
        ),
      ),
    );

    expect(find.text('Could not refresh journal.'), findsOneWidget);
    await tester.drag(find.byType(ListView).first, const Offset(0, -320));
    await tester.pump(const Duration(milliseconds: 250));
    expect(find.text('No journal days yet'), findsOneWidget);

    await tester.tap(find.text('Retry'));
    await tester.pump();

    expect(retried, isTrue);
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
        theme: DFitTheme.dark(),
        home: MealDetailScreen(meal: meal),
      ),
    );

    expect(find.text('Macro Profile'), findsOneWidget);
    expect(find.text('Item Contribution'), findsOneWidget);
    expect(find.text('Protein density'), findsOneWidget);
    expect(find.text('Dal'), findsWidgets);
  });

  testWidgets('initial journal loading shows premium skeleton', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: DFitTheme.dark(),
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
        theme: DFitTheme.light(),
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
    expect(scaffold.backgroundColor, DFitThemeColors.light().background);
  });

  testWidgets('analysis quota failure offers account handoff', (tester) async {
    var accountOpened = false;

    await tester.pumpWidget(
      MaterialApp(
        theme: DFitTheme.dark(),
        home: AnalyzingScreen(
          photo: CapturedMealPhoto(
            bytes: Uint8List.fromList([1, 2, 3]),
            mimeType: 'image/jpeg',
            fileName: 'plate.jpg',
            userHint: 'dal rice',
          ),
          onAnalyze: (_) async {
            throw DFitApiException(
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

  testWidgets('account gate offers Apple Google and email auth', (
    tester,
  ) async {
    EmailAuthMode? submittedMode;
    String? submittedEmail;

    await tester.pumpWidget(
      MaterialApp(
        theme: DFitTheme.dark(),
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
          onManualLog: () {},
        ),
      ),
    );

    expect(find.text('3 scans used'), findsOneWidget);
    expect(find.text('Create account to keep scanning'), findsOneWidget);
    expect(find.text('Apple'), findsOneWidget);
    expect(find.text('Google'), findsOneWidget);
    expect(find.text('Create account'), findsOneWidget);

    await tester.enterText(find.byType(TextField).at(0), 'friend@test.com');
    await tester.enterText(find.byType(TextField).at(1), 'secret1');
    await tester.tap(find.text('Create account'));
    await tester.pump(const Duration(milliseconds: 100));

    expect(submittedMode, EmailAuthMode.signUp);
    expect(submittedEmail, 'friend@test.com');
  });

  testWidgets('settings shows profile entry when signed in', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: DFitTheme.dark(),
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

  testWidgets('settings shows recent diagnostics', (tester) async {
    AppDiagnostics.instance.clear();
    AppDiagnostics.instance.record('journal.load_today', Exception('timeout'));

    await tester.pumpWidget(
      MaterialApp(
        theme: DFitTheme.dark(),
        home: SettingsScreen(
          themeMode: ThemeMode.dark,
          session: null,
          diagnosticsEntries: AppDiagnostics.instance.entries,
          onThemeChanged: (_) {},
          onOpenAccount: () {},
        ),
      ),
    );

    await tester.drag(find.byType(ListView), const Offset(0, -720));
    await tester.pumpAndSettle();

    expect(find.text('Diagnostics'), findsOneWidget);
    expect(find.text('journal.load_today'), findsOneWidget);
    expect(find.textContaining('timeout'), findsOneWidget);

    AppDiagnostics.instance.clear();
  });

  testWidgets('profile page exposes logout action', (tester) async {
    var loggedOut = false;

    await tester.pumpWidget(
      MaterialApp(
        theme: DFitTheme.dark(),
        home: AccountProfileScreen(
          session: AuthSession(
            provider: AuthProvider.google,
            displayName: 'Google account',
            linkedAt: DateTime(2026, 5, 12),
          ),
          onSignOut: () async {
            loggedOut = true;
          },
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
}
