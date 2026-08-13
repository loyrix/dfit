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
} from "../../components/ui";
import { cachedTransactions, netRevenue } from "../../sources/privydock/paddle";
import { listWebhookEvents } from "../../sources/privydock/supabase";

export const dynamic = "force-dynamic";

export default async function RevenuePage() {
  const [transactions, webhooks] = await Promise.all([
    safe(() => cachedTransactions(100)),
    safe(() => listWebhookEvents(20)),
  ]);

  const rows = transactions.ok ? transactions.data : [];
  const completed = rows.filter((row) => row.status === "completed" || row.status === "billed");
  const byCountry = completed.reduce<Record<string, number>>((acc, row) => {
    const key = row.country ?? "??";
    acc[key] = (acc[key] ?? 0) + row.total;
    return acc;
  }, {});

  const lastWebhook = webhooks.ok ? webhooks.data.rows[0] : undefined;

  return (
    <AdminShell project={privydockSource}>
      <PageHeader
        eyebrow="PrivyDock"
        title="Revenue"
        description="Paddle transactions, plus webhook health — a stale last-received timestamp is the earliest warning that licence delivery has broken."
      />

      {transactions.ok ? (
        <section className="metric-grid">
          <Metric
            label="Net revenue"
            value={`$${netRevenue(rows).toFixed(2)}`}
            sub="Completed, net of refunds"
          />
          <Metric label="Transactions" value={formatNumber(rows.length)} />
          <Metric label="Completed" value={formatNumber(completed.length)} />
          <Metric
            label="Countries"
            value={Object.keys(byCountry).length}
            sub={Object.entries(byCountry)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 4)
              .map(([country, total]) => `${country} $${(total / 100).toFixed(0)}`)
              .join(" · ")}
          />
        </section>
      ) : (
        <SourceError source="Paddle" message={transactions.error} />
      )}

      <section className="panel mt-6">
        <div className="metric-label">Transactions</div>
        {rows.length ? (
          <div className="table-scroll mt-3">
            <table className="table">
              <thead>
                <tr>
                  <th>Id</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th>Country</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.id}</td>
                    <td>
                      <Badge tone={row.status === "completed" ? "green" : "gray"}>
                        {row.status}
                      </Badge>
                    </td>
                    <td>
                      {row.currency_code} {(row.total / 100).toFixed(2)}
                    </td>
                    <td>{row.country ?? "—"}</td>
                    <td>{formatDate(row.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No transactions yet"
            body="The beta is free. This fills in once the paid release ships."
          />
        )}
      </section>

      <section className="panel mt-6">
        <div className="metric-label">Webhook health</div>
        {webhooks.ok ? (
          lastWebhook ? (
            <>
              <p className="muted mt-2 text-sm">
                Last event {lastWebhook.event_type} at {formatDate(lastWebhook.occurred_at)}
              </p>
              <div className="table-scroll mt-3">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Occurred</th>
                      <th>Processed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {webhooks.data.rows.map((event) => (
                      <tr key={event.event_id}>
                        <td>{event.event_type}</td>
                        <td>{formatDate(event.occurred_at)}</td>
                        <td>{formatDate(event.processed_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p className="muted mt-2 text-sm">
              No Paddle webhooks received yet. Expected while the beta is free.
            </p>
          )
        ) : (
          <p className="muted mt-2 text-sm">Unavailable — {webhooks.error}</p>
        )}
      </section>
    </AdminShell>
  );
}
