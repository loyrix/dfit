# Production Readiness Review — 1,000 Concurrent Requests

Reviewed 21 Aug 2026 against `24c3325`. Every claim below is marked
**[verified]** where I read it in the code or measured it, or **[check]**
where it depends on a console setting I cannot see from the repo.

## Verdict

**Not ready for 1,000 concurrent requests.** It would fail, and it would fail
early — most likely on the upstream AI quota and the database connection pool
within the first few seconds.

The gap is mostly configuration and a handful of contained structural fixes,
not a rewrite. Current production traffic is roughly 6 scans a day, so nothing
here is on fire; these are the things that break the moment it isn't.

Ranked by what fails first.

---

## 1 · Vertex AI quota is the binding ceiling — [check]

Nothing else matters until this is confirmed. Vertex Gemini quotas are enforced
per project, per region, per model, and are measured in **requests per minute**.
1,000 concurrent scans means ~1,000 requests in flight against a limit that is
typically in the low hundreds by default.

Check the exact number in the GCP console under
IAM & Admin → Quotas → Vertex AI API, for `gemini-2.5-flash` in `asia-south1`.
If it is not already raised well above your target, everything downstream is
academic.

**The retry logic makes a quota breach worse, not better.** [verified]
`vertex-ai-provider.ts:77` retries three times on 429. A quota breach therefore
turns 1,000 requests into up to 4,000 within seconds — a self-inflicted
thundering herd that keeps the quota pinned. Retrying 429 needs jitter and a
much longer backoff than the current fixed `[1s, 2s, 4s]`, or should not retry
429 at all.

## 2 · Database connections will exhaust — [verified]

`db/client.ts` sets `max: 5` per pool, and the pool is created once per lambda
instance (`app.ts:69`, called once at module load).

On Vercel each instance serves one request at a time unless Fluid Compute is
enabled, so 1,000 concurrent requests means on the order of 1,000 instances,
each opening up to 5 connections — **up to 5,000 connections** against the
Supabase pooler, which allows a few hundred.

The pooler choice is correct: port `6543` is transaction-mode PgBouncer, and
`prepare: false` is set, which transaction mode requires. The sizing is not.

**Fix:** `max: 1` (or 2) for serverless — an instance handling one request
cannot use five connections anyway — and confirm the pooler's max client
connections on your Supabase plan.

## 3 · No rate limiting anywhere — [verified]

There is no `@fastify/rate-limit`, no per-IP, per-install or per-profile
throttle on any route. A single misbehaving client, a retry storm, or a scraper
can consume the entire Vertex quota and the whole connection pool.

The scan quota system limits _credits_, not _request rate_, and it is checked
after several database round trips — so even rejected requests cost you.

## 4 · Region mismatch — [verified in repo, check in dashboard]

`vercel.json` has no `regions` key, so functions run in Vercel's default region
(Washington DC, `iad1`) unless the project overrides it. The database is
`aws-1-ap-south-1` — Mumbai.

That is roughly 200ms round trip per query, and the analyze path makes many
sequential queries (see §6). It also holds each pooled connection open for the
whole of that latency, multiplying §2.

**Fix:** set `"regions": ["bom1"]` in `vercel.json`. One line, and on this
architecture it is probably the single largest latency win available.

## 5 · `getProfile()` is the hidden multiplier — [verified]

This is the most serious internal problem.

`getProfile()` is called **27 times** across `postgres-store.ts`, is **never
memoized per request**, and every call costs:

1. a `SELECT` (`getProfileForSession`), plus
2. `attachInstallToProfile`, which performs an **`INSERT … ON CONFLICT` into
   `devices`** — a write, on every read of the current profile.

So a single request that touches the profile five times issues ten round trips
including five redundant writes, each one taking a connection for a Mumbai↔US
round trip. Under load this is both the connection-pool pressure and a
write-amplification problem on `devices`.

**Fix:** memoize the profile for the lifetime of the request (there is already
a request-context module to hang it on), and move the device upsert out of the
read path to somewhere it belongs — a session or bootstrap endpoint.

**I made this worse.** The chat quota timezone fix in `d394bfa` added
`getProfile()` calls to `countChatSessionsToday` and `createChatSession`,
adding four round trips and two writes to every chat session creation. That
should take a timezone argument instead of fetching the profile.

## 6 · Round trips per scan — [verified]

The analyze handler has 11 named timing steps, but the true count is higher
because repository methods fan out internally — `consumeCredit` alone does
`getProfile` + `getOrCreateQuota` + the guarded `UPDATE` + a `quota_events`
insert.

Worst offender: `postgres-store.ts:2955` inserts predicted items **one row at a
time inside a transaction**:

