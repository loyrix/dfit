<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes - APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `../web/node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# Admin Agent Rules

Read the root `AGENTS.md` first. These rules apply to the admin backoffice in
`apps/admin`.

## First Steps

- Run `git status --short` from the repo root before editing.
- Inspect `apps/admin/package.json`, nearby page/component/lib files, and the
  corresponding API admin route before changing behavior.
- Read the relevant installed Next.js 16 documentation before using routing,
  metadata, server/client component, form/action, cache, or route-handler APIs.

## Backoffice Safety

- Treat every admin page as production support tooling. Changes must preserve
  authentication, session handling, admin API authorization, auditability, and
  idempotency.
- Keep admin UI dense, scannable, and operational. Prefer existing tables,
  panels, badges, filters, pagination, and form patterns.
- Do not make admin actions easier to trigger accidentally. Mutations should have
  clear intent, reason fields where established, and idempotency keys where the
  existing flow uses them.
- Preserve fallback table behavior and client-side sorting/pagination utilities
  when backend pagination data is unavailable.

## Security And Privacy

- Keep admin API calls server-only through the existing `app/lib/api.ts` pattern.
- Do not expose credentials, tokens, reset codes, raw secrets, or sensitive
  profile/health/photo data to client components unless an existing admin view
  already has a justified pattern for it.
- Do not weaken login, session cookies, server-only boundaries, environment
  checks, or admin route protection.

## End-to-End Changes

- Admin UI changes often require API route changes in `apps/api/src/routes/admin.ts`,
  repository/database updates, audit entries, and tests.
- When changing runtime flags, AI model/prompt controls, notices, version policy,
  scan compensation, or user actions, verify both the UI path and the API path.

## Tests And Checks

- This app currently has type/build checks rather than a local test suite.
- Useful checks:
  - `pnpm --filter @logmyplate/admin typecheck`
  - `pnpm --filter @logmyplate/admin build`
- If admin API behavior changes, also run:
  - `pnpm --filter @logmyplate/api test`
  - `pnpm --filter @logmyplate/api typecheck`
