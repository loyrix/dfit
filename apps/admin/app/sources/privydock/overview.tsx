import { after } from "next/server";

import { Metric, PageHeader, formatDate, formatNumber } from "../../components/ui";
import { SourceError, safe } from "../../components/source-error";
import { CaptureButton } from "../../components/capture-button";
import { cachedDownloadObjects } from "./cloudflare";
import { cachedTransactions, netRevenue } from "./paddle";
import { autoCapturePrivydock } from "./snapshots";
import {
  CLIENT_HUMAN,
  DOWNLOAD_CLICKS_SINCE,
  VISITOR_IDENTITY_SINCE,
  countRows,
  downloadsDaily,
  latestSnapshot,
  listInstalls,
  trafficDaily,
} from "./supabase";

const DAY = 24 * 60 * 60 * 1000;

function isoDate(offsetDays: number) {
  return new Date(Date.now() - offsetDays * DAY).toISOString().slice(0, 10);
}

export async function PrivydockOverview() {
  after(autoCapturePrivydock);

  const since7 = isoDate(7);
  const since30 = isoDate(30);

  const [captured, traffic, downloads, installs, licenses, waitlist, updateChecks, transactions] =
    await Promise.all([
      safe(() => latestSnapshot("privydock")),
      safe(() => trafficDaily(since7)),
      safe(() => downloadsDaily(since30)),
      safe(() => listInstalls(500)),
      safe(() => countRows("licenses")),
      safe(() => countRows("waitlist_signups")),
      // The only figure Cloudflare still owns: Sparkle polls appcast.xml
      // directly on R2 and never touches anything we instrument.
      safe(() =>
        cachedDownloadObjects(
          new Date(Date.now() - 30 * DAY).toISOString(),
          new Date().toISOString(),
        ),
      ),
      safe(() => cachedTransactions(100)),
    ]);

  const humanTraffic = traffic.ok
    ? traffic.data.rows.filter((row) => row.client_class === CLIENT_HUMAN)
    : [];
  const humanViews = traffic.ok ? humanTraffic.reduce((sum, row) => sum + row.views, 0) : null;

  // Daily unique counts cannot be summed into a period total — the same person
  // on three days would count three times. Reported as a daily peak instead,
  // which is a number that means something.
  const measuredDays = humanTraffic.filter((row) => row.day >= VISITOR_IDENTITY_SINCE);
  const peakDailyVisitors = measuredDays.length
    ? Math.max(...measuredDays.map((row) => row.unique_visitors))
    : null;

  const humanDownloads = downloads.ok
    ? downloads.data.rows.filter((row) => row.client_class === CLIENT_HUMAN)
    : [];
  // Only days after the prefetch fix are genuine clicks; earlier rows counted
  // hovers. Reported over whatever part of the window is trustworthy rather
  // than over a fixed 30 days that would include inflated history.
  const countedDownloadDays = humanDownloads.filter((row) => row.day >= DOWNLOAD_CLICKS_SINCE);
  const downloadClicks = downloads.ok
    ? countedDownloadDays.reduce((sum, row) => sum + row.clicks, 0)
    : null;
  const downloadUniques = downloads.ok
    ? Math.max(0, ...countedDownloadDays.map((row) => row.unique_downloaders))
    : null;

  const appcastPolls = updateChecks.ok
    ? (updateChecks.data.find((object) => object.object === "appcast.xml")?.requests ?? 0)
    : null;

  const activeInstalls = installs.ok
    ? installs.data.rows.filter((row) => Date.parse(row.last_seen) > Date.now() - 30 * DAY).length
    : null;

  return (
    <>
      <PageHeader
        eyebrow="PrivyDock"
        title="Overview"
        description="Counted first-party in PrivyDock's own database. Bots are excluded by classification, not guessed at from user agents."
        action={<CaptureButton />}
      />

      <section className="grid metrics">
        <Metric
          label="Human page views · 7d"
          value={humanViews === null ? "—" : formatNumber(humanViews)}
          sub="Exact · bots excluded"
        />
        <Metric
          label="Peak daily visitors · 7d"
          value={peakDailyVisitors === null ? "not measured" : formatNumber(peakDailyVisitors)}
          sub={
            peakDailyVisitors === null
              ? `Visitor identity starts ${VISITOR_IDENTITY_SINCE}`
              : "Distinct people, busiest day"
          }
        />
        <Metric
          label="Download clicks"
          value={downloadClicks === null ? "—" : formatNumber(downloadClicks)}
          sub={`Exact · humans only · since ${DOWNLOAD_CLICKS_SINCE}`}
        />
        <Metric
          label="Peak daily downloaders"
          value={downloadUniques === null ? "—" : formatNumber(downloadUniques)}
          sub="Distinct people, busiest day"
        />
        <Metric
          label="Installs"
          value={installs.ok ? formatNumber(installs.data.total) : "—"}
          sub={activeInstalls === null ? "Exact" : `${formatNumber(activeInstalls)} active in 30d`}
        />
        <Metric
          label="Licences"
          value={licenses.ok ? formatNumber(licenses.data) : "—"}
          sub="Exact"
        />
        <Metric
          label="Waitlist"
          value={waitlist.ok ? formatNumber(waitlist.data) : "—"}
          sub="Exact"
        />
        <Metric
          label="Update checks · 30d"
          value={appcastPolls === null ? "—" : formatNumber(appcastPolls)}
          sub="Cloudflare R2, sampled 1:10"
        />
        <Metric
          label="Revenue"
          value={transactions.ok ? `$${netRevenue(transactions.data).toFixed(2)}` : "—"}
          sub="Completed Paddle transactions"
        />
      </section>

      <p className="muted mt-4 text-sm">
        {captured.ok && captured.data
          ? `History captured ${formatDate(captured.data.capturedAt)}, through ${captured.data.throughDay}.`
          : captured.ok
            ? "No history captured yet — the first capture is running now."
            : `Snapshot store unreachable — ${captured.error}`}
      </p>

      <section className="grid mt-4">
        {!traffic.ok ? <SourceError source="Page views" message={traffic.error} /> : null}
        {!downloads.ok ? <SourceError source="Download events" message={downloads.error} /> : null}
        {!installs.ok ? <SourceError source="Installs" message={installs.error} /> : null}
        {!licenses.ok ? <SourceError source="Supabase" message={licenses.error} /> : null}
        {!transactions.ok ? <SourceError source="Paddle" message={transactions.error} /> : null}
      </section>
    </>
  );
}
