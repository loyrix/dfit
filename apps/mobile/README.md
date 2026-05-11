# DFit Mobile

Flutter iOS + Android client for the DFit MVP.

## Local API

Start the API from the repo root:

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
- Physical device: pass `--dart-define=DFIT_API_BASE_URL=http://YOUR_MAC_IP:4000`
  and run the API with `API_HOST=0.0.0.0`
