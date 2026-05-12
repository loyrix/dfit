# DFit Mobile

Flutter iOS + Android client for the DFit MVP.

## API Target

Mobile builds default to the deployed API at `https://dfit-api.vercel.app`.
This keeps Xcode and device launches working even when no `--dart-define` is
passed.

To test against the local API, start it from the repo root:

```sh
pnpm --filter @dfit/api dev
```

iOS simulator local API:

```sh
flutter run --dart-define=DFIT_API_BASE_URL=http://127.0.0.1:4000
```

Android emulator local API:

```sh
flutter run --dart-define=DFIT_API_BASE_URL=http://10.0.2.2:4000
```

For a physical device against your local Mac, pass
`--dart-define=DFIT_API_BASE_URL=http://YOUR_MAC_IP:4000` and run the API with
`API_HOST=0.0.0.0`.
