import 'dart:io';

import 'package:flutter/material.dart';

import 'package:path_provider/path_provider.dart';
import 'package:screenshot/screenshot.dart';
import 'package:share_plus/share_plus.dart';

import '../models/meal.dart';
import '../theme/logmyplate_colors.dart';
import '../theme/logmyplate_theme.dart';
import '../widgets/glass/glass_backdrop.dart';
import '../widgets/glass/glass_cards.dart';
import '../widgets/meal_item_editor_sheet.dart';
import '../widgets/macro_chips.dart';
import '../widgets/macro_profile_card.dart';
import '../widgets/meal_delete_controls.dart';
import '../widgets/primitive_icons.dart';

class MealDetailScreen extends StatefulWidget {
  const MealDetailScreen({
    super.key,
    required this.meal,
    this.onUpdateMeal,
    this.onDeleteMeal,
    this.onAskNutritionist,
    this.isPremium = false,
  });

  final MealLog meal;
  final Future<MealLog> Function(MealLog meal, List<MealItem> items)?
  onUpdateMeal;
  final Future<void> Function(MealLog meal)? onDeleteMeal;
  final void Function(MealLog meal)? onAskNutritionist;
  final bool isPremium;

  @override
  State<MealDetailScreen> createState() => _MealDetailScreenState();
}

class _MealDetailScreenState extends State<MealDetailScreen> {
  late MealLog _meal = widget.meal;
  late List<MealItem> _draftItems = widget.meal.items.toList();
  final ScreenshotController _screenshotController = ScreenshotController();
  bool _saving = false;
  bool _deleting = false;
  bool _isCapturing = false;
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
    final colors = context.logmyplate;
    final canEdit = widget.onUpdateMeal != null;
    final canDelete = widget.onDeleteMeal != null;

