import { NextResponse } from "next/server";

import { runPrivydockSnapshot } from "../../../sources/privydock/snapshots";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Metric capture, triggered manually for now.
 *
 * Scheduling is deferred — Vercel Cron is a paid feature on this account. Any
 * external scheduler can drive this endpoint when the time comes (a GitHub
 * Actions `schedule:` workflow costs nothing), which is why authorisation is a
 * bearer secret rather than an admin session: callers have no cookies.
 * `proxy.ts` skips /api so the session gate does not redirect them to login.
 *
 * Pass ?days=N to backfill. Upserts are keyed on (project, metric, day), so
 * re-running any range is safe and repeatable.
 */
function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  // Without a configured secret the endpoint is only reachable in local
  // development; Vercel always sets one for scheduled invocations.
  if (!secret) return process.env.NODE_ENV !== "production";
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const requested = Number.parseInt(new URL(request.url).searchParams.get("days") ?? "2", 10);
  // Two days by default so a missed night is repaired on the next run. Capped at
  // Cloudflare's 90-day retention, beyond which there is nothing to read.
  const days = Number.isFinite(requested) ? Math.min(Math.max(requested, 1), 90) : 2;

  try {
    const result = await runPrivydockSnapshot(days);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "snapshot failed" },
      { status: 500 },
    );
  }
}
