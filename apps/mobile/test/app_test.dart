import 'package:dfit_mobile/src/app.dart';
import 'package:dfit_mobile/src/screens/startup_error_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('renders DFit welcome screen', (tester) async {
    await tester.pumpWidget(const DFitApp());

    expect(find.text('DFit'), findsOneWidget);
    expect(find.text('Start first scan'), findsOneWidget);
  });

  testWidgets('enters camera flow from welcome', (tester) async {
    await tester.pumpWidget(const DFitApp());

    await tester.tap(find.text('Start first scan'));
    await tester.pumpAndSettle();

    expect(find.text('Center your plate'), findsOneWidget);
    expect(find.byType(FloatingActionButton), findsNothing);
  });

  testWidgets('renders controlled startup error screen', (tester) async {
    await tester.pumpWidget(
      const DFitStartupErrorApp(message: 'Missing configuration'),
    );

    expect(find.text('DFit paused'), findsOneWidget);
    expect(find.text('Missing configuration'), findsOneWidget);
  });
}
