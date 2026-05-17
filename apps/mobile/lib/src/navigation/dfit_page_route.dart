import 'package:flutter/material.dart';

enum DFitPageTransition { fadeRise, drillDown }

PageRoute<T> dfitPageRoute<T>({
  required WidgetBuilder builder,
  DFitPageTransition transition = DFitPageTransition.fadeRise,
}) {
  return PageRouteBuilder<T>(
    pageBuilder: (context, animation, secondaryAnimation) => builder(context),
    transitionDuration: const Duration(milliseconds: 420),
    reverseTransitionDuration: const Duration(milliseconds: 320),
    transitionsBuilder: (context, animation, secondaryAnimation, child) {
      final incoming = CurvedAnimation(
        parent: animation,
        curve: Curves.easeOutQuart,
        reverseCurve: Curves.easeInCubic,
      );
      final outgoing = CurvedAnimation(
        parent: secondaryAnimation,
        curve: Curves.easeOutCubic,
        reverseCurve: Curves.easeInCubic,
      );

      final beginOffset = switch (transition) {
        DFitPageTransition.fadeRise => const Offset(0, 0.12),
        DFitPageTransition.drillDown => const Offset(0.20, 0),
      };
      final beginScale = switch (transition) {
        DFitPageTransition.fadeRise => 0.94,
        DFitPageTransition.drillDown => 0.98,
      };

      return FadeTransition(
        opacity: Tween<double>(begin: 1, end: 0.92).animate(outgoing),
        child: ScaleTransition(
          scale: Tween<double>(begin: 1, end: 0.985).animate(outgoing),
          child: FadeTransition(
            opacity: incoming,
            child: SlideTransition(
              position: Tween<Offset>(
                begin: beginOffset,
                end: Offset.zero,
              ).animate(incoming),
              child: ScaleTransition(
                scale: Tween<double>(
                  begin: beginScale,
                  end: 1,
                ).animate(incoming),
                child: child,
              ),
            ),
          ),
        ),
      );
    },
  );
}
