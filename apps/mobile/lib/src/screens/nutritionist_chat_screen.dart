import 'package:logmyplate_mobile/src/widgets/premium_button.dart';
import 'package:flutter/material.dart';
import '../theme/logmyplate_spacing.dart';
import 'package:flutter/services.dart';

import '../state/nutritionist_controller.dart';
import '../theme/logmyplate_colors.dart';
import '../theme/logmyplate_theme.dart';
import '../widgets/chat_message_bubble.dart';
import '../widgets/chat_typing_indicator.dart';
import '../widgets/glass/glass_backdrop.dart';
import '../widgets/glass/glass_cards.dart';
import '../widgets/glass/glass_surface.dart';
import '../widgets/primitive_icons.dart';
import '../widgets/nutritionist_suggested_chip.dart';
import 'package:logmyplate_mobile/src/widgets/glass/glass_wrapper.dart';
import '../services/logmyplate_api_client.dart';
import 'chat_history_screen.dart';

class NutritionistChatScreen extends StatefulWidget {
  const NutritionistChatScreen({
    super.key,
    required this.controller,
    this.focusMealId,
    this.existingSessionId,
    this.onPremiumRequired,
  });

  final NutritionistController controller;
  final String? focusMealId;
  final String? existingSessionId;
  final VoidCallback? onPremiumRequired;

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
        child: Padding(
          padding: const EdgeInsets.all(LogMyPlateSpacing.itemSpacing),
          child: LiteGlassCard(
            padding: const EdgeInsets.fromLTRB(18, 18, 18, 16),
            borderRadius: BorderRadius.circular(20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Center(
                  child: Container(
                    width: 38,
                    height: 5,
                    decoration: BoxDecoration(
                      color: colors.textTertiary.withValues(alpha: 0.36),
                      borderRadius: BorderRadius.circular(99),
                    ),
                  ),
                ),
                const SizedBox(height: LogMyPlateSpacing.sectionSpacing),
                Row(
                  children: [
                    Container(
                      width: 42,
                      height: 42,
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
                          Text(
                            'Exit chat?',
                            style: Theme.of(ctx).textTheme.titleMedium,
                          ),
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
                const SizedBox(height: LogMyPlateSpacing.sectionSpacing),
                PremiumButton(
                  onPressed: () => Navigator.of(ctx).pop(true),

                  child: const Text('Exit'),
                ),
                const SizedBox(height: 8),
                GlassWrapper(
                  child: TextButton(
                    onPressed: () => Navigator.of(ctx).pop(false),
                    child: const Text('Stay'),
                  ),
                ),
              ],
            ),
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
        backgroundColor: Colors.transparent,
        extendBodyBehindAppBar: true,
        body: GlassBackdrop(
          child: SafeArea(
            child: Column(
              children: [
                _ChatAppBar(
                  readOnly: ctrl.readOnly,
                  colors: colors,
                  turnNumber: ctrl.turnNumber,
                  maxTurns: ctrl.maxTurns,
                  sessionComplete: ctrl.sessionComplete,
                  focusMealId: widget.focusMealId,
                  apiClient: widget.controller.apiClient,
                  onNewChat: ctrl.readOnly
                      ? () {
                          final fresh = NutritionistController(
                            apiClient: widget.controller.apiClient,
                          );
                          Navigator.of(context).pushReplacement(
                            MaterialPageRoute(
                              builder: (_) =>
                                  NutritionistChatScreen(controller: fresh),
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
                if (widget.focusMealId != null)
                  _FocusMealBanner(colors: colors),
                if (ctrl.readOnly && ctrl.messages.isNotEmpty)
                  _ReadOnlyBanner(
                    colors: colors,
                    messageCount: ctrl.turnNumber,
                  ),
                Expanded(child: _buildMessageList(ctrl, colors)),
                if (!ctrl.readOnly &&
                    ctrl.suggestedFollowUps.isNotEmpty &&
                    !ctrl.sessionComplete)
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
                    padding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
                    child: SizedBox(
                      width: double.infinity,
                      height: 52,
                      child: PremiumButton.icon(
                        onPressed: () {
                          final fresh = NutritionistController(
                            apiClient: widget.controller.apiClient,
                          );
                          Navigator.of(context).pushReplacement(
                            MaterialPageRoute(
                              builder: (_) =>
                                  NutritionistChatScreen(controller: fresh),
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

  Widget _buildMessageList(
    NutritionistController ctrl,
    LogMyPlateThemeColors colors,
  ) {
    if (ctrl.creatingSession || ctrl.loadingHistory) {
      return const Center(child: CircularProgressIndicator());
    }

    if (ctrl.error != null && ctrl.messages.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(40),
          child: LiteGlassCard(
            padding: const EdgeInsets.all(24),
            borderRadius: BorderRadius.circular(
              LogMyPlateSpacing.elementBorderRadius,
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Icons.error_outline_rounded,
                  color: LogMyPlateColors.destructive.withValues(alpha: 0.7),
                  size: 36,
                ),
                const SizedBox(height: LogMyPlateSpacing.itemSpacing),
                Text(
                  'Unable to load',
                  style: Theme.of(
                    context,
                  ).textTheme.titleMedium?.copyWith(color: colors.textPrimary),
                ),
                const SizedBox(height: 8),
                Text(
                  ctrl.error!,
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: colors.textSecondary,
                    height: 1.35,
                  ),
                ),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  child: PremiumButton(
                    onPressed: ctrl.premiumRequired
                        ? (widget.onPremiumRequired ?? () {})
                        : () {
                            if (widget.existingSessionId != null) {
                              widget.controller.loadExistingSession(
                                widget.existingSessionId!,
                              );
                            } else {
                              ctrl.startSession(
                                focusMealId: widget.focusMealId,
                              );
                            }
                          },
                    child: Text(ctrl.premiumRequired ? 'Get Premium' : 'Retry'),
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return ListView.builder(
      controller: _scrollController,
      reverse: true,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      itemCount:
          ctrl.messages.length +
          (ctrl.sendingMessage ? 1 : 0) +
          ((ctrl.sessionComplete && !ctrl.readOnly) ? 1 : 0) +
          ((ctrl.error != null && ctrl.messages.isNotEmpty) ? 1 : 0),
      itemBuilder: (context, index) {
        int currentIndex = index;

        if (ctrl.sessionComplete && !ctrl.readOnly) {
          if (currentIndex == 0) {
            return Padding(
              padding: const EdgeInsets.symmetric(vertical: 16),
              child: _SessionCompleteCard(
                colors: colors,
                onNewSession: () =>
                    ctrl.startSession(focusMealId: widget.focusMealId),
              ),
            );
          }
          currentIndex--;
        }

        if (ctrl.sendingMessage) {
          if (currentIndex == 0) {
            return const Padding(
              padding: EdgeInsets.symmetric(vertical: 8),
              child: ChatTypingIndicator(),
            );
          }
          currentIndex--;
        }

        if (ctrl.error != null && ctrl.messages.isNotEmpty) {
          if (currentIndex == 0) {
            return Padding(
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.error_outline_rounded,
                    color: LogMyPlateColors.destructive,
                    size: 16,
                  ),
                  const SizedBox(width: 8),
                  Flexible(
                    child: Text(
                      ctrl.error!,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: LogMyPlateColors.destructive,
                      ),
                    ),
                  ),
                ],
              ),
            );
          }
          currentIndex--;
        }

        if (currentIndex < 0 || currentIndex >= ctrl.messages.length) {
          return const SizedBox.shrink();
        }

        final messageIndex = ctrl.messages.length - 1 - currentIndex;
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
    required this.apiClient,
    this.focusMealId,
    this.onNewChat,
  });

  final bool readOnly;
  final LogMyPlateThemeColors colors;
  final int turnNumber;
  final int maxTurns;
  final bool sessionComplete;
  final VoidCallback onBack;
  final LogMyPlateApiClient apiClient;
  final String? focusMealId;
  final VoidCallback? onNewChat;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      padding: const EdgeInsets.fromLTRB(8, 8, 16, 8),
      decoration: readOnly
          ? BoxDecoration(
              border: Border(
                bottom: BorderSide(color: colors.border, width: 0.3),
              ),
            )
          : null,
      child: Row(
        children: [
          IconButton(
            tooltip: 'Back',
            onPressed: onBack,
            icon: const BackMark(),
          ),
          const SizedBox(width: 4),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'AI Nutritionist',
                  style: Theme.of(
                    context,
                  ).textTheme.titleMedium?.copyWith(color: colors.textPrimary),
                ),
                Text(
                  readOnly
                      ? 'Past session · $turnNumber message${turnNumber == 1 ? '' : 's'}'
                      : focusMealId != null
                      ? 'Analyzing specific meal'
                      : 'Based on your last 7 days',
                  style: Theme.of(
                    context,
                  ).textTheme.labelSmall?.copyWith(color: colors.textSecondary),
                ),
              ],
            ),
          ),
          if (readOnly && onNewChat != null)
            PremiumButton.icon(
              onPressed: onNewChat,
              icon: const Icon(Icons.add_rounded, size: 14),
              label: const Text('New chat'),
            ),
          if (!readOnly && onNewChat == null) ...[
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: LogMyPlateColors.accent.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(99),
              ),
              child: Text(
                '$turnNumber/$maxTurns',
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: isDark
                      ? LogMyPlateColors.accent
                      : LogMyPlateColors.accentDeep,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            const SizedBox(width: LogMyPlateSpacing.xsSpacing),
            IconButton(
              icon: Icon(Icons.history_rounded, color: colors.textPrimary),
              onPressed: () {
                Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (_) => ChatHistoryScreen(apiClient: apiClient),
                  ),
                );
              },
            ),
          ],
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
    return GlassSurface(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          border: Border(top: BorderSide(color: colors.border, width: 0.3)),
        ),
        child: Row(
          children: [
            Expanded(
              child: TextField(
                controller: controller,
                focusNode: focusNode,
                textInputAction: TextInputAction.send,
                minLines: 1,
                maxLines: 5,
                onSubmitted: (_) => onSend(),
                decoration: InputDecoration(
                  hintText: 'Ask anything about your nutrition...',
                  hintStyle: Theme.of(
                    context,
                  ).textTheme.bodySmall?.copyWith(color: colors.textTertiary),
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 10,
                  ),
                ),
                style: Theme.of(
                  context,
                ).textTheme.bodySmall?.copyWith(color: colors.textPrimary),
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
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 32),
      child: LiteGlassCard(
        padding: const EdgeInsets.all(20),
        borderRadius: BorderRadius.circular(
          LogMyPlateSpacing.elementBorderRadius,
        ),
        child: Column(
          children: [
            Icon(
              Icons.check_circle_rounded,
              color: LogMyPlateColors.accent,
              size: 40,
            ),
            const SizedBox(height: LogMyPlateSpacing.itemSpacing),
            Text(
              'Session complete',
              style: Theme.of(
                context,
              ).textTheme.titleMedium?.copyWith(color: colors.textPrimary),
            ),
            const SizedBox(height: 8),
            Text(
              'You can start a new session anytime.',
              textAlign: TextAlign.center,
              style: Theme.of(
                context,
              ).textTheme.bodySmall?.copyWith(color: colors.textSecondary),
            ),
            const SizedBox(height: LogMyPlateSpacing.sectionSpacing),
            GlassWrapper(
              child: ElevatedButton(
                onPressed: onNewSession,
                child: const Text('New session'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ReadOnlyBanner extends StatelessWidget {
  const _ReadOnlyBanner({required this.colors, required this.messageCount});

  final LogMyPlateThemeColors colors;
  final int messageCount;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: colors.mutedFill,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        children: [
          Icon(Icons.history_rounded, size: 16, color: colors.textTertiary),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              'Viewing a past conversation with $messageCount message${messageCount == 1 ? '' : 's'}. Start a new session to ask fresh questions.',
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                color: colors.textSecondary,
                height: 1.3,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _FocusMealBanner extends StatelessWidget {
  const _FocusMealBanner({required this.colors});

  final LogMyPlateThemeColors colors;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 12, 16, 4),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: LogMyPlateColors.accent.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: LogMyPlateColors.accent.withValues(alpha: 0.25),
        ),
      ),
      child: Row(
        children: [
          Icon(
            Icons.auto_awesome_rounded,
            size: 18,
            color: Theme.of(context).brightness == Brightness.dark
                ? LogMyPlateColors.accent
                : LogMyPlateColors.accentDeep,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              'The AI Nutritionist is currently focused on analyzing this specific meal. It still considers your daily and weekly progress.',
              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                color: colors.textPrimary,
                height: 1.3,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
