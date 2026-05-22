import 'package:flutter/material.dart';

import '../models/meal.dart';
import '../theme/logmyplate_colors.dart';
import '../theme/logmyplate_theme.dart';

class MealItemEditResult {
  const MealItemEditResult.update(this.item) : delete = false;
  const MealItemEditResult.delete() : item = null, delete = true;

  final MealItem? item;
  final bool delete;
}

class MealItemEditorSheet extends StatefulWidget {
  const MealItemEditorSheet({
    super.key,
    required this.item,
    required this.lockedFromAnalysis,
    this.allowDelete = true,
  });

  final MealItem item;
  final bool lockedFromAnalysis;
  final bool allowDelete;

  @override
  State<MealItemEditorSheet> createState() => _MealItemEditorSheetState();
}

class _MealItemEditorSheetState extends State<MealItemEditorSheet> {
  late MealItem _workingItem = widget.item;
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
  bool _syncingDerivedFields = false;

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
    final colors = context.logmyplate;
    final bottomInset = MediaQuery.viewInsetsOf(context).bottom;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final locked = widget.lockedFromAnalysis;

    return SafeArea(
      child: Padding(
        padding: EdgeInsets.fromLTRB(12, 12, 12, 12 + bottomInset),
        child: Container(
          constraints: const BoxConstraints(maxHeight: 680),
          decoration: BoxDecoration(
            color: isDark
                ? const Color(0xFF17201B)
                : colors.surfaceCard.withValues(alpha: 0.98),
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: colors.border, width: 0.6),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(
                  alpha: Theme.of(context).brightness == Brightness.dark
                      ? 0.30
                      : 0.10,
                ),
                blurRadius: 30,
                offset: const Offset(0, 18),
              ),
            ],
          ),
          child: ListView(
            shrinkWrap: true,
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 14),
            children: [
              Center(
                child: Container(
                  width: 38,
                  height: 4,
                  decoration: BoxDecoration(
                    color: colors.border,
                    borderRadius: BorderRadius.circular(99),
                  ),
                ),
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  Text(
                    'Edit item',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const Spacer(),
                  if (widget.allowDelete)
                    IconButton(
                      tooltip: 'Delete',
                      onPressed: () => Navigator.of(
                        context,
                      ).pop(const MealItemEditResult.delete()),
                      icon: Icon(
                        Icons.delete_outline_rounded,
                        color: LogMyPlateColors.destructive,
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 10),
              if (locked) ...[
                _ReadonlyIdentityCard(name: _workingItem.name),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: _EditTextField(
                        key: const ValueKey('edit-item-quantity'),
                        label: 'Portions',
                        controller: _quantityController,
                        keyboardType: const TextInputType.numberWithOptions(
                          decimal: true,
                        ),
                        textInputAction: TextInputAction.next,
                        onChanged: _updateLockedFromQuantity,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: _EditTextField(
                        key: const ValueKey('edit-item-grams'),
                        label: 'Grams',
                        controller: _gramsController,
                        keyboardType: TextInputType.number,
                        textInputAction: TextInputAction.done,
                        onChanged: _updateLockedFromGrams,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                _CalculatedNutritionGrid(totals: _workingItem.nutrition),
              ] else ...[
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
                        label: 'kCal',
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
              ],
              if (_validation != null) ...[
                const SizedBox(height: 10),
                Text(
                  _validation!,
                  style: Theme.of(
                    context,
                  ).textTheme.bodySmall?.copyWith(color: colors.accentText),
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

    if (widget.lockedFromAnalysis) {
      Navigator.of(context).pop(MealItemEditResult.update(_workingItem));
      return;
    }

    Navigator.of(context).pop(
      MealItemEditResult.update(
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

  void _updateLockedFromQuantity(String value) {
    if (_syncingDerivedFields) return;
    final quantity = _parsePositiveDouble(value);
    if (quantity == null) return;
    setState(() {
      _workingItem = widget.item.scaledToQuantity(quantity);
      _syncDerivedFields(updateQuantity: false);
    });
  }

  void _updateLockedFromGrams(String value) {
    if (_syncingDerivedFields) return;
    final grams = _parsePositiveInt(value);
    if (grams == null) return;
    setState(() {
      _workingItem = widget.item.scaledToGrams(grams);
      _syncDerivedFields(updateGrams: false);
    });
  }

  void _syncDerivedFields({
    bool updateQuantity = true,
    bool updateGrams = true,
  }) {
    _syncingDerivedFields = true;
    if (updateQuantity) {
      _quantityController.text = _formatInputNumber(_workingItem.quantity);
    }
    if (updateGrams) {
      _gramsController.text = _workingItem.grams.toString();
    }
    _caloriesController.text = _workingItem.nutrition.calories.toString();
    _proteinController.text = _formatInputNumber(
      _workingItem.nutrition.proteinG,
    );
    _carbsController.text = _formatInputNumber(_workingItem.nutrition.carbsG);
    _fatController.text = _formatInputNumber(_workingItem.nutrition.fatG);
    _syncingDerivedFields = false;
  }
}

class _ReadonlyIdentityCard extends StatelessWidget {
  const _ReadonlyIdentityCard({required this.name});

  final String name;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      key: const ValueKey('edit-item-name-readonly'),
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
      decoration: BoxDecoration(
        color: isDark
            ? Colors.white.withValues(alpha: 0.045)
            : colors.textPrimary.withValues(alpha: 0.035),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: colors.border.withValues(alpha: 0.72)),
      ),
      child: Row(
        children: [
          Icon(
            Icons.lock_outline_rounded,
            size: 17,
            color: colors.textTertiary,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Food',
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: colors.textTertiary,
                    letterSpacing: 0.4,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: colors.textSecondary,
                    letterSpacing: 0,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _CalculatedNutritionGrid extends StatelessWidget {
  const _CalculatedNutritionGrid({required this.totals});

  final MacroTotals totals;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: _CalculatedNutritionTile(
                label: 'kCal',
                value: totals.calories.toString(),
                color: LogMyPlateColors.accent,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _CalculatedNutritionTile(
                label: 'Protein',
                value: _formatInputNumber(totals.proteinG),
                color: LogMyPlateColors.macroProtein,
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(
              child: _CalculatedNutritionTile(
                label: 'Carbs',
                value: _formatInputNumber(totals.carbsG),
                color: LogMyPlateColors.macroCarbs,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _CalculatedNutritionTile(
                label: 'Fat',
                value: _formatInputNumber(totals.fatG),
                color: LogMyPlateColors.macroFat,
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _CalculatedNutritionTile extends StatelessWidget {
  const _CalculatedNutritionTile({
    required this.label,
    required this.value,
    required this.color,
  });

  final String label;
  final String value;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 12),
      decoration: BoxDecoration(
        color: color.withValues(alpha: isDark ? 0.12 : 0.10),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: color.withValues(alpha: isDark ? 0.22 : 0.18),
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(color: color, shape: BoxShape.circle),
          ),
          const SizedBox(width: 9),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: colors.textSecondary,
                    letterSpacing: 0,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  value,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: colors.textPrimary,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 0,
                  ),
                ),
              ],
            ),
          ),
        ],
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
    this.onChanged,
  });

  final String label;
  final TextEditingController controller;
  final TextInputType? keyboardType;
  final TextInputAction? textInputAction;
  final ValueChanged<String>? onChanged;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;
    return TextField(
      controller: controller,
      keyboardType: keyboardType,
      textInputAction: textInputAction,
      onChanged: onChanged,
      decoration: _fieldDecoration(context, label),
      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
        color: colors.textPrimary,
        letterSpacing: 0,
      ),
    );
  }
}

InputDecoration _fieldDecoration(BuildContext context, String label) {
  final colors = context.logmyplate;
  final isDark = Theme.of(context).brightness == Brightness.dark;
  final enabledFill = isDark
      ? Colors.white.withValues(alpha: 0.035)
      : colors.surfaceCard;
  final enabledBorder = colors.border.withValues(alpha: 0.86);

  return InputDecoration(
    labelText: label,
    labelStyle: Theme.of(context).textTheme.labelSmall?.copyWith(
      color: colors.textSecondary,
      letterSpacing: 0.4,
    ),
    filled: true,
    fillColor: enabledFill,
    contentPadding: const EdgeInsets.symmetric(horizontal: 13, vertical: 12),
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: BorderSide(color: enabledBorder),
    ),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: BorderSide(color: enabledBorder),
    ),
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: BorderSide(color: colors.accent),
    ),
    disabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: BorderSide(color: colors.border.withValues(alpha: 0.48)),
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
