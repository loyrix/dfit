import { AdminShell } from "../../components/shell";
import { privydockSource } from "../../sources/privydock";
import { SourceError, safe } from "../../components/source-error";
import { Metric, PageHeader, formatNumber } from "../../components/ui";
import { cachedDailyTraffic, cachedPathHits } from "../../sources/privydock/cloudflare";

export const dynamic = "force-dynamic";

const DAY = 24 * 60 * 60 * 1000;
const isoDate = (offset: number) => new Date(Date.now() - offset * DAY).toISOString().slice(0, 10);

export default async function TrafficPage() {
  const [traffic, paths] = await Promise.all([
    safe(() => cachedDailyTraffic(isoDate(30), isoDate(0))),
    // The adaptive dataset caps queries at one day and retains eight, so recent
    // days are fetched individually and merged.
    safe(async () => {
      const days = await Promise.all([1, 2, 3].map((offset) => cachedPathHits(isoDate(offset))));
      const merged = new Map<string, { host: string; path: string; count: number }>();
      for (const hit of days.flat()) {
        if (hit.status >= 400) continue;
        const key = `${hit.host}${hit.path}`;
        const current = merged.get(key) ?? { host: hit.host, path: hit.path, count: 0 };
        current.count += hit.count;
        merged.set(key, current);
      }
      return [...merged.values()].sort((a, b) => b.count - a.count).slice(0, 25);
    }),
  ]);

  const totals = traffic.ok
    ? traffic.data.reduce(
        (acc, day) => ({
          human: acc.human + day.humanPageViews,
          bot: acc.bot + day.botPageViews,
          unknown: acc.unknown + day.unknownPageViews,
          uniques: acc.uniques + day.uniqueIps,
        }),
        { human: 0, bot: 0, unknown: 0, uniques: 0 },
      )
    : null;

  const totalViews = totals ? totals.human + totals.bot + totals.unknown : 0;

  return (
    <AdminShell project={privydockSource}>
      <PageHeader
        eyebrow="PrivyDock"
        title="Traffic"
        description="Cloudflare zone analytics over 30 days. The human split is inferred from browser family, which is spoofable — bot scoring needs an Enterprise plan."
      />

      {totals ? (
        <section className="grid metrics">
          <Metric
            label="Human page views · 30d"
            value={formatNumber(totals.human)}
            sub={
              totalViews
                ? `${Math.round((totals.human / totalViews) * 100)}% of all views`
                : undefined
            }
          />
          <Metric
            label="Known bots"
            value={formatNumber(totals.bot)}
            sub="GoogleBot, BingBot, curl…"
          />
          <Metric
            label="Unknown agents"
            value={formatNumber(totals.unknown)}
            sub="Mostly scripts and scanners"
          />
          <Metric
            label="Visitor-days"
            value={formatNumber(totals.uniques)}
            sub="Daily-unique IPs summed — not distinct people"
          />
        </section>
      ) : (
        <SourceError source="Cloudflare traffic" message={traffic.ok ? "" : traffic.error} />
      )}

      {traffic.ok ? (
        <section className="panel mt-6">
          <div className="metric-label">Daily page views</div>
          <div className="table-wrap mt-3">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Human</th>
                  <th>Bot</th>
                  <th>Unknown</th>
                  <th>Unique IPs</th>
                </tr>
              </thead>
              <tbody>
                {[...traffic.data].reverse().map((day) => (
                  <tr key={day.date}>
                    <td>{day.date}</td>
                    <td>{formatNumber(day.humanPageViews)}</td>
                    <td>{formatNumber(day.botPageViews)}</td>
                    <td>{formatNumber(day.unknownPageViews)}</td>
                    <td>{formatNumber(day.uniqueIps)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section className="panel mt-6">
        <div className="metric-label">Top paths · last 3 days</div>
        <p className="muted mt-1 text-sm">
          Cloudflare retains path-level data for 8 days only. Counts include Next.js prefetches, so
          they overstate real page views until first-party logging lands.
        </p>
        {paths.ok ? (
          <div className="table-wrap mt-3">
            <table className="table">
              <thead>
                <tr>
                  <th>Host</th>
                  <th>Path</th>
                  <th>Requests</th>
                </tr>
              </thead>
              <tbody>
                {paths.data.map((row) => (
                  <tr key={`${row.host}${row.path}`}>
                    <td>{row.host}</td>
                    <td>{row.path}</td>
                    <td>{formatNumber(row.count)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted mt-3 text-sm">Unavailable — {paths.error}</p>
        )}
      </section>
    </AdminShell>
  );
}
