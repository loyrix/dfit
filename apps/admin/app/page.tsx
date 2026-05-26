import { AdminShell } from "./components/shell";
import { Metric, PageHeader, formatDate, formatInr, formatNumber } from "./components/ui";
import { adminGet, type AdminOverview, type AiCostData } from "./lib/api";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [overview, cost] = await Promise.all([
    adminGet<AdminOverview>("/admin/overview"),
    adminGet<AiCostData>("/admin/ai-cost/data?days=30"),
  ]);

  return (
    <AdminShell>
      <PageHeader
        eyebrow="Operations"
        title="Backoffice command center"
        description="Production support, Vertex spend, user compensation, runtime flags, prompts, and notices in one place."
      />

      <section className="grid metrics">
        <Metric
          label="Profiles"
          value={formatNumber(overview.profiles)}
          sub={`${overview.accountProfiles} accounts`}
        />
        <Metric
          label="Scans"
          value={formatNumber(overview.scans)}
          sub={`${overview.failedScans} failed`}
        />
        <Metric label="Meals" value={formatNumber(overview.meals)} sub="logged in journals" />
        <Metric label="AI cost" value={formatInr(cost.overall.costInr)} sub="last 30 days" />
      </section>

      <section className="grid two-col mt-4">
        <div className="panel">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">AI cost summary</h2>
              <p className="muted text-sm">Updated {formatDate(cost.generatedAt)}</p>
            </div>
            <div className="badge">{formatNumber(cost.overall.scansPerTenInr)} scans / Rs 10</div>
          </div>
          <table className="table mt-4">
            <thead>
              <tr>
                <th>Model</th>
                <th>Runs</th>
                <th>Cost</th>
                <th>Avg</th>
              </tr>
            </thead>
            <tbody>
              {cost.models.map((model) => (
                <tr key={`${model.provider}-${model.model}`}>
                  <td>
                    <div className="font-semibold">{model.model}</div>
                    <div className="muted text-xs">{model.provider}</div>
                  </td>
                  <td>{formatNumber(model.scans)}</td>
                  <td>{formatInr(model.costInr)}</td>
                  <td>{formatInr(model.averageCostInr)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="panel">
          <h2 className="text-xl font-bold">Recent runs</h2>
          <div className="mt-4 grid gap-3">
            {cost.recentRuns.slice(0, 8).map((run) => (
              <div className="panel-light rounded-lg p-3" key={`${run.createdAt}-${run.model}`}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold">{run.model}</div>
                    <div className="muted text-xs">{formatDate(run.createdAt)}</div>
                  </div>
                  <div className={run.success ? "badge badge-green" : "badge badge-red"}>
                    {formatInr(run.costInr)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </AdminShell>
  );
}
