import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { SqlClient } from "../db/client.js";

const usdToInr = Number(process.env.AI_COST_USD_TO_INR ?? 95.4);

type AiCostData = {
  generatedAt: string;
  days: number;
  usdToInr: number;
  pricingSource: string;
  overall: AiCostOverall;
  daily: DailyAiCost[];
  models: ModelAiCost[];
  recentRuns: RecentAiRun[];
};

type AiCostOverall = {
  scans: number;
  successfulScans: number;
  failedRuns: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  costUsd: number;
  costInr: number;
  averageCostInr: number;
  scansPerTenInr: number;
  averageLatencyMs: number | null;
  averageConfidence: number | null;
};

type DailyAiCost = {
  date: string;
  scans: number;
  inputTokens: number;
  outputTokens: number;
  costInr: number;
  averageCostInr: number;
};

type ModelAiCost = {
  provider: string;
  model: string;
  scans: number;
  inputTokens: number;
  outputTokens: number;
  costInr: number;
  averageCostInr: number;
  scansPerTenInr: number;
};

type RecentAiRun = {
  createdAt: string;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costInr: number;
  latencyMs: number | null;
  confidence: number | null;
  success: boolean;
};

type OverallRow = {
  scans: number | string | null;
  successful_scans: number | string | null;
  failed_runs: number | string | null;
  input_tokens: number | string | null;
  output_tokens: number | string | null;
  cost_usd: number | string | null;
  average_latency_ms: number | string | null;
  average_confidence: number | string | null;
};

type DailyRow = {
  date: string;
  scans: number | string | null;
  input_tokens: number | string | null;
  output_tokens: number | string | null;
  cost_usd: number | string | null;
};

type ModelRow = DailyRow & {
  provider: string;
  model: string;
};

type RecentRunRow = {
  created_at: string;
  provider: string;
  model: string;
  input_tokens: number | string | null;
  output_tokens: number | string | null;
  cost_usd: number | string | null;
  latency_ms: number | string | null;
  confidence: number | string | null;
  success: boolean;
};

export const registerAdminRoutes = async (app: FastifyInstance, sql?: SqlClient): Promise<void> => {
  app.get("/admin/ai-cost", { preHandler: requireAdmin }, async (_request, reply) => {
    return reply.type("text/html").send(renderAiCostDashboardHtml());
  });

  app.get("/admin/ai-cost/data", { preHandler: requireAdmin }, async (request, reply) => {
    if (!sql) {
      return reply.status(503).send({ error: "database_unavailable" });
    }

    const query = request.query as { days?: string };
    const days = clampDays(query.days);
    const data = await loadAiCostData(sql, days);
    return reply.send(data);
  });
};

const requireAdmin = async (request: FastifyRequest, reply: FastifyReply) => {
  const credentials = getAdminCredentials();
  if (!credentials) {
    return reply.status(404).send({ error: "admin_dashboard_disabled" });
  }

  const requestCredentials = extractBasicCredentials(request.headers.authorization);
  if (
    requestCredentials?.username !== credentials.username ||
    requestCredentials.password !== credentials.password
  ) {
    reply.header("www-authenticate", 'Basic realm="LogMyPlate Admin"');
    return reply.status(401).send({ error: "admin_required" });
  }
};

const getAdminCredentials = (): { username: string; password: string } | undefined => {
  const username = process.env.ADMIN_DASHBOARD_USERNAME?.trim();
  const password = process.env.ADMIN_DASHBOARD_PASSWORD?.trim();
  if (!username || !password) return undefined;
  return { username, password };
};

const extractBasicCredentials = (
  authorization: string | undefined,
): { username: string; password: string } | undefined => {
  if (!authorization) return undefined;
  const [scheme, credentials] = authorization.split(" ");
  if (!scheme || !credentials) return undefined;
  if (scheme.toLowerCase() !== "basic") return undefined;

  const decoded = Buffer.from(credentials, "base64").toString("utf8");
  const separatorIndex = decoded.indexOf(":");
  if (separatorIndex === -1) return undefined;

  return {
    username: decoded.slice(0, separatorIndex),
    password: decoded.slice(separatorIndex + 1),
  };
};

