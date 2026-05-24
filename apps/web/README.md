# LogMyPlate — Web

Marketing website for [LogMyPlate](https://logmyplate.com), a photo-based meal calorie and macro tracker for iOS and Android.

Built with **Next.js 16 + App Router + TypeScript + Tailwind CSS 4**.

---

## Development

```bash
# From repo root
pnpm install
cd apps/web
pnpm dev       # http://localhost:3000

# Type check
pnpm typecheck

# Build
pnpm build
```

---

## Deploying to Vercel

This package is designed to be deployed as a **standalone Vercel project** from the monorepo.

### Vercel project settings

| Setting              | Value                   |
| -------------------- | ----------------------- |
| **Root Directory**   | `apps/web`              |
| **Framework Preset** | Next.js                 |
| **Install Command**  | `pnpm install`          |
| **Build Command**    | `pnpm build`            |
| **Output Directory** | `.next` (auto-detected) |

### Recommended domains

| Use          | Domain                                                      |
| ------------ | ----------------------------------------------------------- |
| Landing page | `logmyplate.com`                                            |
| API backend  | `api.logmyplate.com` → `apps/api` (separate Vercel project) |

---

## Key files

| Path                 | Purpose                                                  |
| -------------------- | -------------------------------------------------------- |
| `app/config/app.ts`  | App Store URL, Play Store URL, API domain, support email |
| `public/app-ads.txt` | AdMob publisher verification (`pub-6936425975956435`)    |
| `app/sitemap.ts`     | SEO sitemap (auto-served at `/sitemap.xml`)              |
| `app/robots.ts`      | Robots.txt (auto-served at `/robots.txt`)                |

### Updating store URLs

Before launch, update `app/config/app.ts`:

```ts
appStoreUrl: "https://apps.apple.com/app/logmyplate/id<YOUR_APP_ID>",
playStoreUrl: "https://play.google.com/store/apps/details?id=<YOUR_PACKAGE_ID>",
```

---

## Legal pages

`/privacy` and `/terms` are engineering drafts based on actual app behavior.
**They must be reviewed by a qualified lawyer before App Store or Google Play submission.**

---

## Theme

The site supports light and dark themes via `next-themes`. The theme toggle is in the top-right nav. Default follows the user&apos;s system preference.
