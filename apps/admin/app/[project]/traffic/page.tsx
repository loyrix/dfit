import { AdminShell } from "../../components/shell";
import { privydockSource } from "../../sources/privydock";
import { SourceError, safe } from "../../components/source-error";
import { EmptyState, Metric, PageHeader, formatDate, formatNumber } from "../../components/ui";
import {
  CLIENT_HUMAN,
  REFERRER_SINCE,
  VISITOR_IDENTITY_SINCE,
  trafficByPath,
  trafficByReferrer,
  trafficDaily,
} from "../../sources/privydock/supabase";

export const dynamic = "force-dynamic";

const DAY = 24 * 60 * 60 * 1000;
const isoDate = (offset: number) => new Date(Date.now() - offset * DAY).toISOString().slice(0, 10);

type Day = {
  day: string;
  human: number;
  suspected: number;
  bot: number;
  humanVisitors: number;
  measured: boolean;
};

/**
 * The view returns one row per (day, class). Pivoting to one row per day is
 * what makes the table readable and the human share computable.
 */
function byDay(
  rows: Array<{ day: string; client_class: number; views: number; unique_visitors: number }>,
) {
  const days = new Map<string, Day>();
  for (const row of rows) {
    const day = days.get(row.day) ?? {
      day: row.day,
      human: 0,
      suspected: 0,
      bot: 0,
      humanVisitors: 0,
      measured: row.day >= VISITOR_IDENTITY_SINCE,
    };
    if (row.client_class === CLIENT_HUMAN) {
      day.human += row.views;
      day.humanVisitors = row.unique_visitors;
    } else if (row.client_class === 1) {
      day.suspected += row.views;
    } else {
      day.bot += row.views;
    }
    days.set(row.day, day);
  }
  return [...days.values()].sort((a, b) => b.day.localeCompare(a.day));
}

export default async function TrafficPage() {
  const [traffic, paths, referrers] = await Promise.all([
    safe(() => trafficDaily(isoDate(30))),
    safe(() => trafficByPath(25)),
    safe(() => trafficByReferrer(15)),
  ]);

  if (!traffic.ok) {
    return (
      <AdminShell project={privydockSource}>
        <PageHeader eyebrow="PrivyDock" title="Traffic" />
        <SourceError source="Page views" message={traffic.error} />
      </AdminShell>
    );
  }

  const days = byDay(traffic.data.rows);
  const humanViews = days.reduce((sum, day) => sum + day.human, 0);
  const filtered = days.reduce((sum, day) => sum + day.bot + day.suspected, 0);
  const allViews = humanViews + filtered;

  // Daily unique counts cannot be summed into a period total — one person on
  // three days would count as three. The busiest day is a number that means
  // something; days before the salt existed carry no identity and are excluded
  // rather than counted as zero.
  const measured = days.filter((day) => day.measured);
  const peakVisitors = measured.length
    ? Math.max(...measured.map((day) => day.humanVisitors))
    : null;

  return (
    <AdminShell project={privydockSource}>
      <PageHeader
        eyebrow="PrivyDock"
        title="Traffic"
        description="Counted first-party in PrivyDock's own database, one row per rendered page. Automated clients are classified on request shape — not just user agent — and excluded from every human figure below."
      />

      <section className="grid metrics">
        <Metric
          label="Human page views · 30d"
          value={formatNumber(humanViews)}
          sub={allViews ? `${Math.round((humanViews / allViews) * 100)}% of all requests` : "Exact"}
        />
        <Metric
          label="Peak daily visitors"
          value={peakVisitors === null ? "not measured" : formatNumber(peakVisitors)}
          sub={
            peakVisitors === null
              ? `Visitor identity starts ${VISITOR_IDENTITY_SINCE}`
              : "Distinct people, busiest day"
          }
        />
        <Metric
          label="Automated requests"
          value={formatNumber(filtered)}
          sub="Bots and suspected clients, excluded above"
        />
        <Metric
          label="Days with visitors"
          value={formatNumber(days.filter((day) => day.human > 0).length)}
          sub="of the last 30"
        />
      </section>

      <section className="panel mt-6">
        <div className="metric-label">Daily page views</div>
        <p className="muted mt-1 text-sm">
          Visitors are distinct people that day, deduplicated by a salted hash that is regenerated
          every midnight — so the column is never comparable across rows and must not be added up.
        </p>
        {days.length ? (
          <div className="table-wrap mt-3">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Human views</th>
                  <th>Visitors</th>
                  <th>Suspected</th>
                  <th>Bots</th>
                </tr>
              </thead>
              <tbody>
                {days.map((day) => (
                  <tr key={day.day}>
                    <td>{day.day}</td>
                    <td>{formatNumber(day.human)}</td>
                    <td>{day.measured ? formatNumber(day.humanVisitors) : "—"}</td>
                    <td>{formatNumber(day.suspected)}</td>
                    <td>{formatNumber(day.bot)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No page views recorded" body="Nothing has been logged in 30 days." />
        )}
      </section>

      <section className="grid two-col mt-6">
        <div className="panel">
          <div className="metric-label">Top pages · all time</div>
          <p className="muted mt-1 text-sm">Humans only. Prefetches are not counted.</p>
          {paths.ok && paths.data.rows.length ? (
            <div className="table-wrap mt-3">
              <table className="table">
                <thead>
                  <tr>
                    <th>Path</th>
                    <th>Views</th>
                    <th>Visitors</th>
                    <th>Last seen</th>
                  </tr>
                </thead>
                <tbody>
                  {paths.data.rows.map((row) => (
                    <tr key={row.path}>
                      <td>{row.path}</td>
                      <td>{formatNumber(row.views)}</td>
                      <td>{formatNumber(row.unique_visitors)}</td>
                      <td>{formatDate(row.last_seen)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : paths.ok ? (
            <EmptyState title="No pages recorded yet" />
          ) : (
            <p className="muted mt-3 text-sm">Unavailable — {paths.error}</p>
          )}
        </div>

        <div className="panel">
          <div className="metric-label">Where visitors arrive from · since {REFERRER_SINCE}</div>
          <p className="muted mt-1 text-sm">
            The first page of each visit, counted once. &ldquo;(direct)&rdquo; is a typed URL, a
            bookmark, or an app that sends no referrer. Earlier visits are left out: until{" "}
            {REFERRER_SINCE} every page recorded this site as its own referrer.
          </p>
          {referrers.ok && referrers.data.rows.length ? (
            <div className="table-wrap mt-3">
              <table className="table">
                <thead>
                  <tr>
                    <th>Source</th>
                    <th>Views</th>
                    <th>Visitors</th>
                  </tr>
                </thead>
                <tbody>
                  {referrers.data.rows.map((row) => (
                    <tr key={row.referrer_host}>
                      <td>{row.referrer_host}</td>
                      <td>{formatNumber(row.views)}</td>
                      <td>{formatNumber(row.unique_visitors)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : referrers.ok ? (
            <EmptyState title="No referrers recorded yet" />
          ) : (
            <p className="muted mt-3 text-sm">Unavailable — {referrers.error}</p>
          )}
        </div>
      </section>
    </AdminShell>
  );
}
