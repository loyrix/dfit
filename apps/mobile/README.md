# LogMyPlate Mobile

Flutter iOS + Android client for the LogMyPlate MVP.

## API Target

Mobile builds default to the deployed API at `https://logmyplate-api.vercel.app`.
This keeps Xcode and device launches working even when no `--dart-define` is
passed.

To test against the local API, start it from the repo root:

```sh
pnpm --filter @logmyplate/api dev
```

iOS simulator local API:

```sh
flutter run --dart-define=LOGMYPLATE_API_BASE_URL=http://127.0.0.1:4000
```

Android emulator local API:

```sh
flutter run --dart-define=LOGMYPLATE_API_BASE_URL=http://10.0.2.2:4000
```

For a physical device against your local Mac, pass
`--dart-define=LOGMYPLATE_API_BASE_URL=http://YOUR_MAC_IP:4000` and run the API with
`API_HOST=0.0.0.0`.

## Local Build Configuration

For local device testing, keep runtime build values in the repo root `.env`.
The file is ignored by git. Xcode and Android Gradle read the relevant
allowlisted keys for their platform and pass them to Flutter as dart defines:

- `LOGMYPLATE_API_BASE_URL`
- `LOGMYPLATE_GOOGLE_WEB_CLIENT_ID`
- `LOGMYPLATE_GOOGLE_IOS_CLIENT_ID`
- `LOGMYPLATE_GOOGLE_ANDROID_CLIENT_ID`
- `LOGMYPLATE_REWARDED_AD_UNIT_ID`

This means Xcode's Play button and Android Studio/Gradle runs use the same
local config as terminal `flutter run`. Explicit CLI or CI dart defines still
win over `.env`, so release automation can pass fixed values without editing
local files.

## AdMob Configuration

Debug builds use Google's demo AdMob app IDs and rewarded ad unit IDs so local
testing cannot generate production ad traffic.

Release builds must use LogMyPlate production AdMob IDs:

- iOS native app ID: `ca-app-pub-6936425975956435~6044171348`
- iOS rewarded scan unlock ad unit:
  `ca-app-pub-6936425975956435/9427362674`
- Android native app ID: `ca-app-pub-6936425975956435~2270550089`
- Android rewarded scan unlock ad unit:
  `ca-app-pub-6936425975956435/2997685695`

The Flutter ad service uses production rewarded ad units in release builds and
demo rewarded ad units in debug builds. A local
`LOGMYPLATE_REWARDED_AD_UNIT_ID` dart define can still override the ad unit for
targeted testing.

iOS App Store archive example:

```sh
flutter build ipa --release \
  --build-name=1.0.0 \
  --build-number=1
```

Android release example:

```sh
flutter build appbundle --release \
  --build-name=1.0.0 \
  --build-number=1
```

For Google Play uploads, prefer the release helper from the repo root:

```sh
scripts/mobile/build-android-play-release.sh --build-number 11
```

The build number is the Android `versionCode` and must be higher than every
build already uploaded to Play Console. The helper validates local release
signing, runs `flutter pub get`, `flutter analyze`, `flutter test`, builds a
signed `.aab`, verifies the bundle signature when `jarsigner` is available, and
copies the upload-ready bundle to `apps/mobile/build/playstore/`.
