import 'package:dfit_mobile/src/app.dart';
import 'package:dfit_mobile/src/models/meal.dart';
import 'package:dfit_mobile/src/screens/review_meal_screen.dart';
import 'package:dfit_mobile/src/screens/startup_error_screen.dart';
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
}
