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
import { cachedTransactions, explainTransaction, netRevenue } from "../../sources/privydock/paddle";
import { listWebhookEvents } from "../../sources/privydock/supabase";

export const dynamic = "force-dynamic";

export default async function RevenuePage() {
  const [transactions, webhooks] = await Promise.all([
    safe(() => cachedTransactions(100)),
    safe(() => listWebhookEvents(20)),
  ]);

  const rows = (transactions.ok ? transactions.data : []).map((row) => ({
    ...row,
    outcome: explainTransaction(row),
  }));
  const completed = rows.filter((row) => row.status === "completed" || row.status === "billed");
  const unpaid = rows.filter((row) => row.outcome.stage !== "Paid");
  const stoppedAt = Object.entries(
    unpaid.reduce<Record<string, number>>((acc, row) => {
      acc[row.outcome.stage] = (acc[row.outcome.stage] ?? 0) + 1;
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);
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
        description="Paddle transactions and how far each checkout got, plus webhook health — a stale last-received timestamp is the earliest warning that licence delivery has broken."
      />

      {transactions.ok ? (
        <section className="grid metrics">
          <Metric
            label="Net revenue"
            value={`$${netRevenue(rows).toFixed(2)}`}
            sub="Completed, net of refunds"
          />
          <Metric
            label="Checkouts"
            value={formatNumber(rows.length)}
            sub={`${formatNumber(completed.length)} completed`}
          />
          <Metric
            label="Not paid"
            value={formatNumber(unpaid.length)}
            sub={stoppedAt.map(([stage, count]) => `${stage} ${count}`).join(" · ")}
          />
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
        <p className="muted mt-2 text-sm">
          What happened is read from Paddle&apos;s record of each payment attempt. Paddle knows the
          step a checkout stopped at and what the bank or wallet answered, not why someone closed
          the window.
        </p>
        {!transactions.ok ? (
          <p className="muted mt-3 text-sm">
            Not shown: Paddle could not be read, so this is not a count of zero.
          </p>
        ) : rows.length ? (
          <div className="table-wrap mt-3">
            <table className="table">
              <thead>
                <tr>
                  <th>Created</th>
                  <th>Customer</th>
                  <th>What happened</th>
                  <th>Total</th>
                  <th>Country</th>
                  <th>Id</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>{formatDate(row.created_at)}</td>
                    <td>{row.email ?? "—"}</td>
                    <td>
                      <Badge tone={row.outcome.tone}>{row.outcome.stage}</Badge>
                      <div className="muted mt-1 text-sm">{row.outcome.detail}</div>
                    </td>
                    <td>
                      {row.currency_code} {(row.total / 100).toFixed(2)}
                      {row.discount_percent ? (
                        <div className="muted text-sm">{row.discount_percent}% off</div>
                      ) : null}
                    </td>
                    <td>{row.country ?? "—"}</td>
                    <td>{row.id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No transactions yet" body="Nobody has opened a checkout yet." />
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
              <div className="table-wrap mt-3">
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
            <p className="muted mt-2 text-sm">No Paddle webhooks received yet.</p>
          )
        ) : (
          <p className="muted mt-2 text-sm">Unavailable — {webhooks.error}</p>
        )}
      </section>
    </AdminShell>
  );
}
