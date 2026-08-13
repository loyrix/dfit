import "server-only";

import { dailyDownloads, dailyTraffic } from "./cloudflare";
import { countRows, upsertSnapshots, type Snapshot } from "./supabase";

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
