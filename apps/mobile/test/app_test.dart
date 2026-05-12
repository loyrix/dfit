import 'package:dfit_mobile/src/app.dart';
import 'package:dfit_mobile/src/models/auth_session.dart';
import 'package:dfit_mobile/src/models/meal.dart';
import 'package:dfit_mobile/src/screens/account_gate_screen.dart';
import 'package:dfit_mobile/src/screens/account_profile_screen.dart';
import 'package:dfit_mobile/src/screens/meal_detail_screen.dart';
import 'package:dfit_mobile/src/screens/review_meal_screen.dart';
import 'package:dfit_mobile/src/screens/settings_screen.dart';
import 'package:dfit_mobile/src/screens/startup_error_screen.dart';
import 'package:dfit_mobile/src/screens/today_screen.dart';
import 'package:dfit_mobile/src/theme/dfit_theme.dart';
import 'package:dfit_mobile/src/widgets/primitive_icons.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  testWidgets('renders DFit welcome screen', (tester) async {
    await tester.pumpWidget(const DFitApp());
    await tester.pump();

    expect(find.text('DFit'), findsOneWidget);
    expect(find.text('Start first scan'), findsOneWidget);
  });

  testWidgets('enters camera flow from welcome', (tester) async {
    await tester.pumpWidget(const DFitApp());
    await tester.pump();

    await tester.tap(find.text('Start first scan'));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 300));

    expect(find.text('MEAL SCAN'), findsOneWidget);
    expect(find.text('Center your plate'), findsOneWidget);
    expect(find.text('full plate'), findsOneWidget);
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

    expect(find.text('kcal - 2 items'), findsOneWidget);
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

    expect(find.text('LUNCH'), findsOneWidget);
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
          target: defaultTarget,
          onRefresh: () async {},
          onScan: () => scanTapped = true,
          onAddManually: () {},
          onOpenSettings: () {},
          onOpenMeal: (_) {},
        ),
      ),
    );

    expect(find.byType(FloatingActionButton), findsNothing);
    expect(find.byType(PrimitiveCameraIcon), findsOneWidget);
    expect(find.text('104 kcal over'), findsWidgets);
    expect(find.text('MACRO PROFILE'), findsNothing);
    expect(find.text('70'), findsOneWidget);
    expect(find.text('355'), findsOneWidget);
    expect(find.text('39'), findsOneWidget);

    await tester.tap(find.byType(PrimitiveCameraIcon));
    expect(scanTapped, isTrue);
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

    expect(find.text('MACRO PROFILE'), findsOneWidget);
    expect(find.text('ITEM CONTRIBUTION'), findsOneWidget);
    expect(find.text('protein density'), findsOneWidget);
    expect(find.text('Dal'), findsWidgets);
  });

  testWidgets('initial journal loading shows premium skeleton', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: DFitTheme.dark(),
        home: TodayScreen(
          meals: const [],
          totals: MacroTotals.zero,
          target: defaultTarget,
          loading: true,
          initialLoading: true,
          onRefresh: () async {},
          onScan: () {},
          onAddManually: () {},
          onOpenSettings: () {},
          onOpenMeal: (_) {},
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

    expect(find.text('PROFILE'), findsOneWidget);
    expect(find.text('Google account'), findsWidgets);

    await tester.drag(find.byType(ListView), const Offset(0, -360));
    await tester.pump(const Duration(milliseconds: 100));

    expect(find.text('Log out'), findsOneWidget);

    await tester.tap(find.text('Log out'));
    await tester.pumpAndSettle();

    expect(loggedOut, isTrue);
  });
}
