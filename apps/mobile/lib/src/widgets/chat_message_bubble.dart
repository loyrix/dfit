import 'package:flutter/material.dart';
import '../theme/logmyplate_spacing.dart';

import '../models/chat.dart';
import '../theme/logmyplate_colors.dart';
import '../theme/logmyplate_theme.dart';
import 'glass/glass_cards.dart';

class ChatMessageBubble extends StatelessWidget {
  const ChatMessageBubble({
    super.key,
    required this.message,
  });

  final ChatMessage message;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;

    if (message.isAssistant) {
      return _AiBubble(colors: colors, content: message.content);
    }

    return _UserBubble(colors: colors, content: message.content);
  }
}

class _AiBubble extends StatelessWidget {
  const _AiBubble({required this.colors, required this.content});

  final LogMyPlateThemeColors colors;
  final String content;

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: Alignment.centerLeft,
      child: ConstrainedBox(
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.85,
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Container(
              width: 28,
              height: 28,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                gradient: LinearGradient(
                  colors: [Color(0xFFFFE3A3), LogMyPlateColors.accent],
                ),
              ),
              child: const Icon(
                Icons.auto_awesome_rounded,
                size: 16,
                color: Color(0xFF3D2E07),
              ),
            ),
            const SizedBox(width: 8),
            Flexible(
              child: LiteGlassCard(
                padding: const EdgeInsets.all(LogMyPlateSpacing.cardPadding),
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(4),
                  topRight: Radius.circular(18),
                  bottomLeft: Radius.circular(18),
                  bottomRight: Radius.circular(18),
                ),
                child: Text(
                  _parseMarkdown(content),
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: colors.textPrimary,
                    height: 1.45,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _parseMarkdown(String text) {
    return text
        .replaceAllMapped(RegExp(r'\*\*(.+?)\*\*'), (m) => m[1]!)
        .replaceAll(RegExp(r'^[\s]*[-*][\s]+'), '• ');
  }
}

class _UserBubble extends StatelessWidget {
  const _UserBubble({required this.colors, required this.content});

  final LogMyPlateThemeColors colors;
  final String content;

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: Alignment.centerRight,
      child: ConstrainedBox(
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.80,
        ),
        child: LiteGlassCard(
          padding: const EdgeInsets.all(LogMyPlateSpacing.cardPadding),
          borderRadius: const BorderRadius.only(
            topLeft: Radius.circular(18),
            topRight: Radius.circular(4),
            bottomLeft: Radius.circular(18),
            bottomRight: Radius.circular(18),
          ),
          child: Text(
            content,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: colors.textPrimary,
              height: 1.45,
            ),
          ),
        ),
      ),
    );
  }
}
