import Link from "next/link";
import { AdminShell } from "../components/shell";
import { Badge, Metric, PageHeader, formatDate, formatInr, formatNumber } from "../components/ui";
import { adminGet, type AiCostData } from "../lib/api";

export const dynamic = "force-dynamic";

type CostSearchParams = {
  days?: string;
  platform?: string;
};

export default async function CostPage({
  searchParams,
}: {
  searchParams?: Promise<CostSearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const days = clampDays(params.days);
  const platform = normalizePlatform(params.platform);
  const cost = await adminGet<AiCostData>(`/admin/ai-cost/data?days=${days}&platform=${platform}`);
  const totalTokens = cost.overall.inputTokens + cost.overall.outputTokens;
  const dailyAverage = cost.overall.costInr / days;
  const maxDailyCost = Math.max(0.01, ...cost.daily.map((day) => day.costInr));

  return (
    <AdminShell>
      <PageHeader
        eyebrow="AI operations"
        title="AI usage and scan health"
        description="Cost, latency, confidence, model mix, and recent AI runs in one place, with shortcuts to the operational queues."
        action={
          <form className="inline-controls" action="/cost">
            <select className="select" name="days" defaultValue={String(days)}>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="180">Last 180 days</option>
              <option value="365">Last 365 days</option>
            </select>
            <select className="select" name="platform" defaultValue={platform}>
              <option value="all">All platforms</option>
              <option value="ios">iOS</option>
              <option value="android">Android</option>
            </select>
            <button className="button button-secondary" type="submit">
              Apply
            </button>
          </form>
        }
      />

      <section className="action-row mb-4">
        <Link className="button" href="/scans?aiState=failed_ai&sort=createdAt&direction=desc">
          Review failed AI runs
        </Link>
        <Link className="button button-secondary" href="/scans?sort=latencyMs&direction=desc">
          Inspect slow scans
        </Link>
        <Link className="button button-secondary" href="/ai?section=models">
          Tune model and prompt
        </Link>
        <Link className="button button-secondary" href="/audit?targetType=ai">
          Audit AI changes
        </Link>
      </section>

      <section className="usage-grid">
        <Metric
          label="Total AI cost"
          value={formatInr(cost.overall.costInr)}
          sub={`$${cost.overall.costUsd.toFixed(2)} over ${days} days`}
        />
        <Metric
          label="Avg cost / AI run"
          value={formatInr(cost.overall.averageRunCostInr)}
          sub={`${formatNumber(cost.overall.runs)} runs · ${formatNumber(cost.overall.scans)} scans`}
        />
        <Metric
          label="AI runs in Rs 10"
          value={formatNumber(cost.overall.runsPerTenInr)}
          sub="at current run cost"
        />
        <Metric
          label="Tokens used"
          value={formatNumber(totalTokens)}
          sub={`${formatNumber(cost.overall.inputTokens)} in / ${formatNumber(cost.overall.outputTokens)} out`}
        />
        <Metric
          label="Success"
          value={formatNumber(cost.overall.successfulRuns)}
          sub={`${formatNumber(cost.overall.failedRuns)} failed runs`}
        />
        <Metric
          label="Avg confidence"
          value={formatPercent(cost.overall.averageConfidence)}
          sub="AI prediction score"
        />
        <Metric
          label="Avg latency"
          value={
            cost.overall.averageLatencyMs === null
              ? "None"
              : `${formatNumber(cost.overall.averageLatencyMs)} ms`
          }
          sub="provider response time"
        />
        <Metric label="Daily avg cost" value={formatInr(dailyAverage)} sub="selected window" />
      </section>

      <section className="usage-split mt-4">
        <div className="panel">
          <div className="section-head">
            <div>
              <h2 className="text-xl font-bold">Daily spend</h2>
              <p className="muted text-sm">
                {days} days · {formatInr(cost.usdToInr)} / USD conversion
              </p>
            </div>
            <Link className="badge" href="/scans?sort=createdAt&direction=desc">
              Open scans
            </Link>
          </div>
          <div
            className="bar-chart"
            style={{ "--bar-count": String(Math.max(1, cost.daily.length)) } as React.CSSProperties}
          >
            {cost.daily.length === 0 ? (
              <div className="muted">No AI spend in this window.</div>
            ) : (
              cost.daily.map((day, index) => (
                <div
                  className="bar"
                  key={day.date}
                  style={{ height: `${Math.max(3, (day.costInr / maxDailyCost) * 100)}%` }}
                  title={`${day.date}: ${formatInr(day.costInr)}`}
                >
                  <span className="bar-value">{formatInr(day.costInr)}</span>
                  <span className="sr-only">
                    {formatNumber(day.runs)} AI runs across {formatNumber(day.scans)} scans
                  </span>
                  {index === 0 || index === cost.daily.length - 1 ? (
                    <span className="bar-label">{shortDate(day.date)}</span>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="panel">
          <div className="section-head">
            <h2 className="text-xl font-bold">Model mix</h2>
            <span className="muted text-sm">by INR cost</span>
          </div>
          <div className="table-wrap">
            <table className="table table-compact">
              <thead>
                <tr>
                  <th>Model</th>
                  <th>Runs</th>
                  <th>Avg</th>
                  <th>Rs 10</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {cost.models.map((model) => (
                  <tr key={`${model.provider}-${model.model}`}>
                    <td>
                      <div className="font-semibold">{model.model}</div>
                      <div className="muted text-xs">{model.provider}</div>
                    </td>
                    <td>
                      <div>{formatNumber(model.runs)}</div>
                      <div className="muted text-xs">{formatNumber(model.scans)} scans</div>
                    </td>
                    <td>{formatInr(model.averageRunCostInr)}</td>
                    <td>{formatNumber(model.runsPerTenInr)}</td>
                    <td className="table-actions">
                      <Link
                        className="badge"
                        href={`/scans?model=${encodeURIComponent(model.model)}`}
                      >
                        Runs
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="usage-split mt-4">
        <div className="panel">
          <div className="section-head">
            <h2 className="text-xl font-bold">Platform mix</h2>
            <span className="muted text-sm">AI runs by app platform</span>
          </div>
          <div className="table-wrap">
            <table className="table table-compact">
              <thead>
                <tr>
                  <th>Platform</th>
                  <th>Runs</th>
                  <th>Cost</th>
                  <th>Avg</th>
                  <th>Rs 10</th>
                </tr>
              </thead>
              <tbody>
                {cost.platforms.map((item) => (
                  <tr key={item.platform}>
                    <td className="font-semibold">{platformLabel(item.platform)}</td>
                    <td>
                      <div>{formatNumber(item.runs)}</div>
                      <div className="muted text-xs">{formatNumber(item.scans)} scans</div>
                    </td>
                    <td>{formatInr(item.costInr)}</td>
                    <td>{formatInr(item.averageRunCostInr)}</td>
                    <td>{formatNumber(item.runsPerTenInr)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <div className="section-head">
            <h2 className="text-xl font-bold">App builds</h2>
            <span className="muted text-sm">Version/build from current app headers</span>
          </div>
          <div className="table-wrap">
            <table className="table table-compact">
              <thead>
                <tr>
                  <th>Build</th>
                  <th>Platform</th>
                  <th>Runs</th>
                  <th>Cost</th>
                </tr>
              </thead>
              <tbody>
                {cost.appBuilds.map((item) => (
                  <tr key={`${item.platform}-${item.appVersion}-${item.appBuild}`}>
                    <td>
                      <div className="font-semibold">{item.appVersion}</div>
                      <div className="muted text-xs">Build {item.appBuild}</div>
                    </td>
                    <td>{platformLabel(item.platform)}</td>
                    <td>
                      <div>{formatNumber(item.runs)}</div>
                      <div className="muted text-xs">{formatNumber(item.scans)} scans</div>
                    </td>
                    <td>{formatInr(item.costInr)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="usage-split mt-4">
        <div className="panel">
          <div className="section-head">
            <h2 className="text-xl font-bold">Recent AI runs</h2>
            <span className="muted text-sm">Updated {formatDate(cost.generatedAt)}</span>
          </div>
          <div className="table-wrap">
            <table className="table table-compact">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Platform</th>
                  <th>Model</th>
                  <th>Tokens</th>
                  <th>Confidence</th>
                  <th>Latency</th>
                  <th>Cost</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {cost.recentRuns.map((run) => (
                  <tr key={`${run.createdAt}-${run.provider}-${run.model}`}>
                    <td>{formatDate(run.createdAt)}</td>
                    <td>
                      <Badge>{platformLabel(run.platform)}</Badge>
                      <div className="muted mt-1 text-xs">
                        {run.appVersion} ({run.appBuild})
                      </div>
                    </td>
                    <td>
                      <div className="font-semibold">{run.model}</div>
                      <Badge tone={run.success ? "green" : "red"}>
                        {run.success ? "success" : "failed"}
                      </Badge>
                    </td>
                    <td>
                      <div>{formatNumber(run.inputTokens + run.outputTokens)}</div>
                      <div className="muted text-xs">
                        {formatNumber(run.inputTokens)} in · {formatNumber(run.outputTokens)} out
                      </div>
                    </td>
                    <td>{formatPercent(run.confidence)}</td>
                    <td>{run.latencyMs === null ? "None" : `${formatNumber(run.latencyMs)} ms`}</td>
                    <td>{formatInr(run.costInr)}</td>
                    <td className="table-actions">
                      <Link
                        className="badge"
                        href={`/scans?model=${encodeURIComponent(run.model)}&aiState=${
                          run.success ? "successful_ai" : "failed_ai"
                        }`}
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <h2 className="text-xl font-bold">Operator notes</h2>
          <div className="mt-4 grid gap-3">
            <OperatorNote
              title="Cost spike"
              body="If daily cost jumps, check model mix, recent prompts, and slow scans before changing defaults."
              href="/audit?targetType=ai"
              action="Audit AI changes"
            />
            <OperatorNote
              title="Low confidence"
              body="Open scans sorted by confidence and inspect food-note quality, prompt version, and image metadata."
              href="/scans?sort=confidence&direction=asc"
              action="Review confidence"
            />
            <OperatorNote
              title="High latency"
              body="Sort scans by latency and compare model configuration with recent provider runs."
              href="/scans?sort=latencyMs&direction=desc"
              action="Review latency"
            />
          </div>
        </div>
      </section>
    </AdminShell>
  );
}

function OperatorNote({
  title,
  body,
  href,
  action,
}: {
  title: string;
  body: string;
  href: string;
  action: string;
}) {
  return (
    <div className="panel-light rounded-lg p-4">
      <div className="font-semibold">{title}</div>
      <p className="muted mt-1 text-sm">{body}</p>
      <Link className="badge mt-3" href={href}>
        {action}
      </Link>
    </div>
  );
}

function clampDays(value: string | undefined) {
  const parsed = Number(value ?? 30);
  if (!Number.isFinite(parsed)) return 30;
  return Math.max(1, Math.min(365, Math.floor(parsed)));
}

function normalizePlatform(value: string | undefined) {
  return value === "ios" || value === "android" ? value : "all";
}

function platformLabel(value: string | undefined) {
  if (value === "ios") return "iOS";
  if (value === "android") return "Android";
  return "Unknown";
}

function formatPercent(value: number | null) {
  if (value === null) return "None";
  return `${Number((value * 100).toFixed(2))}%`;
}

function shortDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    day: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}
