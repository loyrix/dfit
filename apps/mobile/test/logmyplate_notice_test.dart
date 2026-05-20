import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:logmyplate_mobile/src/theme/logmyplate_theme.dart';
import 'package:logmyplate_mobile/src/widgets/logmyplate_notice.dart';

void main() {
  tearDown(LogMyPlateNotice.hideCurrent);

  testWidgets('shows a themed top notice with message copy', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: LogMyPlateTheme.dark(),
        home: Builder(
          builder: (context) {
            return Scaffold(
              body: Center(
                child: FilledButton(
                  onPressed: () {
                    LogMyPlateNotice.show(
                      context,
                      tone: LogMyPlateNoticeTone.success,
                      title: 'Scan unlocked',
                      message: 'You can scan one more meal now.',
                    );
                  },
                  child: const Text('Show notice'),
                ),
              ),
            );
          },
        ),
      ),
    );

    await tester.tap(find.text('Show notice'));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 260));

    expect(find.text('Scan unlocked'), findsOneWidget);
    expect(find.text('You can scan one more meal now.'), findsOneWidget);
    expect(find.byIcon(Icons.check_rounded), findsOneWidget);
  });

  testWidgets('replaces the active notice with the latest message', (
    tester,
  ) async {
    late BuildContext noticeContext;

    await tester.pumpWidget(
      MaterialApp(
        theme: LogMyPlateTheme.light(),
        home: Builder(
          builder: (context) {
            noticeContext = context;
            return const Scaffold(body: SizedBox());
          },
        ),
      ),
    );

    LogMyPlateNotice.show(
      noticeContext,
      tone: LogMyPlateNoticeTone.info,
      title: 'Preparing ad',
    );
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 260));

    LogMyPlateNotice.show(
      noticeContext,
      tone: LogMyPlateNoticeTone.error,
      title: 'Unlock sync failed',
      message: 'Ad was watched, but the scan could not be credited.',
    );
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 260));

    expect(find.text('Preparing ad'), findsNothing);
    expect(find.text('Unlock sync failed'), findsOneWidget);
    expect(
      find.text('Ad was watched, but the scan could not be credited.'),
      findsOneWidget,
    );
  });

  testWidgets('can present from the navigator overlay', (tester) async {
    final navigatorKey = GlobalKey<NavigatorState>();

    await tester.pumpWidget(
      MaterialApp(
        navigatorKey: navigatorKey,
        theme: LogMyPlateTheme.dark(),
        home: const Scaffold(body: SizedBox()),
      ),
    );

    LogMyPlateNotice.showInOverlay(
      navigatorKey.currentState!.overlay!,
      tone: LogMyPlateNoticeTone.success,
      title: 'Meal saved',
      message: 'Your journal is up to date.',
    );
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 260));

    expect(find.text('Meal saved'), findsOneWidget);
    expect(find.text('Your journal is up to date.'), findsOneWidget);
  });
}
