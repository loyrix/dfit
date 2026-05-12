import 'package:flutter/material.dart';

import '../models/captured_meal_photo.dart';
import '../models/meal.dart';
import '../theme/dfit_colors.dart';

class AnalyzingScreen extends StatefulWidget {
  const AnalyzingScreen({
    super.key,
    required this.photo,
    required this.onAnalyze,
    required this.onAnalyzed,
  });

  final CapturedMealPhoto photo;
  final Future<ScanAnalysis> Function(CapturedMealPhoto photo) onAnalyze;
  final ValueChanged<ScanAnalysis> onAnalyzed;

  @override
  State<AnalyzingScreen> createState() => _AnalyzingScreenState();
}

class _AnalyzingScreenState extends State<AnalyzingScreen> {
  String? _error;

  @override
  void initState() {
    super.initState();
    _runAnalysis();
  }

  Future<void> _runAnalysis() async {
    if (_error != null) {
      setState(() => _error = null);
    }

    try {
      final analysis = await widget.onAnalyze(widget.photo);
      if (!mounted) return;
      widget.onAnalyzed(analysis);
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _error =
            'Could not analyze this meal. Check the API connection and try again.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final error = _error;

    return Scaffold(
      backgroundColor: DFitColors.bgInk,
      body: SafeArea(
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const _ScanMark(),
              const SizedBox(height: 40),
              Text(
                'Reading your plate',
                style: Theme.of(
                  context,
                ).textTheme.titleMedium?.copyWith(color: Colors.white),
              ),
              const SizedBox(height: 18),
              Container(
                margin: const EdgeInsets.symmetric(horizontal: 32),
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.03),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: Colors.white.withValues(alpha: 0.06),
                  ),
                ),
                child: Column(
                  children: [
                    const _StepRow(label: 'Captured', done: true),
                    _StepRow(label: 'Identifying items', active: error == null),
                    _StepRow(
                      label: 'Estimating portions',
                      active: error == null,
                    ),
                  ],
                ),
              ),
              if (error != null) ...[
                const SizedBox(height: 18),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 32),
                  child: Text(
                    error,
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Colors.white.withValues(alpha: 0.7),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                FilledButton(
                  onPressed: _runAnalysis,
                  style: FilledButton.styleFrom(
                    backgroundColor: DFitColors.accent,
                    foregroundColor: DFitColors.accentDeep,
                  ),
                  child: const Text('Retry'),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _ScanMark extends StatelessWidget {
  const _ScanMark();

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 184,
      height: 184,
      child: Stack(
        alignment: Alignment.center,
        children: [
          Container(
            width: 184,
            height: 184,
            decoration: BoxDecoration(
              border: Border.all(
                color: DFitColors.accent.withValues(alpha: 0.35),
              ),
              shape: BoxShape.circle,
            ),
          ),
          Container(
            width: 108,
            height: 108,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.03),
              border: Border.all(
                color: DFitColors.accent.withValues(alpha: 0.2),
              ),
              borderRadius: BorderRadius.circular(10),
            ),
          ),
          Container(width: 108, height: 2, color: DFitColors.accent),
          const _PulseDot(top: 52, left: 66),
          const _PulseDot(top: 86, left: 112),
          const _PulseDot(top: 118, left: 78),
        ],
      ),
    );
  }
}

class _PulseDot extends StatelessWidget {
  const _PulseDot({required this.top, required this.left});

  final double top;
  final double left;

  @override
  Widget build(BuildContext context) {
    return Positioned(
      top: top,
      left: left,
      child: Container(
        width: 7,
        height: 7,
        decoration: const BoxDecoration(
          color: DFitColors.accent,
          shape: BoxShape.circle,
        ),
      ),
    );
  }
}

class _StepRow extends StatelessWidget {
  const _StepRow({required this.label, this.done = false, this.active = false});

  final String label;
  final bool done;
  final bool active;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 7),
      child: Row(
        children: [
          Container(
            width: 18,
            height: 18,
            decoration: BoxDecoration(
              color: done ? DFitColors.accent : Colors.transparent,
              border: Border.all(
                color: done || active
                    ? DFitColors.accent
                    : Colors.white.withValues(alpha: 0.18),
                width: 1.5,
              ),
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 12),
          Text(
            label,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: active || done
                  ? Colors.white
                  : Colors.white.withValues(alpha: 0.35),
              fontWeight: active ? FontWeight.w500 : FontWeight.w400,
            ),
          ),
        ],
      ),
    );
  }
}
