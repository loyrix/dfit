import { AdminShell } from "../components/shell";
import {
  EmptyState,
  PageHeader,
  Pagination,
  ResultSummary,
  SortableHeader,
  formatDate,
  hrefWithParams,
  resolveTableState,
  type QueryParams,
} from "../components/ui";
import { adminGet, type AuditEntry, type PageInfo } from "../lib/api";

export const dynamic = "force-dynamic";

type AuditSearchParams = {
  query?: string;
  actor?: string;
  action?: string;
  targetType?: string;
  from?: string;
  to?: string;
  page?: string;
  pageSize?: string;
  sort?: string;
  direction?: string;
};

export default async function AuditPage({
  searchParams,
}: {
  searchParams?: Promise<AuditSearchParams>;
}) {
  const params = auditParams((await searchParams) ?? {});
  const query = toApiQuery(params);
  const { entries, pageInfo } = await adminGet<{ entries: AuditEntry[]; pageInfo?: PageInfo }>(
    `/admin/audit-log?${query}`,
  );
  const { rows: visibleEntries, pageInfo: effectivePageInfo } = resolveTableState(
    entries,
    pageInfo,
    params,
    {
      defaultPageSize: 50,
      defaultSort: "createdAt",
      sorters: {
        action: (entry) => entry.action,
        actor: (entry) => entry.actor,
        createdAt: (entry) => new Date(entry.createdAt),
        targetType: (entry) => entry.targetType,
      },
    },
  );

  return (
    <AdminShell>
      <PageHeader
        eyebrow="Safety"
        title="Audit log"
        description="Every support grant and runtime configuration mutation is recorded with actor, target, reason, and before/after state."
      />

      <form className="toolbar toolbar-four" action="/audit">
        <input name="page" type="hidden" value="1" />
        <label>
          <span className="metric-label">Search</span>
          <input
            className="input"
            name="query"
            placeholder="Actor, action, target id, or reason"
            defaultValue={params.query ?? ""}
          />
        </label>
        <label>
          <span className="metric-label">Actor</span>
          <input className="input" name="actor" defaultValue={params.actor ?? ""} />
        </label>
        <label>
          <span className="metric-label">Action</span>
          <input className="input" name="action" defaultValue={params.action ?? ""} />
        </label>
        <label>
          <span className="metric-label">Target</span>
          <input className="input" name="targetType" defaultValue={params.targetType ?? ""} />
        </label>
        <label>
          <span className="metric-label">Rows</span>
          <select className="select" name="pageSize" defaultValue={params.pageSize ?? "50"}>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </label>
        <button className="button" type="submit">
          Apply
        </button>
      </form>

      <form className="toolbar toolbar-two" action="/audit">
        {Object.entries(params)
          .filter(([key, value]) => value && !["from", "to", "page"].includes(key))
          .map(([key, value]) => (
            <input key={key} name={key} type="hidden" value={value} />
          ))}
        <input name="page" type="hidden" value="1" />
        <label>
          <span className="metric-label">From</span>
          <input className="input" name="from" type="date" defaultValue={params.from ?? ""} />
        </label>
        <label>
          <span className="metric-label">To</span>
          <input className="input" name="to" type="date" defaultValue={params.to ?? ""} />
        </label>
        <button className="button button-secondary" type="submit">
          Set date range
        </button>
      </form>

      <section className="panel">
        <div className="section-head">
          <h2 className="text-xl font-bold">Admin events</h2>
          <ResultSummary pageInfo={effectivePageInfo} noun="events" />
        </div>
        <div className="table-wrap">
          <table className="table table-compact">
            <thead>
              <tr>
                <th>
                  <SortableHeader
                    basePath="/audit"
                    params={params}
                    pageInfo={effectivePageInfo}
                    sort="createdAt"
                  >
                    Time
                  </SortableHeader>
                </th>
                <th>
                  <SortableHeader
                    basePath="/audit"
                    params={params}
                    pageInfo={effectivePageInfo}
                    sort="actor"
                  >
                    Actor
                  </SortableHeader>
                </th>
                <th>
                  <SortableHeader
                    basePath="/audit"
                    params={params}
                    pageInfo={effectivePageInfo}
                    sort="action"
                  >
                    Action
                  </SortableHeader>
                </th>
                <th>
                  <SortableHeader
                    basePath="/audit"
                    params={params}
                    pageInfo={effectivePageInfo}
                    sort="targetType"
                  >
                    Target
                  </SortableHeader>
                </th>
                <th>Reason</th>
                <th>State</th>
              </tr>
            </thead>
            <tbody>
              {visibleEntries.map((entry) => (
                <tr key={entry.id}>
                  <td>{formatDate(entry.createdAt)}</td>
                  <td>{entry.actor}</td>
                  <td>
                    <div className="font-semibold">{entry.action}</div>
                    <a
                      className="muted text-xs"
                      href={hrefWithParams("/audit", params, { action: entry.action, page: "1" })}
                    >
                      Filter action
                    </a>
                  </td>
                  <td>
                    <div>{entry.targetType}</div>
                    <div className="muted break-cell text-xs">{entry.targetId ?? "none"}</div>
                  </td>
                  <td className="break-cell">{entry.reason ?? "None"}</td>
                  <td>
                    <details>
                      <summary className="muted cursor-pointer text-xs">Before / after</summary>
                      <pre className="code-block mt-2 max-h-[320px] overflow-auto">
                        {JSON.stringify({ before: entry.before, after: entry.after }, null, 2)}
                      </pre>
                    </details>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {visibleEntries.length === 0 ? (
            <EmptyState title="No audit entries matched" body="Try loosening the filters." />
          ) : null}
        </div>
        <Pagination basePath="/audit" params={params} pageInfo={effectivePageInfo} />
      </section>
    </AdminShell>
  );
}

function auditParams(params: AuditSearchParams): QueryParams {
  return {
    query: params.query,
    actor: params.actor,
    action: params.action,
    targetType: params.targetType,
    from: params.from,
    to: params.to,
    page: params.page ?? "1",
    pageSize: params.pageSize ?? "50",
    sort: params.sort ?? "createdAt",
    direction: params.direction ?? "desc",
  };
}

function toApiQuery(params: QueryParams) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (!value) continue;
    query.set(key, value);
  }
  return query;
}
