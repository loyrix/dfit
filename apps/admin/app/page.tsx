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
          sub={`${formatNumber(overview.confirmedScans ?? 0)} confirmed · ${overview.failedScans} failed`}
        />
        <Metric label="Meals" value={formatNumber(overview.meals)} sub="logged in journals" />
        <Metric label="AI cost" value={formatInr(cost.overall.costInr)} sub="last 30 days" />
      </section>

      <section className="grid metrics mt-4">
        <Metric
          label="Server-seen installs"
          value={formatNumber(overview.installs ?? 0)}
          sub={`${formatNumber(overview.newInstallsToday ?? 0)} first seen today`}
        />
        <Metric
          label="Active devices"
          value={formatNumber(overview.activeInstalls24h ?? 0)}
          sub={`${formatNumber(overview.activeInstalls7d ?? 0)} in last 7 days`}
        />
        <Metric
          label="Scan-active profiles"
          value={formatNumber(overview.scanActiveProfilesToday ?? 0)}
          sub={`${formatNumber(overview.mealActiveProfilesToday ?? 0)} meal-active today`}
        />
        <Metric
          label="Inactive devices"
          value={formatNumber(overview.inactiveInstalls30d ?? 0)}
          sub="30d without server activity"
        />
      </section>

      <section className="grid metrics mt-4">
        {(overview.platforms ?? []).map((platform) => (
          <Metric
            key={platform.platform}
            label={`${platformLabel(platform.platform)} server-seen installs`}
            value={formatNumber(platform.installs)}
            sub={`${formatNumber(platform.activeInstallsToday)} active today · ${formatNumber(
              platform.activeInstalls7d,
            )} active 7d`}
          />
        ))}
        {(overview.platforms ?? []).map((platform) => (
          <Metric
            key={`${platform.platform}-ai`}
            label={`${platformLabel(platform.platform)} AI runs`}
            value={formatNumber(platform.aiRuns)}
            sub={`${formatNumber(platform.scans)} scans in last 30d · ${formatInr(
              platform.aiCostInr,
            )}`}
          />
        ))}
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
                  <td className="font-semibold">Install conversion</td>
                  <td className="muted">
                    Review anonymous installs, registered users, and scan behavior.
                  </td>
                  <td>
                    <Link className="badge" href="/conversions">
                      Open
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
          <div className="section-head">
            <div>
              <h2 className="text-xl font-bold">Scan funnel</h2>
              <p className="muted text-sm">
                Camera opens to confirmed meals; prepared sessions older than an hour are treated as
                abandoned
              </p>
            </div>
          </div>
          <div className="table-wrap">
            <table className="table table-compact">
              <thead>
                <tr>
                  <th>Stage</th>
                  <th>Today</th>
                  <th>Last 7 days</th>
                  <th>7d conversion</th>
                </tr>
              </thead>
              <tbody>
                {funnelStages(overview.scanFunnel).map((stage) => (
                  <tr key={stage.label}>
                    <td className="font-semibold">{stage.label}</td>
                    <td>{formatNumber(stage.today)}</td>
                    <td>{formatNumber(stage.last7d)}</td>
                    <td className="muted">{stage.conversion}</td>
                  </tr>
                ))}
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
              <div className="badge">{formatNumber(cost.overall.runsPerTenInr)} runs / Rs 10</div>
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
                  <td>
                    <div>{formatNumber(model.runs)}</div>
                    <div className="muted text-xs">{formatNumber(model.scans)} scans</div>
                  </td>
                  <td>{formatInr(model.costInr)}</td>
                  <td>{formatInr(model.averageRunCostInr)}</td>
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
          <div className="section-head">
            <div>
              <h2 className="text-xl font-bold">Platform activity</h2>
              <p className="muted text-sm">
                Daily first-seen devices, active devices, scans, and AI runs
              </p>
            </div>
          </div>
          <div className="table-wrap">
            <table className="table table-compact">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Platform</th>
                  <th>Active</th>
                  <th>First seen</th>
                  <th>Scans</th>
                  <th>AI</th>
                </tr>
              </thead>
              <tbody>
                {(overview.dailyPlatformActivity ?? []).slice(0, 14).map((day) => (
                  <tr key={`${day.date}-${day.platform}`}>
                    <td>{formatActivityDate(day.date)}</td>
                    <td>{platformLabel(day.platform)}</td>
                    <td>{formatNumber(day.activeInstalls)}</td>
                    <td>{formatNumber(day.installs)}</td>
                    <td>{formatNumber(day.scans)}</td>
                    <td>{formatNumber(day.aiRuns)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <h2 className="text-xl font-bold">Needs attention</h2>
          <div className="mt-4 grid gap-3">
            {attentionItems(overview, cost).map((item) => (
              <div className="panel-light rounded-lg p-3" key={item.title}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold">{item.title}</div>
                    <div className="muted text-xs">{item.detail}</div>
                  </div>
                  <div className="inline-controls">
                    <span className={item.ok ? "badge badge-green" : "badge badge-red"}>
                      {item.value}
                    </span>
                    {item.href ? (
                      <Link className="badge" href={item.href}>
                        Review
                      </Link>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="section-head">
            <h2 className="text-xl font-bold">App build mix</h2>
            <span className="muted text-sm">Server-seen devices by version</span>
          </div>
          <div className="table-wrap">
            <table className="table table-compact">
              <thead>
                <tr>
                  <th>Build</th>
                  <th>Platform</th>
                  <th>Devices</th>
                  <th>Active 7d</th>
                  <th>Last seen</th>
                </tr>
              </thead>
              <tbody>
                {(overview.appBuilds ?? []).map((build) => (
                  <tr key={`${build.platform}-${build.appVersion}-${build.appBuild}`}>
                    <td>
                      <div className="font-semibold">{build.appVersion}</div>
                      <div className="muted text-xs">Build {build.appBuild}</div>
                    </td>
                    <td>{platformLabel(build.platform)}</td>
                    <td>{formatNumber(build.installs)}</td>
                    <td>{formatNumber(build.activeInstalls7d)}</td>
                    <td>{build.lastSeenAt ? formatDate(build.lastSeenAt) : "None"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </AdminShell>
  );
}

function platformLabel(value: string | undefined) {
  if (value === "ios") return "iOS";
  if (value === "android") return "Android";
  return "Unknown";
}

function funnelStages(funnel: AdminOverview["scanFunnel"]) {
  const today = funnel?.today;
  const week = funnel?.last7d;
  const conversion = (value: number) =>
    week && week.started > 0 ? `${Math.round((value / week.started) * 100)}%` : "None";
  return [
    {
      label: "Camera sessions started",
      today: today?.started ?? 0,
      last7d: week?.started ?? 0,
      conversion: week && week.started > 0 ? "100%" : "None",
    },
    {
      label: "Photo analyzed",
      today: today?.analyzed ?? 0,
      last7d: week?.analyzed ?? 0,
      conversion: conversion(week?.analyzed ?? 0),
    },
    {
      label: "Ready for review",
      today: today?.readyForReview ?? 0,
      last7d: week?.readyForReview ?? 0,
      conversion: conversion(week?.readyForReview ?? 0),
    },
    {
      label: "Meal confirmed",
      today: today?.confirmed ?? 0,
      last7d: week?.confirmed ?? 0,
      conversion: conversion(week?.confirmed ?? 0),
    },
    {
      label: "Failed",
      today: today?.failed ?? 0,
      last7d: week?.failed ?? 0,
      conversion: conversion(week?.failed ?? 0),
    },
  ];
}

function attentionItems(overview: AdminOverview, cost: AiCostData) {
  const failedToday = overview.scanFunnel?.today.failed ?? 0;
  const istToday = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(
    new Date(),
  );
  const todayCost = cost.daily.find((day) => day.date === istToday)?.costInr ?? 0;
  const priorDays = cost.daily.filter((day) => day.date !== istToday).slice(-7);
  const priorAverage =
    priorDays.length > 0
      ? priorDays.reduce((sum, day) => sum + day.costInr, 0) / priorDays.length
      : 0;
  const successRate =
    cost.overall.runs > 0 ? cost.overall.successfulRuns / cost.overall.runs : null;

  return [
    {
      title: "Failed scans today",
      detail: "Model or pipeline failures since midnight IST.",
      value: formatNumber(failedToday),
      ok: failedToday === 0,
      href: "/scans?status=failed&sort=createdAt&direction=desc",
    },
    {
      title: "AI cost today",
      detail: `Prior 7-day daily average ${formatInr(priorAverage)}.`,
      value: formatInr(todayCost),
      ok: priorAverage === 0 || todayCost <= priorAverage * 1.5,
      href: "/cost",
    },
    {
      title: "AI success rate (30d)",
      detail: `${formatNumber(cost.overall.failedRuns)} failed of ${formatNumber(cost.overall.runs)} runs.`,
      value: successRate === null ? "None" : `${Math.round(successRate * 100)}%`,
      ok: successRate === null || successRate >= 0.95,
      href: "/scans?aiState=failed_ai&sort=createdAt&direction=desc",
    },
  ];
}

function formatActivityDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(`${value}T00:00:00+05:30`));
}
