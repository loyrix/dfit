import 'package:flutter/material.dart';

import '../models/meal.dart';
import '../theme/dfit_theme.dart';

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
                  if (widget.allowDelete)
                    IconButton(
                      tooltip: 'Delete',
                      onPressed: () => Navigator.of(
                        context,
                      ).pop(const MealItemEditResult.delete()),
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
                enabled: !widget.lockedFromAnalysis,
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: _EditTextField(
                      key: const ValueKey('edit-item-quantity'),
                      label: widget.lockedFromAnalysis ? 'Portions' : 'Qty',
                      controller: _quantityController,
                      keyboardType: const TextInputType.numberWithOptions(
                        decimal: true,
                      ),
                      textInputAction: TextInputAction.next,
                      onChanged: widget.lockedFromAnalysis
                          ? _updateLockedFromQuantity
                          : null,
                    ),
                  ),
                  if (!widget.lockedFromAnalysis) ...[
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
                      onChanged: widget.lockedFromAnalysis
                          ? _updateLockedFromGrams
                          : null,
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
                      enabled: !widget.lockedFromAnalysis,
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
                      enabled: !widget.lockedFromAnalysis,
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
                      enabled: !widget.lockedFromAnalysis,
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
                      enabled: !widget.lockedFromAnalysis,
                    ),
                  ),
                ],
              ),
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
    _workingItem = widget.item.scaledToQuantity(quantity);
    _syncDerivedFields(updateQuantity: false);
  }

  void _updateLockedFromGrams(String value) {
    if (_syncingDerivedFields) return;
    final grams = _parsePositiveInt(value);
    if (grams == null) return;
    _workingItem = widget.item.scaledToGrams(grams);
    _syncDerivedFields(updateGrams: false);
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

class _EditTextField extends StatelessWidget {
  const _EditTextField({
    super.key,
    required this.label,
    required this.controller,
    this.keyboardType,
    this.textInputAction,
    this.enabled = true,
    this.onChanged,
  });

  final String label;
  final TextEditingController controller;
  final TextInputType? keyboardType;
  final TextInputAction? textInputAction;
  final bool enabled;
  final ValueChanged<String>? onChanged;

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      keyboardType: keyboardType,
      textInputAction: textInputAction,
      enabled: enabled,
      onChanged: onChanged,
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
