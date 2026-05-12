import 'package:flutter/material.dart';

import '../models/meal.dart';
import '../theme/dfit_colors.dart';
import '../theme/dfit_theme.dart';
import '../widgets/primitive_icons.dart';

class ReviewMealScreen extends StatefulWidget {
  const ReviewMealScreen({
    super.key,
    required this.initialItems,
    required this.onConfirm,
    this.initialMealType = MealType.lunch,
  });

  final List<MealItem> initialItems;
  final MealType initialMealType;
  final Future<void> Function(MealType type, List<MealItem> items) onConfirm;

  @override
  State<ReviewMealScreen> createState() => _ReviewMealScreenState();
}

class _ReviewMealScreenState extends State<ReviewMealScreen> {
  late final List<MealItem> _items = List.of(widget.initialItems);
  late MealType _mealType = widget.initialMealType;
  bool _saving = false;
  String? _error;

  MacroTotals get _totals {
    return _items.fold<MacroTotals>(
      MacroTotals.zero,
      (total, item) => total + item.nutrition,
    );
  }

  @override
  Widget build(BuildContext context) {
    final totals = _totals;
    final primaryText = _reviewPrimaryText(context);
    final secondaryText = _reviewSecondaryText(context);
    final borderColor = _reviewBorder(context);
    final colors = context.dfit;

    return Scaffold(
      body: SafeArea(
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
            Text(
              'ESTIMATED',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                color: secondaryText,
                letterSpacing: 1.6,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              '${totals.calories}',
              textAlign: TextAlign.center,
              style: Theme.of(
                context,
              ).textTheme.displayLarge?.copyWith(fontSize: 48),
            ),
            Text(
              'kcal - ${_items.length} items',
              textAlign: TextAlign.center,
              style: Theme.of(
                context,
              ).textTheme.bodySmall?.copyWith(color: secondaryText),
            ),
            const SizedBox(height: 14),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                _MacroChip(
                  label: 'protein',
                  value: totals.proteinG.round(),
                  dark: true,
                ),
                _MacroChip(
                  label: 'carbs',
                  value: totals.carbsG.round(),
                  dark: true,
                ),
                _MacroChip(
                  label: 'fat',
                  value: totals.fatG.round(),
                  dark: false,
                ),
              ],
            ),
            const SizedBox(height: 20),
            Divider(height: 1, color: borderColor),
            for (var index = 0; index < _items.length; index++)
              _ReviewItemRow(
                rowKey: ValueKey('${_items[index].name}-$index'),
                item: _items[index],
                onIncrement: () => _changeQuantity(index, 1),
                onDecrement: () => _changeQuantity(index, -1),
                onDelete: () {
                  setState(() => _items.removeAt(index));
                },
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
    final item = _items[index];
    final next = (item.quantity + delta).clamp(0.5, 12.0);
    final scale = next / item.quantity;
    setState(() {
      _items[index] = item.copyWith(
        quantity: next,
        grams: (item.grams * scale).round(),
        nutrition: MacroTotals(
          calories: (item.nutrition.calories * scale).round(),
          proteinG: item.nutrition.proteinG * scale,
          carbsG: item.nutrition.carbsG * scale,
          fatG: item.nutrition.fatG * scale,
        ),
      );
    });
  }

  Future<void> _openAddItemSheet() async {
    final selected = await showModalBottomSheet<MealItem>(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (_) => _AddItemSheet(
        items: sampleDetectedItems()
            .where(
              (item) => !_items.any((current) => current.name == item.name),
            )
            .toList(),
      ),
    );
    if (selected == null || !mounted) return;

    final existingIndex = _items.indexWhere(
      (item) => item.name == selected.name,
    );
    if (existingIndex == -1) {
      setState(() => _items.add(selected));
    } else {
      _changeQuantity(existingIndex, 1);
    }
  }
}

class _AddItemSheet extends StatelessWidget {
  const _AddItemSheet({required this.items});

  final List<MealItem> items;

  @override
  Widget build(BuildContext context) {
    final colors = context.dfit;

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
                  trailing: Text('${item.nutrition.calories}'),
                  onTap: () => Navigator.of(context).pop(item),
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
    required this.dark,
  });

  final String label;
  final int value;
  final bool dark;

