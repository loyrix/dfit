# Database Agent Rules

Read the root `AGENTS.md` first. These rules apply to `infra/db`.

## First Steps

- Inspect `infra/db/README.md`, existing migrations, seeders, and
  `scripts/db/migrate.cjs` before changing schema or data.
- Use the repository migration commands instead of hand-creating migration
  filenames.

## Migration Rules

- Create migration pairs with:
  - `pnpm db:new <descriptive_name>`
- Keep the existing timestamp-with-seconds convention:
  - `YYYYMMDDHHMMSS_name.up.sql`
  - `YYYYMMDDHHMMSS_name.down.sql`
- Every schema change needs a safe forward migration and a rollback.
- Include backfills for existing production data when new behavior depends on
  existing rows.
- Keep migrations deployable more than once through the migration runner's
  tracking tables. Avoid assumptions that only work on an empty database.
- Avoid destructive data changes unless explicitly requested and documented in
  the handoff.

## Security And Data Integrity

- Preserve account/profile ownership, scan image references, audit records,
  idempotency records, sessions, reset codes, quota state, and admin data.
- Do not store secrets in migrations or seeders.
- Be careful with nullable columns, defaults, unique indexes, foreign keys, and
  rollback behavior.

## Verification

- Run `pnpm db:validate` after editing migrations.
- If repository behavior changes with the schema, also run relevant API tests and
  type checks.
