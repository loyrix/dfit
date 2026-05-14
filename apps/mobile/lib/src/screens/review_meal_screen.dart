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
                onEdit: () => _openEditItemSheet(index),
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

  Future<void> _openEditItemSheet(int index) async {
    final result = await showModalBottomSheet<_EditItemResult>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _EditItemSheet(item: _items[index]),
    );
    if (result == null || !mounted) return;

    if (result.delete) {
      setState(() => _items.removeAt(index));
      return;
    }

    final item = result.item;
    if (item == null) return;
    setState(() => _items[index] = item);
  }

  Future<void> _openAddItemSheet() async {
    final choice = await showModalBottomSheet<_AddItemChoice>(
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
    if (choice == null || !mounted) return;

    final selected = choice.item;
    final existingIndex = _items.indexWhere(
      (item) => item.name == selected.name,
    );
    late final int nextIndex;
    if (existingIndex == -1) {
      setState(() => _items.add(selected));
      nextIndex = _items.length - 1;
    } else {
      _changeQuantity(existingIndex, 1);
      nextIndex = existingIndex;
    }

    if (choice.editImmediately) {
      await _openEditItemSheet(nextIndex);
    }
  }
}

class _AddItemChoice {
  const _AddItemChoice(this.item, {this.editImmediately = false});

  final MealItem item;
  final bool editImmediately;
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
                  trailing: Text('${item.nutrition.calories}'),
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
    required this.onEdit,
    required this.onIncrement,
    required this.onDecrement,
    required this.onDelete,
  });

  final Key rowKey;
  final MealItem item;
  final VoidCallback onEdit;
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
      child: InkWell(
        onTap: onEdit,
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
      ),
    );
  }

  String _formatQuantity(double value) {
    return value % 1 == 0 ? value.toStringAsFixed(0) : value.toStringAsFixed(1);
  }
}

class _EditItemResult {
  const _EditItemResult.update(this.item) : delete = false;
  const _EditItemResult.delete() : item = null, delete = true;

  final MealItem? item;
  final bool delete;
}

class _EditItemSheet extends StatefulWidget {
  const _EditItemSheet({required this.item});

  final MealItem item;

  @override
  State<_EditItemSheet> createState() => _EditItemSheetState();
}

class _EditItemSheetState extends State<_EditItemSheet> {
  late final TextEditingController _nameController = TextEditingController(
    text: widget.item.name,
  );
  late final TextEditingController _quantityController = TextEditingController(
    text: _formatInputNumber(widget.item.quantity),
  );
  late final TextEditingController _gramsController = TextEditingController(
    text: widget.item.grams.toString(),
  );
  late final TextEditingController _caloriesController = TextEditingController(
    text: widget.item.nutrition.calories.toString(),
  );
  late final TextEditingController _proteinController = TextEditingController(
    text: _formatInputNumber(widget.item.nutrition.proteinG),
  );
  late final TextEditingController _carbsController = TextEditingController(
    text: _formatInputNumber(widget.item.nutrition.carbsG),
  );
  late final TextEditingController _fatController = TextEditingController(
    text: _formatInputNumber(widget.item.nutrition.fatG),
  );
  late String _unit = _portionUnits.contains(widget.item.unit)
      ? widget.item.unit
      : 'serving';
  String? _validation;

