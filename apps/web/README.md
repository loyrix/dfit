# LogMyPlate: AI Calorie Tracker — Web

Production marketing, legal, and SEO website for [LogMyPlate: AI Calorie Tracker](https://logmyplate.com), a photo-based calorie and macro tracker for iOS and Android.

Built with **Next.js 16 + App Router + TypeScript + Tailwind CSS 4**.

## Development

```bash
# From repo root
pnpm install
pnpm --filter web dev

# Type check
pnpm --filter web typecheck

# Production build
pnpm --filter web build
```

## Production Domains

| Use          | Domain                                                   |
| ------------ | -------------------------------------------------------- |
| Website      | `logmyplate.com`                                         |
| API backend  | `api.logmyplate.com` as a separate Vercel/API deployment |
| AdMob seller | `https://logmyplate.com/app-ads.txt`                     |

## Vercel Project Settings

| Setting          | Value          |
| ---------------- | -------------- |
| Root Directory   | `apps/web`     |
| Framework Preset | Next.js        |
| Install Command  | `pnpm install` |
| Build Command    | `pnpm build`   |
| Output Directory | `.next`        |

## Key Files

| Path                         | Purpose                                          |
| ---------------------------- | ------------------------------------------------ |
| `config/app.ts`              | App metadata, store URLs, domains, support email |
| `app/layout.tsx`             | Root SEO metadata, app links, icons, theme color |
| `app/sitemap.ts`             | Sitemap served at `/sitemap.xml`                 |
| `app/robots.ts`              | Robots rules served at `/robots.txt`             |
| `app/opengraph-image.tsx`    | Generated social share image                     |
| `app/guides/content.ts`      | SEO guide/blog content source                    |
| `app/privacy/page.tsx`       | Privacy Policy draft                             |
| `app/terms/page.tsx`         | Terms of Service draft                           |
| `app/data-deletion/page.tsx` | Account and data deletion instructions           |
| `public/app-ads.txt`         | AdMob publisher verification                     |

## Launch Checklist

- Confirm App Store and Google Play URLs in `config/app.ts`.
- Confirm `support@logmyplate.com` inbox exists and is monitored.
- Confirm `api.logmyplate.com` is configured for the backend project.
- Verify `https://logmyplate.com/app-ads.txt` returns the AdMob seller line.
- Submit `/privacy`, `/terms`, and `/data-deletion` URLs in App Store Connect and Google Play Console as needed.
- Have the legal pages reviewed by a qualified lawyer before final store submission.

## SEO

The site includes:

- Root metadata with canonical URL, Open Graph, Twitter card, app links, icons, and manifest.
- Generated Open Graph image at `/opengraph-image`.
- `robots.txt` and `sitemap.xml`.
- Structured data for the homepage, guide index, guide articles, FAQs, privacy, terms, and data deletion pages.
- Dynamic guide routes generated from `app/guides/content.ts`.

## Theme

The site follows the mobile app palette and supports light/dark/system themes via `next-themes`.
