# API Agent Rules

Read the root `AGENTS.md` first. These rules apply to `apps/api`.

## First Steps

- Run `git status --short` from the repo root before editing.
- Inspect `apps/api/package.json`, nearby route/service/repository code, and
  existing Vitest tests before choosing an approach.
- Check `packages/contracts`, `packages/domain`, `packages/sdk`, mobile/web/admin
  consumers, and `docs/openapi.yaml` when changing request or response behavior.

## Architecture

- Keep Fastify routes thin. Put reusable behavior in services, repositories,
  presenters, contracts, or domain helpers according to the existing pattern.
- Validate external input through established Zod contract/schema patterns.
- Keep `AppRepository` behavior aligned across `InMemoryStore` and
  `PostgresStore`; tests that pass only against memory are not enough for
  persistence changes.
- Preserve idempotency for mutating endpoints that use the idempotency plugin.
- Keep API documentation available through `docs/openapi.yaml` when public
  endpoint behavior changes.

## Security And Privacy

- Preserve profile ownership, account/session boundaries, OAuth verification,
  password reset safety, admin authorization, rewarded-ad verification, and
  transaction boundaries.
- Never log secrets, credentials, tokens, reset codes, full OAuth payloads,
  private health data, or raw food-photo data unless an existing production-safe
  pattern explicitly does so.
- Treat scan images, AI responses, image hashes, object keys, and health targets
  as sensitive. Use existing storage and repository abstractions for upload,
  signed reads, cache, and deletion.
- Do not weaken environment checks, CORS, admin guards, or production behavior to
  make a local test pass.

## Tests

- Use Vitest and existing `app.inject` patterns for endpoint tests.
- For bugs, add or update a failing test first when practical.
- Cover invalid input, authorization, profile boundaries, idempotency,
  persistence, and external-provider failure paths when relevant.
- Mock AI, OAuth, storage, email, and ad verification through existing injected
  interfaces instead of adding global test hooks.

## Commands

- Narrow API checks:
  - `pnpm --filter @logmyplate/api test`
  - `pnpm --filter @logmyplate/api typecheck`
  - `pnpm --filter @logmyplate/api lint`
- If contracts, domain, SDK, migrations, or clients change, run the matching
  package/app checks from the root guidance too.
