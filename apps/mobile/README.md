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
- `LOGMYPLATE_FIREBASE_API_KEY`
- `LOGMYPLATE_FIREBASE_PROJECT_ID`
- `LOGMYPLATE_FIREBASE_MESSAGING_SENDER_ID`
- `LOGMYPLATE_FIREBASE_APP_ID`
- `LOGMYPLATE_FIREBASE_IOS_APP_ID`
- `LOGMYPLATE_FIREBASE_ANDROID_APP_ID`
- `LOGMYPLATE_FIREBASE_STORAGE_BUCKET`
- `LOGMYPLATE_FIREBASE_MEASUREMENT_ID`
- `LOGMYPLATE_FIREBASE_IOS_BUNDLE_ID`
- `LOGMYPLATE_FIREBASE_IOS_CLIENT_ID`
- `LOGMYPLATE_FIREBASE_ANDROID_CLIENT_ID`

This means Xcode's Play button and Android Studio/Gradle runs use the same
local config as terminal `flutter run`. Explicit CLI or CI dart defines still
win over `.env`, so release automation can pass fixed values without editing
local files.

## Firebase Analytics Configuration

Firebase Analytics is runtime-gated by the backoffice `Growth Controls`
analytics policy. If Firebase dart defines are missing, the analytics service is
a no-op and app startup continues normally. If Firebase is configured but the
backoffice analytics toggles are disabled, collection remains disabled.

Minimum Firebase dart defines for mobile analytics:

```txt
LOGMYPLATE_FIREBASE_API_KEY
LOGMYPLATE_FIREBASE_PROJECT_ID
LOGMYPLATE_FIREBASE_MESSAGING_SENDER_ID
LOGMYPLATE_FIREBASE_IOS_APP_ID
LOGMYPLATE_FIREBASE_ANDROID_APP_ID
```

Optional Firebase dart defines:

```txt
LOGMYPLATE_FIREBASE_APP_ID
LOGMYPLATE_FIREBASE_STORAGE_BUCKET
LOGMYPLATE_FIREBASE_MEASUREMENT_ID
LOGMYPLATE_FIREBASE_IOS_BUNDLE_ID
LOGMYPLATE_FIREBASE_IOS_CLIENT_ID
LOGMYPLATE_FIREBASE_ANDROID_CLIENT_ID
```

## Android Google Sign-In

Android uses the `google_sign_in` plugin without `google-services.json`. Keep
`LOGMYPLATE_GOOGLE_WEB_CLIENT_ID` set to the Web OAuth client ID; the app passes
that value to Google as `serverClientId`.

The Android OAuth client in Google Cloud must use package `com.logmyplate.app`
and the signing SHA for every build you test:

- local debug SHA-1:
  `62:39:CA:E9:D3:AA:02:A6:F5:15:92:BC:72:38:85:E4:6B:45:90:2C`
- current upload/release SHA-1:
  `B4:E7:82:92:9C:F8:83:F1:82:22:EF:27:4A:5D:D3:D0:3E:E6:CC:BC`
- Google Play App Signing SHA-1 from Play Console, for internal testing and
  production installs.

The API must also accept the same Web OAuth client ID in
`AUTH_GOOGLE_CLIENT_IDS`, otherwise the app can complete native Google sign-in
but the backend will reject the returned ID token.

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
