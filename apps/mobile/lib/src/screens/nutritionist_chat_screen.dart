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
  });

  final NutritionistController controller;
  final String? focusMealId;

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
      widget.controller.startSession(focusMealId: widget.focusMealId);
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

    return Scaffold(
      backgroundColor: colors.background,
      body: LogMyPlateAmbientBackground(
        child: SafeArea(
          child: Column(
            children: [
              _ChatAppBar(
                colors: colors,
                turnNumber: ctrl.turnNumber,
                maxTurns: ctrl.maxTurns,
                sessionComplete: ctrl.sessionComplete,
                onBack: () => Navigator.of(context).pop(),
              ),
              Expanded(
                child: _buildMessageList(ctrl, colors),
              ),
              if (ctrl.suggestedFollowUps.isNotEmpty && !ctrl.sessionComplete)
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
              if (!ctrl.sessionComplete)
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
    );
  }

  Widget _buildMessageList(NutritionistController ctrl, LogMyPlateThemeColors colors) {
    if (ctrl.creatingSession) {
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
                onPressed: () => ctrl.startSession(focusMealId: widget.focusMealId),
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
      itemCount: ctrl.messages.length + (ctrl.sendingMessage ? 1 : 0) + (ctrl.sessionComplete ? 1 : 0),
      itemBuilder: (context, index) {
        if (index == 0 && ctrl.sessionComplete) {
          return Padding(
            padding: const EdgeInsets.symmetric(vertical: 16),
            child: _SessionCompleteCard(
              colors: colors,
              onNewSession: () => ctrl.startSession(focusMealId: widget.focusMealId),
            ),
          );
        }

        final adjusted = ctrl.sessionComplete ? index - 1 : index;

        if (adjusted >= ctrl.messages.length) {
          return const Padding(
            padding: EdgeInsets.symmetric(vertical: 8),
            child: ChatTypingIndicator(),
          );
        }

        // Show messages in reverse (newest at bottom)
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
    required this.colors,
    required this.turnNumber,
    required this.maxTurns,
    required this.sessionComplete,
    required this.onBack,
  });

  final LogMyPlateThemeColors colors;
  final int turnNumber;
  final int maxTurns;
  final bool sessionComplete;
  final VoidCallback onBack;

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
                  'AI Nutritionist',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: colors.textPrimary,
                  ),
                ),
                Text(
                  'Based on your last 7 days',
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    color: colors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          if (!sessionComplete)
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
