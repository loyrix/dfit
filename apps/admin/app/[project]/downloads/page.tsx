import { AdminShell } from "../../components/shell";
import { privydockSource } from "../../sources/privydock";
import { SourceError, safe } from "../../components/source-error";
import { EmptyState, Metric, PageHeader, formatNumber } from "../../components/ui";
import { cachedDownloadObjects } from "../../sources/privydock/cloudflare";
import {
  CLIENT_HUMAN,
  DOWNLOAD_CLICKS_SINCE,
  countRows,
  downloadsDaily,
  downloadsDailyTotals,
} from "../../sources/privydock/supabase";

export const dynamic = "force-dynamic";

const DAY = 24 * 60 * 60 * 1000;
const MB = 1_000_000;
const isoDate = (offset: number) => new Date(Date.now() - offset * DAY).toISOString().slice(0, 10);

export default async function DownloadsPage() {
  const [totals, perFile, waitlist, objects] = await Promise.all([
    safe(() => downloadsDailyTotals(isoDate(90))),
    safe(() => downloadsDaily(isoDate(90))),
    safe(() => countRows("waitlist_signups")),
    safe(() =>
      cachedDownloadObjects(
        new Date(Date.now() - 90 * DAY).toISOString(),
        new Date().toISOString(),
      ),
    ),
  ]);

  if (!totals.ok) {
    return (
      <AdminShell project={privydockSource}>
        <PageHeader eyebrow="PrivyDock" title="Downloads" />
        <SourceError source="Download events" message={totals.error} />
      </AdminShell>
    );
  }

  // Rows before the prefetch fix are not clicks: the buttons were Next `<Link>`
  // elements, which fetch their href on hover, so scrolling one into view
  // recorded a download. Counting them would overstate downloads several-fold
  // and quietly poison every conversion rate built on them.
  const counted = totals.data.rows.filter(
    (row) => row.client_class === CLIENT_HUMAN && row.day >= DOWNLOAD_CLICKS_SINCE,
  );
  const clicks = counted.reduce((sum, row) => sum + row.clicks, 0);
  const peakDownloaders = counted.length
    ? Math.max(...counted.map((row) => row.unique_downloaders))
    : 0;
  const botAttempts = totals.data.rows
    .filter((row) => row.client_class !== CLIENT_HUMAN && row.day >= DOWNLOAD_CLICKS_SINCE)
    .reduce((sum, row) => sum + row.clicks, 0);

  const files = new Map<string, { file: string; clicks: number }>();
  for (const row of perFile.ok ? perFile.data.rows : []) {
    if (row.client_class !== CLIENT_HUMAN || row.day < DOWNLOAD_CLICKS_SINCE) continue;
    const entry = files.get(row.file) ?? { file: row.file, clicks: 0 };
    entry.clicks += row.clicks;
    files.set(row.file, entry);
  }
  const fileRows = [...files.values()].sort((a, b) => b.clicks - a.clicks);

  const days = counted.slice().sort((a, b) => b.day.localeCompare(a.day));

  const dmgs = objects.ok ? objects.data.filter((object) => object.object.endsWith(".dmg")) : [];
  const appcast = objects.ok
    ? objects.data.find((object) => object.object === "appcast.xml")
    : undefined;
  const noise = objects.ok
    ? objects.data.filter(
        (object) => !object.object.endsWith(".dmg") && object.object !== "appcast.xml",
      )
    : [];
  const bytes = dmgs.reduce((sum, object) => sum + object.bytes, 0);

  return (
    <AdminShell project={privydockSource}>
      <PageHeader
        eyebrow="PrivyDock"
        title="Downloads"
        description="A click is one person completing the download form and being handed the DMG. Counted first-party at the moment the file is served, so unlike a file-fetch count it cannot be inflated by prefetches, retries, or range requests."
      />

      <section className="grid metrics">
        <Metric
          label="Download clicks"
          value={formatNumber(clicks)}
          sub={`Exact · humans only · since ${DOWNLOAD_CLICKS_SINCE}`}
        />
        <Metric
          label="Peak daily downloaders"
          value={formatNumber(peakDownloaders)}
          sub="Distinct people, busiest day"
        />
        <Metric
          label="Blocked automated attempts"
          value={formatNumber(botAttempts)}
          sub="Classified non-human, excluded above"
        />
        <Metric
          label="Waitlist"
          value={waitlist.ok ? formatNumber(waitlist.data) : "—"}
          sub="Name and email captured at the gate"
        />
      </section>

      <section className="grid two-col mt-6">
        <div className="panel">
          <div className="metric-label">Daily downloads</div>
          {days.length ? (
            <div className="table-wrap mt-3">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Clicks</th>
                    <th>People</th>
                  </tr>
                </thead>
                <tbody>
                  {days.map((row) => (
                    <tr key={row.day}>
                      <td>{row.day}</td>
                      <td>{formatNumber(row.clicks)}</td>
                      <td>{formatNumber(row.unique_downloaders)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="No downloads yet"
              body={`Nothing has been handed over since ${DOWNLOAD_CLICKS_SINCE}.`}
            />
          )}
        </div>

        <div className="panel">
          <div className="metric-label">Per file</div>
          {fileRows.length ? (
            <div className="table-wrap mt-3">
              <table className="table">
                <thead>
                  <tr>
                    <th>File</th>
                    <th>Clicks</th>
                  </tr>
                </thead>
                <tbody>
                  {fileRows.map((row) => (
                    <tr key={row.file}>
                      <td>{row.file}</td>
                      <td>{formatNumber(row.clicks)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No files served yet" />
          )}
        </div>
      </section>

      <section className="panel mt-6">
        <div className="metric-label">File delivery · R2, 90 days</div>
        <p className="muted mt-1 text-sm">
          What the bucket actually served, which is a different question from who asked for it. It
          includes Sparkle updating existing installs — those never touch the website — and is
          sampled 1:10 by Cloudflare, so treat these as estimates and the counts above as the
          authority on people.
        </p>
        {objects.ok ? (
          <>
            <div className="grid metrics mt-3">
              <Metric
                label="Data served"
                value={`${(bytes / MB).toFixed(1)} MB`}
                sub="DMG objects only"
              />
              <Metric
                label="Update checks"
                value={formatNumber(appcast?.requests ?? 0)}
                sub="appcast.xml polls from installed apps"
              />
              <Metric
                label="Scanner probes"
                value={formatNumber(noise.reduce((sum, object) => sum + object.requests, 0))}
                sub={`${noise.length} paths that do not exist, 0 bytes served`}
              />
            </div>
            <div className="table-wrap mt-3">
              <table className="table">
                <thead>
                  <tr>
                    <th>Object</th>
                    <th>Requests</th>
                    <th>Bytes</th>
                    <th>Whole transfers</th>
                  </tr>
                </thead>
                <tbody>
                  {[...dmgs, ...(appcast ? [appcast] : [])].map((object) => (
                    <tr key={object.object}>
                      <td>{object.object}</td>
                      <td>{formatNumber(object.requests)}</td>
                      <td>{(object.bytes / MB).toFixed(2)} MB</td>
                      <td>{object.completed ? formatNumber(object.completed) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p className="muted mt-3 text-sm">Unavailable — {objects.error}</p>
        )}
      </section>

      {perFile.ok ? null : (
        <section className="grid mt-6">
          <SourceError source="Per-file downloads" message={perFile.error} />
        </section>
      )}
    </AdminShell>
  );
}
