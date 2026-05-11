# DFit

Camera-first nutrition journal for iOS and Android.

This repository is intentionally scoped as a real monorepo foundation, not a throwaway prototype. The MVP is narrow:

```txt
Welcome -> Camera -> Analyze -> Review -> Confirm -> Today journal
```

The app is global, Indian-first in food understanding, anonymous-first in identity, and designed to avoid food-image storage.

## Workspace

```txt
apps/
  mobile/        Flutter iOS + Android app
  api/           Fastify TypeScript API

packages/
  contracts/     Zod API contracts
  design-tokens/ Shared DFit design tokens
  domain/        Pure nutrition/quota/domain logic
  sdk/           TypeScript API client

infra/
  db/            SQL migrations and seed files
```

## Commands

The repository is configured for pnpm + Turborepo.

```sh
pnpm install
pnpm test
pnpm typecheck
pnpm dev
pnpm mobile:analyze
pnpm mobile:test
```

Debug mobile builds default to the local API. Run the API before testing the
mobile scan flow locally:

```sh
pnpm --filter @dfit/api dev
```

Flutter defaults to `http://127.0.0.1:4000` on iOS simulator and `http://10.0.2.2:4000`
on Android emulator. Release builds default to the deployed API:
`https://dfit-api.vercel.app`.

To test the deployed API from a debug emulator/device:

```sh
flutter run --dart-define=DFIT_API_BASE_URL=https://dfit-api.vercel.app
```

For a physical phone against your local Mac, pass your Mac's LAN address:

```sh
API_HOST=0.0.0.0 pnpm --filter @dfit/api dev
flutter run --dart-define=DFIT_API_BASE_URL=http://YOUR_MAC_IP:4000
```

## Vercel API Deployment

Create the Vercel project from the repo root.

```txt
Root Directory: .
Install Command: pnpm install
Build Command: pnpm build
Output Directory: public
```

Set production environment variables in Vercel:

```txt
DATABASE_URL
NODE_ENV=production
AI_PROVIDER=mock
```

The root `api/index.js` function forwards all routes to the compiled Fastify
serverless adapter in `apps/api/dist/vercel.js`. The empty `public/` directory
exists only to satisfy Vercel's static output directory check for API-only
deployments.

## Phase 0 Status

- Flutter app scaffold exists with iOS/Android platform projects.
- Mobile shell includes Welcome, Today, Camera placeholder, Analyzing, Review, Meal Detail, and Settings.
- API has health/config/profile/journal/scan endpoints backed by Postgres when
  `DATABASE_URL` is configured, with in-memory repositories for tests.
- Domain package has tested nutrition and quota logic.
- Initial Supabase-compatible Postgres migration exists.

## Current Intentional Gaps

- Real camera plugin integration is deferred to scan-flow implementation.
- Supabase runtime connection is wired through the API repository layer.
- AdMob SSV is not wired yet.
- AI provider calls are mocked behind the planned adapter boundary.
- Account-link and premium screens are scaffold targets, not complete flows.
