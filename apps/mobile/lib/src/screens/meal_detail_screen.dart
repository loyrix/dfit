import 'package:flutter/material.dart';

import '../models/meal.dart';
import '../theme/logmyplate_colors.dart';
import '../theme/logmyplate_theme.dart';
import '../widgets/meal_item_editor_sheet.dart';
import '../widgets/macro_profile_card.dart';
import '../widgets/meal_delete_controls.dart';
import '../widgets/primitive_icons.dart';

class MealDetailScreen extends StatefulWidget {
  const MealDetailScreen({
    super.key,
    required this.meal,
    this.onUpdateMeal,
    this.onDeleteMeal,
  });

  final MealLog meal;
  final Future<MealLog> Function(MealLog meal, List<MealItem> items)?
  onUpdateMeal;
  final Future<void> Function(MealLog meal)? onDeleteMeal;

  @override
  State<MealDetailScreen> createState() => _MealDetailScreenState();
}

class _MealDetailScreenState extends State<MealDetailScreen> {
  late MealLog _meal = widget.meal;
  late List<MealItem> _draftItems = widget.meal.items.toList();
  bool _saving = false;
  bool _deleting = false;
  String? _error;

  MealLog get _draftMeal => MealLog(
    id: _meal.id,
    type: _meal.type,
    title: _meal.title,
    loggedAt: _meal.loggedAt,
    items: _draftItems,
    image: _meal.image,
  );

  bool get _hasChanges {
    if (_meal.items.length != _draftItems.length) return true;
    for (var index = 0; index < _meal.items.length; index++) {
      if (!_sameItem(_meal.items[index], _draftItems[index])) return true;
    }
    return false;
  }

  @override
  Widget build(BuildContext context) {
    final totals = _draftMeal.totals;
    final colors = context.logmyplate;
    final canEdit = widget.onUpdateMeal != null;
    final canDelete = widget.onDeleteMeal != null;

    return Scaffold(
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
          children: [
            Row(
              children: [
                IconButton(
                  onPressed: () => Navigator.of(context).pop(),
                  icon: const BackMark(),
                ),
                const Spacer(),
                if (_hasChanges) const _UnsavedChangesPill(),
                if (canDelete) ...[
                  const SizedBox(width: 8),
                  PopupMenuButton<_MealAction>(
                    tooltip: 'Meal actions',
                    enabled: !_deleting,
                    icon: Icon(Icons.more_horiz_rounded, color: colors.icon),
                    onSelected: (action) {
                      if (action == _MealAction.delete) {
                        _requestDeleteMeal();
                      }
                    },
                    itemBuilder: (context) => [
                      PopupMenuItem<_MealAction>(
                        value: _MealAction.delete,
                        child: Row(
                          children: [
                            Icon(
                              Icons.delete_outline_rounded,
                              color: LogMyPlateColors.destructive,
                              size: 19,
                            ),
                            const SizedBox(width: 10),
                            const Text('Delete meal'),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ],
            ),
            if (_meal.image != null) ...[
              const SizedBox(height: 12),
              _MealHeroImage(image: _meal.image!),
            ],
            const SizedBox(height: 18),
            Text(
              _meal.type.label,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                color: colors.textSecondary,
                letterSpacing: 1.6,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              '${totals.calories}',
              textAlign: TextAlign.center,
              style: Theme.of(
                context,
              ).textTheme.displayLarge?.copyWith(fontSize: 54),
            ),
            Text(
              'kCal - ${_draftItems.length} items',
              textAlign: TextAlign.center,
              style: Theme.of(
                context,
              ).textTheme.bodySmall?.copyWith(color: colors.textSecondary),
            ),
            const SizedBox(height: 22),
            MacroProfileCard(meal: _draftMeal),
            const SizedBox(height: 22),
            Text('Items', style: Theme.of(context).textTheme.labelSmall),
            const SizedBox(height: 10),
            for (var index = 0; index < _draftItems.length; index++)
              _MealDetailItemRow(
                item: _draftItems[index],
                editable: canEdit,
                onEdit: () => _openEditItemSheet(index),
              ),
            if (_error != null) ...[
              const SizedBox(height: 14),
              Text(
                _error!,
                textAlign: TextAlign.center,
                style: Theme.of(
                  context,
                ).textTheme.bodySmall?.copyWith(color: colors.accentText),
              ),
            ],
            if (canEdit) ...[
              const SizedBox(height: 18),
              FilledButton(
                onPressed: !_hasChanges || _saving || _deleting
                    ? null
                    : _saveChanges,
                style: FilledButton.styleFrom(
                  backgroundColor: colors.primaryAction,
                  foregroundColor: colors.primaryActionText,
                  disabledBackgroundColor: colors.mutedFill,
                  disabledForegroundColor: colors.textSecondary,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
                child: AnimatedSwitcher(
                  duration: const Duration(milliseconds: 180),
                  child: _saving
                      ? SizedBox(
                          key: const ValueKey('saving-updated-meal'),
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: colors.primaryActionText,
                          ),
                        )
                      : const Text(
                          'Save updated meal',
                          key: ValueKey('save-updated-meal'),
                        ),
                ),
              ),
              if (_hasChanges)
                TextButton(
                  onPressed: _saving || _deleting ? null : _resetChanges,
                  child: const Text('Reset changes'),
                ),
            ],
          ],
        ),
      ),
    );
  }

  Future<void> _openEditItemSheet(int index) async {
    if (widget.onUpdateMeal == null || _deleting) return;
    final result = await showModalBottomSheet<MealItemEditResult>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => MealItemEditorSheet(
        item: _draftItems[index],
        lockedFromAnalysis: true,
        allowDelete: false,
      ),
    );
    final item = result?.item;
    if (item == null || !mounted) return;
    setState(() {
      _error = null;
      _draftItems[index] = item;
    });
  }

  Future<void> _saveChanges() async {
    final updateMeal = widget.onUpdateMeal;
    if (updateMeal == null || !_hasChanges) return;
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      final updated = await updateMeal(_meal, _draftItems);
      if (!mounted) return;
      setState(() {
        _meal = updated;
        _draftItems = updated.items.toList();
        _saving = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _saving = false;
        _error = 'Could not update this meal. Try again.';
      });
    }
  }

  void _resetChanges() {
    setState(() {
      _error = null;
      _draftItems = _meal.items.toList();
    });
  }

  Future<void> _requestDeleteMeal() async {
    final deleteMeal = widget.onDeleteMeal;
    if (deleteMeal == null || _deleting) return;

    final confirmed = await confirmMealDeletion(context);
    if (confirmed != true || !mounted) return;

    setState(() {
      _deleting = true;
      _error = null;
    });
    try {
      await deleteMeal(_meal);
      if (!mounted) return;
      Navigator.of(context).pop(true);
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _deleting = false;
        _error = 'Could not delete this meal. Try again.';
      });
    }
  }
}

