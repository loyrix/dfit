# AI Integration Audit — 2026-08-20

> **Status update (21 Aug 2026).** F1–F5, F8, T1 and the chat quota timezone
> bug are fixed and on `main`. Each finding below is marked.
>
> **Two corrections to this audit**, found while implementing the fixes:
>
> - **F5 as originally written was wrong.** It claimed there was no cost
>   visibility. The `/admin/ai-cost` dashboard does compute cost, at query time,
>   from a rate table in `admin.ts` — it reported $0.3145 for the last 30 days.
>   The real problem was narrower and is described below. The follow-on claim
>   that this blindness is why the prompt grew unnoticed was overstated: the
>   dashboard would have shown tokens and cost rising.
> - **F4 was understated.** It is not just that failures go unrecorded — the
>   dashboard renders a "Failed runs" metric computed as
>   `count(*) filter (where not success)` over a column hardcoded to `true`, so
>   it displayed `0` as a number that could never be anything else.

Review of every AI code path in the repo: what runs on a model, where the gaps
are, and where tokens are spent without buying anything.

Every number below is measured, not estimated — from `ai_provider_runs`,
`chat_messages`, and `chat_sessions` in the live database, plus token counts
from Gemini's `countTokens` endpoint. Nothing here is inferred from reading
code alone.

---

## Scope

Only two surfaces call a model. Everything else that looks AI-adjacent
(`meal-rating.ts`, `plate-score-policy.ts`, `nutritionist-suggested-prompts.ts`,
`streak-summary.ts`) is deterministic — good, and worth keeping that way.

| Surface           | Entry point                                            | Provider                      | Model              |
| ----------------- | ------------------------------------------------------ | ----------------------------- | ------------------ |
| Food photo scan   | `scans.ts:600` → `analyzeMealImage`                    | Vertex (`AI_PROVIDER=vertex`) | `gemini-2.5-flash` |
| Nutritionist chat | `chat.ts:116` + `chat.ts:251` → `generateChatResponse` | Vertex                        | `gemini-2.5-flash` |

## Measured baseline

| Metric                        | Value                                            |
| ----------------------------- | ------------------------------------------------ |
| Scan runs recorded            | 814 lifetime, 173 in last 30 days                |
| Scan input tokens (v9 prompt) | 3,782 avg                                        |
| Scan output tokens            | 345 avg                                          |
| Scan latency                  | p50 3.1s · p95 6.6s · p99 9.0s · max 44.9s       |
| v9 India prompt, rendered     | **1,838 tokens** — 49% of every scan's input     |
| Chat AI calls                 | 75 welcome + 129 replies = 204                   |
| Chat sessions                 | 75 total, 33 never received a user message (44%) |
| Approx. cost per scan         | ~$0.002 (~$1.63 lifetime across all 814 runs)    |

**Cost today is genuinely pennies.** Nothing in this document is urgent on
spend grounds. It matters because the same code at 10,000 scans/day is ~$600/mo,
and roughly a third of that is avoidable. The reliability findings, by contrast,
affect users right now.

---

## Reliability findings

### F1 · ~~High~~ FIXED — Chat sessions live only in one lambda's memory

`chat.ts:47` creates `new NutritionistSessionStore()` at module load, and the
store is a plain in-memory `Map` (`nutritionist-session-store.ts:16`). The API
is deployed to Vercel serverless (`vercel.json`, `apps/api/src/vercel.ts`).

Session state — system prompt, full message history, turn count — exists only on
the instance that created it. Any request routed to a different instance returns
404 `session_not_found` ("Chat session not found or expired. Start a new one."),
and the user has already spent a session from their daily quota. Free users get
**1 session per day** (`ai_chat_settings.free_max_sessions_per_day`), so a lost
session means no AI chat until tomorrow.

Session TTL is 30 minutes, which comfortably outlives a warm lambda.

Everything needed to rehydrate is already persisted: `chat_sessions.context_snapshot`
holds the context JSON and `chat_messages` holds the full transcript. The store is
a cache in front of data that already exists.

