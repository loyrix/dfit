import 'package:flutter/material.dart';

import '../models/chat.dart';
import '../services/logmyplate_api_client.dart';
import '../theme/logmyplate_colors.dart';
import '../theme/logmyplate_spacing.dart';
import '../theme/logmyplate_theme.dart';
import '../widgets/glass/glass_cards.dart';
import '../widgets/glass/glass_surface.dart';
import '../widgets/glass/glass_wrapper.dart';
import '../widgets/logmyplate_background.dart';
import '../widgets/premium_button.dart';

class ChatHistoryScreen extends StatefulWidget {
  const ChatHistoryScreen({super.key, required this.apiClient});

  final LogMyPlateApiClient apiClient;

  @override
  State<ChatHistoryScreen> createState() => _ChatHistoryScreenState();
}

class _ChatHistoryScreenState extends State<ChatHistoryScreen> {
  bool _isLoading = true;
  String? _error;
  List<ChatSessionSummary> _sessions = [];
  final Set<String> _selectedIds = {};
  bool _isSelectionMode = false;
  bool _isDeleting = false;

  @override
  void initState() {
    super.initState();
    _loadSessions();
  }

  Future<void> _loadSessions() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final sessions = await widget.apiClient.listNutritionistSessions();
      setState(() {
        _sessions = sessions;
      });
    } catch (e) {
      setState(() {
        _error = 'Failed to load chat history. Please try again.';
      });
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  void _toggleSelectionMode() {
    setState(() {
      _isSelectionMode = !_isSelectionMode;
      _selectedIds.clear();
    });
  }

  void _toggleSelection(String id) {
    setState(() {
      if (_selectedIds.contains(id)) {
        _selectedIds.remove(id);
      } else {
        _selectedIds.add(id);
      }
      if (_selectedIds.isEmpty && _isSelectionMode) {
        _isSelectionMode = false;
      }
    });
  }

  Future<void> _deleteSelected() async {
    if (_selectedIds.isEmpty) return;

    final confirm = await showModalBottomSheet<bool>(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _DeleteConfirmationSheet(count: _selectedIds.length),
    );

    if (confirm != true) return;

    setState(() {
      _isDeleting = true;
    });

    try {
      await widget.apiClient.deleteNutritionistSessions(_selectedIds.toList());
      setState(() {
        _sessions.removeWhere((s) => _selectedIds.contains(s.id));
        _selectedIds.clear();
        _isSelectionMode = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Chats deleted successfully.'),
            backgroundColor: LogMyPlateColors.accent,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Failed to delete chats. Please try again.'),
            backgroundColor: LogMyPlateColors.destructive,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isDeleting = false;
        });
      }
    }
  }

  Future<void> _deleteSingle(String id) async {
    final confirm = await showModalBottomSheet<bool>(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => const _DeleteConfirmationSheet(count: 1),
    );

    if (confirm != true) return;

    setState(() {
      _isDeleting = true;
    });

    try {
      await widget.apiClient.deleteNutritionistSessions([id]);
      setState(() {
        _sessions.removeWhere((s) => s.id == id);
        _selectedIds.remove(id);
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Chat deleted successfully.'),
            backgroundColor: LogMyPlateColors.accent,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Failed to delete chat. Please try again.'),
            backgroundColor: LogMyPlateColors.destructive,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isDeleting = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: colors.background,
      body: LogMyPlateAmbientBackground(
        child: SafeArea(
          child: Column(
            children: [
              _buildAppBar(context, colors),
              Expanded(
                child: _isLoading
                    ? Center(
                        child: CircularProgressIndicator(color: LogMyPlateColors.accent),
                      )
                    : _error != null
                        ? _buildErrorState(colors)
                        : _sessions.isEmpty
                            ? _buildEmptyState(colors, isDark)
                            : _buildList(colors, isDark),
              ),
              if (_isSelectionMode) _buildSelectionActionBar(colors),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAppBar(BuildContext context, LogMyPlateThemeColors colors) {
    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: 24.0,
        vertical: 12,
      ),
      child: Row(
        children: [
          GlassWrapper(
            child: IconButton(
              onPressed: () => Navigator.of(context).pop(),
              icon: Icon(Icons.arrow_back_rounded, color: colors.textPrimary),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Text(
              'Chat History',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
            ),
          ),
          if (_sessions.isNotEmpty && !_isDeleting)
            GlassWrapper(
              child: IconButton(
                onPressed: _toggleSelectionMode,
                icon: Icon(
                  _isSelectionMode ? Icons.close_rounded : Icons.checklist_rounded,
                  color: _isSelectionMode ? LogMyPlateColors.destructive : colors.textPrimary,
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildErrorState(LogMyPlateThemeColors colors) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.error_outline_rounded, size: 48, color: colors.textTertiary),
          const SizedBox(height: 16),
          Text(
            _error!,
            style: Theme.of(context).textTheme.bodyLarge?.copyWith(color: colors.textSecondary),
          ),
          const SizedBox(height: 24),
          PremiumButton(
            onPressed: _loadSessions,
            child: const Text('Try Again'),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState(LogMyPlateThemeColors colors, bool isDark) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.black.withValues(alpha: 0.05),
              shape: BoxShape.circle,
            ),
            child: Icon(Icons.chat_bubble_outline_rounded, size: 48, color: colors.textTertiary),
          ),
          const SizedBox(height: 24),
          Text(
            'No chat history yet',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
          ),
          const SizedBox(height: 8),
          Text(
            'Your conversations with the AI\nNutritionist will appear here.',
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: colors.textSecondary,
                  height: 1.4,
                ),
          ),
        ],
      ),
    );
  }

  Widget _buildList(LogMyPlateThemeColors colors, bool isDark) {
    // Group by date
    final groups = <String, List<ChatSessionSummary>>{};
    for (final s in _sessions) {
      final dateKey = _formatDateKey(s.createdAt);
      groups.putIfAbsent(dateKey, () => []).add(s);
    }

    return ListView.builder(
      padding: const EdgeInsets.symmetric(
        horizontal: 24.0,
        vertical: 16,
      ),
      itemCount: groups.length,
      itemBuilder: (context, index) {
        final dateKey = groups.keys.elementAt(index);
        final daySessions = groups[dateKey]!;

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.only(left: 4, bottom: 12, top: 8),
              child: Text(
                dateKey,
                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      color: colors.textSecondary,
                      fontWeight: FontWeight.w600,
                    ),
              ),
            ),
            ...daySessions.map((s) => _buildSessionCard(s, colors, isDark)),
            const SizedBox(height: 16),
          ],
        );
      },
    );
  }

  Widget _buildSessionCard(ChatSessionSummary s, LogMyPlateThemeColors colors, bool isDark) {
    final isSelected = _selectedIds.contains(s.id);
    final tintColor = isSelected
        ? LogMyPlateColors.accent.withValues(alpha: isDark ? 0.2 : 0.1)
        : null;

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: GestureDetector(
        onTap: () {
          if (_isSelectionMode) {
            _toggleSelection(s.id);
          } else {
            Navigator.of(context).pop(s.id);
          }
        },
        onLongPress: () {
          if (!_isSelectionMode) {
            _toggleSelectionMode();
            _toggleSelection(s.id);
          }
        },
        child: GlassSurface(
          borderRadius: BorderRadius.circular(20),
          tintColor: tintColor,
          child: Container(
            decoration: BoxDecoration(
              border: isSelected
                  ? Border.all(color: LogMyPlateColors.accent, width: 1.5)
                  : Border.all(color: Colors.transparent, width: 1.5),
              borderRadius: BorderRadius.circular(20),
            ),
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                if (_isSelectionMode) ...[
                  Icon(
                    isSelected ? Icons.check_circle_rounded : Icons.radio_button_unchecked_rounded,
                    color: isSelected ? LogMyPlateColors.accent : colors.textTertiary,
                    size: 24,
                  ),
                  const SizedBox(width: 16),
                ],
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        LogMyPlateColors.accent.withValues(alpha: 0.2),
                        LogMyPlateColors.accent.withValues(alpha: 0.05),
                      ],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Icon(
                    Icons.auto_awesome_rounded,
                    color: isDark ? LogMyPlateColors.accent : LogMyPlateColors.accentDeep,
                    size: 24,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Nutritionist Chat',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.w600,
                            ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${s.turnCount} message${s.turnCount == 1 ? '' : 's'} • ${_formatTime(s.createdAt)}',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: colors.textSecondary,
                            ),
                      ),
                    ],
                  ),
                ),
                if (!_isSelectionMode)
                  IconButton(
                    onPressed: () => _deleteSingle(s.id),
                    icon: Icon(Icons.delete_outline_rounded, color: LogMyPlateColors.destructive.withValues(alpha: 0.8)),
                    tooltip: 'Delete chat',
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSelectionActionBar(LogMyPlateThemeColors colors) {
    return Container(
      padding: const EdgeInsets.all(24.0),
      decoration: BoxDecoration(
        color: colors.surfaceCard,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: Row(
          children: [
            Text(
              '${_selectedIds.length} selected',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
            ),
            const Spacer(),
            if (_isDeleting)
              const SizedBox(
                width: 24,
                height: 24,
                child: CircularProgressIndicator(strokeWidth: 2),
              )
            else
              TextButton.icon(
                onPressed: _selectedIds.isEmpty ? null : _deleteSelected,
                icon: const Icon(Icons.delete_rounded, size: 20),
                label: const Text('Delete'),
                style: TextButton.styleFrom(
                  foregroundColor: LogMyPlateColors.destructive,
                  disabledForegroundColor: colors.textTertiary,
                ),
              ),
          ],
        ),
      ),
    );
  }

  String _formatDateKey(DateTime date) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final yesterday = today.subtract(const Duration(days: 1));
    final dateOnly = DateTime(date.year, date.month, date.day);

    if (dateOnly == today) return 'Today';
    if (dateOnly == yesterday) return 'Yesterday';

    final diff = today.difference(dateOnly).inDays;
    if (diff < 7) {
      const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      return 'Last ${weekdays[date.weekday - 1]}';
    }

    final months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return '${months[date.month - 1]} ${date.day}, ${date.year}';
  }

  String _formatTime(DateTime date) {
    final hour = date.hour == 0 ? 12 : (date.hour > 12 ? date.hour - 12 : date.hour);
    final minute = date.minute.toString().padLeft(2, '0');
    final amPm = date.hour >= 12 ? 'PM' : 'AM';
    return '$hour:$minute $amPm';
  }
}

class _DeleteConfirmationSheet extends StatelessWidget {
  const _DeleteConfirmationSheet({required this.count});
  final int count;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;
    return LiteGlassCard(
      padding: const EdgeInsets.fromLTRB(24, 24, 24, 32),
      borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Center(
            child: Container(
              width: 40,
              height: 5,
              decoration: BoxDecoration(
                color: colors.textTertiary.withValues(alpha: 0.3),
                borderRadius: BorderRadius.circular(10),
              ),
            ),
          ),
          const SizedBox(height: 32),
          Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              color: LogMyPlateColors.destructive.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.delete_outline_rounded,
              color: LogMyPlateColors.destructive,
              size: 32,
            ),
          ),
          const SizedBox(height: 24),
          Text(
            count == 1 ? 'Delete Chat?' : 'Delete $count Chats?',
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
          ),
          const SizedBox(height: 12),
          Text(
            'This action cannot be undone. Are you sure you want to permanently delete '
            '${count == 1 ? 'this chat session' : 'these chat sessions'}?',
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: colors.textSecondary,
                  height: 1.4,
                ),
          ),
          const SizedBox(height: 32),
          PremiumButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Yes, delete'),
          ),
          const SizedBox(height: 16),
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            style: TextButton.styleFrom(
              foregroundColor: colors.textPrimary,
              padding: const EdgeInsets.symmetric(vertical: 16),
            ),
            child: const Text(
              'Cancel',
              style: TextStyle(fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }
}
