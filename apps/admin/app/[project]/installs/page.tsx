import { AdminShell } from "../../components/shell";
import { privydockSource } from "../../sources/privydock";
import { SourceError, safe } from "../../components/source-error";
import {
  Badge,
  EmptyState,
  Metric,
  PageHeader,
  Pagination,
  ResultSummary,
  SortableHeader,
  formatDate,
  formatNumber,
  resolveTableState,
  shortId,
} from "../../components/ui";
import {
  type InstallRow,
  deviceTrials,
  installUsage,
  listInstalls,
} from "../../sources/privydock/supabase";

export const dynamic = "force-dynamic";

const DAY = 24 * 60 * 60 * 1000;

/** "Version 27.0 (Build 26A5421a)" is what the app reports; the build is noise here. */
function macOsRelease(value: string | null) {
  if (!value) return "Unknown";
  return value.replace(/^Version\s+/i, "").replace(/\s*\(Build [^)]*\)\s*$/i, "");
}

/**
 * Whole days from now until the trial ends, negative once it has passed.
 *
 * The device's window wins where there is one: the trial belongs to the Mac,
 * not to the copy of the app, which is what stops a reinstall earning another
 * thirty days. Installs predating device anchoring fall back to their own
 * dates, and those cannot be corrected retroactively.
 */
function trialDaysLeft(row: InstallRow, windows: Map<string, string>, now: number): number | null {
  const ends = (row.device_hash ? windows.get(row.device_hash) : null) ?? row.trial_expires_at;
  if (!ends) return null;
  return Math.ceil((Date.parse(ends) - now) / DAY);
}

