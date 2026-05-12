import 'package:dfit_mobile/src/app.dart';
import 'package:dfit_mobile/src/models/meal.dart';
import 'package:dfit_mobile/src/screens/review_meal_screen.dart';
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
    await tester.pumpAndSettle();

    expect(find.text('Center your plate'), findsOneWidget);
    expect(find.byType(FloatingActionButton), findsNothing);
  });

  testWidgets('skips welcome after onboarding is seen', (tester) async {
    SharedPreferences.setMockInitialValues({'dfit.has_seen_welcome': true});

    await tester.pumpWidget(const DFitApp());
    await tester.pump();

    expect(find.text('Start first scan'), findsNothing);
    expect(find.byType(FloatingActionButton), findsOneWidget);
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
    expect(find.text('104 kcal over'), findsOneWidget);
    expect(find.text('70'), findsOneWidget);
    expect(find.text('355'), findsOneWidget);
    expect(find.text('39'), findsOneWidget);

    await tester.tap(find.byType(PrimitiveCameraIcon));
    expect(scanTapped, isTrue);
  });
}
