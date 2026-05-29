import Link from "next/link";
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

      <section className="grid metrics mt-4">
        <Metric
          label="Installs"
          value={formatNumber(overview.installs ?? 0)}
          sub={`${formatNumber(overview.newInstallsToday ?? 0)} new today`}
        />
        <Metric
          label="Active installs"
          value={formatNumber(overview.activeInstalls24h ?? 0)}
          sub={`${formatNumber(overview.activeInstalls7d ?? 0)} in last 7 days`}
        />
        <Metric
          label="Scan-active profiles"
          value={formatNumber(overview.scanActiveProfilesToday ?? 0)}
          sub={`${formatNumber(overview.mealActiveProfilesToday ?? 0)} meal-active today`}
        />
        <Metric
          label="Inactive estimate"
          value={formatNumber(overview.inactiveInstalls30d ?? 0)}
          sub="30d without server activity"
        />
      </section>

      <section className="grid two-col mt-4">
        <div className="panel">
          <h2 className="text-xl font-bold">Operational queues</h2>
          <div className="table-wrap mt-4">
            <table className="table table-compact">
              <thead>
                <tr>
                  <th>Queue</th>
                  <th>Why it matters</th>
                  <th>Open</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="font-semibold">Failed scans</td>
                  <td className="muted">Inspect model errors and compensate affected users.</td>
                  <td>
                    <Link
                      className="badge"
                      href="/scans?status=failed&sort=createdAt&direction=desc"
                    >
                      Review
                    </Link>
                  </td>
                </tr>
                <tr>
                  <td className="font-semibold">Ready for review</td>
                  <td className="muted">
                    Check scans that reached estimate review but were not confirmed.
                  </td>
                  <td>
                    <Link
                      className="badge"
                      href="/scans?status=ready_for_review&sort=createdAt&direction=desc"
                    >
                      Review
                    </Link>
                  </td>
                </tr>
                <tr>
                  <td className="font-semibold">Inactive users</td>
                  <td className="muted">Reactivate profiles after support validation.</td>
                  <td>
                    <Link className="badge" href="/users?status=inactive">
                      Review
                    </Link>
                  </td>
                </tr>
                <tr>
                  <td className="font-semibold">Runtime changes</td>
                  <td className="muted">
                    Audit model, prompt, flag, notice, and version-policy changes.
                  </td>
                  <td>
                    <Link className="badge" href="/audit">
                      Audit
                    </Link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">AI cost summary</h2>
              <p className="muted text-sm">Updated {formatDate(cost.generatedAt)}</p>
            </div>
            <div className="inline-controls">
              <div className="badge">{formatNumber(cost.overall.scansPerTenInr)} scans / Rs 10</div>
              <Link className="badge" href="/cost">
                Full usage
              </Link>
            </div>
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
          <div className="section-head">
            <div>
              <h2 className="text-xl font-bold">Daily activity</h2>
              <p className="muted text-sm">IST, from scans and meal logs</p>
            </div>
          </div>
          <div className="table-wrap">
            <table className="table table-compact">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Active profiles</th>
                  <th>Scans</th>
                  <th>Meal profiles</th>
                  <th>Meals</th>
                </tr>
              </thead>
              <tbody>
                {(overview.dailyActivity ?? []).slice(0, 7).map((day) => (
                  <tr key={day.date}>
                    <td>{formatActivityDate(day.date)}</td>
                    <td>{formatNumber(day.activeProfiles)}</td>
                    <td>{formatNumber(day.scans)}</td>
                    <td>{formatNumber(day.mealProfiles)}</td>
                    <td>{formatNumber(day.meals)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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

function formatActivityDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(`${value}T00:00:00+05:30`));
}
