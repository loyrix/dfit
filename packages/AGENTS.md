# Packages Agent Rules

Read the root `AGENTS.md` first. These rules apply to `packages/*`.

## Package Boundaries

- `contracts`: shared Zod API schemas and exported request/response types.
- `domain`: pure business logic for meals, nutrition, quotas, foods, rewarded
  ads, and related types. Keep it free of I/O and framework dependencies.
- `sdk`: TypeScript API client behavior for consumers.
- `design-tokens`: shared visual tokens.

## Working Rules

- Put shared business rules in `domain` when API and clients must agree.
- Put shared data shape validation in `contracts`; do not duplicate shape rules
  separately across API and clients.
- Keep package exports explicit through each package's `src/index.ts`.
- Avoid importing app code into packages. Package dependencies should point
  inward or sideways only when already established.
- Do not add runtime dependencies unless the package genuinely needs them and
  the correct package manifest is updated.

## Contract Changes

- Treat contract changes as cross-app changes. Check API routes, SDK behavior,
  mobile client parsing, web/admin usage, tests, and OpenAPI docs.
- Preserve backward compatibility when production clients may still send old
  shapes, unless the task explicitly requires a breaking change.

## Tests And Checks

- Add Vitest coverage for new or changed domain logic.
- Keep tests close to the package behavior they prove.
- Useful checks:
  - `pnpm --filter @logmyplate/domain test`
  - `pnpm --filter @logmyplate/domain typecheck`
  - `pnpm --filter @logmyplate/contracts typecheck`
  - `pnpm --filter @logmyplate/sdk typecheck`
  - `pnpm --filter @logmyplate/design-tokens typecheck`
