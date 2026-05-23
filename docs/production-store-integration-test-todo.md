# TODO: Production Store Integration Test Coverage

## Why This Exists

The email signup/login regression on production was not caught by the current test suite because most API tests exercise `InMemoryStore`, not the real `PostgresStore` and migration-backed schema.

This means the product flow was tested, but production SQL behavior was not covered. SQL-only failures such as ambiguous columns, broken joins, missing migrations, cascade behavior, and production repository drift can pass in-memory tests and still fail after deployment.

## Goal

Add a small but reliable production-store test layer so core launch flows are verified against real Postgres behavior before backend deployment.

## Required Coverage

- Email signup for a new user succeeds.
- Duplicate email signup returns `email_already_registered`.
- Login for an existing user succeeds.
- Login with a missing/deleted account returns `account_not_found`.
- Login with the wrong password returns `invalid_credentials`.
- Deactivated account login returns `account_deactivated`.
- Deleted account can sign up again with the same email.
- Auth session token can fetch `/v1/profiles/me`.
- Auth session token can fetch `/v1/app/bootstrap`.
- Deleting a profile cascades user-owned app data correctly.
- Deleting a profile removes stored image references and storage objects.
- Anonymous-to-email account linking preserves expected journal data.

## Proposed Implementation

1. Add a Postgres integration test setup that runs against a real test database.
2. Run migrations before the suite.
3. Use isolated test data per run.
4. Add repository contract tests shared by `InMemoryStore` and `PostgresStore`.
5. Keep fast in-memory API tests for product behavior, but require Postgres tests for persistence-sensitive areas.

## Candidate Test Groups

- `auth.postgres.test.ts`
- `profiles.postgres.test.ts`
- `journal.postgres.test.ts`
- `quota.postgres.test.ts`
- `repository-contract.test.ts`

## Local Command Target

Add a command like:

```bash
pnpm --dir apps/api test:postgres
```

The command should fail clearly if `TEST_DATABASE_URL` is missing, so local app development is not blocked by default.

## Pre-Deploy Gate

Before backend deploy, run:

```bash
pnpm --dir apps/api test
pnpm --dir apps/api typecheck
pnpm db:validate
pnpm --dir apps/api test:postgres
```

## Notes

- Do not use production data for these tests.
- Do not point tests at the main Supabase database.
- Use a dedicated local Postgres, Supabase branch, or disposable test database.
- Keep this suite focused on high-trust flows rather than trying to duplicate every in-memory test.
