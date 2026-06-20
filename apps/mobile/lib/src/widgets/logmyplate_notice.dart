import 'dart:async';

import 'package:flutter/material.dart';

import '../theme/logmyplate_colors.dart';
import '../theme/logmyplate_theme.dart';
import 'glass/glass_cards.dart';
import 'package:logmyplate_mobile/src/widgets/glass/glass_wrapper.dart';

enum LogMyPlateNoticeTone { success, info, warning, error }

class LogMyPlateNotice {
  LogMyPlateNotice._();

  static _NoticeHandle? _active;

  static void show(
    BuildContext context, {
    required LogMyPlateNoticeTone tone,
    required String title,
    String? message,
    String? actionLabel,
    VoidCallback? onAction,
    Duration duration = const Duration(milliseconds: 2800),
  }) {
    final overlay = Overlay.maybeOf(context, rootOverlay: true);
    if (overlay == null) return;

    showInOverlay(
      overlay,
      tone: tone,
      title: title,
      message: message,
      actionLabel: actionLabel,
      onAction: onAction,
      duration: duration,
    );
  }

  static void showInOverlay(
    OverlayState overlay, {
    required LogMyPlateNoticeTone tone,
    required String title,
    String? message,
    String? actionLabel,
    VoidCallback? onAction,
    Duration duration = const Duration(milliseconds: 2800),
  }) {
    _active?.dismiss();

    late _NoticeHandle handle;
    late OverlayEntry entry;
    handle = _NoticeHandle(
      onClosed: () {
        entry.remove();
        if (identical(_active, handle)) _active = null;
      },
    );

    entry = OverlayEntry(
      builder: (_) => _LogMyPlateNoticeHost(
        handle: handle,
        tone: tone,
        title: title,
        message: message,
        actionLabel: actionLabel,
        onAction: onAction,
        duration: duration,
      ),
    );

    handle.entry = entry;
    _active = handle;
    overlay.insert(entry);
  }

  static void hideCurrent() {
    _active?.dismiss();
  }
}

class _NoticeHandle {
  _NoticeHandle({required this.onClosed});

  final VoidCallback onClosed;
  OverlayEntry? entry;
  _LogMyPlateNoticeHostState? state;
  bool _removed = false;

  void dismiss() {
    if (_removed) return;
    final noticeState = state;
    if (noticeState == null) {
      _removed = true;
      onClosed();
      return;
    }
    noticeState.dismiss();
  }

  void markRemoved() {
    _removed = true;
  }
}

class _LogMyPlateNoticeHost extends StatefulWidget {
  const _LogMyPlateNoticeHost({
    required this.handle,
    required this.tone,
    required this.title,
    required this.message,
    required this.actionLabel,
    required this.onAction,
    required this.duration,
  });

  final _NoticeHandle handle;
  final LogMyPlateNoticeTone tone;
  final String title;
  final String? message;
  final String? actionLabel;
  final VoidCallback? onAction;
  final Duration duration;

  @override
  State<_LogMyPlateNoticeHost> createState() => _LogMyPlateNoticeHostState();
}

