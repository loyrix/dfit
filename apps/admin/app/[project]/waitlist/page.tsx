import { AdminShell } from "../../components/shell";
import { SourceError, safe } from "../../components/source-error";
import {
  Badge,
  EmptyState,
  Metric,
  PageHeader,
  formatDate,
  formatNumber,
} from "../../components/ui";
import { listLicenses, listWaitlist } from "../../sources/privydock/supabase";

export const dynamic = "force-dynamic";

const DAY = 24 * 60 * 60 * 1000;

export default async function WaitlistPage() {
  const [waitlist, licenses] = await Promise.all([
    safe(() => listWaitlist(500)),
    safe(() => listLicenses(500)),
  ]);

  if (!waitlist.ok) {
    return (
      <AdminShell>
        <PageHeader eyebrow="PrivyDock" title="Waitlist" />
        <SourceError source="Supabase" message={waitlist.error} />
      </AdminShell>
    );
  }

  const rows = waitlist.data.rows;
  const last30 = rows.filter(
    (row) => Date.parse(row.first_joined_at) > Date.now() - 30 * DAY,
  ).length;

  const bySource = rows.reduce<Record<string, number>>((acc, row) => {
    acc[row.source] = (acc[row.source] ?? 0) + 1;
    return acc;
  }, {});

  // Both tables carry normalized_email, so waitlist-to-customer conversion is a
  // plain set intersection rather than anything that needs instrumenting.
  const customerEmails = licenses.ok
    ? new Set(licenses.data.rows.map((license) => license.customer_email.trim().toLowerCase()))
    : null;
  const converted = customerEmails
    ? rows.filter((row) => customerEmails.has(row.normalized_email)).length
    : null;

  return (
    <AdminShell>
      <PageHeader
        eyebrow="PrivyDock"
        title="Waitlist"
        description="Early-access signups, and how many of them went on to buy."
      />

      <section className="metric-grid">
        <Metric label="Total signups" value={formatNumber(waitlist.data.total)} />
        <Metric label="New · 30d" value={formatNumber(last30)} />
        <Metric
          label="Converted to customer"
          value={converted === null ? "—" : formatNumber(converted)}
          sub={
            converted !== null && rows.length
              ? `${Math.round((converted / rows.length) * 100)}% of the list`
              : "Matched on normalised email"
          }
        />
        <Metric
          label="Sources"
          value={Object.keys(bySource).length}
          sub={Object.entries(bySource)
            .map(([source, count]) => `${source} ${count}`)
            .join(" · ")}
        />
      </section>

      <section className="panel mt-6">
        <div className="metric-label">Signups</div>
        {rows.length ? (
          <div className="table-scroll mt-3">
            <table className="table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Source</th>
                  <th>First joined</th>
                  <th>Last joined</th>
                  <th>Customer</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.normalized_email}>
                    <td>{row.email}</td>
                    <td>{row.source}</td>
                    <td>{formatDate(row.first_joined_at)}</td>
                    <td>{formatDate(row.last_joined_at)}</td>
                    <td>
                      {customerEmails?.has(row.normalized_email) ? (
                        <Badge tone="green">Bought</Badge>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No signups yet" />
        )}
      </section>
    </AdminShell>
  );
}