enum _MealAction { delete }

class _MealHeroImage extends StatelessWidget {
  const _MealHeroImage({required this.image});

  final MealImage image;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;
    return AspectRatio(
      aspectRatio: 1.55,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(22),
        child: DecoratedBox(
          decoration: BoxDecoration(
            color: colors.surfaceCard,
            border: Border.all(color: colors.border),
          ),
          child: Stack(
            fit: StackFit.expand,
            children: [
              Image.network(
                image.url,
                fit: BoxFit.cover,
                loadingBuilder: (context, child, progress) {
                  if (progress == null) return child;
                  return _MealHeroPlaceholder(active: true);
                },
                errorBuilder: (context, error, stackTrace) =>
                    const _MealHeroPlaceholder(active: false),
              ),
              DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Colors.transparent,
                      Colors.black.withValues(alpha: 0.05),
                      Colors.black.withValues(alpha: 0.32),
                    ],
                    stops: const [0, 0.58, 1],
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

class _MealHeroPlaceholder extends StatelessWidget {
  const _MealHeroPlaceholder({required this.active});

  final bool active;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;
    return DecoratedBox(
      decoration: BoxDecoration(color: colors.surfaceCard),
      child: Center(
        child: active
            ? SizedBox(
                width: 22,
                height: 22,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: colors.accentText,
                ),
              )
            : Icon(
                Icons.image_not_supported_outlined,
                color: colors.textSecondary,
              ),
      ),
    );
  }
}

class _MealDetailItemRow extends StatelessWidget {
  const _MealDetailItemRow({
    required this.item,
    required this.editable,
    required this.onEdit,
  });

  final MealItem item;
  final bool editable;
  final VoidCallback onEdit;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;
    final row = Container(
      padding: const EdgeInsets.symmetric(vertical: 13, horizontal: 4),
      decoration: BoxDecoration(
        border: Border(bottom: BorderSide(color: colors.border, width: 0.5)),
      ),
      child: Row(
        children: [
          if (editable) ...[
            Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(
                color: colors.mutedFill,
                border: Border.all(color: colors.border, width: 0.5),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Icon(
                Icons.edit_rounded,
                color: colors.textPrimary,
                size: 18,
              ),
            ),
            const SizedBox(width: 12),
          ],
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(item.name, style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 4),
                Text(
                  '${_formatQuantity(item.quantity)} ${item.unit} - ${item.grams}g',
                  style: Theme.of(
                    context,
                  ).textTheme.bodySmall?.copyWith(color: colors.textSecondary),
                ),
              ],
            ),
          ),
          const SizedBox(width: 10),
          Text('${item.nutrition.calories} kCal'),
        ],
      ),
    );

    if (!editable) return row;
    return InkWell(onTap: onEdit, child: row);
  }
}

class _UnsavedChangesPill extends StatelessWidget {
  const _UnsavedChangesPill();

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 7),
      decoration: BoxDecoration(
        color: LogMyPlateColors.accent.withValues(alpha: 0.14),
        borderRadius: BorderRadius.circular(99),
        border: Border.all(
          color: LogMyPlateColors.accent.withValues(alpha: 0.24),
        ),
      ),
      child: Text(
        'Unsaved changes',
        style: Theme.of(
          context,
        ).textTheme.labelSmall?.copyWith(color: colors.accentText),
      ),
    );
  }
}

String _formatQuantity(double value) {
  return value % 1 == 0 ? value.toStringAsFixed(0) : value.toStringAsFixed(1);
}

bool _sameItem(MealItem first, MealItem second) {
  return first.name == second.name &&
      first.foodId == second.foodId &&
      first.quantity == second.quantity &&
      first.unit == second.unit &&
      first.grams == second.grams &&
      first.nutrition.calories == second.nutrition.calories &&
      first.nutrition.proteinG == second.nutrition.proteinG &&
      first.nutrition.carbsG == second.nutrition.carbsG &&
      first.nutrition.fatG == second.nutrition.fatG;
}
