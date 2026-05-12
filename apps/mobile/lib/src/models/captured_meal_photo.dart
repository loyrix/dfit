import 'dart:typed_data';

class CapturedMealPhoto {
  const CapturedMealPhoto({
    required this.bytes,
    required this.mimeType,
    required this.fileName,
  });

  final Uint8List bytes;
  final String mimeType;
  final String fileName;

  int get byteSize => bytes.length;
}
