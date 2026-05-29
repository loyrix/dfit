import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';

class LogMyPlateLinks {
  const LogMyPlateLinks._();

  static final deleteAccountDeepLink = Uri.parse('logmyplate://delete-account');
  static final support = Uri.parse('https://logmyplate.com/support');
  static final accountSupport = Uri.parse(
    'https://logmyplate.com/support?reason=account',
  );
  static final dataDeletion = Uri.parse('https://logmyplate.com/data-deletion');
  static final privacy = Uri.parse('https://logmyplate.com/privacy');
  static final terms = Uri.parse('https://logmyplate.com/terms');
}

enum LogMyPlateDeepLink { deleteAccount }

LogMyPlateDeepLink? parseLogMyPlateDeepLink(Uri uri) {
  final scheme = uri.scheme.toLowerCase();
  final host = uri.host.toLowerCase();
  final path = uri.pathSegments
      .map((segment) => segment.toLowerCase())
      .join('/');

  if (scheme == 'logmyplate') {
    if (host == 'delete-account' || path == 'delete-account') {
      return LogMyPlateDeepLink.deleteAccount;
    }
    if ((host == 'account' && path == 'delete') || path == 'account/delete') {
      return LogMyPlateDeepLink.deleteAccount;
    }
  }

  if (scheme == 'https' &&
      (host == 'logmyplate.com' || host == 'www.logmyplate.com') &&
      (path == 'delete-account' || path == 'data-deletion')) {
    return LogMyPlateDeepLink.deleteAccount;
  }

  return null;
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