```
for (const item of items) {
  await tx`insert into ai_predicted_items ...`;
}
```

A six-item meal is six sequential round trips holding a transaction open. At
cross-region latency that is over a second of held connection per scan. It
should be one multi-row insert.

## 7 · `app.inject` on the production hot path — [verified]

`vercel.ts:20` serves every request through `app.inject()` — that is
`light-my-request`, Fastify's **testing** harness, not a server.

Consequences: the full request body is buffered into memory with no streaming,
and the response is fully materialised before anything is sent. For a scan that
means the 3MB base64 image exists simultaneously as the chunk array, the
concatenated Buffer, the inject payload, the parsed JSON string, and the decoded
Buffer — several times the wire size, per invocation, with a 6MB body limit
(`app.ts:60`) permitting it.

This is a known pattern for putting Fastify on Vercel and it works, but it is
memory-hungry and it is on the path of your heaviest endpoint.

---

## Correctness under concurrency

**Credits are atomically consumed — [verified], and this is done right.** The
`UPDATE … WHERE column > 0 RETURNING` pattern at `postgres-store.ts:1683`
cannot over-grant under concurrency, and `if (!rows[0]) throw` handles the loss.

**But there is a check-then-consume window — [verified].** Quota is checked at
`scans.ts:548`, the model is called at `scans.ts:600`, and the credit is only
consumed at `scans.ts:687`. Two concurrent scans on a user's last credit both
pass the check, **both call Gemini and both cost you money**, then one throws
`No free scan credit remaining` after the user has already waited several
seconds. Reserve the credit before the AI call and refund on failure.

**No idempotency on analyze — [verified].** A client retry after a timeout
re-runs the entire AI call. The image-hash analysis cache absorbs some of this,
but only after the credit check and only for byte-identical images.

**Timezone handling is still inconsistent — [verified].** `localDate()` (UTC)
and `localDateForTimezone(profile.timezone)` are both in use. Rewarded-ad daily
caps read and write UTC consistently, so they reset at 05:30 IST rather than the
user's local midnight — the same bug class fixed for chat sessions in `d394bfa`,
still present for ads and the scan quota row.

## Accuracy of results

This side is in better shape than the scaling side.

**Good, and worth keeping:**

- Structured output via `responseSchema` with `responseMimeType:
application/json` — the model cannot drift into prose.
- `temperature: 0.1`, `topP: 0.8` — appropriate for extraction rather than
  generation.
- Scores and ratings are computed deterministically in `@logmyplate/domain`,
  never asked of the model.
- `applyPortionSignals` sanity-checks portions and logs what it corrects.
- The analysis cache is keyed on an exact image hash per profile, so it cannot
  serve one user's analysis to another.
- Zod validation rejects off-schema responses rather than passing them through.

**Open accuracy questions:**

- **Scans run with thinking disabled** (`thinkingBudget: 0`, since no
  `ai_scan_config` row exists) while chat now gets 512. Portion and gram
  estimation from a photo is the more reasoning-heavy of the two tasks, and it
  is the one running with reasoning off. Worth an A/B against portion-signal
  warning rates.
- **The image is ~1,944 tokens of the ~3,800 input**, capped at 1600px
  client-side. Whether that resolution is necessary for accuracy is measurable
  against the existing scan corpus.
- **`gemini-2.5-flash` under sustained load** may return more `MAX_TOKENS`
  truncations. `maxOutputTokens` is 3,072 with thinking off, so there is
  headroom, but the empty-response path now logs `finishReason` — watch it.

---

## Recommended order

Config first — these are hours, not days, and they remove the hard failures.

| #   | Change                                                                       | Effort             |
| --- | ---------------------------------------------------------------------------- | ------------------ |
| 1   | Confirm and raise Vertex quota for the target concurrency                    | Console            |
| 2   | `regions: ["bom1"]` in `vercel.json`                                         | One line           |
| 3   | `max: 1` in the SQL client; confirm pooler limits                            | One line + console |
| 4   | Rate limiting on scan and chat endpoints                                     | Half a day         |
| 5   | Jitter + longer backoff on 429, or stop retrying it                          | An hour            |
| 6   | Memoize `getProfile()` per request; move the device upsert off the read path | A day              |
| 7   | Reserve the credit before the AI call, refund on failure                     | Half a day         |
| 8   | Batch the `ai_predicted_items` insert                                        | An hour            |
| 9   | Idempotency key on analyze                                                   | Half a day         |
| 10  | Load test at 1,000 concurrent and re-measure                                 | A day              |

Nothing here should be considered done until item 10 has actually been run.
Every number in this document is read from code or from production data at
current volume; none of it is a substitute for watching the system under real
load.
