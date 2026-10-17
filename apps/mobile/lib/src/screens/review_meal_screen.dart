import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../theme/logmyplate_spacing.dart';

import '../models/captured_meal_photo.dart';
import '../models/meal.dart';
import '../models/plate_score.dart';
import '../theme/logmyplate_colors.dart';
import '../theme/logmyplate_theme.dart';
import '../widgets/glass/glass_backdrop.dart';
import '../widgets/glass/glass_cards.dart';
import '../widgets/macro_chips.dart';
import '../widgets/primitive_icons.dart';
import '../widgets/glass/glass_wrapper.dart';
import '../widgets/meal_item_editor_sheet.dart';
import '../widgets/premium_button.dart';

class ReviewMealScreen extends StatefulWidget {
  const ReviewMealScreen({
    super.key,
    required this.initialItems,
    required this.onConfirm,
    this.initialMealType = MealType.lunch,
    this.lockInitialItems = false,
    this.photo,
    this.onFoodSearch,
    this.isPremium = false,
    this.plateScoreProfile,
    this.plateScorePolicy = PlateScorePolicy.fallback,
    this.onPersonaliseScore,
    this.mealAdvice,
    this.onDescribeMeal,
  });

  final List<MealItem> initialItems;
  final MealType initialMealType;
  final bool lockInitialItems;
  final CapturedMealPhoto? photo;
  final Future<List<FoodSearchResult>> Function(String query)? onFoodSearch;
  final Future<void> Function(
    MealType type,
    List<MealItem> items, {
    bool analyzeWithAI,
  })
  onConfirm;
  final bool isPremium;

  /// Scoring inputs for the signed-in user, or null for the general tier.
  final PlateScoreProfile? plateScoreProfile;

  /// Tunable constants from bootstrap; bundled defaults when absent.
  final PlateScorePolicy plateScorePolicy;

  /// Opens the health target form from the "personalise this" prompt.
  final VoidCallback? onPersonaliseScore;

  /// Commentary from the scan, shown in the breakdown sheet. Null for manually
  /// built meals, which never went through the model.
  final MealAdvice? mealAdvice;

  /// Sends a typed description of the meal for AI estimation. Supplied only on
  /// the manual screen; the described meal then comes back as a normal review.
  final ValueChanged<String>? onDescribeMeal;

  @override
  State<ReviewMealScreen> createState() => _ReviewMealScreenState();
}

class _ReviewMealScreenState extends State<ReviewMealScreen> {
  late final List<_ReviewMealEntry> _entries = widget.initialItems
      .map(
        (item) => _ReviewMealEntry(
          item: item,
          lockedFromAnalysis: widget.lockInitialItems,
        ),
      )
      .toList();
  late MealType _mealType = widget.initialMealType;
  bool _saving = false;
  String? _error;

  List<MealItem> get _items => _entries.map((entry) => entry.item).toList();

  MacroTotals get _totals {
    return _entries.fold<MacroTotals>(
      MacroTotals.zero,
      (total, entry) => total + entry.item.nutrition,
    );
  }

