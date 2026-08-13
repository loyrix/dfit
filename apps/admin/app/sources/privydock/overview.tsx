import { Metric, PageHeader, formatNumber } from "../../components/ui";
import { SourceError, safe } from "../../components/source-error";
import { dailyTraffic, downloadObjects } from "./cloudflare";
import { listTransactions, netRevenue } from "./paddle";
import { countRows, listActivations } from "./supabase";

const DAY = 24 * 60 * 60 * 1000;

function isoDate(offsetDays: number) {
  return new Date(Date.now() - offsetDays * DAY).toISOString().slice(0, 10);
}

export async function PrivydockOverview() {
  const [traffic, downloads, licenses, waitlist, activations, transactions] = await Promise.all([
    safe(() => dailyTraffic(isoDate(7), isoDate(0))),
    safe(() => downloadObjects(new Date(Date.now() - 30 * DAY), new Date())),
    safe(() => countRows("licenses")),
    safe(() => countRows("waitlist_signups")),
    safe(() => listActivations(500)),
    safe(() => listTransactions(100)),
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

      <section className="mt-6 grid gap-3">
        {!traffic.ok ? <SourceError source="Cloudflare traffic" message={traffic.error} /> : null}
        {!downloads.ok ? <SourceError source="Cloudflare R2" message={downloads.error} /> : null}
        {!licenses.ok ? <SourceError source="Supabase" message={licenses.error} /> : null}
        {!transactions.ok ? <SourceError source="Paddle" message={transactions.error} /> : null}
      </section>
    </>
  );
}
