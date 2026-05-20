# Coding Agent Rules

Any coding agent must read this file before changing code in this repository.

## Core Rule

Do not guess the project pattern. Inspect the existing code, scripts, docs, tests, and file structure first, then make the smallest change that fits those patterns.

## Before Editing

- Run `git status --short` and understand what is already changed.
- Do not overwrite, revert, delete, or reformat work you did not create.
- Read the nearby implementation and tests before editing a file.
- Check `package.json`, workspace config, README files, and existing scripts before choosing commands.
- If the repo has a generator or helper command, use that instead of hand-creating files.
- Keep each change focused on the requested task.

## Follow Existing Patterns

- Match the repository's current architecture, naming, file layout, formatting, and error-handling style.
- Prefer existing helpers, services, models, repositories, schemas, and test utilities over new abstractions.
- Do not introduce a new framework, package, storage mechanism, migration format, or architectural layer unless clearly required.
- If two implementations must stay behaviorally aligned, update both and test both.
- Avoid broad refactors while fixing a bug unless the refactor is necessary for the fix.

## Tests And TDD

- For bug fixes, add or update a failing test first when practical.
- Cover the real scenario that failed, not only the happy path.
- Add tests for edge cases, permission/identity boundaries, invalid input, persistence behavior, and regression-prone flows when relevant.
- Do not delete or weaken tests to make the build pass.
- Keep test data realistic enough to catch production bugs.
- If a change affects an API contract, update contract tests/client tests as well as server tests.
- If a change affects UI navigation or visible behavior, add or update UI/widget tests where the project supports them.

## Migrations And Database Changes

- Before creating a migration, inspect the existing migration directory, naming convention, migration runner, docs, and package scripts.
- Use the repository's migration generator command when one exists.
- Match the existing migration file format exactly. Do not assume `.sql`, `.js`, `.cjs`, or any other extension without checking the repo.
- Every schema change must include a safe forward migration and, when the project supports it, a rollback/down migration.
- Include data backfills for existing production data when changing behavior that depends on current rows.
- Avoid destructive data changes unless explicitly requested and clearly documented.
- Run the repository's migration validation command after editing migrations.

## DRY And Abstractions

- Avoid duplicating business rules across API, UI, tests, and persistence layers.
- Extract shared logic only when it removes real duplication or prevents inconsistent behavior.
- Do not create generic abstractions for one-off code.
- Keep business rules close to the layer that owns them.
- Prefer structured schemas/parsers over ad hoc string manipulation.

## API And Persistence

- Validate external input using the repository's established validation pattern.
- Keep route/controller code thin when the project already uses services, repositories, presenters, or domain modules.
- Preserve idempotency, authorization, transaction boundaries, and ownership checks.
- Production code must not silently rely on test-only or in-memory implementations.
- When changing persistence behavior, verify the production store implementation, not only mocks.

## UI And Client Code

- Match the existing design system, navigation style, state management, and component structure.
- Keep screens/components focused; move reusable logic into the project's existing service/model/state layer.
- Do not add explanatory implementation text to the UI unless it is product copy requested by the user.
- Ensure loading, empty, error, retry, and success states remain coherent when touching user flows.

## Style And Formatting

- Use the repository's formatter and linter.
- Do not apply unrelated formatting churn.
- Keep comments brief and useful; explain non-obvious decisions, not obvious code.
- Use existing language conventions for imports, async handling, errors, logging, and naming.
- Do not add dependencies without a clear need and without updating the correct package manifest.

## Verification

- Run the narrowest relevant checks while developing.
- Before handoff, run the broader checks expected by the repo or explain why they could not be run.
- At minimum, verify the changed area with tests, type checks, lint/analyze, and migration validation when applicable.
- Report exactly which checks passed, failed, or were skipped.

## Git Safety

- Do not commit unless the user asks.
- Do not push unless the user explicitly asks.
- Stage only files related to the requested task.
- Leave unrelated untracked or modified files alone.
- Never use destructive git commands unless the user explicitly requested them and the risk is clear.

## Handoff

- Summarize what changed, where it changed, and why.
- List tests/checks run.
- Call out remaining risks, skipped verification, or decisions needed from the user.
