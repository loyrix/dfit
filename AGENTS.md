# Coding Agent Rules

Any coding agent must read this file before changing code in this repository.
More specific `AGENTS.md` files in subdirectories add rules for that area.

## Core Rule

Do not guess. Inspect the existing code, scripts, docs, tests, package manifests,
workspace config, and file structure first. Make the smallest complete change
that fits the facts you found.

This repository is a real LogMyPlate monorepo, not a prototype. Half-finished
changes are not acceptable. If a request touches a user flow, own the work end to
end across contracts, API, persistence, clients, docs, and tests as needed.

## Repository Shape

- `apps/mobile`: Flutter iOS and Android app.
- `apps/api`: Fastify TypeScript API.
- `apps/web`: Next.js public website.
- `apps/admin`: Next.js admin backoffice.
- `packages/contracts`: Zod API contracts shared across apps.
- `packages/domain`: pure nutrition, quota, meal, and business logic.
- `packages/sdk`: TypeScript API client.
- `packages/design-tokens`: shared design token package.
- `infra/db`: SQL migrations and seeders.
- `docs`: product, OpenAPI, implementation, and operations notes.

## Working Principles

- Start by understanding the request, the current implementation, and the tests
  that prove the behavior. Ask only when the repo cannot answer a necessary
  question and guessing would be risky.
- Prefer simple, boring, readable code. Cleverness must earn its place.
- Make surgical changes. Avoid broad refactors, formatting churn, dependency
  upgrades, or architecture changes unless they are required for the task.
- Define success before editing: which behavior should change, which behavior
  must remain unchanged, and which checks will prove it.
- Use facts from this repo over memory about frameworks. When framework versions
  are modern or unusual, read the installed docs or local code before assuming an
  API or convention.
- Keep work secure by default. Treat identity, profile ownership, sessions,
  tokens, food photos, health data, AI payloads, admin actions, and database
  rows as sensitive.

## Before Editing

- Run `git status --short` and understand what is already changed.
- Do not overwrite, revert, delete, or reformat work you did not create.
- Read nearby implementation and tests before editing a file.
- Check the relevant `package.json`, `pubspec.yaml`, README, workspace config,
  scripts, and existing generated/helper commands before choosing commands.
- If the repo has a generator or helper command, use it instead of hand-creating
  files. For migrations, use `pnpm db:new`.
- Identify whether a change crosses boundaries: API contract, domain logic,
  SDK, mobile client, web/admin UI, database, OpenAPI docs, or deployment config.

## End-to-End Ownership

- API behavior changes usually require checking `packages/contracts`,
  `apps/api`, `packages/sdk`, `apps/mobile`, `apps/web` or `apps/admin`, and
  `docs/openapi.yaml`.
- Persistence changes require migrations, repository updates, API tests, and
  validation against the production Postgres implementation when practical, not
  only the in-memory test store.
- Mobile-visible API changes require updating the Flutter client/service layer,
  controller state, UI states, and Flutter tests where the project supports it.
- Admin changes are high impact. Preserve authentication, session handling,
  auditability, idempotency, and operator safety.
- Public website changes should preserve SEO metadata, app-store links, legal
  pages, responsive layout, and accessibility.
- Shared business rules belong in `packages/domain` or `packages/contracts`
  when multiple surfaces need the same behavior.

## Follow Existing Patterns

- Match the repository's current architecture, naming, file layout, formatting,
  and error-handling style.
- Prefer existing helpers, services, models, repositories, schemas, presenters,
  controllers, widgets, components, and test utilities over new abstractions.
- Do not introduce a new framework, package, storage mechanism, migration
  format, state-management style, or architectural layer unless clearly
  required.
- If two implementations must stay behaviorally aligned, update both and test
  both.
- Keep business rules close to the layer that owns them. Extract shared logic
  only when it removes real duplication or prevents inconsistent behavior.
- Prefer structured schemas, parsers, and typed models over ad hoc string
  manipulation.

## Security And Privacy

- Validate all external input using the repository's established schemas and
  validation style.
- Preserve authorization, profile ownership checks, account/session boundaries,
  idempotency, and transaction boundaries.
- Never log secrets, auth tokens, reset codes, OAuth tokens, full credentials,
  private object keys beyond what existing operational logs require, or raw
  personal/health data unless an existing pattern explicitly allows it.
- Do not weaken CORS, admin auth, password reset behavior, OAuth verification,
  rewarded-ad server verification, or environment checks to make a test pass.