    return Scaffold(
      extendBodyBehindAppBar: true,
      backgroundColor: Colors.transparent,
      body: GlassBackdrop(
        child: SafeArea(
          child: SingleChildScrollView(
            child: Screenshot(
              controller: _screenshotController,
              child: ColoredBox(
                color: _isCapturing ? colors.background : Colors.transparent,
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      if (!_isCapturing) ...[
                        Row(
                children: [
                  IconButton(
                    tooltip: 'Back',
                    onPressed: () => Navigator.of(context).pop(),
                    icon: const BackMark(),
                  ),
                  const Spacer(),
                  if (_hasChanges) const _UnsavedChangesPill(),
                  const SizedBox(width: 8),
                  GlassCard(
                    padding: EdgeInsets.zero,
                    borderRadius: BorderRadius.circular(16),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        IconButton(
                          tooltip: 'Share meal',
                          onPressed: _deleting ? null : _shareMeal,
                          icon: Icon(
                            Icons.ios_share_rounded,
                            color: colors.textPrimary,
                            size: 20,
                          ),
                        ),
                        if (canDelete) ...[
                          Container(
                            width: 1,
                            height: 20,
                            color: colors.border,
                          ),
                          IconButton(
                            tooltip: 'Delete meal',
                            onPressed: _deleting ? null : _requestDeleteMeal,
                            icon: Icon(
                              Icons.delete_outline_rounded,
                              color: LogMyPlateColors.destructive,
                              size: 20,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ],
              ),
              if (!_isCapturing && _meal.image != null) const SizedBox(height: 12),
            ],
            if (_meal.image != null) ...[
                const SizedBox(height: 12),
                _MealHeroImage(image: _meal.image!),
              ],
              const SizedBox(height: 14),
              _MealDetailSummaryCard(meal: _draftMeal),
              const SizedBox(height: 18),
              MacroProfileCard(meal: _draftMeal),
              if (!_isCapturing) ...[
                if (widget.onAskNutritionist != null) ...[
                  const SizedBox(height: 18),
                  InkWell(
                    onTap: _hasChanges ? null : () => widget.onAskNutritionist!(_meal),
                    borderRadius: BorderRadius.circular(16),
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 16),
                      decoration: BoxDecoration(
                        color: _hasChanges 
                            ? colors.mutedFill 
                            : LogMyPlateColors.accent.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: _hasChanges 
                              ? colors.border 
                              : LogMyPlateColors.accent.withValues(alpha: 0.2),
                        ),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.auto_awesome_rounded,
                            size: 18,
                            color: _hasChanges 
                                ? colors.textSecondary 
                                : LogMyPlateColors.accent,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            'Analyze this meal with AI',
                            style: Theme.of(context).textTheme.titleSmall?.copyWith(
                              color: _hasChanges 
                                  ? colors.textSecondary 
                                  : colors.textPrimary,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          if (!widget.isPremium && !_hasChanges) ...[
                            const SizedBox(width: 8),
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
                ],
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
              if (_isCapturing) ...[
                const SizedBox(height: 32),
                Center(
                  child: Column(
                    children: [
                      Text(
                        'Tracked with LogMyPlate AI',
                        style: Theme.of(context).textTheme.labelLarge?.copyWith(
                              color: colors.textSecondary,
                              fontWeight: FontWeight.w600,
                            ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'logmyplate.com',
                        style: Theme.of(context).textTheme.labelMedium?.copyWith(
                              color: colors.textTertiary,
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
      ),
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

  Future<void> _shareMeal() async {
    setState(() => _isCapturing = true);
    // Give the UI a frame to update
    await Future.delayed(const Duration(milliseconds: 50));
    
    final image = await _screenshotController.capture(
      delay: const Duration(milliseconds: 20),
      pixelRatio: 2.0,
    );
    
    setState(() => _isCapturing = false);

    if (image == null) return;

    final tempDir = await getTemporaryDirectory();
    final file = File('${tempDir.path}/shared_meal_page.png');
    await file.writeAsBytes(image);

    await Share.shareXFiles(
      [XFile(file.path)],
      text: 'Check out my meal on LogMyPlate!\n\nhttps://logmyplate.com',
      subject: 'My Meal on LogMyPlate',
    );
  }
}

class _MealDetailSummaryCard extends StatelessWidget {
  const _MealDetailSummaryCard({required this.meal});

  final MealLog meal;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;
    final totals = meal.totals;

    return Padding(
      padding: const EdgeInsets.fromLTRB(4, 4, 4, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            meal.type.label,
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
              color: colors.textSecondary,
              letterSpacing: 1.5,
            ),
          ),
          const SizedBox(height: 8),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Expanded(
                child: Text(
                  meal.title,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    color: colors.textPrimary,
                    height: 1.08,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Text(
                '${totals.calories} kCal',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  color: colors.textPrimary,
                  fontFeatures: const [FontFeature.tabularFigures()],
                ),
              ),
            ],
          ),
          const SizedBox(height: 13),
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
          const SizedBox(height: 10),
          Text(
            _mealSubtitle(meal, meal.items.length),
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: colors.textSecondary,
              height: 1.25,
            ),
          ),
        ],
      ),
    );
  }
}



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
        child: LiteGlassCard(
          borderRadius: BorderRadius.circular(22),
          padding: EdgeInsets.zero,
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
    return LiteGlassCard(
      padding: EdgeInsets.zero,
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
                Text(
                  item.name,
                  overflow: TextOverflow.ellipsis,
                  maxLines: 1,
                  style: Theme.of(context).textTheme.titleMedium,
                ),
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
          Flexible(
            flex: 0,
            child: Text(
              '${item.nutrition.calories} kCal',
              overflow: TextOverflow.ellipsis,
            ),
          ),
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

String _mealSubtitle(MealLog meal, int itemCount) {
  final itemCopy = '$itemCount ${itemCount == 1 ? 'item' : 'items'}';
  return meal.title.trim().toLowerCase() == meal.type.label.toLowerCase()
      ? itemCopy
      : '${meal.type.label} - $itemCopy';
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
