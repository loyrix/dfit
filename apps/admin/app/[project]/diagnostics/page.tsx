import { AdminShell } from "../../components/shell";
import { privydockSource } from "../../sources/privydock";
import { SourceError, safe } from "../../components/source-error";
import { Badge, EmptyState, Metric, PageHeader, formatNumber } from "../../components/ui";
import { type AppLogRow, appLogs } from "../../sources/privydock/supabase";

export const dynamic = "force-dynamic";

const DAY = 24 * 60 * 60 * 1000;

/**
 * What a log line means to someone reading this page.
 *
 * The app sends codes; this is the one place they become words, the same
 * arrangement as the Issues page. Anything unrecognised is shown raw rather
 * than hidden — an unmapped code from a newer build is information, not noise.
 */
function describe(row: AppLogRow): string {
  const key = `${row.area}.${row.event}`;

  const known: Record<string, string> = {
    "launch.started": "PrivyDock opened",
    "location.blocked_hide": "Refused — app is in the wrong place",
    "location.recovered_stranded_probe": "Put back an app left renamed by an interrupted check",
    "permission.probe": "Tested App Management",
    "permission.offered": "Suggested a next step",
    "permission.relaunch_started": "Reopened itself to apply the grant",
    "permission.resumed": "Finished the hide it was interrupted doing",
    "permission.resume_target_missing": "Could not finish — that app had gone",
    "helper.install_requested": "Started installing the helper",
    "helper.registering": "About to register the helper",
  };

  if (known[key]) return known[key];
  if (key.startsWith("helper.register_failed_attempt_")) {
    return `Helper registration failed (attempt ${key.split("_").pop()})`;
  }
  return key;
}

/** The codes worth translating, since they are the diagnosis. */
function explainCode(code: string | null): string | null {
  if (!code) return null;

  const known: Record<string, string> = {
    granted: "macOS allows it",
    denied: "macOS refuses — permission not in effect",
    stranded: "an app was left renamed",
    installed: "in the Applications folder",
    translocated: "opened from a download, never moved",
    diskImage: "running from inside the DMG",
    elsewhere: "outside the Applications folder",
    grantInSettings: "turn it on in System Settings",
    relaunch: "reopen PrivyDock",
    fullDiskAccess: "grant Full Disk Access instead",
    notRegistered: "helper not registered",
    enabled: "helper already registered",
    requiresApproval: "helper awaiting approval in Login Items",
    notFound: "helper plist not found",
    "SMAppServiceErrorDomain:1": "EPERM — wrong location, or one still running",
    "SMAppServiceErrorDomain:2": "ENOENT — helper missing from the bundle",
    "SMAppServiceErrorDomain:13": "EACCES — access denied",
  };
  if (known[code]) return known[code];
  if (code.startsWith("inconclusive:")) {
    return `check could not finish (errno ${code.split(":")[1]})`;
  }
  return null;
}

/** A failure worth the reader's eye, as opposed to ordinary progress. */
function isTrouble(row: AppLogRow): boolean {
  if (row.code === "denied" || row.code === "stranded") return true;
  if (row.event.startsWith("register_failed")) return true;
  if (row.event === "blocked_hide" || row.event === "resume_target_missing") return true;
  return false;
}

/** One Mac's story, newest activity first. */
function groupByInstall(rows: AppLogRow[]) {
  const groups = new Map<string, AppLogRow[]>();
  for (const row of rows) {
    const existing = groups.get(row.install_id);
    if (existing) existing.push(row);
    else groups.set(row.install_id, [row]);
  }

  return [...groups.entries()]
    .map(([installId, entries]) => ({
      installId,
      // Ascending inside a Mac: a sequence only reads as a story forwards.
      entries: [...entries].reverse(),
      lastSeen: entries[0]?.occurred_at ?? "",
      troubles: entries.filter(isTrouble).length,
    }))
    .sort((a, b) => b.troubles - a.troubles || b.lastSeen.localeCompare(a.lastSeen));
}

function time(value: string) {
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default async function DiagnosticsPage() {
  const since = new Date(Date.now() - 30 * DAY).toISOString().slice(0, 10);
  const logs = await safe(() => appLogs(since));

  if (!logs.ok) {
    return (
      <AdminShell project={privydockSource}>
        <PageHeader eyebrow="PrivyDock" title="Diagnostics" />
        <SourceError source="Permission log" message={logs.error} />
      </AdminShell>
    );
  }

  const rows = logs.data.rows;
  const installs = groupByInstall(rows);
  const troubled = installs.filter((install) => install.troubles > 0);
  const denials = rows.filter((row) => row.code === "denied").length;
  const relaunches = rows.filter((row) => row.event === "relaunch_started").length;
  const resumed = rows.filter((row) => row.event === "resumed").length;

  return (
    <AdminShell project={privydockSource}>
      <PageHeader
        eyebrow="PrivyDock"
        title="Diagnostics"
        description="What macOS allowed and refused on people's Macs, in the order it happened, from 0.1.8. Codes only — no app names, bundle identifiers, or paths. Kept for 30 days."
      />

      <section className="grid metrics">
        <Metric
          label="Macs reporting · 30d"
          value={formatNumber(installs.length)}
          sub={`${formatNumber(rows.length)} log lines`}
        />
        <Metric
          label="Macs with trouble"
          value={formatNumber(troubled.length)}
          sub={troubled.length ? "Listed first below" : "Nothing refused"}
        />
        <Metric
          label="Permission refusals"
          value={formatNumber(denials)}
          sub="Times macOS said no to App Management"
        />
        <Metric
          label="Reopened to apply a grant"
          value={formatNumber(relaunches)}
          sub={`${formatNumber(resumed)} went on to finish the hide`}
        />
      </section>

      {installs.length ? (
        <section className="mt-6 grid gap-4">
          {installs.map((install) => (
            <div className="panel" key={install.installId}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="metric-label">Mac {install.installId.slice(0, 8)}</div>
                  <p className="muted text-xs mt-1">
                    {install.entries.at(-1)?.app_version ?? "—"} ·{" "}
                    {install.entries.at(-1)?.os_version ?? "—"}
                  </p>
                </div>
                {install.troubles > 0 ? (
                  <Badge tone="red">
                    {install.troubles} {install.troubles === 1 ? "problem" : "problems"}
                  </Badge>
                ) : (
                  <Badge tone="green">Clean</Badge>
                )}
              </div>

              <div className="table-wrap mt-3">
                <table className="table">
                  <thead>
                    <tr>
                      <th>When</th>
                      <th>What happened</th>
                      <th>Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {install.entries.map((row, index) => {
                      const meaning = explainCode(row.code);
                      return (
                        <tr key={`${row.occurred_at}-${index}`}>
                          <td className="muted text-xs">{time(row.occurred_at)}</td>
                          <td>
                            {describe(row)}
                            {isTrouble(row) ? " ⚠" : ""}
                          </td>
                          <td>
                            {meaning ?? row.code ?? "—"}
                            {meaning && row.code ? (
                              <div className="muted text-xs">{row.code}</div>
                            ) : null}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </section>
      ) : (
        <section className="mt-6">
          <EmptyState
            title="Nothing reported yet"
            body="The app sends this from 0.1.8, roughly every six hours. Copies on earlier versions send nothing here until they update."
          />
        </section>
      )}
    </AdminShell>
  );
}
