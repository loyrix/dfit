import 'package:flutter/material.dart';
import '../theme/logmyplate_spacing.dart';

import '../models/captured_meal_photo.dart';
import '../models/meal.dart';
import '../theme/logmyplate_colors.dart';
import '../theme/logmyplate_theme.dart';
import '../widgets/glass/glass_backdrop.dart';
import '../widgets/glass/glass_cards.dart';
import '../widgets/meal_item_editor_sheet.dart';
import '../widgets/macro_chips.dart';
import '../widgets/primitive_icons.dart';
import 'package:logmyplate_mobile/src/widgets/glass/glass_wrapper.dart';

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
  });

  final List<MealItem> initialItems;
  final MealType initialMealType;
  final bool lockInitialItems;
  final CapturedMealPhoto? photo;
  final Future<List<FoodSearchResult>> Function(String query)? onFoodSearch;
  final Future<void> Function(MealType type, List<MealItem> items, {bool analyzeWithAI}) onConfirm;
  final bool isPremium;

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
    final colors = context.logmyplate;

    return Scaffold(
      extendBodyBehindAppBar: true,
      backgroundColor: Colors.transparent,
      body: GlassBackdrop(
        photo: widget.photo,
        child: SafeArea(
          child: ListView(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
            children: [
              Row(
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
              const SizedBox(height: LogMyPlateSpacing.itemSpacing),
              _ReviewSummaryCard(
                photo: widget.photo,
                mealType: _mealType,
                totals: totals,
                itemCount: _items.length,
              ),
              const SizedBox(height: LogMyPlateSpacing.sectionSpacing),
              Text(
                'Items to confirm',
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: secondaryText,
                  letterSpacing: 1.2,
                ),
              ),
              const SizedBox(height: 10),
              LiteGlassCard(
                borderRadius: BorderRadius.circular(LogMyPlateSpacing.heroCardBorderRadius),
                padding: EdgeInsets.zero,
                child: Column(
                  children: [
                    for (var index = 0; index < _entries.length; index++)
                      _ReviewItemRow(
                        rowKey: ValueKey('${_entries[index].item.name}-$index'),
                        item: _entries[index].item,
                        onEdit: () => _openEditItemSheet(index),
                        onDelete: () {
                          setState(() => _entries.removeAt(index));
                        },
                      ),
                  ],
                ),
              ),
              const SizedBox(height: LogMyPlateSpacing.sectionSpacing),
              GlassWrapper(child: OutlinedButton(
                onPressed: _openAddCustomItemSheet,
                style: OutlinedButton.styleFrom(
                  foregroundColor: primaryText,
                  side: BorderSide(color: borderColor),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(LogMyPlateSpacing.elementBorderRadius),
                  ),
                ),
                child: const Text('Add custom item'),
              )),
              const SizedBox(height: 10),
              if (_error != null) ...[
                Text(
                  _error!,
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: _reviewAccentText(context),
                  ),
                ),
                const SizedBox(height: 10),
              ],
              Row(
                children: [
                  Expanded(
                    child: GlassWrapper(child: OutlinedButton(
                      onPressed: _items.isEmpty
                          ? null
                          : _saving
                          ? () {}
                          : () => _confirm(analyzeWithAI: false),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: primaryText,
                        side: BorderSide(color: borderColor),
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(LogMyPlateSpacing.elementBorderRadius),
                        ),
                      ),
                      child: const Text('Confirm meal', key: ValueKey('confirm')),
                    )),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    flex: 2,
                    child: FilledButton(
                      onPressed: _items.isEmpty
                          ? null
                          : _saving
                          ? () {}
                          : () => _confirm(analyzeWithAI: true),
                      style: FilledButton.styleFrom(
                        backgroundColor: LogMyPlateColors.accent.withValues(alpha: 0.15),
                        foregroundColor: primaryText,
                        disabledBackgroundColor: _reviewMutedFill(context),
                        disabledForegroundColor: secondaryText,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(LogMyPlateSpacing.elementBorderRadius),
                          side: BorderSide(
                            color: LogMyPlateColors.accent.withValues(alpha: 0.3),
                          ),
                        ),
                      ),
                      child: AnimatedSwitcher(
                        duration: const Duration(milliseconds: 160),
                        child: _saving
                            ? SizedBox(
                                key: const ValueKey('saving'),
                                width: 18,
                                height: 18,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: LogMyPlateColors.accent,
                                ),
                              )
                            : Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                key: const ValueKey('confirm-analyze'),
                                children: [
                                  Icon(Icons.auto_awesome_rounded, size: 18, color: LogMyPlateColors.accent),
                                  const SizedBox(width: 6),
                                  const Text('Analyze with AI'),
                                  if (!widget.isPremium) ...[
                                    const SizedBox(width: 6),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: LogMyPlateColors.accent.withValues(alpha: 0.2),
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Icon(
                                            Icons.lock_rounded,
                                            size: 10,
                                            color: LogMyPlateColors.accent,
                                          ),
                                          const SizedBox(width: 2),
                                          Text(
                                            'PRO',
                                            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                                              color: LogMyPlateColors.accent,
                                              fontSize: 9,
                                              fontWeight: FontWeight.w700,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                      ),
                    ),
                  ),
                ],
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
                  borderRadius: BorderRadius.circular(LogMyPlateSpacing.cardBorderRadius),
                  child: Image.memory(
                    photo.bytes,
                    width: 74,
                    height: 74,
                    fit: BoxFit.cover,
                    gaplessPlayback: true,
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
    return GlassWrapper(child: TextButton(
      onPressed: onTap,
      child: Text(
        type.label,
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
          color: _reviewPrimaryText(context),
          letterSpacing: 1.6,
        ),
      ),
    ));
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
                  borderRadius: BorderRadius.circular(LogMyPlateSpacing.elementBorderRadius),
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
