# DFit Mobile

Flutter iOS + Android client for the DFit MVP.

## API Target

Debug builds default to the local API so iOS Simulator and Android Emulator can
talk to your Mac during development.

Start the local API from the repo root:

```sh
pnpm --filter @dfit/api dev
```

Then run mobile:

```sh
flutter run
```

Defaults:

- iOS simulator: `http://127.0.0.1:4000`
- Android emulator: `http://10.0.2.2:4000`
- Release builds: `https://dfit-api.vercel.app`

To test the deployed API from a debug emulator/device:

```sh
flutter run --dart-define=DFIT_API_BASE_URL=https://dfit-api.vercel.app
```

For a physical device against your local Mac, pass
`--dart-define=DFIT_API_BASE_URL=http://YOUR_MAC_IP:4000` and run the API with
`API_HOST=0.0.0.0`.