function trialEndsOn(row: InstallRow, windows: Map<string, string>): string | null {
  return (row.device_hash ? windows.get(row.device_hash) : null) ?? row.trial_expires_at;
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

type InstallsSearchParams = {
  page?: string;
  sort?: string;
  direction?: string;
};

export default async function InstallsPage({
  params: projectParams,
  searchParams,
}: {
  params: Promise<{ project: string }>;
  searchParams?: Promise<InstallsSearchParams>;
}) {
  const { project } = await projectParams;
  const query = (await searchParams) ?? {};
  // Soonest-to-expire first until a column is chosen; a chosen column starts
  // wherever its link says.
  const listParams = {
    page: query.page,
    sort: query.sort ?? "trialEnds",
    direction: query.direction ?? (query.sort ? undefined : "asc"),
  };
  const basePath = `/${project}/installs`;
  const since = new Date(Date.now() - 30 * DAY).toISOString().slice(0, 10);
  const [installs, trials, usage] = await Promise.all([
    safe(() => listInstalls(500)),
    safe(() => deviceTrials(500)),
    safe(() => installUsage(since)),
  ]);

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
  // A device row is the authority when one exists. A failed trials query is not
  // fatal: every install still has its own dates to fall back on, and a missing
  // column is better than a missing page.
  const windows = new Map(
    (trials.ok ? trials.data.rows : []).map((trial) => [trial.device_hash, trial.trial_expires_at]),
  );
  const daysLeft = (row: InstallRow) => trialDaysLeft(row, windows, now);
  // Opens are only reported from 0.1.8, so an absent count means "too old to
  // say", not "never used" — the table shows those differently for that reason.
  const opensBy = usage.ok ? usage.data : new Map();
  const opens = (row: InstallRow) => opensBy.get(row.install_id)?.opens ?? 0;
  const reportsOpens = (row: InstallRow) => (row.app_version ?? "") >= "0.1.8";
  const usingIt = rows.filter((row) => opens(row) > 0);
  const reporting = rows.filter(reportsOpens);

  const unlicensed = rows.filter((row) => !row.license_id);
  const inTrial = unlicensed.filter((row) => (daysLeft(row) ?? -1) >= 0);
  const expiringSoon = inTrial.filter((row) => (daysLeft(row) ?? 99) <= 7);
  const expired = unlicensed.filter((row) => (daysLeft(row) ?? 1) < 0);
  const seenWithin = (days: number) =>
    rows.filter((row) => Date.parse(row.last_seen) > now - days * DAY);
  const active30 = seenWithin(30);
  const active7 = seenWithin(7);
  const new7 = rows.filter((row) => Date.parse(row.first_seen) > now - 7 * DAY);
  // More than one check-in means it was running on more than one day — the
  // nearest thing to "kept using it" this data can say.
  const returning = rows.filter((row) => (row.heartbeat_count ?? 0) > 1);
  const licensed = rows.filter((row) => row.license_id);

  const { rows: visibleRows, pageInfo } = resolveTableState(rows, undefined, listParams, {
    defaultPageSize: 25,
    defaultSort: "trialEnds",
    sorters: {
      checkIns: (row) => row.heartbeat_count ?? 0,
      lastSeen: (row) => new Date(row.last_seen),
      // Licensed installs have no clock to run out; an empty value sorts them
      // to the bottom in either direction rather than pretending to be urgent.
      trialEnds: (row) => {
        const ends = row.license_id ? null : trialEndsOn(row, windows);
        return ends ? new Date(ends) : null;
      },
    },
  });
  const sortable = { basePath, params: listParams, pageInfo };

  return (
    <AdminShell project={privydockSource}>
      <PageHeader
        eyebrow="PrivyDock"
        title="Installs"
        description="One row per installed copy, keyed by a random identifier the app stores in the Keychain, soonest-to-expire first. The trial belongs to the Mac rather than the copy, so reinstalling does not restart it — but installs from before that existed carry only their own dates and cannot be re-anchored retroactively. From 0.1.7 the app checks in once a day while running; earlier versions only checked in at launch, so an old copy left running for weeks shows one check-in even if used daily."
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
        <Metric
          label="Actually using it · 30d"
          value={formatNumber(usingIt.length)}
          sub={
            reporting.length
              ? `of ${formatNumber(reporting.length)} on 0.1.8+ — opening a hidden app is the habit, hiding is a one-off`
              : "Reported from 0.1.8 onwards"
          }
        />
        <Metric
          label="Expiring · 7d"
          value={formatNumber(expiringSoon.length)}
          sub={
            expiringSoon.length
              ? "Trials ending this week — the paywall meets them next"
              : "No trial ends in the next week"
          }
        />
        <Metric
          label="Trial ended"
          value={formatNumber(expired.length)}
          sub={
            expired.length
              ? `${formatNumber(expired.length)} past their 30 days and not licensed`
              : "Nobody has reached the end yet"
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
            <div className="section-head">
              <div className="metric-label">Every install</div>
              <ResultSummary pageInfo={pageInfo} noun="installs" />
            </div>
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
                    <th>
                      <SortableHeader {...sortable} sort="lastSeen">
                        Last seen
                      </SortableHeader>
                    </th>
                    <th>
                      <SortableHeader {...sortable} sort="checkIns">
                        Check-ins
                      </SortableHeader>
                    </th>
                    <th>Opens · 30d</th>
                    <th>
                      <SortableHeader {...sortable} sort="trialEnds">
                        Trial ends
                      </SortableHeader>
                    </th>
                    <th>Days left</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((row) => {
                    const stale = Date.parse(row.last_seen) <= now - 30 * DAY;
                    const left = daysLeft(row);
                    const ends = trialEndsOn(row, windows);
                    return (
                      <tr key={row.install_id}>
                        <td>{shortId(row.install_id)}</td>
                        <td>{row.app_version ?? "—"}</td>
                        <td>{macOsRelease(row.os_version)}</td>
                        <td>{row.country ?? "—"}</td>
                        <td>{formatDate(row.first_seen)}</td>
                        <td>{formatDate(row.last_seen)}</td>
                        <td>{formatNumber(row.heartbeat_count ?? 0)}</td>
                        <td>{reportsOpens(row) ? formatNumber(opens(row)) : "—"}</td>
                        <td>{row.license_id ? "—" : ends ? formatDate(ends) : "—"}</td>
                        <td>
                          {row.license_id || left === null
                            ? "—"
                            : left < 0
                              ? `${Math.abs(left)}d ago`
                              : `${left}d`}
                        </td>
                        <td>
                          {row.license_id ? (
                            <Badge tone="green">Licensed</Badge>
                          ) : left !== null && left < 0 ? (
                            <Badge tone="red">Trial ended</Badge>
                          ) : left !== null && left <= 7 ? (
                            <Badge tone="red">Ends in {left}d</Badge>
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
            <Pagination basePath={basePath} params={listParams} pageInfo={pageInfo} />
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
