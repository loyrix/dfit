import 'dart:typed_data';

class CapturedMealPhoto {
  const CapturedMealPhoto({
    required this.bytes,
    required this.mimeType,
    required this.fileName,
    this.userHint,
  });

  final Uint8List bytes;
  final String mimeType;
  final String fileName;
  final String? userHint;

  int get byteSize => bytes.length;
}
