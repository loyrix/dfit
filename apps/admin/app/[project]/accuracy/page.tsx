import Link from "next/link";
import { AdminShell } from "../../components/shell";
import {
  Badge,
  EmptyState,
  Metric,
  PageHeader,
  formatDate,
  formatNumber,
} from "../../components/ui";
import { adminGet, type AdminScanAccuracy } from "../../lib/api";

export const dynamic = "force-dynamic";

type AccuracySearchParams = {
  windowDays?: string;
};

/**
 * `user_edited` was written as a constant `true` for every item before this
 * date, so edit rates that include earlier meals are meaningless. Surfaced in
 * the UI rather than silently filtered, so the number is never read as real.
 */
const EDIT_TRACKING_START = "2026-08-01";

export default async function ScanAccuracyPage({
  searchParams,
}: {
  searchParams?: Promise<AccuracySearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const windowDays = normalizeWindow(params.windowDays);
  const data = await adminGet<AdminScanAccuracy>(`/admin/scan-accuracy?windowDays=${windowDays}`);
  const { summary, thresholds, outlierItems, heavyMeals, recentCorrections } = data;

  const editTrackingLive = new Date() >= new Date(EDIT_TRACKING_START);
  const editRateReliable = editTrackingLive && summary.correctedScans > 0;

  return (
    <AdminShell>
      <PageHeader
        eyebrow="AI Quality"
        title="Scan Accuracy"
        description="How often users correct the AI before confirming, plus the portion estimates that are almost certainly wrong. Use this to tell whether a prompt change actually helped."
      />

      <form className="toolbar mt-4" action="/accuracy">
        <label>
          <span className="metric-label">Window</span>
          <select className="select" name="windowDays" defaultValue={String(windowDays)}>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
        </label>
        <button className="button" type="submit">
          Apply
        </button>
      </form>

      <section className="grid metrics mt-4">
        <Metric
          label="AI-scanned items"
          value={formatNumber(summary.aiItems)}
          sub={`${formatNumber(summary.aiMeals)} meals · last ${summary.windowDays} days`}
        />
        <Metric
          label="Items corrected by users"
          value={editRateReliable ? formatPercent(summary.editRate) : "Not yet measurable"}
          sub={
            editRateReliable
              ? `${formatNumber(summary.editedItems)} of ${formatNumber(summary.aiItems)} items`
              : `Edit tracking starts ${EDIT_TRACKING_START} — earlier rows were all flagged true`
          }
        />
        <Metric
          label="Scans with corrections"
          value={formatNumber(summary.correctedScans)}
          sub="Distinct scans where the user changed something"
        />
        <Metric
          label="Portion outliers"
          value={formatNumber(outlierItems.length)}
          sub={`Items over ${formatNumber(thresholds.calorieThreshold)} kcal or ${formatNumber(thresholds.gramThreshold)} g`}
        />
      </section>

      <section className="grid metrics mt-4">
        <Metric
          label="Items the user added"
          value={formatNumber(summary.itemsAdded)}
          sub="AI missed these"
        />
        <Metric
          label="Items the user deleted"
          value={formatNumber(summary.itemsRemoved)}
          sub="AI saw food that was not there"
        />
        <Metric
          label="Items the user adjusted"
          value={formatNumber(summary.itemsChanged)}
          sub="Portion or nutrition was wrong"
        />
      </section>

      <section className="panel mt-4">
        <div className="section-head">
          <h2 className="text-xl font-bold">Portion outliers</h2>
          <span className="muted text-sm">
            Single items over {formatNumber(thresholds.calorieThreshold)} kcal or{" "}
            {formatNumber(thresholds.gramThreshold)} g
          </span>
        </div>
        {outlierItems.length === 0 ? (
          <EmptyState
            title="No portion outliers in this window"
            body="Nothing exceeded the implausibility thresholds."
          />
        ) : (
          <div className="table-wrap">
            <table className="table table-compact">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Calories</th>
                  <th>Grams</th>
                  <th>Flagged for</th>
                  <th>Corrected?</th>
                  <th>Logged</th>
                  <th>Scan</th>
                </tr>
              </thead>
              <tbody>
                {outlierItems.map((item, index) => (
                  <tr key={`${item.mealId}-${index}`}>
                    <td>{item.name}</td>
                    <td>{item.calories === null ? "—" : formatNumber(item.calories)}</td>
                    <td>{item.grams === null ? "—" : formatNumber(item.grams)}</td>
                    <td>
                      <Badge tone={item.reason === "calories" ? "red" : "default"}>
                        {item.reason}
                      </Badge>
                    </td>
                    <td>
                      <Badge tone={item.userEdited ? "green" : "default"}>
                        {item.userEdited ? "Yes" : "No"}
                      </Badge>
                    </td>
                    <td>{formatDate(item.loggedAt)}</td>
                    <td>
                      {item.scanId ? (
                        <Link className="badge" href={`/scans?scanId=${item.scanId}`}>
                          Inspect
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel mt-4">
        <div className="section-head">
          <h2 className="text-xl font-bold">Implausible meals</h2>
          <span className="muted text-sm">
            Meals totalling over {formatNumber(thresholds.mealCalorieThreshold)} kcal
          </span>
        </div>
        {heavyMeals.length === 0 ? (
          <EmptyState title="No implausible meal totals in this window" />
        ) : (
          <div className="table-wrap">
            <table className="table table-compact">
              <thead>
                <tr>
                  <th>Meal</th>
                  <th>Total calories</th>
                  <th>Logged</th>
                </tr>
              </thead>
              <tbody>
                {heavyMeals.map((meal) => (
                  <tr key={meal.mealId}>
                    <td>{meal.title}</td>
                    <td>{formatNumber(meal.calories)}</td>
                    <td>{formatDate(meal.loggedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel mt-4">
        <div className="section-head">
          <h2 className="text-xl font-bold">Recent corrections</h2>
          <span className="muted text-sm">What users changed before confirming</span>
        </div>
        {recentCorrections.length === 0 ? (
          <EmptyState
            title="No corrections recorded yet"
            body="Corrections are captured from the confirm step. If this stays empty after users log meals, check the confirm route."
          />
        ) : (
          <div className="table-wrap">
            <table className="table table-compact">
              <thead>
                <tr>
                  <th>Kind</th>
                  <th>Before</th>
                  <th>After</th>
                  <th>When</th>
                  <th>Scan</th>
                </tr>
              </thead>
              <tbody>
                {recentCorrections.map((correction, index) => (
                  <tr key={`${correction.scanId}-${index}`}>
                    <td>
                      <Badge tone={correctionTone(correction.kind)}>
                        {correction.kind.replace("item_", "")}
                      </Badge>
                    </td>
                    <td className="muted text-sm">{describeItem(correction.before)}</td>
                    <td className="text-sm">{describeItem(correction.after)}</td>
                    <td>{formatDate(correction.createdAt)}</td>
                    <td>
                      {correction.scanId ? (
                        <Link className="badge" href={`/scans?scanId=${correction.scanId}`}>
                          Inspect
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AdminShell>
  );
}

function normalizeWindow(value: string | undefined): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 30;
  return Math.min(365, Math.max(1, Math.floor(parsed)));
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function correctionTone(kind: string): string {
  if (kind === "item_removed") return "red";
  if (kind === "item_added") return "green";
  return "default";
}

/** Renders a correction snapshot compactly; shape is intentionally loose. */
function describeItem(value: unknown): string {
  if (!value || typeof value !== "object") return "—";
  const item = value as {
    name?: string;
    quantity?: number;
    unit?: string;
    grams?: number;
    calories?: number;
    changedFields?: string[];
  };
  if (!item.name) return "—";

  const parts = [item.name];
  if (item.quantity !== undefined && item.unit) parts.push(`${item.quantity} ${item.unit}`);
  if (item.grams !== undefined) parts.push(`${item.grams}g`);
  if (item.calories !== undefined) parts.push(`${item.calories} kcal`);
  if (item.changedFields?.length) parts.push(`(${item.changedFields.join(", ")})`);
  return parts.join(" · ");
}
