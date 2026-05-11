# DFit Implementation Notes

## Current Phase

This repo begins at Phase 0 from `DFit_Plan_Revisions_v2.md`.

The first implementation pass prioritizes architecture seams:

- Flutter mobile shell with DFit design language.
- Fastify API with route boundaries.
- Pure domain package for quota and nutrition math.
- Zod contracts package for request/response schemas.
- SQL migration that stores structured data but not food images.

## Important Decisions Applied

1. No bottom navigation in MVP.
2. Today is the home screen and journal.
3. No login wall.
4. Account linking is opt-in and deferred.
5. Food images are not stored.
6. AI is mocked until the scan/review/confirm loop is stable.
7. Quota decrement belongs in analyze, not prepare.
8. Every mutating endpoint requires `Idempotency-Key`.
9. Supabase Edge Functions are avoided.
10. Business logic lives in the API, not in Supabase directly.

## Next Implementation Slice

Recommended next slice:

1. Fix package-manager install on the machine and commit lockfile.
2. Wire API to Supabase Postgres with repository interfaces.
3. Replace in-memory API store with Postgres-backed repositories.
4. Generate a Dart API client from contracts or OpenAPI.
5. Connect Flutter Today screen to API journal data.
6. Add real manual meal creation before real AI.

That order keeps TDD practical and avoids spending AI money before the product loop works.
