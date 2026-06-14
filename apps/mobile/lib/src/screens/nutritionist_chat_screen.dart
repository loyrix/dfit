import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../state/nutritionist_controller.dart';
import '../theme/logmyplate_colors.dart';
import '../theme/logmyplate_theme.dart';
import '../widgets/chat_message_bubble.dart';
import '../widgets/chat_typing_indicator.dart';
import '../widgets/logmyplate_background.dart';
import '../widgets/nutritionist_suggested_chip.dart';
import '../widgets/primitive_icons.dart';

class NutritionistChatScreen extends StatefulWidget {
  const NutritionistChatScreen({
    super.key,
    required this.controller,
    this.focusMealId,
    this.existingSessionId,
  });

  final NutritionistController controller;
  final String? focusMealId;
  final String? existingSessionId;

  @override
  State<NutritionistChatScreen> createState() => _NutritionistChatScreenState();
}

class _NutritionistChatScreenState extends State<NutritionistChatScreen> {
  final TextEditingController _textController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final FocusNode _focusNode = FocusNode();

  @override
  void initState() {
    super.initState();
    widget.controller.addListener(_onControllerChanged);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (widget.existingSessionId != null) {
        widget.controller.loadExistingSession(widget.existingSessionId!);
      } else {
        widget.controller.startSession(focusMealId: widget.focusMealId);
      }
    });
  }

  @override
  void dispose() {
    widget.controller.removeListener(_onControllerChanged);
    _textController.dispose();
    _scrollController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  void _onControllerChanged() {
    setState(() {});
    if (widget.controller.messages.isNotEmpty) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (_scrollController.hasClients) {
          _scrollController.animateTo(
            0,
            duration: const Duration(milliseconds: 200),
            curve: Curves.easeOut,
          );
        }
      });
    }
  }

  Future<void> _confirmExit() async {
    final colors = context.logmyplate;
    final confirmed = await showModalBottomSheet<bool>(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => SafeArea(
        child: Container(
          margin: const EdgeInsets.all(12),
          padding: const EdgeInsets.fromLTRB(18, 18, 18, 16),
          decoration: BoxDecoration(
            color: colors.surfaceCard,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: colors.border),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.18),
                blurRadius: 24,
                offset: const Offset(0, 14),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Center(
                child: Container(
                  width: 38, height: 5,
                  decoration: BoxDecoration(
                    color: colors.textTertiary.withValues(alpha: 0.36),
                    borderRadius: BorderRadius.circular(99),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Container(
                    width: 42, height: 42,
                    decoration: BoxDecoration(
                      color: colors.mutedFill,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.logout_rounded, size: 20),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Exit chat?', style: Theme.of(ctx).textTheme.titleMedium),
                        const SizedBox(height: 4),
                        Text(
                          'Your conversation will be saved. You can start a new session anytime.',
                          style: Theme.of(ctx).textTheme.bodySmall?.copyWith(
                            color: colors.textSecondary,
                            height: 1.35,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 18),
              FilledButton(
                onPressed: () => Navigator.of(ctx).pop(true),
                style: FilledButton.styleFrom(
                  backgroundColor: colors.primaryAction,
                  foregroundColor: colors.primaryActionText,
                  padding: const EdgeInsets.symmetric(vertical: 15),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
                child: const Text('Exit'),
              ),
              const SizedBox(height: 8),
              TextButton(
                onPressed: () => Navigator.of(ctx).pop(false),
                child: const Text('Stay'),
              ),
            ],
          ),
        ),
      ),
    );
    if (confirmed == true && mounted) {
      Navigator.of(context).pop();
    }
  }

  void _sendMessage() {
    final text = _textController.text.trim();
    if (text.isEmpty || widget.controller.sendingMessage) return;

    HapticFeedback.lightImpact();
    _textController.clear();
    widget.controller.sendMessage(text);
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;
    final ctrl = widget.controller;

    return PopScope(
      canPop: ctrl.readOnly,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) {
          if (ctrl.turnNumber > 0 && !ctrl.sessionComplete) {
            _confirmExit();
          } else {
            Navigator.of(context).pop();
          }
        }
      },
      child: Scaffold(
      backgroundColor: colors.background,
      body: LogMyPlateAmbientBackground(
        child: SafeArea(
          child: Column(
            children: [
              _ChatAppBar(
                readOnly: ctrl.readOnly,
                colors: colors,
                turnNumber: ctrl.turnNumber,
                maxTurns: ctrl.maxTurns,
                sessionComplete: ctrl.sessionComplete,
                onNewChat: ctrl.readOnly
                    ? () {
                        final fresh = NutritionistController(
                          apiClient: widget.controller.apiClient,
                        );
                        Navigator.of(context).pushReplacement(
                          MaterialPageRoute(
                            builder: (_) => NutritionistChatScreen(
                              controller: fresh,
                            ),
                          ),
                        );
                      }
                    : null,
                onBack: () {
                  if (ctrl.readOnly) {
                    Navigator.of(context).pop();
                  } else if (ctrl.turnNumber > 0 && !ctrl.sessionComplete) {
                    _confirmExit();
                  } else {
                    Navigator.of(context).pop();
                  }
                },
              ),
              Expanded(
                child: _buildMessageList(ctrl, colors),
              ),
              if (!ctrl.readOnly && ctrl.suggestedFollowUps.isNotEmpty && !ctrl.sessionComplete)
                Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: NutritionistSuggestedChips(
                    prompts: ctrl.suggestedFollowUps,
                    disabled: ctrl.sendingMessage,
                    onTap: (prompt) {
                      _textController.text = prompt;
                      _sendMessage();
                    },
                  ),
                ),
              if (ctrl.readOnly && ctrl.messages.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  child: SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: () {
                        final fresh = NutritionistController(
                          apiClient: widget.controller.apiClient,
                        );
                        Navigator.of(context).pushReplacement(
                          MaterialPageRoute(
                            builder: (_) => NutritionistChatScreen(
                              controller: fresh,
                            ),
                          ),
                        );
                      },
                      icon: const Icon(Icons.add_rounded, size: 18),
                      label: const Text('Start new chat'),
                    ),
                  ),
                ),
              if (!ctrl.readOnly && !ctrl.sessionComplete)
                _ChatInputBar(
                  controller: _textController,
                  focusNode: _focusNode,
                  sendingMessage: ctrl.sendingMessage,
                  onSend: _sendMessage,
                  colors: colors,
                ),
            ],
          ),
        ),
      ),
      ),
    );
  }

  Widget _buildMessageList(NutritionistController ctrl, LogMyPlateThemeColors colors) {
    if (ctrl.creatingSession || ctrl.loadingHistory) {
      return const Center(child: CircularProgressIndicator());
    }

    if (ctrl.error != null && ctrl.messages.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                ctrl.error!,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: colors.textSecondary,
                ),
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () {
                  if (widget.existingSessionId != null) {
                    widget.controller.loadExistingSession(widget.existingSessionId!);
                  } else {
                    ctrl.startSession(focusMealId: widget.focusMealId);
                  }
                },
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      );
    }

    return ListView.builder(
      controller: _scrollController,
      reverse: true,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      itemCount: ctrl.messages.length + (ctrl.sendingMessage ? 1 : 0) + ((ctrl.sessionComplete && !ctrl.readOnly) ? 1 : 0),
      itemBuilder: (context, index) {
        if (index == 0 && ctrl.sessionComplete && !ctrl.readOnly) {
          return Padding(
            padding: const EdgeInsets.symmetric(vertical: 16),
            child: _SessionCompleteCard(
              colors: colors,
              onNewSession: () => ctrl.startSession(focusMealId: widget.focusMealId),
            ),
          );
        }

        final adjusted = (ctrl.sessionComplete && !ctrl.readOnly) ? index - 1 : index;

        if (adjusted >= ctrl.messages.length) {
          return const Padding(
            padding: EdgeInsets.symmetric(vertical: 8),
            child: ChatTypingIndicator(),
          );
        }

        final messageIndex = ctrl.messages.length - 1 - adjusted;
        if (messageIndex < 0 || messageIndex >= ctrl.messages.length) {
          return const SizedBox.shrink();
        }

        final message = ctrl.messages[messageIndex];
        return Padding(
          padding: const EdgeInsets.symmetric(vertical: 4),
          child: ChatMessageBubble(message: message),
        );
      },
    );
  }
}

