import { AdminShell } from "../../components/shell";
import { privydockSource } from "../../sources/privydock";
import { SourceError, safe } from "../../components/source-error";
import { EmptyState, Metric, PageHeader, formatDate, formatNumber } from "../../components/ui";
import { type AppIssueRow, appIssues } from "../../sources/privydock/supabase";

export const dynamic = "force-dynamic";

const DAY = 24 * 60 * 60 * 1000;

const EVENT_LABEL: Record<string, string> = {
  hide_failed: "Hide",
  restore_failed: "Restore",
  helper_setup_failed: "Helper setup",
  license_activation_failed: "Licence activation",
};

/**
 * What a code means to a person reading this page. The app only ever sends the
 * code; this is the one place it is turned back into words.
 */
function meaning(code: string, permission: string): string {
  if (permission === "appManagement") return "App Management not granted";
  if (permission === "fullDiskAccess") return "Full Disk Access not granted";
  if (permission === "helperNotReady") return "Helper not approved in Login Items";
  if (permission === "protectedByApple") return "Apple-protected app";

  const known: Record<string, string> = {
    "PrivyDockError.appIsRunning": "The app was open",
    "PrivyDockError.appLaunchedFromPrivyDock": "The app was open",
    "PrivyDockError.appStoreAppBusy": "macOS was updating the app",
    "PrivyDockError.helperRequired": "App Store app — helper needed",
    "PrivyDockError.helperOperationFailed": "Helper could not move the app",
    "PrivyDockError.restoreTargetExists": "Something already at the restore location",
    "PrivyDockError.crossVolumeMoveUnsupported": "App lives on another volume",
    "PrivyDockError.insufficientDiskSpace": "Not enough disk space",
    "PrivyDockError.appMoveFailed": "Moving the app failed",
    "PrivyDockError.hideRollbackFailed": "Hide failed and rollback failed",
    "PrivyDockError.manifestWriteFailed": "Could not write recovery data",
    "PrivyDockError.symlinkNotSupported": "App is a shortcut",
    "NSCocoaErrorDomain:513": "macOS denied permission",
    "NSCocoaErrorDomain:4": "File no longer exists",
  };
  if (known[code]) return known[code];
  if (code.startsWith("PrivyDockHelperError.")) return "Helper problem";
  if (code.startsWith("LicenseActivationError.")) return "Activation problem";
  return code || "Unknown";
}

/** Versions fold together: the question is what is failing, then on which build. */
function groupFailures(rows: AppIssueRow[]) {
  const groups = new Map<
    string,
    {
      event: string;
      code: string;
      permission: string;
      occurrences: number;
      installs: number;
      versions: Set<string>;
      lastSeen: string;
    }
  >();

  for (const row of rows) {
    if (!row.event.endsWith("_failed")) continue;
    const key = `${row.event}|${row.error_code}|${row.missing_permission}`;
    const group = groups.get(key) ?? {
      event: row.event,
      code: row.error_code,
      permission: row.missing_permission,
      occurrences: 0,
      installs: 0,
      versions: new Set<string>(),
      lastSeen: row.last_seen,
    };
    group.occurrences += row.occurrences;
    // An install can span versions, so this can overcount by the number of
    // Macs that updated mid-window. Close enough to rank by; the per-version
    // rows in the database are exact.
    group.installs += row.installs;
    if (row.app_version) group.versions.add(row.app_version);
    if (row.last_seen > group.lastSeen) group.lastSeen = row.last_seen;
    groups.set(key, group);
  }

  return [...groups.values()].sort(
    (a, b) => b.installs - a.installs || b.occurrences - a.occurrences,
  );
}

function total(rows: AppIssueRow[], event: string) {
  return rows
    .filter((row) => row.event === event)
    .reduce(
      (sum, row) => ({
        occurrences: sum.occurrences + row.occurrences,
        installs: sum.installs + row.installs,
      }),
      { occurrences: 0, installs: 0 },
    );
}

export default async function IssuesPage() {
  const since = new Date(Date.now() - 30 * DAY).toISOString().slice(0, 10);
  const issues = await safe(() => appIssues(since));

  if (!issues.ok) {
    return (
      <AdminShell project={privydockSource}>
        <PageHeader eyebrow="PrivyDock" title="Issues" />
        <SourceError source="App events" message={issues.error} />
      </AdminShell>
    );
  }

  const rows = issues.data.rows;
  const hideOk = total(rows, "hide_succeeded");
  const hideFailed = total(rows, "hide_failed");
  const restoreFailed = total(rows, "restore_failed");
  const blocked = total(rows, "hide_blocked_by_entitlement");
  const pricing = total(rows, "pricing_clicked");
  const attempts = hideOk.occurrences + hideFailed.occurrences;
  const failures = groupFailures(rows);

  return (
    <AdminShell project={privydockSource}>
      <PageHeader
        eyebrow="PrivyDock"
        title="Issues"
        description="What went wrong on people's Macs over the last 30 days, reported by the app from 0.1.7. Codes only — the app never sends an app's name, its location, or anything else about what is on the Mac."
      />

      <section className="grid metrics">
        <Metric
          label="Hide success · 30d"
          value={attempts ? `${Math.round((hideOk.occurrences / attempts) * 100)}%` : "—"}
          sub={
            attempts
              ? `${formatNumber(hideFailed.occurrences)} failures of ${formatNumber(attempts)} attempts`
              : "No attempts reported yet"
          }
        />
        <Metric
          label="Restore failures · 30d"
          value={formatNumber(restoreFailed.occurrences)}
          sub={
            restoreFailed.occurrences
              ? `On ${formatNumber(restoreFailed.installs)} Macs — should always be zero`
              : "Restore should never fail"
          }
        />
        <Metric
          label="Stopped by trial end · 30d"
          value={formatNumber(blocked.installs)}
          sub={`Macs that tried to hide after expiry · ${formatNumber(blocked.occurrences)} attempts`}
        />
        <Metric
          label="Pricing opened in app · 30d"
          value={formatNumber(pricing.occurrences)}
          sub={`From ${formatNumber(pricing.installs)} Macs`}
        />
      </section>

      {failures.length ? (
        <section className="panel mt-6">
          <div className="metric-label">Failures, most widespread first</div>
          <p className="muted mt-1 text-sm">
            Ranked by how many Macs hit it, not how many times — one Mac retrying ten times is one
            person with a problem.
          </p>
          <div className="table-wrap mt-3">
            <table className="table">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>What happened</th>
                  <th>Macs</th>
                  <th>Times</th>
                  <th>Versions</th>
                  <th>Last seen</th>
                </tr>
              </thead>
              <tbody>
                {failures.map((failure) => (
                  <tr key={`${failure.event}|${failure.code}|${failure.permission}`}>
                    <td>{EVENT_LABEL[failure.event] ?? failure.event}</td>
                    <td>
                      {meaning(failure.code, failure.permission)}
                      <div className="muted text-xs">{failure.code || "—"}</div>
                    </td>
                    <td>{formatNumber(failure.installs)}</td>
                    <td>{formatNumber(failure.occurrences)}</td>
                    <td>{[...failure.versions].sort().join(", ") || "—"}</td>
                    <td>{formatDate(failure.lastSeen)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <section className="mt-6">
          <EmptyState
            title={rows.length ? "No failures in the last 30 days" : "Nothing reported yet"}
            body={
              rows.length
                ? "Every hide and restore reported in this window succeeded."
                : "The app reports these from 0.1.7. Copies on earlier versions send nothing here until they update."
            }
          />
        </section>
      )}
    </AdminShell>
  );
}
