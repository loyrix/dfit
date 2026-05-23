import 'package:flutter/material.dart';

import '../models/captured_meal_photo.dart';
import '../models/meal.dart';
import '../theme/logmyplate_colors.dart';
import '../theme/logmyplate_theme.dart';
import '../widgets/logmyplate_background.dart';
import '../widgets/meal_item_editor_sheet.dart';
import '../widgets/primitive_icons.dart';

class ReviewMealScreen extends StatefulWidget {
  const ReviewMealScreen({
    super.key,
    required this.initialItems,
    required this.onConfirm,
    this.initialMealType = MealType.lunch,
    this.lockInitialItems = false,
    this.photo,
  });

  final List<MealItem> initialItems;
  final MealType initialMealType;
  final bool lockInitialItems;
  final CapturedMealPhoto? photo;
  final Future<void> Function(MealType type, List<MealItem> items) onConfirm;

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
      backgroundColor: colors.background,
      body: LogMyPlateAmbientBackground(
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
              const SizedBox(height: 12),
              _ReviewSummaryCard(
                photo: widget.photo,
                mealType: _mealType,
                totals: totals,
                itemCount: _items.length,
              ),
              const SizedBox(height: 18),
              Text(
                'Items to confirm',
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: secondaryText,
                  letterSpacing: 1.2,
                ),
              ),
              const SizedBox(height: 10),
              Container(
                decoration: BoxDecoration(
                  color: colors.surfaceCard,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: borderColor, width: 0.5),
                ),
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
              const SizedBox(height: 16),
              OutlinedButton(
                onPressed: _openAddItemSheet,
                style: OutlinedButton.styleFrom(
                  foregroundColor: primaryText,
                  side: BorderSide(color: borderColor),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
                child: const Text('Add item'),
              ),
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
              FilledButton(
                onPressed: _items.isEmpty
                    ? null
                    : _saving
                    ? () {}
                    : _confirm,
                style: FilledButton.styleFrom(
                  backgroundColor: colors.primaryAction,
                  foregroundColor: colors.primaryActionText,
                  disabledBackgroundColor: _reviewMutedFill(context),
                  disabledForegroundColor: secondaryText,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
                child: AnimatedSwitcher(
                  duration: const Duration(milliseconds: 160),
                  child: _saving
                      ? SizedBox(
                          key: ValueKey('saving'),
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: colors.primaryActionText,
                          ),
                        )
                      : const Text('Confirm meal', key: ValueKey('confirm')),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _confirm() async {
    setState(() {
      _saving = true;
      _error = null;
    });

    try {
      await widget.onConfirm(_mealType, _items);
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

  void _changeQuantity(int index, int delta) {
    final entry = _entries[index];
    final item = entry.item;
    final next = (item.quantity + delta).clamp(0.5, 12.0);
    setState(() {
      _entries[index] = entry.copyWith(item: item.scaledToQuantity(next));
    });
  }

  Future<void> _openEditItemSheet(int index) async {
    final result = await showModalBottomSheet<MealItemEditResult>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => MealItemEditorSheet(
        item: _entries[index].item,
        lockedFromAnalysis: _entries[index].lockedFromAnalysis,
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

  Future<void> _openAddItemSheet() async {
    final choice = await showModalBottomSheet<_AddItemChoice>(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (_) => _AddItemSheet(
        items: sampleDetectedItems()
            .where(
              (item) =>
                  !_entries.any((current) => current.item.name == item.name),
            )
            .toList(),
      ),
    );
    if (choice == null || !mounted) return;

    if (choice.editImmediately) {
      final item = await _openNewItemSheet(choice.item);
      if (item == null || !mounted) return;
      setState(
        () => _entries.add(
          _ReviewMealEntry(item: item, lockedFromAnalysis: false),
        ),
      );
      return;
    }

    final selected = choice.item;
    final existingIndex = _entries.indexWhere(
      (entry) => entry.item.name == selected.name,
    );
    if (existingIndex == -1) {
      setState(
        () => _entries.add(
          _ReviewMealEntry(item: selected, lockedFromAnalysis: false),
        ),
      );
    } else {
      _changeQuantity(existingIndex, 1);
    }
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
                  borderRadius: BorderRadius.circular(16),
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
          const SizedBox(height: 14),
          Row(
            children: [
              _MacroChip(
                label: 'Protein',
                value: totals.proteinG.round(),
                color: LogMyPlateColors.macroProtein,
              ),
              const SizedBox(width: 8),
              _MacroChip(
                label: 'Carbs',
                value: totals.carbsG.round(),
                color: LogMyPlateColors.macroCarbs,
              ),
              const SizedBox(width: 8),
              _MacroChip(
                label: 'Fat',
                value: totals.fatG.round(),
                color: LogMyPlateColors.macroFat,
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _AddItemChoice {
  const _AddItemChoice(this.item, {this.editImmediately = false});

  final MealItem item;
  final bool editImmediately;
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

class _AddItemSheet extends StatelessWidget {
  const _AddItemSheet({required this.items});

  final List<MealItem> items;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;

    return SafeArea(
      child: Container(
        margin: const EdgeInsets.all(12),
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 10),
        decoration: BoxDecoration(
          color: colors.surfaceCard,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: colors.border),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Add item', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            OutlinedButton(
              onPressed: () => Navigator.of(context).pop(
                const _AddItemChoice(
                  MealItem(
                    name: 'Custom item',
                    quantity: 1,
                    unit: 'serving',
                    grams: 100,
                    nutrition: MacroTotals(
                      calories: 100,
                      proteinG: 0,
                      carbsG: 0,
                      fatG: 0,
                    ),
                  ),
                  editImmediately: true,
                ),
              ),
              style: OutlinedButton.styleFrom(
                foregroundColor: colors.textPrimary,
                side: BorderSide(color: colors.border),
                minimumSize: const Size.fromHeight(44),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: const Text('Custom item'),
            ),
            const SizedBox(height: 8),
            if (items.isEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 18),
                child: Text(
                  'All quick items are already included.',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: _reviewSecondaryText(context),
                  ),
                ),
              )
            else
              for (final item in items)
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  dense: true,
                  title: Text(item.name),
                  subtitle: Text(
                    '${item.quantity.toStringAsFixed(item.quantity % 1 == 0 ? 0 : 1)} ${item.unit} - ${item.grams}g',
                  ),
                  trailing: Text('${item.nutrition.calories} kCal'),
                  onTap: () => Navigator.of(context).pop(_AddItemChoice(item)),
                ),
          ],
        ),
      ),
    );
  }
}

class _MealTypePill extends StatelessWidget {
  const _MealTypePill({required this.type, required this.onTap});

  final MealType type;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return TextButton(
      onPressed: onTap,
      child: Text(
        type.label,
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
          color: _reviewPrimaryText(context),
          letterSpacing: 1.6,
        ),
      ),
    );
  }
}

class _MacroChip extends StatelessWidget {
  const _MacroChip({
    required this.label,
    required this.value,
    required this.color,
  });

  final String label;
  final int value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;

    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 8),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(13),
          border: Border.all(color: color.withValues(alpha: 0.20), width: 0.5),
        ),
        child: Text(
          '$label ${value}g',
          textAlign: TextAlign.center,
          overflow: TextOverflow.ellipsis,
          style: Theme.of(context).textTheme.labelSmall?.copyWith(
            color: colors.textPrimary,
            letterSpacing: 0,
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
                  borderRadius: BorderRadius.circular(14),
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