const clampDays = (value: string | undefined): number => {
  const parsed = Number(value ?? 30);
  if (!Number.isFinite(parsed)) return 30;
  return Math.max(1, Math.min(366, Math.floor(parsed)));
};

const loadAiCostData = async (sql: SqlClient, days: number): Promise<AiCostData> => {
  const [overall] = await sql<OverallRow[]>`
    with priced_runs as (
      select
        run.*,
        coalesce(prediction.total_confidence, null) as confidence,
        coalesce(
          run.estimated_cost_usd,
          (
            coalesce(run.input_token_estimate, 0) * ${inputRateSql(sql)} +
            coalesce(run.output_token_estimate, 0) * ${outputRateSql(sql)}
          ) / 1000000.0
        ) as calculated_cost_usd
      from ai_provider_runs run
      left join lateral (
        select total_confidence
        from ai_predictions
        where ai_predictions.provider_run_id = run.id
        order by ai_predictions.created_at desc
        limit 1
      ) prediction on true
      where run.created_at >= now() - (${days}::int * interval '1 day')
    )
    select
      count(*)::int as scans,
      count(*) filter (where success)::int as successful_scans,
      count(*) filter (where not success)::int as failed_runs,
      coalesce(sum(input_token_estimate), 0)::bigint as input_tokens,
      coalesce(sum(output_token_estimate), 0)::bigint as output_tokens,
      coalesce(sum(calculated_cost_usd), 0)::numeric as cost_usd,
      avg(latency_ms)::numeric as average_latency_ms,
      avg(confidence)::numeric as average_confidence
    from priced_runs
  `;

  const dailyRows = await sql<DailyRow[]>`
    with priced_runs as (
      select
        date_trunc('day', created_at)::date as date,
        input_token_estimate,
        output_token_estimate,
        coalesce(
          estimated_cost_usd,
          (
            coalesce(input_token_estimate, 0) * ${inputRateSql(sql)} +
            coalesce(output_token_estimate, 0) * ${outputRateSql(sql)}
          ) / 1000000.0
        ) as calculated_cost_usd
      from ai_provider_runs
      where created_at >= now() - (${days}::int * interval '1 day')
    )
    select
      date::text,
      count(*)::int as scans,
      coalesce(sum(input_token_estimate), 0)::bigint as input_tokens,
      coalesce(sum(output_token_estimate), 0)::bigint as output_tokens,
      coalesce(sum(calculated_cost_usd), 0)::numeric as cost_usd
    from priced_runs
    group by date
    order by date
  `;

  const modelRows = await sql<ModelRow[]>`
    with priced_runs as (
      select
        provider,
        model,
        input_token_estimate,
        output_token_estimate,
        coalesce(
          estimated_cost_usd,
          (
            coalesce(input_token_estimate, 0) * ${inputRateSql(sql)} +
            coalesce(output_token_estimate, 0) * ${outputRateSql(sql)}
          ) / 1000000.0
        ) as calculated_cost_usd
      from ai_provider_runs
      where created_at >= now() - (${days}::int * interval '1 day')
    )
    select
      provider,
      model,
      count(*)::int as scans,
      coalesce(sum(input_token_estimate), 0)::bigint as input_tokens,
      coalesce(sum(output_token_estimate), 0)::bigint as output_tokens,
      coalesce(sum(calculated_cost_usd), 0)::numeric as cost_usd,
      current_date::text as date
    from priced_runs
    group by provider, model
    order by cost_usd desc
  `;

  const recentRows = await sql<RecentRunRow[]>`
    select
      run.created_at::text,
      run.provider,
      run.model,
      coalesce(run.input_token_estimate, 0)::bigint as input_tokens,
      coalesce(run.output_token_estimate, 0)::bigint as output_tokens,
      coalesce(
        run.estimated_cost_usd,
        (
          coalesce(run.input_token_estimate, 0) * ${inputRateSql(sql)} +
          coalesce(run.output_token_estimate, 0) * ${outputRateSql(sql)}
        ) / 1000000.0
      )::numeric as cost_usd,
      run.latency_ms,
      prediction.total_confidence as confidence,
      run.success
    from ai_provider_runs run
    left join lateral (
      select total_confidence
      from ai_predictions
      where ai_predictions.provider_run_id = run.id
      order by ai_predictions.created_at desc
      limit 1
    ) prediction on true
    order by run.created_at desc
    limit 20
  `;

  const mappedOverall = mapOverall(overall);

  return {
    generatedAt: new Date().toISOString(),
    days,
    usdToInr,
    pricingSource:
      "Gemini token pricing catalog in API route, falling back to stored estimated_cost_usd when present.",
    overall: mappedOverall,
    daily: dailyRows.map(mapDailyRow),
    models: modelRows.map(mapModelRow),
    recentRuns: recentRows.map(mapRecentRunRow),
  };
};

