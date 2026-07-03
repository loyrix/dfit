import 'dart:typed_data';

import 'package:flutter_image_compress/flutter_image_compress.dart';

/// Upload-ready photo produced by [optimizeMealPhotoForUpload].
class OptimizedMealPhoto {
  const OptimizedMealPhoto({required this.bytes, required this.mimeType});

  final Uint8List bytes;
  final String mimeType;
}

/// Comfortable target for the encoded photo. Base64 inflates bytes by ~33%
/// and the production API sits behind Vercel's hard ~4.5 MB request-body
/// limit, so staying near this target keeps uploads fast and safe.
const int mealPhotoTargetBytes = 2_500_000;

/// Absolute ceiling: 3 MB of image bytes becomes a ~4.1 MB JSON body after
/// base64, still under the 4.5 MB platform limit with headroom. Anything
/// larger would be rejected with a 413 before reaching the API.
const int mealPhotoMaxUploadBytes = 3_000_000;

/// Progressive re-encode attempts: (max dimension, JPEG quality). The picker
/// already caps captures at 1600 px, so the first passes mostly transcode
/// PNG/oversized images to JPEG without losing detail that matters for food
/// recognition.
const List<(int, int)> _attempts = [
  (1600, 85),
  (1600, 75),
  (1280, 65),
  (1024, 55),
];

/// Re-encodes a picked photo so it can never exceed the upload body limit.
///
/// `image_picker`'s `imageQuality` only applies to JPEG — PNG (screenshots,
/// some gallery sources) passes through uncompressed and a 1600 px
/// photographic PNG can exceed the limit on its own, which previously
/// surfaced as a raw 413 from production. This always transcodes toward
/// JPEG until the result fits [mealPhotoTargetBytes].
///
/// Returns null only when the photo cannot be brought under
/// [mealPhotoMaxUploadBytes] (callers should ask for another photo).
Future<OptimizedMealPhoto?> optimizeMealPhotoForUpload(
  Uint8List bytes,
  String mimeType,
) async {
  // Fast path: camera JPEGs are already resized + compressed by the picker.
  if (mimeType == 'image/jpeg' && bytes.length <= mealPhotoTargetBytes) {
    return OptimizedMealPhoto(bytes: bytes, mimeType: mimeType);
  }

  var bestBytes = bytes;
  var bestMimeType = mimeType;

  try {
    for (final (maxDimension, quality) in _attempts) {
      final compressed = await FlutterImageCompress.compressWithList(
        bytes,
        minWidth: maxDimension,
        minHeight: maxDimension,
        quality: quality,
        format: CompressFormat.jpeg,
      );
      if (compressed.length < bestBytes.length) {
        bestBytes = compressed;
        bestMimeType = 'image/jpeg';
      }
      if (compressed.length <= mealPhotoTargetBytes) {
        return OptimizedMealPhoto(bytes: compressed, mimeType: 'image/jpeg');
      }
    }
  } catch (_) {
    // Native compression failed; fall through to the raw size check so an
    // already-small photo still uploads.
  }

  if (bestBytes.length <= mealPhotoMaxUploadBytes) {
    return OptimizedMealPhoto(bytes: bestBytes, mimeType: bestMimeType);
  }
  return null;
}
