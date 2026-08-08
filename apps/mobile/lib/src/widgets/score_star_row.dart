import 'package:flutter/material.dart';

import '../models/score_rating.dart';
import 'score_visuals.dart';

/// Five stars, of which [stars] are filled.
///
/// The filled stars are painted with a single gradient stretched across the
/// whole row, so the sweep runs through the group rather than repeating
/// identically in each one — that continuity is most of what separates a
/// metallic read from a flat one. A soft halo sits behind them at the top tier.
///
/// The entire row is one semantics node reading "3 of 5 stars". Screen readers
/// would otherwise announce five separate icons, which is both noisy and
/// meaningless — the rating is the row, not any single star.
class ScoreStarRow extends StatefulWidget {
  const ScoreStarRow({
    super.key,
    required this.stars,
    this.size = 20,
    this.semanticsPrefix,
    this.animate = true,
  });

  final int stars;
  final double size;

  /// Prefixed to the announcement, e.g. "Today". Keeps the same widget honest
  /// on three surfaces without three different semantics strings.
  final String? semanticsPrefix;

  /// Stars settle in one after another on first appearance. Disabled for the
  /// meal tap-through, where the rating is supporting detail and movement would
  /// pull attention it does not deserve.
  final bool animate;

  @override
  State<ScoreStarRow> createState() => _ScoreStarRowState();
}

class _ScoreStarRowState extends State<ScoreStarRow>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 620),
  );

  @override
  void initState() {
    super.initState();
    if (widget.animate) {
      _controller.forward();
    } else {
      _controller.value = 1;
    }
  }

  @override
  void didUpdateWidget(covariant ScoreStarRow oldWidget) {
    super.didUpdateWidget(oldWidget);
    // Replay only when the rating itself changes, never on an unrelated rebuild.
    if (widget.animate && oldWidget.stars != widget.stars) {
      _controller.forward(from: 0);
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final tone = scoreToneFor(widget.stars);
    final style = ScoreToneStyle.of(context, tone);
    final prefix = widget.semanticsPrefix == null
        ? ''
        : '${widget.semanticsPrefix}: ';

    // Someone who asked the system to reduce motion should get the finished
    // state, not a slower version of the animation.
    final reduceMotion = MediaQuery.maybeDisableAnimationsOf(context) ?? false;
    final gap = widget.size * 0.16;

    return Semantics(
      label: '$prefix${widget.stars} of 5 stars',
      child: ExcludeSemantics(
        child: AnimatedBuilder(
          animation: _controller,
          builder: (context, _) {
            return Row(
              mainAxisSize: MainAxisSize.min,
              children: List.generate(5, (index) {
                final filled = index < widget.stars;
                final progress = reduceMotion ? 1.0 : _starProgress(index);
                return Padding(
                  padding: EdgeInsets.only(right: index == 4 ? 0 : gap),
                  child: _Star(
                    filled: filled,
                    size: widget.size,
                    style: style,
                    // Only the filled stars perform; the empty ones are just
                    // the track they land on.
                    progress: filled ? progress : 1.0,
                    glow: filled && tone == ScoreTone.great,
                  ),
                );
              }),
            );
          },
        ),
      ),
    );
  }

  /// Staggered so the stars read as filling up, with a slight overshoot that
  /// gives the row some weight as it settles.
  double _starProgress(int index) {
    const stagger = 0.11;
    final start = index * stagger;
    final end = (start + 0.55).clamp(0.0, 1.0);
    if (end <= start) return 1;
    return Curves.easeOutBack.transform(
      ((_controller.value - start) / (end - start)).clamp(0.0, 1.0),
    );
  }
}

class _Star extends StatelessWidget {
  const _Star({
    required this.filled,
    required this.size,
    required this.style,
    required this.progress,
    required this.glow,
  });

  final bool filled;
  final double size;
  final ScoreToneStyle style;
  final double progress;
  final bool glow;

  @override
  Widget build(BuildContext context) {
    if (!filled) {
      return Icon(Icons.star_rounded, size: size, color: style.emptyStar);
    }

    // easeOutBack overshoots past 1, which is the point — but it also dips
    // below 0 at the very start, and a negative scale mirrors the glyph.
    final scale = progress.clamp(0.0, 1.4);

    return Transform.scale(
      scale: scale,
      child: Opacity(
        opacity: progress.clamp(0.0, 1.0),
        child: SizedBox(
          width: size,
          height: size,
          child: Stack(
            alignment: Alignment.center,
            children: [
              if (glow)
                Container(
                  width: size * 0.82,
                  height: size * 0.82,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: style.glow,
                        blurRadius: size * 0.55,
                        spreadRadius: size * 0.1,
                      ),
                    ],
                  ),
                ),
              ShaderMask(
                blendMode: BlendMode.srcIn,
                shaderCallback: (bounds) => LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: style.starGradient,
                ).createShader(bounds),
                child: Icon(
                  Icons.star_rounded,
                  size: size,
                  color: Colors.white,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Copy for the in-progress caveat on a daily rating.
///
/// A provisional day is not a verdict. Someone who has logged only breakfast
/// would otherwise read a low rating as a judgement on their day rather than on
/// the one item they have entered so far.
String? scoreProgressNote(ScoreRating rating, int mealsLogged) {
  if (!rating.provisional) return null;
  if (mealsLogged <= 0) return null;
  if (mealsLogged == 1) {
    return 'Based on 1 meal so far — this updates as you log.';
  }
  return 'Based on $mealsLogged meals so far — this updates as you log.';
}