**Evidence:** 13 zero-turn sessions were followed by another session from the same
profile within 10 minutes — consistent with users being told to start over.
Not proof on its own (some of those are the empty-reply bug fixed in `e6e6711`),
but the architecture guarantees the failure mode regardless.

### F2 · ~~High~~ FIXED — A failed AI call burns a chat turn and duplicates the message

```
chat.ts:224   const turnNumber = activeSession.turnCount + 1;
chat.ts:226   activeSession.messages.push({ role: "user", content: body.message });
chat.ts:227   activeSession.turnCount = turnNumber;
chat.ts:249   aiResult = await chatAiProvider.generateChatResponse({ ... })   // no try/catch
```

The user message is appended and the turn counter incremented _before_ the
provider call, with no error handling around it. A transient 503 — I hit one from
Gemini during testing ("This model is currently experiencing high demand") —
produces a 500 to the client, **and**:

1. The turn is consumed even though the user got no reply.
2. The user's message stays in `activeSession.messages`. Retrying the same
   message pushes it a second time, so the model sees it duplicated.

Fix: wrap the call, and roll back `turnCount` and the pushed message on failure.

### F3 · ~~Medium~~ FIXED — Chat has no retries; scans have three

`VertexAiProvider.generateWithRetries` (`vertex-ai-provider.ts:203`) retries 3×
with 1s/2s/4s backoff on 5xx, 408, and 429. Both chat providers make exactly one
attempt. Same infrastructure, same transient failures, opposite resilience —
and chat is the path where a failure costs the user a scarce daily session.

### F4 · ~~Medium~~ FIXED — `ai_provider_runs.success` is hardcoded `true`

`postgres-store.ts:2836` writes the literal `true`. The failure path
(`scans.ts:611-620`) calls `updateScan` with `status: "failed"` and no
`aiProviderRun`, so **no row is written at all** on failure.

814/814 "success" is an artifact of the schema, not a real reliability number.
`error_code` has never been written. There is no AI failure-rate metric anywhere
— failures exist only in request logs.

### F5 · ~~Medium~~ FIXED (and partly wrong as written) — `estimated_cost_usd` is never computed

> **Correction.** "Zero cost visibility" was wrong. `/admin/ai-cost` derives
> cost at query time from a hardcoded rate `case` in `admin.ts`, coalesced with
> the stored value, and reports real numbers ($0.3145 over 30 days).

What was actually true: the column was NULL on all 814 rows, so every run's cost
was recomputed later against whatever the rate table said at read time, with no
record of what it cost when it ran. A model missing from that `case` silently
priced at $0, and the rate table was duplicated inline in the dashboard query
where it could drift from anything else that priced a run.

### F6 · High (OPEN) — The Gemini scan path ignores every admin-published prompt

`RuntimeGeminiAiProvider` loads only `ai_scan_config` — unlike
`RuntimeVertexAiProvider`, it never reads `ai_prompt_versions`. And
`GeminiAiProvider` calls:

```
gemini-ai-provider.ts:225   buildFoodPhotoPrompt(input.userHint, undefined, input.userProfile)
```

Passing `undefined` for the template hardcodes the built-in v5 default. It also
reports `promptVersion: "gemini_food_photo_v5"` regardless of what is live.

The full divergence between the two scan providers:

|                                              | Vertex (prod)  | Gemini                  |
| -------------------------------------------- | -------------- | ----------------------- |
| Admin prompt (`ai_prompt_versions`)          | applied        | **ignored — always v5** |
| Region routing (`food_photo_IN` / `_GLOBAL`) | applied        | **ignored**             |
| `thinkingBudget` default                     | `0` (off)      | **`-1` (dynamic)**      |
| `maxOutputTokens`                            | 3072           | **unset**               |
| Retries                                      | 3 with backoff | none                    |
| `topP` / `candidateCount`                    | 0.8 / 1        | unset                   |

Prod runs Vertex, so this is latent. But `AI_PROVIDER=gemini` is a documented
fallback, and flipping it silently reverts the prompt by four versions _and_
reintroduces unbounded thinking with no output cap — exactly the failure just
fixed in chat (`e6e6711`).

### F7 · Medium (OPEN) — Retry budget can exceed the function timeout

