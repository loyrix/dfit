<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# Web Agent Rules

Read the root `AGENTS.md` first. These rules apply to the public website in
`apps/web`.

## First Steps

- Run `git status --short` from the repo root before editing.
- Inspect `apps/web/package.json`, `README.md`, `app`, `components`, `config`,
  and existing styles before changing behavior or UI.
- Read the relevant installed Next.js 16 documentation before using routing,
  metadata, server/client component, image, font, cache, or route-handler APIs.

## Product And Design

- Preserve the public website's core purpose: trustworthy app download,
  nutrition/AI-calorie positioning, support, privacy, terms, account deletion,
  guides, metadata, and app-store discovery.
- Reuse existing components, theme variables, Tailwind conventions, layout
  rhythm, app screenshots, and `APP_CONFIG` values before adding new patterns.
- Keep pages responsive, accessible, and SEO-safe. Metadata, canonical URLs,
  Open Graph, sitemap, robots, app links, and manifest behavior matter.
- Do not add implementation explanations to visible UI unless the user requested
  product copy.
- Keep app-store links, package IDs, app IDs, support email, and legal pages
  consistent with `APP_CONFIG` and existing docs.

## Security And Privacy

- Keep secrets and private operational data out of this app. Public website code
  should not depend on server-only admin credentials or local `.env` secrets.
- Treat privacy, data deletion, and support pages as policy-sensitive content.
  Make careful, minimal edits and preserve facts from existing copy/docs.

## Tests And Checks

- This app currently has type/build checks rather than a local test suite.
- Useful checks:
  - `pnpm --filter web typecheck`
  - `pnpm --filter web build`
- If shared packages or API-facing behavior change, run their checks too.
