import 'package:flutter/material.dart';

import '../models/meal.dart';
import '../theme/dfit_colors.dart';
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
                  icon: const BackMark(color: DFitColors.textPrimaryLight),
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
                color: DFitColors.textSecondaryLight,
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
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: DFitColors.textSecondaryLight,
              ),
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
            const Divider(height: 1, color: DFitColors.borderLight),
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
                foregroundColor: DFitColors.textPrimaryLight,
                side: const BorderSide(color: DFitColors.borderLight),
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
                style: Theme.of(
                  context,
                ).textTheme.bodySmall?.copyWith(color: DFitColors.accentWarm),
              ),
              const SizedBox(height: 10),
            ],
            FilledButton(
              onPressed: _items.isEmpty || _saving ? null : _confirm,
              style: FilledButton.styleFrom(
                backgroundColor: DFitColors.textPrimaryLight,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 160),
                child: _saving
                    ? const SizedBox(
                        key: ValueKey('saving'),
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
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
    return SafeArea(
      child: Container(
        margin: const EdgeInsets.all(12),
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 10),
        decoration: BoxDecoration(
          color: Theme.of(context).brightness == Brightness.dark
              ? DFitColors.surfaceCardDark
              : DFitColors.surfaceCard,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(
            color: Theme.of(context).brightness == Brightness.dark
                ? Colors.white.withValues(alpha: 0.08)
                : DFitColors.borderLight,
          ),
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
                    color: DFitColors.textSecondaryLight,
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
          color: DFitColors.textPrimaryLight,
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
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 3),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: dark ? DFitColors.textPrimaryLight : DFitColors.accent,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Text(
        '$label ${value}g',
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
          color: dark ? Colors.white : DFitColors.accentDeep,
          letterSpacing: 0,
        ),
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

    return Dismissible(
      key: rowKey,
      direction: DismissDirection.endToStart,
      onDismissed: (_) => onDelete(),
      background: Container(
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 18),
        color: DFitColors.accentLow.withValues(alpha: 0.18),
        child: Text(
          'Delete',
          style: Theme.of(
            context,
          ).textTheme.bodySmall?.copyWith(color: DFitColors.accentWarm),
        ),
      ),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 13, horizontal: 4),
        decoration: BoxDecoration(
          color: lowConfidence
              ? DFitColors.accent.withValues(alpha: 0.08)
              : null,
          border: const Border(
            bottom: BorderSide(color: DFitColors.borderLight, width: 0.5),
          ),
        ),
        child: Row(
          children: [
            Container(
              height: 32,
              decoration: BoxDecoration(
                color: Colors.white,
                border: Border.all(color: DFitColors.borderLight, width: 0.5),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Row(
                children: [
                  _StepperButton(label: '-', onTap: onDecrement),
                  Text(
                    _formatQuantity(item.quantity),
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
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
              style: Theme.of(
                context,
              ).textTheme.bodySmall?.copyWith(fontWeight: FontWeight.w500),
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
      child: SizedBox(width: 30, height: 32, child: Center(child: Text(label))),
    );
  }
}

class _UnitChip extends StatelessWidget {
  const _UnitChip({required this.text, this.highlighted = false});

  final String text;
  final bool highlighted;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: highlighted
            ? DFitColors.accent.withValues(alpha: 0.15)
            : DFitColors.textPrimaryLight.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(7),
        border: Border.all(
          color: highlighted
              ? DFitColors.accent.withValues(alpha: 0.4)
              : DFitColors.borderLight,
          width: 0.5,
        ),
      ),
      child: Text(
        text,
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
          color: highlighted
              ? DFitColors.accentWarm
              : DFitColors.textPrimaryLight,
          letterSpacing: 0,
        ),
      ),
    );
  }
}