3 retries × 30s Vertex timeout + 7s of backoff = up to ~97s worst case. No
`maxDuration` is configured in `vercel.json`, so the function runs on the plan
default. Observed max scan latency is already 44.9s. Worth bounding the total
retry budget rather than the per-attempt timeout.

### F8 · ~~Low~~ FIXED — `sessionsUsedToday: 0` hardcoded

`chat.ts:355` returns a literal `0` in the message response while the session
response (`chat.ts:198`) computes it correctly. The client sees a wrong quota
number on every turn.

---

## Token and cost findings

### T1 · ~~High~~ FIXED — 37% of chat AI calls are greetings, and 44% of those go unanswered

75 welcome calls versus 129 actual reply calls. Every session creation fires a
full model call carrying the entire system prompt plus context (~1,000 input
tokens) to produce this:

> "Greet the user warmly and briefly summarize what you see in their data.
> Keep it under 60 words."

Everything that greeting summarizes is already in `NutritionistContext` as
structured data. And `generateSuggestedPrompts` in
`nutritionist-suggested-prompts.ts` already proves the deterministic-from-context
pattern works well in this codebase.

Two options, both cheap:

- **Template it.** Build the greeting from `context.today.mealsLogged`, totals,
  and the health target the same way suggested prompts are built. Removes 37% of
  chat AI calls outright.
- **Defer it.** Return a templated greeting at session create and fold the model
  call into the first user turn. Keeps AI-written copy for people who actually
  engage, spends nothing on the 44% who don't.

### T2 · Medium — The scan prompt grew 34% across v5 → v9 with no budget

Real per-version averages from `ai_provider_runs`:

| Prompt version                | Runs | Avg input | Avg output |
| ----------------------------- | ---- | --------- | ---------- |
| `gemini_food_photo_v5_global` | 327  | 2,715     | 327        |
| `gemini_food_photo_v5_india`  | 314  | 2,814     | 315        |
| `gemini_food_photo_v7_india`  | 19   | 3,585     | 348        |
| `gemini_food_photo_v9_india`  | 33   | **3,782** | 345        |
| `gemini_food_photo_v9_global` | 18   | **4,009** | 441        |

**+968 input tokens per scan (+34%)** from v5 to v9, while output stayed flat.
The additions are real (cooking method, meal advice, advice safety rules), but
nothing tracks the cost of a prompt revision, and F5 means no one would see it.

Worth reviewing v9 for redundancy specifically. The `ADVICE SAFETY RULES` block
alone is ~35 lines restating the same constraint several ways.

### T3 · Medium — No context caching, and no way to tell whether it's working

The 1,838-token prompt is byte-identical across every scan except two short
interpolated blocks. It clears the 1,024-token minimum for Gemini 2.5 implicit
caching, and the prompt is already `parts[0]` with the image second — correct
ordering for prefix caching.

Two problems:

1. **`{{USER_HINT_BLOCK}}` and `{{USER_PROFILE_BLOCK}}` sit ~88% of the way
   through the template**, with the entire MEAL ADVICE and ADVICE SAFETY RULES
   sections after them. That caps the stable cacheable prefix at ~1,600 tokens
   instead of the full 1,838. Moving both blocks to the end of the template is
   a one-line change to the prompt body.
2. **`cachedContentTokenCount` is never read** from `usageMetadata` — only
   `promptTokenCount` and `candidatesTokenCount` are captured. So there is no
   way to know whether caching is hitting at all. Capture it before optimizing it.

At current volume implicit caching probably rarely hits (cache TTL is minutes,
traffic is ~6 scans/day). This becomes a real lever at scale, and explicit
caching would make it deterministic.

### T4 · Medium — `website-reference-content.ts` is dead code

6 KB of app/billing/privacy reference material exists in the repo and is wired
into `buildNutritionistSystemPrompt`, but no `website_reference_content` row was
ever published to `ai_prompt_versions`. `getAiPrompt` returns `undefined`, so it
is never appended.

Confirmed by the numbers: chat turn-1 input is 824–1,064 tokens, consistent with
prompt + context only. Including this content would add roughly 1,500 tokens to
**every chat turn**.

Decide one way or the other. Today the nutritionist cannot answer "how do I cancel
my subscription" — the reference material for exactly that is sitting unused.

