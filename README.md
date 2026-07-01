# LogMyPlate

Camera-first nutrition journal for iOS and Android.

This repository is intentionally scoped as a real monorepo foundation, not a throwaway prototype. The MVP is narrow:

```txt
Welcome -> Camera -> Analyze -> Review -> Confirm -> Today journal
```

The app is global, Indian-first in food understanding, anonymous-first in identity, and designed to avoid food-image storage.

Coding agents and AI assistants must read [AGENTS.md](AGENTS.md) before editing
this repository.

## Workspace

```txt
apps/
  mobile/        Flutter iOS + Android app
  api/           Fastify TypeScript API
  admin/         Next.js admin backoffice
  web/           Next.js public website

packages/
  contracts/     Zod API contracts
  design-tokens/ Shared LogMyPlate design tokens
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

Mobile builds default to the deployed API at `https://logmyplate-api.vercel.app`.
This keeps Xcode and device launches working even when no `--dart-define` is
passed.

To test against the local API, run the API first:

```sh
pnpm --filter @logmyplate/api dev
```

API documentation is available from the running server:

```txt
Swagger UI: http://127.0.0.1:4000/docs
OpenAPI YAML: http://127.0.0.1:4000/openapi.yaml
```

iOS simulator local API:

```sh
flutter run --dart-define=LOGMYPLATE_API_BASE_URL=http://127.0.0.1:4000
```

Android emulator local API:

```sh
flutter run --dart-define=LOGMYPLATE_API_BASE_URL=http://10.0.2.2:4000
```

For a physical phone against your local Mac, pass your Mac's LAN address:

```sh
API_HOST=0.0.0.0 pnpm --filter @logmyplate/api dev
flutter run --dart-define=LOGMYPLATE_API_BASE_URL=http://YOUR_MAC_IP:4000
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
API_DOCS_ENABLED=false
AI_PROVIDER=gemini
GEMINI_API_KEY
GEMINI_MODEL=gemini-2.5-flash
RESEND_API_KEY
PASSWORD_RESET_EMAIL_FROM=LogMyPlate <no-reply@logmyplate.com>
REVENUECAT_REST_API_KEY
REVENUECAT_WEBHOOK_AUTH_TOKEN
REVENUECAT_PREMIUM_ENTITLEMENT_ID=premium
PREMIUM_MONTHLY_SCAN_LIMIT=300
PREMIUM_DAILY_SCAN_LIMIT=10
```

The root `api/index.js` function forwards all routes to the compiled Fastify
serverless adapter in `apps/api/dist/vercel.js`. The empty `public/` directory
exists only to satisfy Vercel's static output directory check for API-only
deployments.

## Status

- Flutter app ships the full scan flow: Welcome, Today journal, Camera capture
  (`image_picker`), Analyzing, Review, Meal Detail, weekly journal, and Settings.
- Real food-photo analysis runs through Gemini (`AI_PROVIDER=gemini`), with a
  mock provider retained for tests and local dev.
- Premium is live via RevenueCat (`purchases_flutter`), including paywall,
  entitlement checks, and subscription management.
- Rewarded/interstitial ads are integrated via AdMob (`google_mobile_ads`).
- AI nutritionist chat and AI food-learning features are implemented (see
  `docs/ai-nutritionist.md` and `docs/ai-food-learning.md`).
- API exposes health/config/profile/journal/scan endpoints backed by Postgres
  when `DATABASE_URL` is set, with in-memory repositories for tests.
- Domain package has tested nutrition and quota logic.
- Admin backoffice (`apps/admin`) and public website (`apps/web`) are built on
  Next.js.
