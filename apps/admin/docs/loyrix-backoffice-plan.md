# Loyrix — Centralized Backoffice Implementation Plan

> **Loyrix** is the umbrella brand. Every app built under it — LogMyPlate, PrivyDock, and
> whatever follows — is operated from one centralized backoffice rather than a separate
> admin per product.
>
> This plan grows `apps/admin` into that console: a single sign-in, a project switcher, and
> per-project adapters so each app plugs in however its stack allows.

- **Drafted:** 2026-08-12
- **Revised:** 2026-08-13 (Phase 1 shipped; renamed to Loyrix)
- **Projects:** LogMyPlate (existing), PrivyDock (first new adapter)

---

## Progress

| Phase                                 | Goal                   | Tasks       | Status                     |
| ------------------------------------- | ---------------------- | ----------- | -------------------------- |
| [1](#phase-1--harden-in-place)        | Harden in place        | 9 / 9       | Done                       |
| [2](#phase-2--registry-and-switcher)  | Registry and switcher  | 8 / 8       | Done                       |
| [3](#phase-3--privydock-read-only)    | PrivyDock, read-only   | 13 / 15     | Scheduling + backfill left |
| [4](#phase-4--close-the-tracking-gap) | Close the tracking gap | 0 / 14      | Not started                |
| [5](#phase-5--credential-isolation)   | Credential isolation   | 0 / 3       | Not started                |
| [6](#phase-6--authentication-rebuild) | Authentication rebuild | 0 / 12      | Deferred by decision       |
|                                       | **Total**              | **30 / 61** |                            |

Update the counts and status as tasks land. Status values: `Not started` → `In progress` → `Blocked` → `Done`.

---

## Decisions taken

| Decision    | Choice                               | Why                                                                                                                                                                                                                                                                                                                                                        |
| ----------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Data access | **Per-project adapters**             | Each project plugs in however it can. No existing app has to change to be onboarded. PrivyDock has no API server, so a uniform admin API would block everything behind building one.                                                                                                                                                                       |
| Home        | **Stays in this monorepo**           | Reversed 2026-08-13. `apps/admin` imports _nothing_ from the monorepo — zero workspace deps, only `next/*` and `node:crypto` — and already deploys as its own Vercel project with its own env. Extraction is therefore cheap whenever it's wanted, so paying for it now buys nothing. Other apps are worked on by adding this folder to the IDE workspace. |
| First slice | **PrivyDock, read-only**             | Traffic & downloads, licenses & revenue, waitlist & funnel. App telemetry deferred.                                                                                                                                                                                                                                                                        |
| Auth        | **Keep the shared password for now** | Decided 2026-08-13. The existing username/password gates both projects until Phase 6. Enforcement bugs (findings 1, 2, 4, 8) are still fixed in Phase 1 — those are about whether the gate works, not how strong the credential is.                                                                                                                        |

---

## Current state

`apps/admin` is unusually well suited to extraction because it holds **no data logic**. Every page calls `adminGet` / `adminSend`, which fetch `${ADMIN_API_BASE_URL}${path}` over HTTP Basic auth. It is already a pure client over a swappable endpoint.

| Piece                      | Lines  | Fate                                                                     |
| -------------------------- | ------ | ------------------------------------------------------------------------ |
| `app/lib/api.ts`           | 705    | **Reuse** — becomes the LogMyPlate adapter, behaviour unchanged          |
| `app/lib/session.ts`       | 95     | **Replace** — shared password → per-user accounts with TOTP              |
| `app/components/ui.tsx`    | 317    | **Reuse** — tables, badges, filters, pagination                          |
| `app/components/nav.tsx`   | 139    | **Rework** — hardcoded routes → capability-driven                        |
| `app/components/shell.tsx` | 34     | **Rework** — auth moves to middleware                                    |
| `app/lib/actions.ts`       | 608    | **Reuse** — already calls `requireAdminSession()` at all 18 entry points |
| 12 page routes             | ~5,800 | **Namespace** under `/[project]/…`, behaviour identical                  |
| `AdminOverview` type       | —      | **Do not copy** (see below)                                              |

### The trap: do not generalise `AdminOverview`

It carries `scanFunnel`, `meals`, `appBuilds`, `aiCostInr`, and iOS/Android platform splits. None of that means anything to a Mac app. Widening it to fit both products yields a type that fits neither.

Normalised shapes stay deliberately thin. Product vocabulary lives behind the adapter.

---

## Security review of the code being extracted

The mutation path is sound: all 18 server actions call `requireAdminSession()` independently, credentials use `timingSafeEqual`, and `import "server-only"` keeps API secrets out of client bundles. The **read path** is where the gaps are.

### Critical: data is fetched before the session is checked

In every page, `adminGet` runs at the top of the component while `AdminShell` — the only thing calling `requireAdminSession()` — is not reached until the return statement. In `app/users/page.tsx` that is **line 46 versus line 76**.

Because `adminFetch` throws on a non-OK response (`api.ts:674`), this hands an anonymous visitor an oracle:

| Request                      | Result                                    |
| ---------------------------- | ----------------------------------------- |
| `/users?profileId=<valid>`   | fetch succeeds → 302 redirect to `/login` |
| `/users?profileId=<invalid>` | fetch throws → 500 error page             |

Valid profile IDs can be enumerated **without logging in**, and every probe drives a credentialed call against the production API.

### Full findings

| #   | Finding                                              | Where                      | Fix                                                           | Phase |
| --- | ---------------------------------------------------- | -------------------------- | ------------------------------------------------------------- | ----- |
| 1   | Fetch precedes auth check                            | every `page.tsx`           | Move `requireAdminSession()` above data loading               | 1     |
| 2   | No `middleware.ts` — auth is fail-open               | app root                   | Matcher-based gate so a forgotten wrapper can't expose a page | 1     |
| 3   | No login rate limiting or lockout                    | `actions.ts` `loginAction` | Attempt table + exponential backoff                           | 1     |
| 4   | Hardcoded session-secret fallback                    | `session.ts:88`            | Require the env var; fail loudly if absent                    | 1     |
| 5   | One shared identity                                  | `session.ts`               | Per-user accounts so the audit log can attribute actions      | 1     |
| 6   | Stateless sessions, no revocation                    | `session.ts`               | Server-side session rows; opaque cookie token                 | 1     |
| 7   | No second factor                                     | —                          | TOTP — offline, no delivery dependency                        | 6     |
| 8   | `safeEqual` leaks credential length via early return | `session.ts:90`            | Compare fixed-length digests instead                          | 1     |

**Split by phase.** Findings 1, 2, 4 and 8 are _enforcement_ defects — the gate not working — and cost almost nothing to fix, so they stay in Phase 1. Findings 3, 5, 6 and 7 are _credential_ upgrades that need a database, and move to Phase 6.

**Accepted risk until Phase 6:** one shared password will gate every product's data at once, sessions cannot be revoked, and the audit log cannot say which person acted. From Phase 3 onward that login also fronts PrivyDock customer emails, license keys and Paddle records. This is a deliberate call, not an oversight — revisit it before the console holds anything a customer would be harmed by leaking.

### Why TOTP rather than emailed codes (for Phase 6)

An operations console must not depend on a working mail pipeline to open — you often need it precisely when something is broken, and email is one provider deep. TOTP is offline and standard (RFC 6238).

**Passkeys/WebAuthn are stronger** (phishing-resistant, Touch ID) at roughly double the code and a harder recovery story. TOTP is phishable — someone can be tricked into typing a code into a fake page. Decide before Phase 6 enrollment is built; retrofitting means redoing it.

---

## Architecture

```
apps/admin/
  middleware.ts              # fail-closed auth gate
  app/
    login/page.tsx           # password + TOTP
    [project]/
      layout.tsx             # project switcher + capability nav
      page.tsx               # overview cards
      traffic/page.tsx
      revenue/page.tsx
      users/page.tsx
      waitlist/page.tsx
    lib/
      auth/                  # sessions, TOTP, rate limiting
      registry.ts            # project list, resolves id -> source
  sources/
    types.ts                 # the contract everything obeys
    logmyplate/index.ts      # REST, ADMIN_API_BASE_URL
    privydock/
      supabase.ts            # licenses, activations, waitlist
      cloudflare.ts          # zone analytics + R2 GraphQL
      paddle.ts              # transactions, revenue
      index.ts               # composes the three
  scripts/
    admin-user-add.ts        # enrollment CLI
    snapshot.ts              # nightly metric capture
```

### The contract

Capability declaration is what makes this multi-project rather than lowest-common-denominator. Each source announces what it can answer; the nav renders only those routes. LogMyPlate keeps its scan funnel, PrivyDock gets downloads, and neither stubs the other's screens.

```ts
export type Capability = "overview" | "traffic" | "revenue" | "users" | "waitlist" | "downloads";

export interface ProjectSource {
  id: string;
  label: string;
  capabilities: Capability[];

  overview(range: DateRange): Promise<Metric[]>;
  traffic?(range: DateRange): Promise<Series[]>;
  revenue?(range: DateRange): Promise<Metric[]>;
  users?(q: Query): Promise<Table>;
  waitlist?(q: Query): Promise<Table>;
  downloads?(range: DateRange): Promise<Series[]>;
}

// deliberately thin - no product vocabulary
type Metric = { label: string; value: number; unit?: string; delta?: number };
type Series = { label: string; points: { date: string; value: number }[] };
type Table = { columns: string[]; rows: (string | number)[][]; total: number };
```

### Where the console stores data

**Default: each project's own database, configured per project in `.env`.** The console provisions nothing of its own. This keeps a project's data with that project, so retiring or handing one off takes its data with it.

**Snapshots are not cross-project infrastructure.** The rolling-retention problem is PrivyDock-specific — its numbers live in Cloudflare's 8- and 90-day windows. LogMyPlate's metrics come from its own API backed by its own Postgres, which already retains history and needs no snapshotting. So `metric_snapshots` is one table in PrivyDock's existing Supabase, written by the PrivyDock adapter, which already holds those credentials.

```
-- PrivyDock's Supabase, loyrix schema
loyrix.metric_snapshots   project, metric, date, value   -- PK (project, metric, date)
```

Namespace console-owned tables under a `loyrix` schema rather than `public`, following the precedent already set by `privydock_admin.schema_migrations`. It keeps them visibly distinct from product data and trivial to drop or relocate.

**The exception is identity (Phase 6).** Users and sessions are not project data, and sessions are checked on every request _before_ a project is selected — so there is no project context from which to pick a database. Putting them in one product's database makes that product a hard dependency for logging into every other one; duplicating them per project means N user tables and N password rotations.

That argues for a single small store, but only Phase 6 needs it, so **the decision defers with Phase 6.** Nothing before then requires it.

```
-- Phase 6, home TBD
admin_users           id, username, password_hash (scrypt),
                      totp_secret_enc, totp_confirmed_at, disabled_at, created_at
admin_sessions        id, user_id, token_hash, expires_at,
                      revoked_at, ip, user_agent, created_at
admin_login_attempts  id, username, ip, succeeded, created_at
admin_recovery_codes  id, user_id, code_hash, used_at
admin_audit_log       id, user_id, project, action, payload, created_at
```

Dependencies for Phase 6: `node:crypto` covers scrypt and HMAC-SHA1. The only added package is `otpauth` for the drift window. No native builds to fight on Vercel.

---

## Where PrivyDock's numbers come from

Three systems that do not talk to each other today. That disconnection is the actual problem this solves.

| Panel                 | Source                                     | Status      | Constraint                                        |
| --------------------- | ------------------------------------------ | ----------- | ------------------------------------------------- |
| Visitors, page views  | Cloudflare `httpRequests1dGroups`          | Live        | 90-day retention; bot split via `browserMap`      |
| Top pages, hostnames  | Cloudflare `httpRequestsAdaptiveGroups`    | Limited     | **8-day retention, 1-day max query window**       |
| DMG downloads         | Cloudflare R2 `r2OperationsAdaptiveGroups` | Live        | 1:10 sampled, 32-day max window, 90-day retention |
| Download clicks       | `download_events` table                    | **Missing** | Built in Phase 4                                  |
| Licenses, activations | Supabase `licenses`, `license_activations` | Live        | Service-role only, RLS on                         |
| Waitlist              | Supabase `waitlist_signups`                | Live        | 4 rows as of 2026-08-13                           |
| Revenue               | Paddle API + `paddle_webhook_events`       | Live        | 0 transactions — the beta is free                 |

> **Time-sensitive.** Cloudflare retention is _rolling_. Path-level traffic vanishes after 8 days, everything else after 90. Any month not pulled and stored is gone permanently — the July 2026 traffic spike is already half-expired. The nightly snapshot job is the highest-value early feature, ahead of any chart.

Access notes: zone ID `c070396f2104b1986d1f082dab48c30e`, account `b73e4827cc9aca2557ef999780395977`. The API token is account-owned — it verifies at `/accounts/{id}/tokens/verify`, **not** `/user/tokens/verify`, which misleadingly returns "Invalid API Token".

---

## PrivyDock metrics specification

Six screens. Every metric below is tagged with where it comes from and how much it can be trusted:

- **Exact** — counted in a table we own, no sampling, no inference.
- **Estimated** — derived or inferred; directionally right, not a hard number.
- **Sampled** — Cloudflare applies 1:10 adaptive sampling; resolution is ±10.

Metrics marked **P4** do not exist until Phase 4 ships the first-party event tables. Everything else is available in Phase 3 from systems that already hold the data.

### Screen 1 — Overview

The one screen to open first thing in the morning. Eight cards over a selectable range (24h / 7d / 30d / 90d), each with a delta against the preceding period.

| Card             | Definition                                               | Source                          | Accuracy |
| ---------------- | -------------------------------------------------------- | ------------------------------- | -------- |
| Human visitors   | `count(distinct visitor_hash) where client_class = 2`    | `loyrix.page_views` **P4**      | Exact    |
| Page views       | Row count, humans only                                   | `loyrix.page_views` **P4**      | Exact    |
| Download clicks  | Row count on `/api/download`                             | `loyrix.download_events` **P4** | Exact    |
| DMG downloads    | `responseBytes ÷ 3,739,695` per `.dmg` object            | Cloudflare R2                   | Sampled  |
| Waitlist signups | Rows in period, and running total                        | Supabase `waitlist_signups`     | Exact    |
| Licenses         | Active, and new in period                                | Supabase `licenses`             | Exact    |
| Revenue          | Completed transactions, net of refunds                   | Paddle API                      | Exact    |
| Active installs  | Distinct `license_id` seen in `last_validated_at` window | Supabase `license_activations`  | Exact    |

Until Phase 4, the first three fall back to Cloudflare: page views from `pageViews`, visitors from daily-unique IPs × human share from `browserMap`, and clicks are simply unavailable. Cards render with an "estimated" marker rather than pretending to precision.

Below the cards sits **the funnel**, which is the actual point of the console:

```
Site visits            ──▶  /download views  ──▶  Download clicks
       │                          │                     │
   P4 exact                   P4 exact              P4 exact
                                                        ▼
License activated  ◀──  Licence purchased  ◀──  DMG downloaded
   Supabase exact         Paddle exact            R2 sampled
```

Each step shows absolute count and conversion rate from the previous step. The two rates that matter commercially: **/download view → click** (is the page persuasive?) and **download → purchase** (is the product persuasive?).

### Screen 2 — Traffic

| Panel                     | Definition                                   | Source                                              | Accuracy                |
| ------------------------- | -------------------------------------------- | --------------------------------------------------- | ----------------------- |
| Daily visitors and views  | Time series, humans only                     | `page_views` **P4**, Cloudflare before that         | Exact / Estimated       |
| Human vs suspected vs bot | Stacked split by `client_class`              | `page_views` **P4**                                 | Exact                   |
| Top pages                 | Views per path, ranked                       | `page_views` **P4**                                 | Exact                   |
| Countries                 | Views by `country`                           | `page_views` **P4**, Cloudflare `countryMap` before | Exact / Exact           |
| Referrers                 | Views by `referrer_host`                     | `page_views` **P4**                                 | Exact                   |
| Hostname split            | `privydock.com` vs `downloads.privydock.com` | Cloudflare adaptive                                 | Exact, **8-day window** |
| Blocked requests          | 403 count — scanner pressure                 | Cloudflare adaptive                                 | Exact, **8-day window** |

Top pages is the panel that most needs Phase 4. Cloudflare's path-level dataset retains only 8 days, and its counts are inflated by Next.js `<Link>` prefetching — a single visitor fires requests at a dozen routes without seeing any of them. First-party logging counts renders, not prefetches, which is why the flat distributions disappear.

### Screen 3 — Downloads

| Panel                     | Definition                     | Source                                   | Accuracy        |
| ------------------------- | ------------------------------ | ---------------------------------------- | --------------- |
| Clicks per day            | Time series                    | `download_events` **P4**                 | Exact           |
| Completed fetches per day | R2 bytes ÷ file size           | Cloudflare R2                            | Sampled         |
| Completion rate           | Fetches ÷ clicks               | Both                                     | Estimated       |
| Unique downloaders        | `count(distinct visitor_hash)` | `download_events` **P4**                 | Exact           |
| Per file                  | `latest.dmg` vs pinned version | R2 `objectName` + `download_events.file` | Sampled / Exact |
| Source page               | Which page drove the click     | `download_events.source_path` **P4**     | Exact           |
| Region                    | APAC / ENAM / EEUR …           | R2 `eyeballRegion`                       | Sampled         |
| Update checks             | `appcast.xml` requests per day | Cloudflare R2                            | Sampled         |

Two things worth reading carefully on this screen. **Completion rate below 100% is normal** — people click and cancel — but a collapse means the download itself is broken. And **update checks are a proxy for the live installed base**: every running copy polls `appcast.xml` on a schedule, so the daily poll count tracks installs even for users who never buy a licence. It is the only visibility into free-beta usage.

### Screen 4 — Licences

Operational support tooling first, analytics second. This is the screen you open when a customer emails.

| Panel                   | Definition                                                                                       | Source                             |
| ----------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------- |
| Licence table           | Masked key, email, status, plan, created, activated, last validated. Searchable by email or key. | `licenses`                         |
| Status split            | active / revoked / refunded                                                                      | `licenses`                         |
| Activations per licence | Device count, with the device list                                                               | `license_activations`              |
| macOS spread            | Distinct `os_version`, ranked                                                                    | `license_activations`              |
| App version adoption    | Installs per `app_version` over time                                                             | `license_activations`              |
| Dormant licences        | Purchased but never activated, or not validated in 30 days                                       | `licenses` + `license_activations` |

All exact — this is your own database, no sampling anywhere.

App version adoption answers "did the update actually reach people", which is the number that tells you whether a Sparkle release worked. Activations per licence is your licence-sharing signal: one key on eight machines is worth a look.

### Screen 5 — Waitlist

| Panel                     | Definition                                                              | Source             |
| ------------------------- | ----------------------------------------------------------------------- | ------------------ |
| Signups over time         | Daily and cumulative                                                    | `waitlist_signups` |
| Total and new this period | Counts                                                                  | `waitlist_signups` |
| Source split              | `source` column                                                         | `waitlist_signups` |
| Signup table              | Email, first joined, last joined                                        | `waitlist_signups` |
| **Waitlist → customer**   | Join `waitlist_signups.normalized_email` to `licenses.normalized_email` | both               |

That last row is free and genuinely useful: both tables already carry `normalized_email`, so conversion from waiting list to paying customer is a single join. It tells you whether the list is worth marketing to.

### Screen 6 — Revenue

| Panel               | Definition                         | Source                  |
| ------------------- | ---------------------------------- | ----------------------- |
| Transactions        | Completed, refunded, disputed      | Paddle API              |
| Revenue over time   | Net of refunds                     | Paddle API              |
| By country          | Where sales come from              | Paddle API              |
| Price points served | Cached display price per country   | `pricing_cache`         |
| Webhook health      | Last event received, count by type | `paddle_webhook_events` |

Webhook health is an ops panel rather than an analytics one. `paddle_webhook_events` is currently empty; once selling starts, a stale "last received" timestamp is the earliest warning that licence delivery has silently broken.

### Bot classification

Every first-party row carries two `smallint` columns — 4 bytes total.

```
client_class   0 = bot, 1 = suspected, 2 = human
signals        bitmask of what the classifier saw
```

Signals, cheapest first: missing `Sec-Fetch-Mode`, missing `Accept-Language`, bot-shaped user agent, absent or non-`Mozilla` user agent. `cf-bot-score` would be better but is Enterprise-only.

The classifier only handles what Cloudflare lets through — its managed rules already 403 roughly half of all inbound requests before they reach the origin. Page views are logged from the client, so clients that do not run JavaScript never create a row at all; the classifier mainly exists for `/api/download`, which must be server-side to issue the redirect.

`signals` is retained rather than collapsed to a boolean so a surprising number can be audited later instead of re-guessed. A determined scraper sending complete browser headers will still classify as human — this catches the lazy majority, which is the correct trade for analytics.

### Storage and retention

| Table                    | Rows/year at current traffic | Size       |
| ------------------------ | ---------------------------- | ---------- |
| `loyrix.page_views`      | ~79k                         | ~6 MB      |
| `loyrix.download_events` | ~160                         | negligible |

Raw events are kept **90 days**, rolled nightly into `loyrix.metric_snapshots`, then deleted. The raw tables stay bounded at roughly 20k rows forever while history accumulates in aggregates that never expire — the same job that solves Cloudflare's rolling-retention problem.

Never log the 404 handler. The scanner swarm probing `/wp-admin/install.php` and friends is what would actually make these tables heavy.

### Visitor identity

`visitor_hash` is `HMAC(ip + user_agent, salt_of_the_day)`, truncated to 16 bytes. The salt rotates every 24 hours and old salts are discarded, so daily unique counts are accurate while cross-day correlation is cryptographically impossible. No cookie is set and no raw IP is ever stored.

This still needs the privacy policy amended: it currently states analytics "does not store IP addresses, does not use cookies". The no-cookie claim survives unchanged; the IP sentence has to become an accurate description of daily-rotating hashing.

---

## Phase 1 — Harden in place

**Goal:** the admin runs behind two-factor login with all 8 security findings closed. No new features, no move.

### 1.1 Neutralise the naming

Cheap now, while there is one project. These are the only things tying the console to LogMyPlate.

- [x] Rename the session cookie off `logmyplate_admin_session` → `loyrix_admin_session`
- [x] Rename the package from `@logmyplate/admin` → `@loyrix/admin` (also updated in `.claude/settings.local.json`)
- [x] Product-neutral env names — **no change needed**, `ADMIN_*` carries no product name already
- [x] Confirm the Admin Vercel project keeps its own env, separate from the API project — confirmed 2026-08-13: `logmyplate-admin` carries project-scoped `ADMIN_*` vars including `ADMIN_SESSION_SECRET`

### 1.2 Enforcement fixes

Closes findings 1, 2, 4 and 8. None need a database, and none touch the credential itself — they fix whether the existing gate is actually enforced.

- [x] `proxy.ts` fail-closed gate covering every route except `/login` and static assets
- [x] Enforce the session **inside `adminFetch`** so no admin data can be fetched without one
- [x] Verify the enumeration oracle is closed — `/users?profileId=<valid|invalid>` must be indistinguishable when logged out
- [x] Remove the hardcoded `"logmyplate-local-admin-session-secret"` fallback; fail loudly if unset
- [x] Fix `safeEqual` length leak (finding #8)

#### Two corrections made during implementation

**1. Middleware is called `proxy` in Next.js 16.** There is no `middleware.ts`; the file is `proxy.ts` at the app root, exporting `proxy` with a `config.matcher`. Confirmed against the installed docs at `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md`. The build output lists it as `ƒ Proxy (Middleware)`.

**2. Auth is enforced in the data access layer, not hoisted per page.** The original task said "move `requireAdminSession()` above data loading in all 13 pages." The Next.js authentication guide argues against relying on that shape:

> _"While Proxy can be useful for initial checks, it should not be your only line of defense… The majority of security checks should be performed as close as possible to your data source."_
>
> _"Due to Partial Rendering, be cautious when doing checks in Layouts as these don't re-render on navigation."_

`AdminShell` is exactly such a shared boundary. Hoisting the call into 13 pages also regresses the moment page 14 is added. So the check now lives in `adminFetch` itself — every `adminGet` / `adminSend` verifies the session before issuing a request. `proxy.ts` is the optimistic pre-filter on top, and the per-action `requireAdminSession()` calls stay as a third layer.

#### Verified against a running build

| Case                                                   | Result                                                           |
| ------------------------------------------------------ | ---------------------------------------------------------------- |
| `/users?profileId=<valid-shaped>` logged out           | `307 → /login`                                                   |
| `/users?profileId=<invalid>` logged out                | `307 → /login` (identical — oracle closed)                       |
| `/`, `/audit`, `/growth`, `/cost`, `/flags` logged out | `307 → /login`                                                   |
| `/login` logged out                                    | `200`                                                            |
| Cookie forged with the old hardcoded literal           | `307 → /login` (rejected)                                        |
| Cookie with tampered payload                           | `307 → /login` (rejected)                                        |
| Cookie signed with the configured secret               | reaches the API layer (`ECONNREFUSED` — API not running locally) |

`pnpm typecheck` and `pnpm build` both pass.

**Acceptance:** met, except the Vercel env check in 1.1 which needs dashboard access. No route reaches production data before a session check, a forgotten `AdminShell` cannot expose a page, and findings 1, 2, 4 and 8 are closed. The login itself is unchanged — still the shared username and password.

#### Deploy notes

- **`ADMIN_SESSION_SECRET` must be set** in the Admin Vercel project. The literal fallback is gone, so the app now throws on session signing if no secret env var is present. `ADMIN_API_PASSWORD` and `ADMIN_DASHBOARD_PASSWORD` still work as fallbacks, so a correctly configured deploy is unaffected — but verify before shipping.
- **The cookie rename signs everyone out once.** Existing `logmyplate_admin_session` cookies are ignored.

### Keeping extraction cheap

The console stays here, but the option to leave should stay free. Three rules preserve it:

1. **Never import from `packages/*`.** The current zero is the entire reason this is reversible. The first `@logmyplate/contracts` import turns a `git filter-repo` into a project.
2. **Keep names product-neutral** — covered by 1.1 above.
3. **Keep the Admin Vercel project separate** from the API project.

Accepted costs: PrivyDock adapter work lands in LogMyPlate's git history, and root `turbo run build/typecheck` will exercise the admin on unrelated changes. Both are minor for solo work; both become awkward if LogMyPlate is ever handed off or open-sourced, since the console goes with the repo.

---

## Phase 2 — Registry and switcher

**Goal:** introduce the project dimension while there is still only one project, so the refactor is provably safe.

- [x] `app/sources/types.ts` — `ProjectSource`, `NavItem`, `NavGroup`, `ProjectNav`
- [x] `app/lib/registry.ts` — project list, resolve id → source, path helpers
- [x] Wrap the existing REST client as the LogMyPlate source (`app/sources/logmyplate.ts`)
- [x] Move routes under `/[project]/…`
- [x] `/` redirects to the last-used project (cookie)
- [x] Project switcher in the shell
- [x] Nav renders from the source manifest instead of the hardcoded arrays in `nav.tsx`
- [x] Unknown project id → 404, not a crash

#### Correction: nav manifests, not a capability enum

The written plan had nav rendering from a six-value `Capability` union. LogMyPlate has twelve pages across four groups with `?section=` sub-navigation, and none of that survives being flattened into `overview | traffic | revenue | users | waitlist | downloads` — which is the lowest-common-denominator trap this design exists to avoid.

So each source declares its **own nav manifest**: primary links, groups, and default sections. LogMyPlate's arrangement moved out of `nav.tsx` unchanged. PrivyDock will declare its own, shorter one. A shared vocabulary can still appear later for generic data screens, but it will not be what drives navigation.

Hrefs in a manifest are project-relative (`/users`). The nav prefixes them at render, so a source never encodes its own URL prefix.

#### How the active project is resolved

Three different mechanisms, because three different contexts need it:

| Context                   | Source of truth                                               |
| ------------------------- | ------------------------------------------------------------- |
| Pages                     | `params.project` from the route segment                       |
| Nav and switcher (client) | First path segment, via `projectIdFromPathname`               |
| Server actions            | `next-url` header, then `referer`, then the remembered cookie |

Nav manifests are pure data with no credentials, which is what makes resolving the registry inside a client component safe. That is why pages do not have to thread the project through the shell.

**Known trade-off in the action path.** Actions receive `FormData`, not route params. Rather than add a hidden project field to all 23 forms, `activeProjectId()` recovers it from the request context. If a referrer is stripped, a post-mutation redirect lands on the remembered project rather than the current one. The mutation itself is never affected — only where the redirect goes. When a second project makes this too loose, the explicit fix is the hidden field per form.

**Acceptance:** met. Verified against a running build:

| Case                                               | Result                                   |
| -------------------------------------------------- | ---------------------------------------- |
| `/`, `/logmyplate`, `/logmyplate/users` logged out | `307 → /login`                           |
| `/` logged in                                      | `307 → /logmyplate` (remembered project) |
| `/logmyplate/users`, `/logmyplate/ai` logged in    | reach the API layer                      |
| `/nope`, `/nope/users` logged in                   | `404`                                    |

The switcher renders as a label while one project is registered, and becomes a select when the second lands.

---

## Phase 3 — PrivyDock, read-only

**Goal:** first proof the adapter idea holds — a project with no API server, no user table, and a completely different shape.

### 3.1 Adapters

- [x] `sources/privydock/supabase.ts` — licenses, activations, waitlist (service-role, server-only)
- [x] `sources/privydock/cloudflare.ts` — zone analytics + R2, chunked for the 32-day and 1-day caps
- [x] `sources/privydock/paddle.ts` — transactions, revenue
- [x] `sources/privydock/index.ts` — composes the three, declares capabilities
- [x] Graceful degradation when one upstream is down — one dead source must not blank the page

### 3.2 Snapshots

- [x] Migration in the PrivyDock repo: `public.loyrix_metric_snapshots(project, metric, day, value)` — applied 2026-08-13
- [x] `sources/privydock/snapshots.ts` + `/api/cron/snapshot` — collect and upsert, idempotent on `(project, metric, day)`
- [ ] **Scheduling deferred** — Vercel Cron is paid on this account. The endpoint takes a bearer secret so any external scheduler can drive it; a GitHub Actions `schedule:` workflow is the free option.
- [ ] Backfill as far as retention still allows — **still expiring**

**Table lives in `public` with a `loyrix_` prefix, not its own schema.** Supabase only exposes `public` through PostgREST, and the backoffice reads and writes over PostgREST rather than a direct Postgres connection. The prefix keeps it visibly separate from PrivyDock's product tables without adding a database driver dependency to the console.

Point-in-time totals (licences, waitlist) cannot be reconstructed for past days, so those series begin the first time the job runs. Traffic and download series backfill to whatever Cloudflare still retains.

### 3.3 Screens

Six screens, specified in detail under _PrivyDock metrics specification_. Panels marked **P4** there render an "estimated" state until Phase 4 supplies exact numbers.

- [x] Overview — eight cards plus the funnel strip
- [x] Traffic — visitors, views, human/bot split, countries, hostname split
- [x] Downloads — R2 fetches per file, region, update-check volume
- [x] Licences — searchable table, status split, activations, macOS and app-version spread
- [x] Waitlist — signups over time, source split, waitlist → customer join
- [x] Revenue — Paddle transactions, price points, webhook health

**Acceptance:** switch to PrivyDock and read traffic, downloads, licences, waitlist and revenue, with history that survives past Cloudflare's retention window. Estimated panels are visibly labelled as such.

---

## Phase 4 — Close the tracking gap

**Goal:** make the funnel real. Requires changes in the **PrivyDock site repo**, not just the backoffice.

Until this lands there is a hole exactly where the money is: TelemetryDeck knows clicks, Cloudflare knows file fetches, and the two cannot be joined.

#### 4.1 Instrumentation in the PrivyDock repo

- [ ] Migration: `loyrix.page_views` and `loyrix.download_events` (see the metrics specification for columns)
- [ ] `lib/visitor.ts` — daily-rotating salt, `HMAC(ip + user_agent)` truncated to 16 bytes, salt discarded on rotation
- [ ] `lib/classify.ts` — the `client_class` / `signals` bot classifier
- [ ] `app/api/download/route.ts` — classify, log a row, then 302 to R2
- [ ] `app/api/pv/route.ts` — client-side page-view beacon; never log the 404 handler
- [ ] Replace direct DMG links on `/download` with the route
- [ ] Route the ~11 untracked `/download` CTAs through the tracked link (SEO pages, about, checkout success, footer)
- [ ] Nightly rollup into `loyrix.metric_snapshots`, then delete raw rows past 90 days
- [ ] Privacy policy amended: daily-rotating hashed IP, still no cookies, still no raw IP retained

#### 4.2 Backoffice

- [ ] Downloads panel reads `download_events` instead of R2 estimates
- [ ] Traffic panels read `page_views`; drop the "estimated" markers
- [ ] Funnel strip — visit → `/download` view → click → download → licence in one query
- [ ] Human / suspected / bot toggle across traffic and download panels

#### 4.3 Cloudflare

- [ ] Cache Rule so `appcast.xml` is edge-cached and Sparkle polling stops hitting R2

**Acceptance:** visit → click → download is one query, with real unique counts, no sampling, and no bot contamination.

---

## Phase 5 — Credential isolation

**Goal:** shrink the blast radius of the credentials the console holds. Independent of who logs in, so it does not wait for Phase 6.

- [ ] Read-only keys for every read-only source (Cloudflare analytics, Supabase reads)
- [ ] Write paths on separately scoped credentials
- [ ] Secret rotation runbook

**Acceptance:** a leaked console credential cannot mutate production data in any product.

---

## Phase 6 — Authentication rebuild

**Goal:** replace the shared password with per-user identity, a second factor, and revocable sessions.

**Deferred by decision (2026-08-13).** Until this ships, one shared username and password gates every project, sessions cannot be revoked, and the audit log cannot attribute an action to a person. Bring this forward if the console starts holding data whose leak would harm a customer — from Phase 3 it fronts PrivyDock customer emails and license keys.

Decide **TOTP vs passkeys** before starting; enrollment is built on that choice and retrofitting means redoing it.

### 6.1 Identity

- [ ] Decide where the identity tables live — they cannot sit in a per-project database (see _Where the console stores data_)
- [ ] Migration: `admin_users`, `admin_sessions`, `admin_login_attempts`, `admin_recovery_codes`
- [ ] scrypt password hashing helpers (`node:crypto`)
- [ ] TOTP verification via `otpauth`, ±1 step drift window
- [ ] Single-use recovery codes, hashed at rest
- [ ] `pnpm admin:user:add <username>` CLI printing QR + `otpauth://` URI + 10 recovery codes

### 6.2 Sessions and login

- [ ] Server-side sessions — opaque random token in the cookie, row in `admin_sessions`
- [ ] Login flow: password step, then TOTP step
- [ ] Rate limiting and lockout backed by `admin_login_attempts` (finding #3)
- [ ] "Sign out everywhere" — confirm revocation takes effect immediately (finding #6)

### 6.3 Attribution

- [ ] Migration: `admin_audit_log`; every mutation records the real user
- [ ] Per-project access — not every account reaches every product

**Acceptance:** each person has their own credential and second factor, any mutation traces to a named person, and a lost laptop is handled by revoking one account rather than rotating a shared password.

---

## Risks and open decisions

| Risk                                                                                                                                                                                                          | Mitigation                                                                                                                                                | Decide by            |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| **Blast radius.** One console holds production credentials for every app — Supabase service-role, Cloudflare admin, Paddle. A single compromise reaches everything.                                           | Read-only keys per source wherever the panel is read-only; write paths on separately scoped credentials.                                                  | Phase 3              |
| **Shared password until Phase 6.** One credential gates every product, sessions are not revocable, and the audit log cannot name a person. From Phase 3 it fronts PrivyDock customer emails and license keys. | Accepted deliberately. Phase 1 still fixes enforcement so the gate works. Re-evaluate before the console holds anything whose leak would harm a customer. | Before Phase 3 ships |
| **TOTP is phishable.** Passkeys are not.                                                                                                                                                                      | Decide before enrollment is built — retrofitting means redoing it.                                                                                        | Phase 6 start        |
| **Coupling creep.** The admin currently imports nothing from the monorepo, which is what keeps a future extraction trivial. Convenience imports would erode that silently.                                    | Treat `packages/*` as off-limits from `apps/admin`. Re-check the import list before each phase closes.                                                    | Ongoing              |
| **Adapter drift.** Each new project is bespoke code rather than configuration.                                                                                                                                | Keep the normalised shapes thin so onboarding stays cheap.                                                                                                | Ongoing              |
| **Next.js 16.** `AGENTS.md` warns its APIs differ from widely documented ones.                                                                                                                                | Read the installed docs in `node_modules/next/dist/docs/` before touching routing, server actions, or caching.                                            | Ongoing              |
| **Cloudflare retention expiring now.**                                                                                                                                                                        | Backfill snapshots as the first task in Phase 3.                                                                                                          | **Phase 3 start**    |

---

## Changelog

| Date       | Change                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-12 | Initial plan. Decisions: per-project adapters, standalone repo, PrivyDock first.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 2026-08-13 | Security review of `apps/admin` added (8 findings). Auth rebuild moved from Phase 5 to Phase 1. Console database section added.                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 2026-08-13 | **Snapshot capture built.** `loyrix_metric_snapshots` migrated into PrivyDock's Supabase, with a collector and a bearer-authorised endpoint that upserts on `(project, metric, day)` so any range can be re-run safely. Scheduling deferred — Vercel Cron is paid on this account — so the endpoint is manual until an external scheduler drives it.                                                                                                                                                                                                                    |
| 2026-08-13 | **Phase 3 adapters and screens shipped.** PrivyDock reads Supabase, Cloudflare and Paddle directly — no app changes were needed to onboard it, which is the adapter thesis holding. Route ownership is enforced in `proxy.ts` since both projects share one `app/[project]/…` tree. Verified against live credentials: 4 licences, 4 waitlist rows, 20 DMG downloads over 30 days, 258 human page views over 7 days. Paddle returns 403 — the key lacks `transaction.read`, so the Revenue panel degrades on its own while every other panel renders. Snapshots remain. |
| 2026-08-13 | **Metrics specification added.** Six PrivyDock screens defined panel by panel, each metric tagged Exact / Estimated / Sampled and marked with whether it needs Phase 4. Bot classification, storage/retention maths and the visitor-hash scheme documented. Phase 3 screens 5 → 6, Phase 4 tasks 9 → 14.                                                                                                                                                                                                                                                                |
| 2026-08-13 | **Phase 2 implemented.** Routes moved under `/[project]/…`, registry and per-source nav manifests added, project switcher in the shell, `/` forwards to the remembered project, unknown ids 404. Nav is driven by per-project manifests rather than the planned capability enum, which would have flattened LogMyPlate's twelve pages into six generic slots. Server actions recover the project from request context instead of a hidden field in all 23 forms.                                                                                                        |
| 2026-08-13 | **Named Loyrix.** The console is branded under the umbrella name that covers every app, replacing the working name "Switchboard". Package `@loyrix/admin`, cookie `loyrix_admin_session`, console-owned tables in a `loyrix` schema, and the UI now reads "Loyrix — Centralized backoffice". Doc renamed to `loyrix-backoffice-plan.md`.                                                                                                                                                                                                                                |
| 2026-08-13 | **Phase 1 implemented** (8/9; the remaining item is a Vercel dashboard check). Two corrections vs the written plan: Next.js 16 renames middleware to `proxy.ts`, and the auth check went into `adminFetch` rather than being hoisted through 13 pages, per the framework's own guidance on data-source-adjacent checks. Findings 1, 2, 4 and 8 closed and verified against a running build.                                                                                                                                                                             |
| 2026-08-13 | **Dropped the central console database.** Each project stores console data in its own DB, configured per project in `.env`. The retention problem is PrivyDock-specific — LogMyPlate's own API already retains history — so `metric_snapshots` is one table in PrivyDock's existing Supabase, namespaced under a `loyrix` schema. Identity tables remain the one thing that cannot be per-project; that decision defers with Phase 6.                                                                                                                                   |
| 2026-08-13 | **Auth rebuild deferred to a new final Phase 6.** The existing shared username/password gates both projects meanwhile. Phase 1 keeps only the enforcement fixes (findings 1, 2, 4, 8), which need no database. Database provisioning moves to Phase 3, where `metric_snapshots` needs it regardless. Old Phase 5 split: credential isolation stays at 5, attribution moves into 6.                                                                                                                                                                                      |
| 2026-08-13 | **Reversed the standalone-repo decision.** The admin has zero workspace imports and its own Vercel project, so extraction stays cheap indefinitely and buys nothing today. Phase 1 loses its repo-bootstrap section (21 → 20 tasks) and gains naming neutralisation plus rules for keeping extraction cheap.                                                                                                                                                                                                                                                            |