### T5 · Medium — Scans run with thinking off while chat now has 512

`ai_scan_config` has never been saved to `app_runtime_config` (the table holds
`meal_score_policy`, `engagement_policy`, `app_update_policy`, `scan_limits`,
`maintenance`, `admin_policy` — no `ai_scan_config`). So `loadAiScanConfig`
returns `undefined` and `thinkingConfigForModel` falls back to
`thinkingBudget: 0` — thinking fully disabled.

Two things follow:

- The zod schema documents `thinkingBudget` as defaulting to `-1` (dynamic).
  That default **never applies**, because the code path only reaches zod when a
  row exists. The documented behaviour and the actual behaviour disagree.
- Portion and gram estimation from a photo is the more reasoning-heavy of the two
  AI tasks, and it is the one running with reasoning switched off. Given the
  accuracy-first stance, this is worth an A/B: a capped budget (256–512) on
  scans, measured against portion-signal warning rates.

### T6 · Low — Image is ~1,944 tokens, 51% of scan input

Photos are capped at 1600px client-side (`meal_photo_optimizer.dart`). Dropping
to 1024px would cut image tokens meaningfully. Whether that costs identification
accuracy is measurable, not guessable — flagging it as an experiment to run
against the existing scan corpus, not a change to make.

### T7 · Low — Duplicate `getHealthTarget` per scan

Read once for the advice profile (`scans.ts:595`) and again inside
`withFreshPlateScore` (`scans.ts:359`). Same row, same request. Two DB round-trips
where one would do.

### T8 · Low — Chat history is never trimmed

Every turn resends the full transcript. Bounded by `maxTurns: 15`, so worst case
is ~5–6k input tokens on the final turn — acceptable. Noting it only because
raising `maxTurns` would make the growth quadratic.

### T9 · Low — `raw_ai_json` stores the full provider response

`ai_predictions.raw_ai_json` embeds `providerRun.rawResponse` alongside the
parsed analysis: 899 rows, 1.6 MB total, 1.8 KB average. Not a problem at this
size. Worth a retention policy before it is.

---

## Fixed since this audit

| Finding        | Commit      | Note                                                                                                             |
| -------------- | ----------- | ---------------------------------------------------------------------------------------------------------------- |
| F2 + F3        | `4c68395`   | Turn rolled back on failure; both chat providers retry transient errors within the existing timeout budget       |
| F1             | `d394bfa`   | Sessions resume from Postgres; public id is now the row id; ownership, soft-delete, closed and TTL guards added  |
| Quota timezone | `d394bfa`   | `session_date` written and compared in the profile's timezone, not the database server's                         |
| T1 + F8        | this change | Greeting built from context — opening a session now costs zero tokens; real session quota reported on every turn |

An access-control gap surfaced while fixing F1: the in-memory store keyed
sessions on the id alone, so any caller holding a session UUID could post into
that conversation. `profile_id` is now part of the resume query.

## What I would do first

| Priority | Item                                                               | Why                                                               |
| -------- | ------------------------------------------------------------------ | ----------------------------------------------------------------- |
| 1        | **F1** — rehydrate chat sessions from Postgres                     | Users lose their one daily free session to a routing coin-flip    |
| 2        | **F2** — roll back turn state on provider failure                  | Two-line fix, stops burning turns and duplicating messages        |
| 3        | **T1** — template or defer the welcome message                     | Removes 37% of chat AI calls, no accuracy cost                    |
| 4        | **F4 + F5** — record failures and compute cost                     | Everything else is unmeasurable until these exist                 |
| 5        | **F6** — make the Gemini path honour runtime prompts, or delete it | A fallback that silently degrades is worse than no fallback       |
| 6        | **T4** — publish the website reference content, or delete the file | Currently paying maintenance on unused code and missing a feature |
| 7        | **F3** — retries on chat                                           | Matches what scans already do                                     |
| 8        | **T5** — A/B a capped thinking budget on scans                     | Accuracy question, needs data before a decision                   |

F7, F8, T2, T3, T6, T7, T8, T9 are worth doing but none of them change what a
user experiences this week.