class _ChatAppBar extends StatelessWidget {
  const _ChatAppBar({
    required this.readOnly,
    required this.colors,
    required this.turnNumber,
    required this.maxTurns,
    required this.sessionComplete,
    required this.onBack,
    this.onNewChat,
  });

  final bool readOnly;
  final LogMyPlateThemeColors colors;
  final int turnNumber;
  final int maxTurns;
  final bool sessionComplete;
  final VoidCallback onBack;
  final VoidCallback? onNewChat;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
      child: Row(
        children: [
          GestureDetector(onTap: onBack, child: const BackMark()),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  readOnly ? 'Chat history' : 'AI Nutritionist',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: colors.textPrimary,
                  ),
                ),
                Text(
                  readOnly ? '' : 'Based on your last 7 days',
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: colors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          if (readOnly && onNewChat != null)
            TextButton.icon(
              onPressed: onNewChat,
              icon: const Icon(Icons.add_rounded, size: 16),
              label: const Text('New chat'),
              style: TextButton.styleFrom(
                visualDensity: VisualDensity.compact,
                foregroundColor: LogMyPlateColors.accent,
              ),
            ),
          if (!readOnly && !sessionComplete)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: LogMyPlateColors.accent.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(99),
              ),
              child: Text(
                '$turnNumber/$maxTurns',
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: LogMyPlateColors.accentDeep,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _ChatInputBar extends StatelessWidget {
  const _ChatInputBar({
    required this.controller,
    required this.focusNode,
    required this.sendingMessage,
    required this.onSend,
    required this.colors,
  });

  final TextEditingController controller;
  final FocusNode focusNode;
  final bool sendingMessage;
  final VoidCallback onSend;
  final LogMyPlateThemeColors colors;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: colors.surfaceCard.withValues(alpha: 0.85),
        border: Border(
          top: BorderSide(color: colors.border, width: 0.3),
        ),
      ),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: controller,
              focusNode: focusNode,
              textInputAction: TextInputAction.send,
              onSubmitted: (_) => onSend(),
              decoration: InputDecoration(
                hintText: 'Ask anything about your nutrition...',
                hintStyle: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: colors.textTertiary,
                ),
                border: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              ),
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: colors.textPrimary,
              ),
            ),
          ),
          const SizedBox(width: 8),
          Material(
            color: LogMyPlateColors.accent,
            shape: const CircleBorder(),
            child: InkWell(
              customBorder: const CircleBorder(),
              onTap: sendingMessage ? null : onSend,
              child: Container(
                width: 42,
                height: 42,
                alignment: Alignment.center,
                child: Icon(
                  Icons.arrow_upward_rounded,
                  color: sendingMessage
                      ? LogMyPlateColors.accentDeep.withValues(alpha: 0.5)
                      : LogMyPlateColors.accentDeep,
                  size: 20,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SessionCompleteCard extends StatelessWidget {
  const _SessionCompleteCard({
    required this.colors,
    required this.onNewSession,
  });

  final LogMyPlateThemeColors colors;
  final VoidCallback onNewSession;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      margin: const EdgeInsets.symmetric(horizontal: 32),
      decoration: BoxDecoration(
        color: colors.surfaceCard,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: colors.border, width: 0.5),
      ),
      child: Column(
        children: [
          Icon(Icons.check_circle_rounded, color: LogMyPlateColors.accent, size: 40),
          const SizedBox(height: 12),
          Text(
            'Session complete',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              color: colors.textPrimary,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'You can start a new session anytime.',
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: colors.textSecondary,
            ),
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: onNewSession,
            child: const Text('New session'),
          ),
        ],
      ),
    );
  }
}
