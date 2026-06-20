import 'package:flutter/material.dart';

import '../models/chat.dart';
import '../services/logmyplate_api_client.dart';
import '../theme/logmyplate_colors.dart';
import '../theme/logmyplate_spacing.dart';
import '../theme/logmyplate_theme.dart';
import '../widgets/glass/glass_cards.dart';

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

  @override
  void initState() {
    super.initState();
    _fetchSessions();
  }

  Future<void> _fetchSessions() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final sessions = await widget.apiClient.listNutritionistSessions();
      setState(() {
        _sessions = sessions;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Failed to load chat history';
        _isLoading = false;
      });
    }
  }

  Future<void> _deleteSelected() async {
    if (_selectedIds.isEmpty) return;

    final colors = context.logmyplate;

    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: colors.surfaceCard,
        title: Text('Delete Chats', style: Theme.of(context).textTheme.titleLarge),
        content: Text(
          'Are you sure you want to delete ${_selectedIds.length} chat(s)? This cannot be undone.',
          style: Theme.of(context).textTheme.bodyMedium,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: Text('Cancel', style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: colors.textSecondary)),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: Text('Delete', style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: LogMyPlateColors.destructive)),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    setState(() {
      _isLoading = true;
    });

    try {
      await widget.apiClient.deleteNutritionistSessions(_selectedIds.toList());
      setState(() {
        _sessions.removeWhere((s) => _selectedIds.contains(s.id));
        _selectedIds.clear();
        _isSelectionMode = false;
        _isLoading = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Chats deleted successfully')),
        );
      }
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to delete chats')),
        );
      }
    }
  }

  Future<void> _deleteSingle(String id) async {
    final colors = context.logmyplate;
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: colors.surfaceCard,
        title: Text('Delete Chat', style: Theme.of(context).textTheme.titleLarge),
        content: Text(
          'Are you sure you want to delete this chat?',
          style: Theme.of(context).textTheme.bodyMedium,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: Text('Cancel', style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: colors.textSecondary)),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: Text('Delete', style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: LogMyPlateColors.destructive)),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    setState(() {
      _isLoading = true;
    });

    try {
      await widget.apiClient.deleteNutritionistSessions([id]);
      setState(() {
        _sessions.removeWhere((s) => s.id == id);
        _selectedIds.remove(id);
        if (_selectedIds.isEmpty) {
          _isSelectionMode = false;
        }
        _isLoading = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Chat deleted')),
        );
      }
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to delete chat')),
        );
      }
    }
  }

  void _toggleSelection(String id) {
    setState(() {
      if (_selectedIds.contains(id)) {
        _selectedIds.remove(id);
        if (_selectedIds.isEmpty) {
          _isSelectionMode = false;
        }
      } else {
        _selectedIds.add(id);
      }
    });
  }

  String _getGroupForDate(DateTime date) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final yesterday = today.subtract(const Duration(days: 1));
    final dateLocal = date.toLocal();
    final dateOnly = DateTime(dateLocal.year, dateLocal.month, dateLocal.day);

    if (dateOnly == today) return 'Today';
    if (dateOnly == yesterday) return 'Yesterday';
    if (now.difference(dateOnly).inDays <= 7) return 'Previous 7 Days';
    return 'Older';
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;
    final textTheme = Theme.of(context).textTheme;

    // Group sessions
    final groupedSessions = <String, List<ChatSessionSummary>>{};
    for (final session in _sessions) {
      final group = _getGroupForDate(session.createdAt);
      groupedSessions.putIfAbsent(group, () => []).add(session);
    }

    // Sort groups in predefined order
    final orderedGroups = ['Today', 'Yesterday', 'Previous 7 Days', 'Older']
        .where((g) => groupedSessions.containsKey(g))
        .toList();

    return Scaffold(
      backgroundColor: colors.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back, color: colors.textPrimary),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text(
          _isSelectionMode ? '${_selectedIds.length} Selected' : 'Chat History',
          style: textTheme.titleMedium?.copyWith(color: colors.textPrimary),
        ),
        actions: [
          if (_isSelectionMode)
            IconButton(
              icon: const Icon(Icons.delete_outline, color: LogMyPlateColors.destructive),
              onPressed: _deleteSelected,
            ),
        ],
      ),
      body: Stack(
        children: [
          if (!_isLoading && _sessions.isEmpty && _error == null)
            Center(
              child: Text(
                'No chat history yet',
                style: textTheme.bodyMedium?.copyWith(color: colors.textSecondary),
              ),
            )
          else if (_error != null)
            Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(_error!, style: textTheme.bodyMedium?.copyWith(color: LogMyPlateColors.destructive)),
                  const SizedBox(height: LogMyPlateSpacing.sectionSpacing),
                  TextButton(
                    onPressed: _fetchSessions,
                    child: const Text('Retry'),
                  ),
                ],
              ),
            )
          else
            ListView.builder(
              padding: const EdgeInsets.all(LogMyPlateSpacing.sectionSpacing),
              itemCount: orderedGroups.length,
              itemBuilder: (context, groupIndex) {
                final group = orderedGroups[groupIndex];
                final sessionsInGroup = groupedSessions[group]!;

                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Padding(
                      padding: const EdgeInsets.only(
                        top: LogMyPlateSpacing.sectionSpacing,
                        bottom: LogMyPlateSpacing.smSpacing,
                        left: LogMyPlateSpacing.xsSpacing,
                      ),
                      child: Text(
                        group,
                        style: textTheme.labelLarge?.copyWith(
                          color: colors.textSecondary,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                    ...sessionsInGroup.map((session) {
                      final isSelected = _selectedIds.contains(session.id);
                      final timeFormat = TimeOfDay.fromDateTime(session.createdAt.toLocal()).format(context);

                      return Padding(
                        padding: const EdgeInsets.only(bottom: LogMyPlateSpacing.smSpacing),
                        child: GestureDetector(
                          onLongPress: () {
                            setState(() {
                              _isSelectionMode = true;
                              _selectedIds.add(session.id);
                            });
                          },
                          onTap: () {
                            if (_isSelectionMode) {
                              _toggleSelection(session.id);
                            }
                          },
                          child: GlassCard(
                            tintColor: isSelected ? colors.primaryAction.withValues(alpha: 0.1) : null,
                            padding: const EdgeInsets.all(LogMyPlateSpacing.smSpacing),
                            child: Row(
                              children: [
                                if (_isSelectionMode)
                                  Padding(
                                    padding: const EdgeInsets.only(right: LogMyPlateSpacing.smSpacing),
                                    child: Icon(
                                      isSelected ? Icons.check_circle : Icons.radio_button_unchecked,
                                      color: isSelected ? colors.primaryAction : colors.textTertiary,
                                    ),
                                  )
                                else
                                  Padding(
                                    padding: const EdgeInsets.only(right: LogMyPlateSpacing.smSpacing),
                                    child: Container(
                                      padding: const EdgeInsets.all(8),
                                      decoration: BoxDecoration(
                                        color: colors.primaryAction.withValues(alpha: 0.1),
                                        shape: BoxShape.circle,
                                      ),
                                      child: Icon(Icons.chat_bubble_outline, color: colors.primaryAction, size: 16),
                                    ),
                                  ),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        'Chat Session',
                                        style: textTheme.bodyMedium?.copyWith(
                                          fontWeight: FontWeight.w600,
                                          color: colors.textPrimary,
                                        ),
                                      ),
                                      Text(
                                        '$timeFormat • ${session.turnCount} messages',
                                        style: textTheme.labelSmall?.copyWith(color: colors.textSecondary),
                                      ),
                                    ],
                                  ),
                                ),
                                if (!_isSelectionMode)
                                  IconButton(
                                    icon: Icon(Icons.delete_outline, color: colors.textTertiary, size: 20),
                                    onPressed: () => _deleteSingle(session.id),
                                  ),
                              ],
                            ),
                          ),
                        ),
                      );
                    }),
                  ],
                );
              },
            ),
          if (_isLoading && _sessions.isEmpty)
            Container(
              color: colors.background,
              child: Center(
                child: CircularProgressIndicator(color: colors.primaryAction),
              ),
            ),
          if (_isLoading && _sessions.isNotEmpty)
            Positioned(
              top: 0,
              left: 0,
              right: 0,
              child: LinearProgressIndicator(color: colors.primaryAction),
            ),
        ],
      ),
    );
  }
}