  @override
  Widget build(BuildContext context) {
    final colors = context.dfit;
    final background = dark ? colors.mutedFill : colors.accent;
    final foreground = dark ? colors.textPrimary : colors.accentOn;
    final borderColor = dark ? colors.border : Colors.transparent;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 3),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: borderColor, width: 0.5),
      ),
      child: Text(
        '$label ${value}g',
        style: Theme.of(
          context,
        ).textTheme.labelSmall?.copyWith(color: foreground, letterSpacing: 0),
      ),
    );
  }
}

class _ReviewItemRow extends StatelessWidget {
  const _ReviewItemRow({
    required this.rowKey,
    required this.item,
    required this.onIncrement,
    required this.onDecrement,
    required this.onDelete,
  });

  final Key rowKey;
  final MealItem item;
  final VoidCallback onIncrement;
  final VoidCallback onDecrement;
  final VoidCallback onDelete;

  @override
  Widget build(BuildContext context) {
    final lowConfidence = item.confidence < 0.7;
    final borderColor = _reviewBorder(context);
    final colors = context.dfit;

    return Dismissible(
      key: rowKey,
      direction: DismissDirection.endToStart,
      onDismissed: (_) => onDelete(),
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 18),
        color: DFitColors.accentLow.withValues(alpha: 0.2),
        child: Text(
          'Delete',
          style: Theme.of(
            context,
          ).textTheme.bodySmall?.copyWith(color: _reviewAccentText(context)),
        ),
      ),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 13, horizontal: 4),
        decoration: BoxDecoration(
          color: lowConfidence
              ? DFitColors.accent.withValues(alpha: 0.08)
              : null,
          border: Border(bottom: BorderSide(color: borderColor, width: 0.5)),
        ),
        child: Row(
          children: [
            Container(
              height: 32,
              decoration: BoxDecoration(
                color: colors.mutedFill,
                border: Border.all(color: borderColor, width: 0.5),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Row(
                children: [
                  _StepperButton(label: '-', onTap: onDecrement),
                  Text(
                    _formatQuantity(item.quantity),
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: _reviewPrimaryText(context),
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  _StepperButton(label: '+', onTap: onIncrement),
                ],
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
                            color: DFitColors.accentLow,
                            shape: BoxShape.circle,
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 5),
                  Row(
                    children: [
                      _UnitChip(text: item.unit, highlighted: true),
                      const SizedBox(width: 5),
                      _UnitChip(text: '~${item.grams}g'),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(width: 10),
            Text(
              '${item.nutrition.calories}',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: _reviewPrimaryText(context),
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatQuantity(double value) {
    return value % 1 == 0 ? value.toStringAsFixed(0) : value.toStringAsFixed(1);
  }
}

class _StepperButton extends StatelessWidget {
  const _StepperButton({required this.label, required this.onTap});

  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: SizedBox(
        width: 30,
        height: 32,
        child: Center(
          child: Text(
            label,
            style: TextStyle(color: _reviewPrimaryText(context)),
          ),
        ),
      ),
    );
  }
}

class _UnitChip extends StatelessWidget {
  const _UnitChip({required this.text, this.highlighted = false});

  final String text;
  final bool highlighted;

  @override
  Widget build(BuildContext context) {
    final colors = context.dfit;
    final fill = highlighted
        ? colors.accent.withValues(alpha: 0.16)
        : _reviewMutedFill(context);
    final border = highlighted
        ? colors.accent.withValues(alpha: 0.45)
        : _reviewBorder(context);
    final textColor = highlighted
        ? _reviewAccentText(context)
        : _reviewSecondaryText(context);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: fill,
        borderRadius: BorderRadius.circular(7),
        border: Border.all(color: border, width: 0.5),
      ),
      child: Text(
        text,
        style: Theme.of(
          context,
        ).textTheme.labelSmall?.copyWith(color: textColor, letterSpacing: 0),
      ),
    );
  }
}

Color _reviewPrimaryText(BuildContext context) {
  return context.dfit.textPrimary;
}

Color _reviewSecondaryText(BuildContext context) {
  return context.dfit.textSecondary;
}

Color _reviewBorder(BuildContext context) {
  return context.dfit.border;
}

Color _reviewMutedFill(BuildContext context) {
  return context.dfit.mutedFill;
}

Color _reviewAccentText(BuildContext context) {
  return context.dfit.accentText;
}
