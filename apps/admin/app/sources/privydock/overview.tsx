import { after } from "next/server";

import { Metric, PageHeader, formatDate, formatNumber } from "../../components/ui";
import { CaptureButton } from "../../components/capture-button";
import { SourceError, safe } from "../../components/source-error";
import { cachedDailyTraffic, cachedDownloadObjects } from "./cloudflare";
import { cachedTransactions, netRevenue } from "./paddle";
import { autoCapturePrivydock } from "./snapshots";
import { countRows, latestSnapshot, listActivations } from "./supabase";

const DAY = 24 * 60 * 60 * 1000;

function isoDate(offsetDays: number) {
  return new Date(Date.now() - offsetDays * DAY).toISOString().slice(0, 10);
}

export async function PrivydockOverview() {
  // Cloudflare's retention is rolling, so history only exists if it is captured.
  // There is no scheduler, so opening this page is the trigger — and `after()`
  // runs it once the response has already been sent, adding no latency here.
  after(autoCapturePrivydock);

  const captured = await safe(() => latestSnapshot("privydock"));

  const [traffic, downloads, licenses, waitlist, activations, transactions] = await Promise.all([
    safe(() => cachedDailyTraffic(isoDate(7), isoDate(0))),
    safe(() =>
      cachedDownloadObjects(
        new Date(Date.now() - 30 * DAY).toISOString(),
        new Date().toISOString(),
      ),
    ),
    safe(() => countRows("licenses")),
    safe(() => countRows("waitlist_signups")),
    safe(() => listActivations(500)),
    safe(() => cachedTransactions(100)),
  ]);

  const humanViews = traffic.ok
    ? traffic.data.reduce((sum, day) => sum + day.humanPageViews, 0)
    : null;
  const visitorDays = traffic.ok ? traffic.data.reduce((sum, day) => sum + day.uniqueIps, 0) : null;
  const dmgDownloads = downloads.ok
    ? downloads.data
        .filter((object) => object.object.endsWith(".dmg"))
        .reduce((sum, object) => sum + object.completed, 0)
    : null;
  const updateChecks = downloads.ok
    ? (downloads.data.find((object) => object.object === "appcast.xml")?.requests ?? 0)
    : null;

  const activeInstalls = activations.ok
    ? new Set(
        activations.data.rows
          .filter((row) => Date.parse(row.last_validated_at) > Date.now() - 30 * DAY)
          .map((row) => row.license_id),
      ).size
    : null;

  return (
    <>
      <PageHeader
        eyebrow="PrivyDock"
        title="Overview"
        description="Traffic, downloads and commerce across Cloudflare, Supabase and Paddle. Figures marked estimated come from sampled or inferred sources until first-party event tracking lands."
      />

      <section className="metric-grid">
        <Metric
          label="Human page views · 7d"
          value={humanViews === null ? "—" : formatNumber(humanViews)}
          sub="Estimated — user-agent based"
        />
        <Metric
          label="Visitor-days · 7d"
          value={visitorDays === null ? "—" : formatNumber(visitorDays)}
          sub="Daily-unique IPs, not distinct people"
        />
        <Metric
          label="DMG downloads · 30d"
          value={dmgDownloads === null ? "—" : formatNumber(dmgDownloads)}
          sub="Sampled 1:10, derived from bytes"
        />
        <Metric
          label="Update checks · 30d"
          value={updateChecks === null ? "—" : formatNumber(updateChecks)}
          sub="appcast.xml polls — proxy for installs"
        />
        <Metric
          label="Licences"
          value={licenses.ok ? formatNumber(licenses.data) : "—"}
          sub="Exact"
        />
        <Metric
          label="Active installs · 30d"
          value={activeInstalls === null ? "—" : formatNumber(activeInstalls)}
          sub="Licences validated in window"
        />
        <Metric
          label="Waitlist"
          value={waitlist.ok ? formatNumber(waitlist.data) : "—"}
          sub="Exact"
        />
        <Metric
          label="Revenue"
          value={transactions.ok ? `$${netRevenue(transactions.data).toFixed(2)}` : "—"}
          sub="Completed Paddle transactions"
        />
      </section>

      <section className="panel mt-6">
        <div className="section-head">
          <div className="metric-label">Metric history</div>
          <CaptureButton />
        </div>
        <p className="muted mt-2 text-sm">
          {captured.ok && captured.data
            ? `Last captured ${formatDate(captured.data.capturedAt)}, covering days through ${captured.data.throughDay}. Opening this page tops up anything missing.`
            : captured.ok
              ? "Nothing captured yet. The first capture runs in the background now and backfills everything Cloudflare still retains — reload in a minute."
              : `Snapshot store unreachable — ${captured.error}`}
        </p>
        <p className="muted mt-1 text-sm">
          Cloudflare discards path-level data after 8 days and everything else after 90, so only
          captured days survive. Repeat visits within six hours are skipped.
        </p>
      </section>

      <section className="mt-6 grid gap-3">
        {!traffic.ok ? <SourceError source="Cloudflare traffic" message={traffic.error} /> : null}
        {!downloads.ok ? <SourceError source="Cloudflare R2" message={downloads.error} /> : null}
        {!licenses.ok ? <SourceError source="Supabase" message={licenses.error} /> : null}
        {!transactions.ok ? <SourceError source="Paddle" message={transactions.error} /> : null}
      </section>
    </>
  );
}
