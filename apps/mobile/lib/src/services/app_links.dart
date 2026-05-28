import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';

class LogMyPlateLinks {
  const LogMyPlateLinks._();

  static final support = Uri.parse('https://logmyplate.com/support');
  static final accountSupport = Uri.parse(
    'https://logmyplate.com/support?reason=account',
  );
  static final privacy = Uri.parse('https://logmyplate.com/privacy');
  static final terms = Uri.parse('https://logmyplate.com/terms');
}

Future<void> openLogMyPlateLink(
  BuildContext context,
  Uri url, {
  String copiedMessage = 'Link copied',
}) async {
  final opened = await launchUrl(url, mode: LaunchMode.externalApplication);
  if (opened || !context.mounted) return;

  await Clipboard.setData(ClipboardData(text: url.toString()));
  if (!context.mounted) return;

  ScaffoldMessenger.maybeOf(
    context,
  )?.showSnackBar(SnackBar(content: Text(copiedMessage)));
}