  @override
  Widget build(BuildContext context) {
    final totals = _totals;
    final primaryText = _reviewPrimaryText(context);
    final secondaryText = _reviewSecondaryText(context);
    final borderColor = _reviewBorder(context);
    final bool isEmptyTextEntry =
        widget.onDescribeMeal != null && _entries.isEmpty;

    final addCustomItemButton = GlassWrapper(
      child: OutlinedButton(
        onPressed: _openAddCustomItemSheet,
        style: OutlinedButton.styleFrom(
          foregroundColor: primaryText,
          side: BorderSide(color: borderColor),
          padding: const EdgeInsets.symmetric(vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(
              LogMyPlateSpacing.elementBorderRadius,
            ),
          ),
        ),
        child: const Text('Add custom item'),
      ),
    );

    return Scaffold(
      extendBodyBehindAppBar: true,
      backgroundColor: Colors.transparent,
      body: GlassBackdrop(
        child: SafeArea(
          child: Column(
            children: [
              // Outside the scroll view so Back stays reachable on a long page.
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    IconButton(
                      tooltip: 'Back',
                      onPressed: () => Navigator.of(context).pop(),
                      icon: const BackMark(),
                    ),
                    _MealTypePill(type: _mealType, onTap: _cycleMealType),
                    const SizedBox(width: 48),
                  ],
                ),
              ),
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.fromLTRB(
                    16,
                    LogMyPlateSpacing.itemSpacing,
                    16,
                    24,
                  ),
                  children: [
                    AnimatedSwitcher(
                      duration: const Duration(milliseconds: 220),
                      switchInCurve: Curves.easeOutCubic,
                      switchOutCurve: Curves.easeInCubic,
                      layoutBuilder: (currentChild, previousChildren) {
                        return Stack(
                          alignment: Alignment.topCenter,
                          children: <Widget>[
                            ...previousChildren,
                            ?currentChild,
                          ],
                        );
                      },
                      transitionBuilder: (child, animation) {
                        return FadeTransition(
                          opacity: animation,
                          child: SizeTransition(
                            sizeFactor: animation,
                            alignment: Alignment.topCenter,
                            child: child,
                          ),
                        );
                      },
                      child: isEmptyTextEntry
                          ? Column(
                              key: const ValueKey('review-empty-text-entry'),
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              children: [
                                _DescribeMealCard(
                                  onSubmit: widget.onDescribeMeal!,
                                ),
                                const _OrDivider(),
                                addCustomItemButton,
                              ],
                            )
                          : Column(
                              key: const ValueKey('review-populated'),
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              children: [
                                _ReviewSummaryCard(
                                  photo: widget.photo,
                                  mealType: _mealType,
                                  totals: totals,
                                  itemCount: _items.length,
                                ),
                                const SizedBox(
                                  height: LogMyPlateSpacing.sectionSpacing,
                                ),
                                Text(
                                  'Items to confirm',
                                  style: Theme.of(context).textTheme.labelSmall
                                      ?.copyWith(
                                        color: secondaryText,
                                        letterSpacing: 1.2,
                                      ),
                                ),
                                const SizedBox(height: 10),
                                LiteGlassCard(
                                  borderRadius: BorderRadius.circular(
                                    LogMyPlateSpacing.heroCardBorderRadius,
                                  ),
                                  padding: EdgeInsets.zero,
                                  child: Column(
                                    children: [
                                      for (
                                        var index = 0;
                                        index < _entries.length;
                                        index++
                                      )
                                        _ReviewItemRow(
                                          rowKey: ValueKey(
                                            '${_entries[index].item.name}-$index',
                                          ),
                                          item: _entries[index].item,
                                          onEdit: () =>
                                              _openEditItemSheet(index),
                                          onDelete: () {
                                            setState(
                                              () => _entries.removeAt(index),
                                            );
                                          },
                                        ),
                                    ],
                                  ),
                                ),
                                const SizedBox(
                                  height: LogMyPlateSpacing.sectionSpacing,
                                ),
                                addCustomItemButton,
                                const SizedBox(height: 10),
                                if (_error != null) ...[
                                  Text(
                                    _error!,
                                    textAlign: TextAlign.center,
                                    style: Theme.of(context).textTheme.bodySmall
                                        ?.copyWith(
                                          color: _reviewAccentText(context),
                                        ),
                                  ),
                                  const SizedBox(height: 10),
                                ],
                                PremiumButton.icon(
                                  onPressed: _items.isEmpty
                                      ? null
                                      : _saving
                                      ? () {}
                                      : () => _confirm(analyzeWithAI: false),
                                  icon: _saving
                                      ? const SizedBox(
                                          width: 18,
                                          height: 18,
                                          child: CircularProgressIndicator(
                                            strokeWidth: 2,
                                          ),
                                        )
                                      : const Icon(
                                          Icons.check_rounded,
                                          size: 20,
                                        ),
                                  label: const Text(
                                    'Confirm meal',
                                    key: ValueKey('confirm'),
                                  ),
                                ),
                              ],
                            ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _confirm({bool analyzeWithAI = false}) async {
    setState(() {
      _saving = true;
      _error = null;
    });

    try {
      await widget.onConfirm(_mealType, _items, analyzeWithAI: analyzeWithAI);
      unawaited(HapticFeedback.lightImpact());
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _saving = false;
        _error =
            'Could not save this meal. Check the API connection and try again.';
      });
    }
  }

  void _cycleMealType() {
    final nextIndex = (_mealType.index + 1) % MealType.values.length;
    setState(() => _mealType = MealType.values[nextIndex]);
  }

  Future<void> _openEditItemSheet(int index) async {
    final result = await showModalBottomSheet<MealItemEditResult>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => MealItemEditorSheet(
        item: _entries[index].item,
        lockedFromAnalysis: _entries[index].lockedFromAnalysis,
        onFoodSearch: widget.onFoodSearch,
      ),
    );
    if (result == null || !mounted) return;

    if (result.delete) {
      setState(() => _entries.removeAt(index));
      return;
    }

    final item = result.item;
    if (item == null) return;
    setState(() => _entries[index] = _entries[index].copyWith(item: item));
  }

  Future<void> _openAddCustomItemSheet() async {
    final item = await _openNewItemSheet(_emptyCustomMealItem);
    if (item == null || !mounted) return;
    setState(
      () =>
          _entries.add(_ReviewMealEntry(item: item, lockedFromAnalysis: false)),
    );
  }

  Future<MealItem?> _openNewItemSheet(MealItem item) async {
    final result = await showModalBottomSheet<MealItemEditResult>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => MealItemEditorSheet(
        item: item,
        lockedFromAnalysis: false,
        allowDelete: false,
        onFoodSearch: widget.onFoodSearch,
      ),
    );
    if (result == null || result.delete) return null;
    return result.item;
  }
}

// Mirrors the API limits for a meal described without a photo, in
// packages/contracts/src/scans.ts.
const _describedMealMaxChars = 600;
const _describedMealMaxWords = 120;

/// Lets someone type what they ate and have the AI estimate it, with no photo.
class _DescribeMealCard extends StatefulWidget {
  const _DescribeMealCard({required this.onSubmit});

  final ValueChanged<String> onSubmit;

  @override
  State<_DescribeMealCard> createState() => _DescribeMealCardState();
}

class _DescribeMealCardState extends State<_DescribeMealCard> {
  final _controller = TextEditingController();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  int get _wordCount {
    final text = _controller.text.trim();
    if (text.isEmpty) return 0;
    return text.split(RegExp(r'\s+')).where((word) => word.isNotEmpty).length;
  }

  void _submit() {
    final description = _controller.text.trim();
    if (description.isEmpty || _wordCount > _describedMealMaxWords) return;
    FocusScope.of(context).unfocus();
    widget.onSubmit(description);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final secondaryText = _reviewSecondaryText(context);
    final wordCount = _wordCount;
    final overLimit = wordCount > _describedMealMaxWords;
    final canSubmit = wordCount > 0 && !overLimit;

    return LiteGlassCard(
      borderRadius: BorderRadius.circular(
        LogMyPlateSpacing.heroCardBorderRadius,
      ),
      padding: const EdgeInsets.all(LogMyPlateSpacing.itemSpacing),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            'Describe your meal',
            style: theme.textTheme.titleSmall?.copyWith(
              color: _reviewPrimaryText(context),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Type what you ate and how much. AI estimates the calories and '
            'macros for you to review. Uses 1 scan.',
            style: theme.textTheme.bodySmall?.copyWith(
              color: secondaryText,
              height: 1.3,
            ),
          ),
          const SizedBox(height: 10),
          TextField(
            key: const ValueKey('describe-meal-field'),
            controller: _controller,
            maxLength: _describedMealMaxChars,
            minLines: 3,
            maxLines: 6,
            textInputAction: TextInputAction.newline,
            onChanged: (_) => setState(() {}),
            style: theme.textTheme.bodyMedium?.copyWith(
              color: _reviewPrimaryText(context),
              letterSpacing: 0,
            ),
            decoration: InputDecoration(
              counterText: '',
              hintText: 'e.g. 2 rotis, 1 bowl dal and a small bowl of rice',
              hintStyle: theme.textTheme.bodyMedium?.copyWith(
                color: secondaryText,
                letterSpacing: 0,
              ),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(
                  LogMyPlateSpacing.elementBorderRadius,
                ),
                borderSide: BorderSide(color: _reviewBorder(context)),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(
                  LogMyPlateSpacing.elementBorderRadius,
                ),
                borderSide: BorderSide(color: _reviewBorder(context)),
              ),
              contentPadding: const EdgeInsets.all(12),
            ),
          ),
          const SizedBox(height: 6),
          Align(
            alignment: Alignment.centerRight,
            child: Text(
              '$wordCount/ $_describedMealMaxWords words',
              style: theme.textTheme.bodySmall?.copyWith(
                color: overLimit ? _reviewAccentText(context) : secondaryText,
                fontFeatures: const [FontFeature.tabularFigures()],
              ),
            ),
          ),
          const SizedBox(height: 8),
          PremiumButton.icon(
            onPressed: canSubmit ? _submit : null,
            icon: const Icon(Icons.auto_awesome_rounded, size: 20),
            label: const Text(
              'Estimate with AI',
              key: ValueKey('describe-meal-submit'),
            ),
          ),
        ],
      ),
    );
  }
}