  @override
  void dispose() {
    _nameController.dispose();
    _quantityController.dispose();
    _gramsController.dispose();
    _caloriesController.dispose();
    _proteinController.dispose();
    _carbsController.dispose();
    _fatController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.dfit;
    final bottomInset = MediaQuery.viewInsetsOf(context).bottom;

    return SafeArea(
      child: Padding(
        padding: EdgeInsets.fromLTRB(12, 12, 12, 12 + bottomInset),
        child: Container(
          constraints: const BoxConstraints(maxHeight: 680),
          decoration: BoxDecoration(
            color: colors.surfaceCard,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: colors.border),
          ),
          child: ListView(
            shrinkWrap: true,
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 14),
            children: [
              Row(
                children: [
                  Text(
                    'Edit item',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const Spacer(),
                  IconButton(
                    tooltip: 'Delete',
                    onPressed: () => Navigator.of(
                      context,
                    ).pop(const _EditItemResult.delete()),
                    icon: Icon(
                      Icons.delete_outline_rounded,
                      color: colors.textSecondary,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              _EditTextField(
                key: const ValueKey('edit-item-name'),
                label: 'Food',
                controller: _nameController,
                textInputAction: TextInputAction.next,
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: _EditTextField(
                      key: const ValueKey('edit-item-quantity'),
                      label: 'Qty',
                      controller: _quantityController,
                      keyboardType: const TextInputType.numberWithOptions(
                        decimal: true,
                      ),
                      textInputAction: TextInputAction.next,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: DropdownButtonFormField<String>(
                      initialValue: _unit,
                      items: [
                        for (final unit in _portionUnits)
                          DropdownMenuItem(value: unit, child: Text(unit)),
                      ],
                      onChanged: (value) {
                        if (value == null) return;
                        setState(() => _unit = value);
                      },
                      decoration: _fieldDecoration(context, 'Unit'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: _EditTextField(
                      key: const ValueKey('edit-item-grams'),
                      label: 'Grams',
                      controller: _gramsController,
                      keyboardType: TextInputType.number,
                      textInputAction: TextInputAction.next,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _EditTextField(
                      key: const ValueKey('edit-item-calories'),
                      label: 'Kcal',
                      controller: _caloriesController,
                      keyboardType: TextInputType.number,
                      textInputAction: TextInputAction.next,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: _EditTextField(
                      key: const ValueKey('edit-item-protein'),
                      label: 'Protein',
                      controller: _proteinController,
                      keyboardType: const TextInputType.numberWithOptions(
                        decimal: true,
                      ),
                      textInputAction: TextInputAction.next,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _EditTextField(
                      key: const ValueKey('edit-item-carbs'),
                      label: 'Carbs',
                      controller: _carbsController,
                      keyboardType: const TextInputType.numberWithOptions(
                        decimal: true,
                      ),
                      textInputAction: TextInputAction.next,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _EditTextField(
                      key: const ValueKey('edit-item-fat'),
                      label: 'Fat',
                      controller: _fatController,
                      keyboardType: const TextInputType.numberWithOptions(
                        decimal: true,
                      ),
                      textInputAction: TextInputAction.done,
                    ),
                  ),
                ],
              ),
              if (_validation != null) ...[
                const SizedBox(height: 10),
                Text(
                  _validation!,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: _reviewAccentText(context),
                  ),
                ),
              ],
              const SizedBox(height: 16),
              FilledButton(
                onPressed: _save,
                style: FilledButton.styleFrom(
                  backgroundColor: colors.primaryAction,
                  foregroundColor: colors.primaryActionText,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
                child: const Text('Save changes'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _save() {
    final name = _nameController.text.trim();
    final quantity = _parsePositiveDouble(_quantityController.text);
    final grams = _parsePositiveInt(_gramsController.text);
    final calories = _parseNonNegativeInt(_caloriesController.text);
    final protein = _parseNonNegativeDouble(_proteinController.text);
    final carbs = _parseNonNegativeDouble(_carbsController.text);
    final fat = _parseNonNegativeDouble(_fatController.text);

    if (name.isEmpty ||
        quantity == null ||
        grams == null ||
        calories == null ||
        protein == null ||
        carbs == null ||
        fat == null) {
      setState(() {
        _validation = 'Check the name and numbers before saving.';
      });
      return;
    }

    Navigator.of(context).pop(
      _EditItemResult.update(
        widget.item.copyWith(
          name: name,
          quantity: quantity,
          unit: _unit,
          grams: grams,
          nutrition: MacroTotals(
            calories: calories,
            proteinG: protein,
            carbsG: carbs,
            fatG: fat,
          ),
          confidence: 1,
        ),
      ),
    );
  }
}

class _EditTextField extends StatelessWidget {
  const _EditTextField({
    super.key,
    required this.label,
    required this.controller,
    this.keyboardType,
    this.textInputAction,
  });

  final String label;
  final TextEditingController controller;
  final TextInputType? keyboardType;
  final TextInputAction? textInputAction;

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      keyboardType: keyboardType,
      textInputAction: textInputAction,
      decoration: _fieldDecoration(context, label),
      style: Theme.of(context).textTheme.bodyMedium?.copyWith(letterSpacing: 0),
    );
  }
}

InputDecoration _fieldDecoration(BuildContext context, String label) {
  final colors = context.dfit;

  return InputDecoration(
    labelText: label,
    labelStyle: Theme.of(context).textTheme.labelSmall?.copyWith(
      color: colors.textSecondary,
      letterSpacing: 0.4,
    ),
    filled: true,
    fillColor: colors.mutedFill,
    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 11),
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: BorderSide(color: colors.border),
    ),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: BorderSide(color: colors.border),
    ),
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: BorderSide(color: colors.accent),
    ),
  );
}

const _portionUnits = [
  'gram',
  'ml',
  'piece',
  'serving',
  'bowl',
  'katori',
  'cup',
  'tablespoon',
  'teaspoon',
  'ladle',
  'roti',
  'idli',
  'dosa',
  'slice',
  'scoop',
  'small',
  'medium',
  'large',
];

String _formatInputNumber(double value) {
  return value % 1 == 0 ? value.toStringAsFixed(0) : value.toStringAsFixed(1);
}

double? _parsePositiveDouble(String value) {
  final parsed = double.tryParse(value.trim());
  if (parsed == null || parsed <= 0) return null;
  return parsed;
}

double? _parseNonNegativeDouble(String value) {
  final parsed = double.tryParse(value.trim());
  if (parsed == null || parsed < 0) return null;
  return parsed;
}

int? _parsePositiveInt(String value) {
  final parsed = num.tryParse(value.trim());
  if (parsed == null || parsed <= 0) return null;
  return parsed.round();
}

int? _parseNonNegativeInt(String value) {
  final parsed = num.tryParse(value.trim());
  if (parsed == null || parsed < 0) return null;
  return parsed.round();
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