const inputRateSql = (sql: SqlClient) => sql`
  case
    when model = 'gemini-2.5-flash-lite' then 0.10
    when model = 'gemini-2.5-flash' then 0.30
    when model = 'gemini-2.5-pro' then 1.25
    else 0
  end
`;

const outputRateSql = (sql: SqlClient) => sql`
  case
    when model = 'gemini-2.5-flash-lite' then 0.40
    when model = 'gemini-2.5-flash' then 2.50
    when model = 'gemini-2.5-pro' then 10.00
    else 0
  end
`;

const mapOverall = (row: OverallRow | undefined): AiCostOverall => {
  const scans = numberValue(row?.scans);
  const costUsd = numberValue(row?.cost_usd);
  const inputTokens = numberValue(row?.input_tokens);
  const outputTokens = numberValue(row?.output_tokens);
  const costInr = costUsd * usdToInr;
  const averageCostInr = scans === 0 ? 0 : costInr / scans;

  return {
    scans,
    successfulScans: numberValue(row?.successful_scans),
    failedRuns: numberValue(row?.failed_runs),
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
    costUsd,
    costInr,
    averageCostInr,
    scansPerTenInr: averageCostInr === 0 ? 0 : 10 / averageCostInr,
    averageLatencyMs: nullableNumberValue(row?.average_latency_ms),
    averageConfidence: nullableNumberValue(row?.average_confidence),
  };
};

const mapDailyRow = (row: DailyRow): DailyAiCost => {
  const scans = numberValue(row.scans);
  const costInr = numberValue(row.cost_usd) * usdToInr;
  return {
    date: row.date,
    scans,
    inputTokens: numberValue(row.input_tokens),
    outputTokens: numberValue(row.output_tokens),
    costInr,
    averageCostInr: scans === 0 ? 0 : costInr / scans,
  };
};

const mapModelRow = (row: ModelRow): ModelAiCost => {
  const scans = numberValue(row.scans);
  const costInr = numberValue(row.cost_usd) * usdToInr;
  const averageCostInr = scans === 0 ? 0 : costInr / scans;
  return {
    provider: row.provider,
    model: row.model,
    scans,
    inputTokens: numberValue(row.input_tokens),
    outputTokens: numberValue(row.output_tokens),
    costInr,
    averageCostInr,
    scansPerTenInr: averageCostInr === 0 ? 0 : 10 / averageCostInr,
  };
};

const mapRecentRunRow = (row: RecentRunRow): RecentAiRun => ({
  createdAt: row.created_at,
  provider: row.provider,
  model: row.model,
  inputTokens: numberValue(row.input_tokens),
  outputTokens: numberValue(row.output_tokens),
  costInr: numberValue(row.cost_usd) * usdToInr,
  latencyMs: nullableNumberValue(row.latency_ms),
  confidence: nullableNumberValue(row.confidence),
  success: row.success,
});

const numberValue = (value: number | string | null | undefined): number => Number(value ?? 0);

const nullableNumberValue = (value: number | string | null | undefined): number | null => {
  if (value === null || value === undefined) return null;
  return Number(value);
};