class _ReviewSummaryCard extends StatelessWidget {
  const _ReviewSummaryCard({
    required this.photo,
    required this.mealType,
    required this.totals,
    required this.itemCount,
  });

  final CapturedMealPhoto? photo;
  final MealType mealType;
  final MacroTotals totals;
  final int itemCount;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;
    final photo = this.photo;

    return Padding(
      padding: const EdgeInsets.fromLTRB(4, 4, 4, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              if (photo != null) ...[
                ClipRRect(
                  borderRadius: BorderRadius.circular(
                    LogMyPlateSpacing.cardBorderRadius,
                  ),
                  child: Image.memory(
                    photo.bytes,
                    width: 74,
                    height: 74,
                    fit: BoxFit.cover,
                    gaplessPlayback: true,
                    // Decode at thumbnail size instead of the full capture.
                    cacheWidth: (74 * MediaQuery.devicePixelRatioOf(context))
                        .round(),
                  ),
                ),
                const SizedBox(width: 14),
              ],
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Review estimate',
                      style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        color: colors.textSecondary,
                        letterSpacing: 1.5,
                      ),
                    ),
                    const SizedBox(height: 7),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          '${totals.calories}',
                          style: Theme.of(context).textTheme.headlineMedium
                              ?.copyWith(
                                color: colors.textPrimary,
                                fontSize: 42,
                                fontFeatures: const [
                                  FontFeature.tabularFigures(),
                                ],
                              ),
                        ),
                        const SizedBox(width: 6),
                        Padding(
                          padding: const EdgeInsets.only(bottom: 4),
                          child: Text(
                            'kCal',
                            style: Theme.of(context).textTheme.bodySmall
                                ?.copyWith(color: colors.textSecondary),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 7),
                    Text(
                      '${mealType.label} - $itemCount ${itemCount == 1 ? 'item' : 'items'}',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: colors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: LogMyPlateSpacing.cardPadding),
          Row(
            children: [
              MacroTextChip(
                label: 'Protein',
                value: totals.proteinG,
                color: LogMyPlateColors.macroProtein,
              ),
              const SizedBox(width: 8),
              MacroTextChip(
                label: 'Carbs',
                value: totals.carbsG,
                color: LogMyPlateColors.macroCarbs,
              ),
              const SizedBox(width: 8),
              MacroTextChip(
                label: 'Fat',
                value: totals.fatG,
                color: LogMyPlateColors.macroFat,
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _ReviewMealEntry {
  const _ReviewMealEntry({
    required this.item,
    required this.lockedFromAnalysis,
  });

  final MealItem item;
  final bool lockedFromAnalysis;

  _ReviewMealEntry copyWith({MealItem? item, bool? lockedFromAnalysis}) {
    return _ReviewMealEntry(
      item: item ?? this.item,
      lockedFromAnalysis: lockedFromAnalysis ?? this.lockedFromAnalysis,
    );
  }
}

const _emptyCustomMealItem = MealItem(
  name: '',
  quantity: 1,
  unit: 'serving',
  grams: 100,
  nutrition: MacroTotals(calories: 0, proteinG: 0, carbsG: 0, fatG: 0),
);

class _MealTypePill extends StatelessWidget {
  const _MealTypePill({required this.type, required this.onTap});

  final MealType type;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GlassWrapper(
      child: TextButton(
        onPressed: onTap,
        child: Text(
          type.label,
          style: Theme.of(context).textTheme.labelSmall?.copyWith(
            color: _reviewPrimaryText(context),
            letterSpacing: 1.6,
          ),
        ),
      ),
    );
  }
}

class _ReviewItemRow extends StatelessWidget {
  const _ReviewItemRow({
    required this.rowKey,
    required this.item,
    required this.onEdit,
    required this.onDelete,
  });

  final Key rowKey;
  final MealItem item;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    final lowConfidence = item.confidence < 0.7;
    final borderColor = _reviewBorder(context);
    final colors = context.logmyplate;

    return Dismissible(
      key: rowKey,
      direction: DismissDirection.endToStart,
      onDismissed: (_) => onDelete(),
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 18),
        color: LogMyPlateColors.destructive.withValues(alpha: 0.14),
        child: Text(
          'Delete',
          style: Theme.of(
            context,
          ).textTheme.bodySmall?.copyWith(color: LogMyPlateColors.destructive),
        ),
      ),
      child: InkWell(
        onTap: onEdit,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 13, horizontal: 4),
          decoration: BoxDecoration(
            color: lowConfidence
                ? LogMyPlateColors.accent.withValues(alpha: 0.08)
                : null,
            border: Border(bottom: BorderSide(color: borderColor, width: 0.5)),
          ),
          child: Row(
            children: [
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  color: colors.mutedFill,
                  border: Border.all(color: borderColor, width: 0.5),
                  borderRadius: BorderRadius.circular(
                    LogMyPlateSpacing.elementBorderRadius,
                  ),
                ),
                child: Icon(
                  Icons.edit_rounded,
                  color: _reviewPrimaryText(context),
                  size: 18,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            item.name,
                            overflow: TextOverflow.ellipsis,
                            style: Theme.of(context).textTheme.titleMedium,
                          ),
                        ),
                        if (lowConfidence) ...[
                          const SizedBox(width: 6),
                          Container(
                            width: 6,
                            height: 6,
                            decoration: const BoxDecoration(
                              color: LogMyPlateColors.accentLow,
                              shape: BoxShape.circle,
                            ),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 5),
                    _UnitChip(text: '${item.grams}g'),
                  ],
                ),
              ),
              const SizedBox(width: 10),
              Flexible(
                flex: 0,
                child: Text(
                  '${item.nutrition.calories} kCal',
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: _reviewPrimaryText(context),
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _UnitChip extends StatelessWidget {
  const _UnitChip({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: _reviewMutedFill(context),
        borderRadius: BorderRadius.circular(7),
        border: Border.all(color: _reviewBorder(context), width: 0.5),
      ),
      child: Text(
        text,
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
          color: _reviewSecondaryText(context),
          letterSpacing: 0,
        ),
      ),
    );
  }
}

class _OrDivider extends StatelessWidget {
  const _OrDivider();

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;
    return Padding(
      padding: const EdgeInsets.symmetric(
        vertical: LogMyPlateSpacing.lgSpacing,
      ),
      child: Row(
        children: [
          Expanded(
            child: Divider(color: colors.border, thickness: 0.5, height: 1),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14),
            child: Text(
              'or',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: colors.textSecondary,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          Expanded(
            child: Divider(color: colors.border, thickness: 0.5, height: 1),
          ),
        ],
      ),
    );
  }
}

Color _reviewPrimaryText(BuildContext context) {
  return context.logmyplate.textPrimary;
}

Color _reviewSecondaryText(BuildContext context) {
  return context.logmyplate.textSecondary;
}

Color _reviewBorder(BuildContext context) {
  return context.logmyplate.border;
}

Color _reviewMutedFill(BuildContext context) {
  return context.logmyplate.mutedFill;
}

Color _reviewAccentText(BuildContext context) {
  return context.logmyplate.accentText;
}
