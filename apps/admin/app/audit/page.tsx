import { AdminShell } from "../components/shell";
import { PageHeader, formatDate } from "../components/ui";
import { adminGet, type AuditEntry } from "../lib/api";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  const { entries } = await adminGet<{ entries: AuditEntry[] }>("/admin/audit-log?limit=100");

  return (
    <AdminShell>
      <PageHeader
        eyebrow="Safety"
        title="Audit log"
        description="Every support grant and runtime configuration mutation is recorded with actor, target, reason, and before/after state."
      />

      <section className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Actor</th>
              <th>Action</th>
              <th>Target</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id}>
                <td>{formatDate(entry.createdAt)}</td>
                <td>{entry.actor}</td>
                <td>
                  <div className="font-semibold">{entry.action}</div>
                  <details className="mt-2">
                    <summary className="muted cursor-pointer text-xs">Before / after</summary>
                    <pre className="code-block mt-2 max-h-[260px] overflow-auto">
                      {JSON.stringify({ before: entry.before, after: entry.after }, null, 2)}
                    </pre>
                  </details>
                </td>
                <td>
                  <div>{entry.targetType}</div>
                  <div className="muted break-all text-xs">{entry.targetId ?? "none"}</div>
                </td>
                <td>{entry.reason ?? "None"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </AdminShell>
  );
}
