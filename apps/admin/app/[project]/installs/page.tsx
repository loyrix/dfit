import { AdminShell } from "../../components/shell";
import { privydockSource } from "../../sources/privydock";
import { SourceError, safe } from "../../components/source-error";
import {
  Badge,
  EmptyState,
  Metric,
  PageHeader,
  formatDate,
  formatNumber,
  shortId,
} from "../../components/ui";
import { listInstalls } from "../../sources/privydock/supabase";

export const dynamic = "force-dynamic";

const DAY = 24 * 60 * 60 * 1000;

/** "Version 27.0 (Build 26A5421a)" is what the app reports; the build is noise here. */
function macOsRelease(value: string | null) {
  if (!value) return "Unknown";
  return value.replace(/^Version\s+/i, "").replace(/\s*\(Build [^)]*\)\s*$/i, "");
}

function tally<T>(rows: T[], key: (row: T) => string) {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const value = key(row);
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

function Breakdown({
  label,
  rows,
  total,
}: {
  label: string;
  rows: Array<[string, number]>;
  total: number;
}) {
  return (
    <div className="panel">
      <div className="metric-label">{label}</div>
      {rows.length ? (
        <div className="table-wrap mt-3">
          <table className="table">
            <tbody>
              {rows.map(([value, count]) => (
                <tr key={value}>
                  <td>{value}</td>
                  <td>{formatNumber(count)}</td>
                  <td className="muted">{total ? `${Math.round((count / total) * 100)}%` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="muted mt-3 text-sm">Nothing recorded yet.</p>
      )}
    </div>
  );
}

export default async function InstallsPage() {
  const installs = await safe(() => listInstalls(500));

  if (!installs.ok) {
    return (
      <AdminShell project={privydockSource}>
        <PageHeader eyebrow="PrivyDock" title="Installs" />
        <SourceError source="App installs" message={installs.error} />
      </AdminShell>
    );
  }

  const rows = installs.data.rows;
  const now = Date.now();
  const seenWithin = (days: number) =>
    rows.filter((row) => Date.parse(row.last_seen) > now - days * DAY);
  const active30 = seenWithin(30);
  const active7 = seenWithin(7);
  const new7 = rows.filter((row) => Date.parse(row.first_seen) > now - 7 * DAY);
  // More than one check-in means it was running on more than one day — the
  // nearest thing to "kept using it" this data can say.
  const returning = rows.filter((row) => (row.heartbeat_count ?? 0) > 1);
  const licensed = rows.filter((row) => row.license_id);

  return (
    <AdminShell project={privydockSource}>
      <PageHeader
        eyebrow="PrivyDock"
        title="Installs"
        description="One row per installed copy, keyed by a random identifier the app stores in the Keychain. From 0.1.7 the app checks in once a day while it is running. Earlier versions only checked in at launch, so an older copy left running for weeks shows a single check-in and an old last-seen date even if it is used every day."
      />

      <section className="grid metrics">
        <Metric
          label="Installs"
          value={formatNumber(installs.data.total)}
          sub="Distinct copies ever seen"
        />
        <Metric
          label="Active · 30d"
          value={formatNumber(active30.length)}
          sub="Checked in within 30 days"
        />
        <Metric
          label="Active · 7d"
          value={formatNumber(active7.length)}
          sub="Checked in within 7 days"
        />
        <Metric label="New · 7d" value={formatNumber(new7.length)} sub="First seen within 7 days" />
        <Metric
          label="Returning"
          value={formatNumber(returning.length)}
          sub="Checked in on more than one day"
        />
        <Metric
          label="Licensed"
          value={formatNumber(licensed.length)}
          sub={
            rows.length ? `${Math.round((licensed.length / rows.length) * 100)}% of installs` : "—"
          }
        />
      </section>

      {rows.length ? (
        <>
          <section className="grid metrics mt-6">
            <Breakdown
              label="App version"
              rows={tally(rows, (row) => row.app_version ?? "Unknown")}
              total={rows.length}
            />
            <Breakdown
              label="macOS"
              rows={tally(rows, (row) => macOsRelease(row.os_version))}
              total={rows.length}
            />
            <Breakdown
              label="Country"
              rows={tally(rows, (row) => row.country ?? "Unknown")}
              total={rows.length}
            />
          </section>

          <section className="panel mt-6">
            <div className="metric-label">Every install</div>
            <p className="muted mt-1 text-sm">
              Identifiers are random and device-local. They carry no name, email, or address, and
              cannot be linked back to a person.
            </p>
            <div className="table-wrap mt-3">
              <table className="table">
                <thead>
                  <tr>
                    <th>Install</th>
                    <th>Version</th>
                    <th>macOS</th>
                    <th>Country</th>
                    <th>First seen</th>
                    <th>Last seen</th>
                    <th>Check-ins</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const stale = Date.parse(row.last_seen) <= now - 30 * DAY;
                    return (
                      <tr key={row.install_id}>
                        <td>{shortId(row.install_id)}</td>
                        <td>{row.app_version ?? "—"}</td>
                        <td>{macOsRelease(row.os_version)}</td>
                        <td>{row.country ?? "—"}</td>
                        <td>{formatDate(row.first_seen)}</td>
                        <td>{formatDate(row.last_seen)}</td>
                        <td>{formatNumber(row.heartbeat_count ?? 0)}</td>
                        <td>
                          {row.license_id ? (
                            <Badge tone="green">Licensed</Badge>
                          ) : (
                            <Badge tone={stale ? "gray" : "default"}>
                              {stale ? "Dormant" : "Trial"}
                            </Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : (
        <section className="mt-6">
          <EmptyState
            title="No installs recorded"
            body="The app reports in on launch and once a day after that. Nothing has checked in yet."
          />
        </section>
      )}
    </AdminShell>
  );
}
