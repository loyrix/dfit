import "server-only";

import { dailyDownloads, dailyTraffic } from "./cloudflare";
import { countRows, latestSnapshot, upsertSnapshots, type Snapshot } from "./supabase";

/**
 * Captures PrivyDock's daily metrics into permanent storage.
 *
 * Cloudflare's retention is rolling — 8 days for path-level data, 90 for the
 * rest — so a day that is never captured is gone for good. This is why the job
 * matters more than any chart built on top of it.
 *
 * Point-in-time counts (licences, waitlist) cannot be reconstructed for past
 * days, so they are only recorded for today and accumulate going forward.
 */

const DAY = 24 * 60 * 60 * 1000;

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export async function collectPrivydockSnapshots(days: number): Promise<Snapshot[]> {
  const to = new Date(Date.now() - DAY); // yesterday: today is still accumulating
  const from = new Date(to.getTime() - Math.max(days - 1, 0) * DAY);

  const [traffic, downloads] = await Promise.all([
    dailyTraffic(isoDate(from), isoDate(to)),
    dailyDownloads(from, new Date(to.getTime() + DAY - 1)),
  ]);

  const rows: Snapshot[] = [];
  const push = (day: string, metric: string, value: number) =>
    rows.push({ project: "privydock", metric, day, value });

  for (const day of traffic) {
    push(day.date, "traffic.page_views", day.pageViews);
    push(day.date, "traffic.human_page_views", day.humanPageViews);
    push(day.date, "traffic.bot_page_views", day.botPageViews);
    push(day.date, "traffic.unknown_page_views", day.unknownPageViews);
    push(day.date, "traffic.unique_ips", day.uniqueIps);
    push(day.date, "traffic.requests", day.requests);
  }

  for (const day of downloads) {
    push(day.date, "downloads.dmg_completed", day.dmgCompleted);
    push(day.date, "downloads.dmg_bytes", day.dmgBytes);
    push(day.date, "downloads.dmg_requests", day.dmgRequests);
    push(day.date, "downloads.appcast_requests", day.appcastRequests);
  }

  // Totals as they stand right now. Historic values are unrecoverable, so these
  // start from the day the job first runs.
  const today = isoDate(new Date());
  const [licenses, waitlist] = await Promise.all([
    countRows("licenses").catch(() => null),
    countRows("waitlist_signups").catch(() => null),
  ]);
  if (licenses !== null) push(today, "licenses.total", licenses);
  if (waitlist !== null) push(today, "waitlist.total", waitlist);

  return rows;
}

export async function runPrivydockSnapshot(days: number) {
  const rows = await collectPrivydockSnapshots(days);
  await upsertSnapshots(rows);
  return { project: "privydock", days, written: rows.length };
}

/** Longest window Cloudflare still retains. */
const FULL_BACKFILL_DAYS = 90;
/** Enough to repair a few missed days without re-reading a whole quarter. */
const TOP_UP_DAYS = 5;
/** Skip a capture if one already ran this recently. */
const FRESH_FOR_MS = 6 * 60 * 60 * 1000;

export type AutoCaptureResult =
  | { status: "skipped"; reason: string }
  | { status: "captured"; days: number; written: number }
  | { status: "failed"; error: string };

/**
 * Capture triggered by opening the PrivyDock console rather than by a schedule.
 *
 * Called from `after()`, so it runs once the page has already been sent and
 * never adds latency. The first run backfills everything Cloudflare still holds;
 * later runs only top up recent days, and are skipped entirely if a capture
 * already ran in the last few hours — opening the page five times in a morning
 * should not mean five backfills.
 */
let lastCheckedAt = 0;

export async function autoCapturePrivydock(): Promise<AutoCaptureResult> {
  // Cheap guard first. Next prefetches routes on hover, so this can be reached
  // several times per visit; without it every one of those would cost two
  // Supabase reads. The database check below remains the cross-instance
  // backstop for a cold serverless worker, where this counter starts at zero.
  if (Date.now() - lastCheckedAt < FRESH_FOR_MS) {
    return { status: "skipped", reason: "checked recently in this instance" };
  }
  lastCheckedAt = Date.now();

  try {
    const latest = await latestSnapshot("privydock");

    if (latest && Date.now() - Date.parse(latest.capturedAt) < FRESH_FOR_MS) {
      return { status: "skipped", reason: "captured within the last 6 hours" };
    }

    const days = latest ? TOP_UP_DAYS : FULL_BACKFILL_DAYS;
    const result = await runPrivydockSnapshot(days);
    return { status: "captured", days, written: result.written };
  } catch (error) {
    // Never let a capture failure surface as a broken console — the page has
    // already been sent by the time this runs.
    return { status: "failed", error: error instanceof Error ? error.message : "unknown" };
  }
}