class _LogMyPlateNoticeHostState extends State<_LogMyPlateNoticeHost>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<Offset> _offset;
  late final Animation<double> _opacity;
  Timer? _timer;
  bool _closing = false;

  @override
  void initState() {
    super.initState();
    widget.handle.state = this;
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 260),
      reverseDuration: const Duration(milliseconds: 180),
    );
    final curve = CurvedAnimation(
      parent: _controller,
      curve: Curves.easeOutCubic,
      reverseCurve: Curves.easeInCubic,
    );
    _offset = Tween<Offset>(
      begin: const Offset(0, -0.22),
      end: Offset.zero,
    ).animate(curve);
    _opacity = Tween<double>(begin: 0, end: 1).animate(curve);

    _controller.forward();
    _timer = Timer(widget.duration, dismiss);
  }

  @override
  void dispose() {
    _timer?.cancel();
    if (identical(widget.handle.state, this)) widget.handle.state = null;
    _controller.dispose();
    super.dispose();
  }

  Future<void> dismiss() async {
    if (_closing) return;
    _closing = true;
    _timer?.cancel();
    if (mounted) {
      await _controller.reverse();
    }
    widget.handle.markRemoved();
    widget.handle.onClosed();
  }

  void _handleAction() {
    final action = widget.onAction;
    dismiss();
    action?.call();
  }

  @override
  Widget build(BuildContext context) {
    final top = MediaQuery.paddingOf(context).top + 12;

    return Positioned(
      top: top,
      left: 16,
      right: 16,
      child: SafeArea(
        top: false,
        bottom: false,
        child: FadeTransition(
          opacity: _opacity,
          child: SlideTransition(
            position: _offset,
            child: _LogMyPlateNoticeCard(
              tone: widget.tone,
              title: widget.title,
              message: widget.message,
              actionLabel: widget.actionLabel,
              onAction: widget.onAction == null ? null : _handleAction,
            ),
          ),
        ),
      ),
    );
  }
}

class _LogMyPlateNoticeCard extends StatelessWidget {
  const _LogMyPlateNoticeCard({
    required this.tone,
    required this.title,
    required this.message,
    required this.actionLabel,
    required this.onAction,
  });

  final LogMyPlateNoticeTone tone;
  final String title;
  final String? message;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    final colors = context.logmyplate;
    final toneColor = _toneColor(context);
    final icon = _toneIcon();

    return Semantics(
      liveRegion: true,
      label: message == null ? title : '$title. $message',
      child: Material(
        color: Colors.transparent,
        child: LiteGlassCard(
          borderRadius: BorderRadius.circular(22),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(14, 12, 14, 12),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Container(
                      width: 38,
                      height: 38,
                      decoration: BoxDecoration(
                        color: toneColor.withValues(alpha: 0.16),
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: toneColor.withValues(alpha: 0.26),
                          width: 0.8,
                        ),
                      ),
                      child: Icon(icon, size: 20, color: toneColor),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            title,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: Theme.of(context).textTheme.bodyMedium
                                ?.copyWith(
                                  color: colors.textPrimary,
                                  fontWeight: FontWeight.w700,
                                  height: 1.15,
                                ),
                          ),
                          if (message != null) ...[
                            const SizedBox(height: 3),
                            Text(
                              message!,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: Theme.of(context).textTheme.bodySmall
                                  ?.copyWith(
                                    color: colors.textSecondary,
                                    height: 1.2,
                                  ),
                            ),
                          ],
                        ],
                      ),
                    ),
                    if (actionLabel != null && onAction != null) ...[
                      const SizedBox(width: 10),
                      GlassWrapper(child: TextButton(
                        onPressed: onAction,
                        style: TextButton.styleFrom(
                          foregroundColor: toneColor,
                          minimumSize: const Size(44, 34),
                          padding: const EdgeInsets.symmetric(horizontal: 10),
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        ),
                        child: Text(actionLabel!),
                      )),
                    ],
                  ],
                ),
              ),
            ),
          ),
    );
  }

  Color _toneColor(BuildContext context) {
    final colors = context.logmyplate;
    return switch (tone) {
      LogMyPlateNoticeTone.success => LogMyPlateColors.accent,
      LogMyPlateNoticeTone.info => colors.textPrimary,
      LogMyPlateNoticeTone.warning => LogMyPlateColors.accentLow,
      LogMyPlateNoticeTone.error => LogMyPlateColors.destructive,
    };
  }

  IconData _toneIcon() {
    return switch (tone) {
      LogMyPlateNoticeTone.success => Icons.check_rounded,
      LogMyPlateNoticeTone.info => Icons.auto_awesome_rounded,
      LogMyPlateNoticeTone.warning => Icons.priority_high_rounded,
      LogMyPlateNoticeTone.error => Icons.close_rounded,
    };
  }
}
