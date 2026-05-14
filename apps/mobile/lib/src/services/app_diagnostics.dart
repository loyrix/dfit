import 'package:flutter/foundation.dart';

class DiagnosticEntry {
  const DiagnosticEntry({
    required this.timestamp,
    required this.scope,
    required this.message,
    this.context = const {},
  });

  final DateTime timestamp;
  final String scope;
  final String message;
  final Map<String, Object?> context;

  String get compactTime {
    final hour = timestamp.hour.toString().padLeft(2, '0');
    final minute = timestamp.minute.toString().padLeft(2, '0');
    return '$hour:$minute';
  }
}

class AppDiagnostics {
  AppDiagnostics._();

  static final AppDiagnostics instance = AppDiagnostics._();
  static const _maxEntries = 40;

  final List<DiagnosticEntry> _entries = [];

  List<DiagnosticEntry> get entries => List.unmodifiable(_entries.reversed);

  void record(
    String scope,
    Object error, {
    StackTrace? stackTrace,
    Map<String, Object?> context = const {},
  }) {
    final entry = DiagnosticEntry(
      timestamp: DateTime.now(),
      scope: scope,
      message: _messageFor(error),
      context: context,
    );
    _entries.add(entry);
    if (_entries.length > _maxEntries) {
      _entries.removeRange(0, _entries.length - _maxEntries);
    }

    debugPrint('[DFit][$scope] ${entry.message}');
    if (context.isNotEmpty) debugPrint('[DFit][$scope] context=$context');
    if (stackTrace != null) debugPrintStack(stackTrace: stackTrace);
  }

  @visibleForTesting
  void clear() {
    _entries.clear();
  }

  String _messageFor(Object error) {
    final message = error.toString().trim();
    return message.isEmpty ? error.runtimeType.toString() : message;
  }
}