const renderAiCostDashboardHtml = () => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>LogMyPlate AI Cost Dashboard</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f7f5ef;
        --panel: #fffdf8;
        --ink: #20201d;
        --muted: #6f6a60;
        --line: #ded7ca;
        --accent: #23c273;
        --accent-ink: #07391f;
        --warn: #b45309;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: var(--bg);
        color: var(--ink);
        font: 14px/1.45 Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      main { max-width: 1180px; margin: 0 auto; padding: 28px 20px 48px; }
      header {
        display: flex;
        align-items: end;
        justify-content: space-between;
        gap: 18px;
        margin-bottom: 22px;
      }
      h1 { margin: 0; font-size: 26px; letter-spacing: 0; }
      p { margin: 4px 0 0; color: var(--muted); }
      select {
        min-width: 150px;
        padding: 10px 12px;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: var(--panel);
        color: var(--ink);
        font: inherit;
      }
      .grid { display: grid; gap: 14px; }
      .metrics { grid-template-columns: repeat(4, minmax(0, 1fr)); }
      .card {
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: 8px;
        padding: 16px;
      }
      .label { color: var(--muted); font-size: 12px; text-transform: uppercase; letter-spacing: .08em; }
      .value { margin-top: 8px; font-size: 26px; font-weight: 750; }
      .sub { margin-top: 4px; color: var(--muted); }
      .split { grid-template-columns: minmax(0, 1.4fr) minmax(320px, .8fr); margin-top: 14px; }
      canvas { width: 100%; height: 280px; display: block; }
      table { width: 100%; border-collapse: collapse; }
      th, td { padding: 11px 8px; border-bottom: 1px solid var(--line); text-align: left; white-space: nowrap; }
      th { color: var(--muted); font-size: 12px; font-weight: 650; }
      td:last-child, th:last-child { text-align: right; }
      .ok { color: #047857; }
      .bad { color: var(--warn); }
      .section-title { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom: 10px; }
      .section-title h2 { margin: 0; font-size: 17px; }
      .note { color: var(--muted); font-size: 12px; }
      @media (max-width: 860px) {
        header { align-items: stretch; flex-direction: column; }
        .metrics, .split { grid-template-columns: 1fr; }
        table { font-size: 12px; }
      }
    </style>
  </head>
  <body>
    <main>
      <header>
        <div>
          <h1>AI Cost Dashboard</h1>
          <p>Token spend, INR cost, scan count, and scans purchasable per ₹10.</p>
        </div>
        <select id="days">
          <option value="7">Last 7 days</option>
          <option value="30" selected>Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="365">Last 365 days</option>
        </select>
      </header>

      <section class="grid metrics" id="metrics"></section>

      <section class="grid split">
        <div class="card">
          <div class="section-title">
            <h2>Daily Spend</h2>
            <span class="note" id="chartNote"></span>
          </div>
          <canvas id="costChart" width="900" height="280"></canvas>
        </div>
        <div class="card">
          <div class="section-title">
            <h2>Model Mix</h2>
            <span class="note">by INR cost</span>
          </div>
          <div id="models"></div>
        </div>
      </section>

      <section class="card" style="margin-top:14px">
        <div class="section-title">
          <h2>Recent Runs</h2>
          <span class="note" id="generatedAt"></span>
        </div>
        <div id="recentRuns"></div>
      </section>
    </main>

    <script>
      const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });
      const whole = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
      const decimal = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });

      const formatPercent = (value) => value == null ? "—" : decimal.format(value * 100) + "%";
      const formatMs = (value) => value == null ? "—" : whole.format(value) + " ms";

      async function load() {
        const days = document.getElementById("days").value;
        const response = await fetch("/admin/ai-cost/data?days=" + encodeURIComponent(days));
        if (!response.ok) {
          document.getElementById("metrics").innerHTML =
            '<div class="card"><div class="value bad">Unable to load</div><div class="sub">Status ' + response.status + '</div></div>';
          return;
        }
        const data = await response.json();
        renderMetrics(data);
        renderChart(data.daily);
        renderModels(data.models);
        renderRecentRuns(data.recentRuns);
        document.getElementById("chartNote").textContent = data.days + " days · ₹" + data.usdToInr + " / $";
        document.getElementById("generatedAt").textContent = "Updated " + new Date(data.generatedAt).toLocaleString();
      }

      function renderMetrics(data) {
        const m = data.overall;
        const cards = [
          ["Total AI Cost", inr.format(m.costInr), "$" + decimal.format(m.costUsd)],
          ["Avg Cost / Scan", inr.format(m.averageCostInr), whole.format(m.scans) + " runs"],
          ["Scans in ₹10", decimal.format(m.scansPerTenInr), "at current avg cost"],
          ["Tokens Used", whole.format(m.totalTokens), whole.format(m.inputTokens) + " in · " + whole.format(m.outputTokens) + " out"],
          ["Success", whole.format(m.successfulScans), whole.format(m.failedRuns) + " failed runs"],
          ["Avg Confidence", formatPercent(m.averageConfidence), "AI prediction score"],
          ["Avg Latency", formatMs(m.averageLatencyMs), "provider response time"],
          ["Daily Avg Cost", inr.format(m.costInr / Math.max(data.days, 1)), "selected window"],
        ];
        document.getElementById("metrics").innerHTML = cards.map(([label, value, sub]) =>
          '<div class="card"><div class="label">' + label + '</div><div class="value">' + value + '</div><div class="sub">' + sub + '</div></div>'
        ).join("");
      }

      function renderChart(rows) {
        const canvas = document.getElementById("costChart");
        const ctx = canvas.getContext("2d");
        const width = canvas.width;
        const height = canvas.height;
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = "#fffdf8";
        ctx.fillRect(0, 0, width, height);

        if (rows.length === 0) {
          ctx.fillStyle = "#6f6a60";
          ctx.font = "16px system-ui";
          ctx.fillText("No AI runs in this period", 24, 42);
          return;
        }

        const pad = 34;
        const maxCost = Math.max(...rows.map((row) => row.costInr), 1);
        const barWidth = Math.max(4, (width - pad * 2) / rows.length - 4);
        ctx.strokeStyle = "#ded7ca";
        ctx.beginPath();
        ctx.moveTo(pad, height - pad);
        ctx.lineTo(width - pad, height - pad);
        ctx.stroke();

        rows.forEach((row, index) => {
          const x = pad + index * ((width - pad * 2) / rows.length) + 2;
          const barHeight = (row.costInr / maxCost) * (height - pad * 2);
          const y = height - pad - barHeight;
          ctx.fillStyle = "#23c273";
          ctx.fillRect(x, y, barWidth, barHeight);
        });

        ctx.fillStyle = "#6f6a60";
        ctx.font = "13px system-ui";
        ctx.fillText("₹" + decimal.format(maxCost), pad, 18);
        ctx.fillText(rows[0].date, pad, height - 8);
        ctx.textAlign = "right";
        ctx.fillText(rows[rows.length - 1].date, width - pad, height - 8);
        ctx.textAlign = "left";
      }

      function renderModels(rows) {
        if (rows.length === 0) {
          document.getElementById("models").innerHTML = '<p>No model usage yet.</p>';
          return;
        }
        document.getElementById("models").innerHTML =
          '<table><thead><tr><th>Model</th><th>Runs</th><th>Avg</th><th>₹10</th></tr></thead><tbody>' +
          rows.map((row) =>
            '<tr><td>' + row.model + '<div class="note">' + row.provider + '</div></td><td>' + whole.format(row.scans) +
            '</td><td>' + inr.format(row.averageCostInr) + '</td><td>' + decimal.format(row.scansPerTenInr) + '</td></tr>'
          ).join("") +
          '</tbody></table>';
      }

      function renderRecentRuns(rows) {
        if (rows.length === 0) {
          document.getElementById("recentRuns").innerHTML = '<p>No recent AI runs.</p>';
          return;
        }
        document.getElementById("recentRuns").innerHTML =
          '<table><thead><tr><th>Time</th><th>Model</th><th>Tokens</th><th>Confidence</th><th>Latency</th><th>Cost</th></tr></thead><tbody>' +
          rows.map((row) =>
            '<tr><td>' + new Date(row.createdAt).toLocaleString() + '</td><td>' + row.model +
            '<div class="note ' + (row.success ? "ok" : "bad") + '">' + (row.success ? "success" : "failed") + '</div></td><td>' +
            whole.format(row.inputTokens + row.outputTokens) + '<div class="note">' + whole.format(row.inputTokens) + ' in · ' + whole.format(row.outputTokens) +
            ' out</div></td><td>' + formatPercent(row.confidence) + '</td><td>' + formatMs(row.latencyMs) + '</td><td>' + inr.format(row.costInr) + '</td></tr>'
          ).join("") +
          '</tbody></table>';
      }

      document.getElementById("days").addEventListener("change", load);
      load();
    </script>
  </body>
</html>`;