- Keep production code independent of test-only or in-memory implementations.
- Treat food images and AI analysis payloads as sensitive. Store, cache, expose,
  and delete them only through the existing storage and repository abstractions.
- Do not add dependencies casually. A dependency must solve a clear problem,
  fit the app/package manifest, and not introduce avoidable security risk.

## Tests And TDD

- For bug fixes, add or update a failing test first when practical.
- Cover the real scenario that failed, not only the happy path.
- Add tests for edge cases, permission/identity boundaries, invalid input,
  persistence behavior, offline/error states, and regression-prone flows when
  relevant.
- Do not delete, weaken, or skip tests to make the build pass.
- Keep test data realistic enough to catch production bugs.
- If a change affects an API contract, update contract/client tests as well as
  server tests.
- If a change affects UI navigation or visible behavior, add or update UI/widget
  tests where the project supports them.

## Migrations And Database Changes

- Before creating a migration, inspect `infra/db/README.md`, existing migration
  files, the migration runner, docs, and package scripts.
- Use `pnpm db:new <descriptive_name>` to create migration pairs.
- Migration files must follow the existing timestamp-with-seconds
  `.up.sql`/`.down.sql` convention.
- Every schema change must include a safe forward migration and rollback.
- Include data backfills for existing production data when changing behavior
  that depends on current rows.
- Avoid destructive data changes unless explicitly requested and clearly
  documented.
- Run `pnpm db:validate` after editing migrations.

## Domain Guidance

- Keep pure nutrition, quota, meal, and related business rules in
  `packages/domain` when they are shared or testable without I/O.
- Keep request/response schemas in `packages/contracts`; do not duplicate shape
  validation separately in clients.
- Keep API client behavior in `packages/sdk` or the app's existing service layer,
  not scattered through UI components.
- When changing a contract, check all consumers before handoff.

## API Guidance

- Keep Fastify routes thin. Use services, repositories, presenters, contracts,
  and domain helpers where the repo already does.
- Preserve idempotency for mutating endpoints that use it.
- Preserve repository parity between `InMemoryStore` and `PostgresStore`.
- Keep admin endpoints protected and auditable.
- Update `docs/openapi.yaml` when public API behavior changes.

## Flutter Guidance

- Respect the current app structure: screens, widgets, services, state
  controllers, models, navigation, and theme live in their existing layers.
- Do not put networking, persistence, or business rules directly into widgets
  when a service/controller/model layer already owns them.
- Keep loading, empty, error, retry, success, signed-out, and permission-denied
  states coherent.
- Be careful with iOS/Android platform files, signing, bundle IDs, entitlements,
  AdMob IDs, OAuth client IDs, and build numbers. Change them only for a clear
  requested reason.

## Web And Admin Guidance

- These apps use Next.js 16. Read the relevant installed Next docs before using
  framework APIs, routing conventions, metadata behavior, server actions, or
  caching behavior.
- Keep public web pages accessible, responsive, SEO-safe, and aligned with the
  existing LogMyPlate visual system.
- Keep admin pages dense, operational, authenticated, and safe for production
  support workflows. Avoid decorative UI that makes scanning harder.
- Preserve server-only boundaries for secrets and admin API calls.

## Style And Formatting

- Use the repository's formatter, linter, analyzer, and type checker.
- Do not apply unrelated formatting churn.
- Keep comments brief and useful; explain non-obvious decisions, not obvious
  code.
- Use existing language conventions for imports, async handling, errors,
  logging, naming, and file organization.
- Do not add dependencies without a clear need and without updating the correct
  package manifest or lockfile.

## Verification

- Run the narrowest relevant checks while developing.
- Before handoff, run broader checks expected by the touched area or explain why
  they could not be run.
- Relevant commands include:
  - `pnpm test`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm build`
  - `pnpm format:check`
  - `pnpm db:validate`
  - `pnpm mobile:analyze`
  - `pnpm mobile:test`
  - `pnpm --filter @logmyplate/api test`
  - `pnpm --filter @logmyplate/api typecheck`
  - `pnpm --filter web typecheck`
  - `pnpm --filter @logmyplate/admin typecheck`
- Report exactly which checks passed, failed, or were skipped.

## Git Safety

- Do not commit unless the user asks.
- Do not push unless the user explicitly asks.
- Stage only files related to the requested task.
- Leave unrelated untracked or modified files alone.
- Never use destructive git commands unless the user explicitly requested them
  and the risk is clear.

## Handoff

- Summarize what changed, where it changed, and why.
- List tests/checks run.
- Call out remaining risks, skipped verification, or decisions needed from the
  user.
