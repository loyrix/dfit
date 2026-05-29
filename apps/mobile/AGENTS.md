# Mobile Agent Rules

Read the root `AGENTS.md` first. These rules apply to the Flutter app in
`apps/mobile`.

## First Steps

- Run `git status --short` from the repo root before editing.
- Inspect `apps/mobile/README.md`, `pubspec.yaml`, `analysis_options.yaml`,
  nearby Dart files, and existing tests before choosing an approach.
- Check API contracts, API behavior, SDK/client code, and app configuration when
  a mobile change depends on server behavior.

## App Structure

- Respect the current layers:
  - screens in `lib/src/screens`
  - reusable widgets in `lib/src/widgets`
  - state controllers in `lib/src/state`
  - API, storage, OAuth, ads, links, diagnostics, and build info in
    `lib/src/services`
  - app models in `lib/src/models`
  - theme and surfaces in `lib/src/theme`
  - navigation helpers in `lib/src/navigation`
- Do not put networking, local persistence, auth, ad logic, or business rules
  directly in widgets when an existing service/controller/model layer owns it.
- Reuse existing theme colors, surfaces, typography, routes, controllers, and
  widgets before adding new patterns.

## Product Quality

- Build user flows end to end: API client, controller state, screen behavior,
  loading states, empty states, errors, retries, success, and persistence/cache
  effects when relevant.
- Keep anonymous-first identity, account-linking, scan credits, rewarded ads,
  food-photo handling, and health target flows consistent with existing product
  behavior.
- Do not add explanatory implementation copy to the UI unless it is product copy
  requested by the user.
- Keep both iOS and Android in mind for camera, image picking, auth, AdMob,
  deep links, build values, and release behavior.

## Security And Platform Safety

- Treat tokens, OAuth identities, local session data, food photos, health data,
  scan results, and API base URLs as sensitive.
- Do not change bundle IDs, signing files, entitlements, package names, AdMob
  production IDs, OAuth client IDs, build numbers, or release scripts unless the
  task explicitly requires it and the existing docs support the change.
- Do not commit local `.env` values or generated secrets.

## Tests

- Use `flutter_test` and existing test style in `apps/mobile/test`.
- Add or update tests for controller behavior, API client parsing, service
  edge cases, model logic, and widget-visible behavior when touched.
- Cover error and boundary states, not only the happy path.

## Commands

- Run from repo root:
  - `pnpm mobile:analyze`
  - `pnpm mobile:test`
- For direct Flutter work inside `apps/mobile`, the equivalent commands are:
  - `flutter analyze`
  - `flutter test`
