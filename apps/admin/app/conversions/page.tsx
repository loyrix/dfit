import Link from "next/link";
import { AdminShell } from "../components/shell";
import {
  Badge,
  EmptyState,
  Metric,
  PageHeader,
  Pagination,
  ResultSummary,
  SortableHeader,
  formatDate,
  formatNumber,
  hrefWithParams,
  personLabel,
  resolveTableState,
  shortId,
  type QueryParams,
} from "../components/ui";
import {
  adminGet,
  type AdminConversionInstall,
  type AdminConversionSummary,
  type PageInfo,
} from "../lib/api";

export const dynamic = "force-dynamic";

type ConversionsSearchParams = {
  query?: string;
  platform?: string;
  status?: string;
  page?: string;
  pageSize?: string;
  sort?: string;
  direction?: string;
};

export default async function ConversionsPage({
  searchParams,
}: {
  searchParams?: Promise<ConversionsSearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const listParams = conversionListParams(params);
  const apiQuery = toApiQuery(listParams);
  const { summary, installs, pageInfo } = await adminGet<{
    summary: AdminConversionSummary;
    installs: AdminConversionInstall[];
    pageInfo?: PageInfo;
  }>(`/admin/conversions?${apiQuery}`);

  const { rows: visibleInstalls, pageInfo: effectivePageInfo } = resolveTableState(
    installs,
    pageInfo,
    listParams,
    {
      defaultPageSize: 50,
      defaultSort: "updatedAt",
      sorters: {
        authMethod: (install) => install.authMethod,
        createdAt: (install) => new Date(install.createdAt),
        displayName: (install) => install.displayName ?? install.email ?? install.installId,
        email: (install) => install.email ?? install.installId,
        linkedAt: (install) => (install.linkedAt ? new Date(install.linkedAt) : null),
        meals: (install) => install.stats.meals,
        platform: (install) => install.platform,
        scans: (install) => install.stats.scans,
        updatedAt: (install) => new Date(install.updatedAt),
      },
    },
  );

  return (
    <AdminShell>
      <PageHeader
        eyebrow="Growth"
        title="Conversion"
        description="Track server-seen installs, registered accounts, anonymous users, and the activity that leads to account creation."
      />

      <section className="grid metrics">
        <Metric
          label="Installs"
          value={formatNumber(summary.totalInstalls)}
          sub="server-seen devices"
        />
        <Metric
          label="Registered"
          value={formatNumber(summary.registeredInstalls)}
          sub={`${formatNumber(summary.registrationRate)}% conversion`}
        />
        <Metric
          label="Anonymous"
          value={formatNumber(summary.anonymousInstalls)}
          sub="not linked to Apple, Google, or email"
        />
        <Metric
          label="Current rows"
          value={formatNumber(effectivePageInfo.total)}
          sub="after filters"
        />
      </section>

      <form className="toolbar toolbar-two mt-4" action="/conversions">
        <input name="page" type="hidden" value="1" />
        <label>
          <span className="metric-label">Search</span>
          <input
            className="input"
            name="query"
            placeholder="Name, email, install id, profile id, app version, timezone, region"
            defaultValue={listParams.query ?? ""}
          />
        </label>
        <label>
          <span className="metric-label">Platform</span>
          <select className="select" name="platform" defaultValue={listParams.platform ?? "all"}>
            <option value="all">All platforms</option>
            <option value="ios">iOS</option>
            <option value="android">Android</option>
          </select>
        </label>
        <label>
          <span className="metric-label">Status</span>
          <select className="select" name="status" defaultValue={listParams.status ?? "all"}>
            <option value="all">All installs</option>
            <option value="registered">Registered</option>
            <option value="anonymous">Anonymous</option>
          </select>
        </label>
        <label>
          <span className="metric-label">Rows</span>
          <select className="select" name="pageSize" defaultValue={listParams.pageSize ?? "50"}>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </label>
        <button className="button" type="submit">
          Apply
        </button>
      </form>

      <section className="panel mt-4">
        <div className="section-head">
          <h2 className="text-xl font-bold">Install conversion table</h2>
          <ResultSummary pageInfo={effectivePageInfo} noun="installs" />
        </div>
        <div className="table-wrap">
          <table className="table table-compact">
            <thead>
              <tr>
                <th>Install</th>
                <th>
                  <SortableHeader
                    basePath="/conversions"
                    params={listParams}
                    pageInfo={effectivePageInfo}
                    sort="displayName"
                  >
                    User
                  </SortableHeader>
                </th>
                <th>
                  <SortableHeader
                    basePath="/conversions"
                    params={listParams}
                    pageInfo={effectivePageInfo}
                    sort="authMethod"
                  >
                    Auth
                  </SortableHeader>
                </th>
                <th>
                  <SortableHeader
                    basePath="/conversions"
                    params={listParams}
                    pageInfo={effectivePageInfo}
                    sort="platform"
                  >
                    Platform
                  </SortableHeader>
                </th>
                <th>Location</th>
                <th>
                  <SortableHeader
                    basePath="/conversions"
                    params={listParams}
                    pageInfo={effectivePageInfo}
                    sort="scans"
                  >
                    Scans
                  </SortableHeader>
                </th>
                <th>
                  <SortableHeader
                    basePath="/conversions"
                    params={listParams}
                    pageInfo={effectivePageInfo}
                    sort="createdAt"
                  >
                    Created
                  </SortableHeader>
                </th>
                <th>
                  <SortableHeader
                    basePath="/conversions"
                    params={listParams}
                    pageInfo={effectivePageInfo}
                    sort="updatedAt"
                  >
                    Updated
                  </SortableHeader>
                </th>
                <th>
                  <SortableHeader
                    basePath="/conversions"
                    params={listParams}
                    pageInfo={effectivePageInfo}
                    sort="linkedAt"
                  >
                    Linked
                  </SortableHeader>
                </th>
                <th />
              </tr>
            </thead>
            <tbody>
              {visibleInstalls.map((install) => (
                <tr key={install.installId}>
                  <td>
                    <div className="font-semibold truncate-cell" title={install.installId}>
                      {shortId(install.installId, 10, 7)}
                    </div>
                    <div className="muted text-xs">
                      {install.appVersion ?? "unknown"} ({install.appBuild ?? 0})
                    </div>
                  </td>
                  <td>
                    <div
                      className="font-semibold truncate-cell"
                      title={
                        install.displayName ??
                        install.email ??
                        install.profileId ??
                        install.installId
                      }
                    >
                      {conversionUserLabel(install)}
                    </div>
                    <div className="muted text-xs truncate-cell" title={install.profileId}>
                      {install.email && install.displayName
                        ? install.email
                        : install.profileId
                          ? shortId(install.profileId)
                          : "No profile"}
                    </div>
                  </td>
                  <td>
                    <Badge
                      tone={
                        install.authMethod && install.authMethod !== "anonymous"
                          ? "green"
                          : "default"
                      }
                    >
                      {install.authMethod ?? "unknown"}
                    </Badge>
                    {install.identityProvider ? (
                      <div className="muted text-xs">{install.identityProvider}</div>
                    ) : null}
                  </td>
                  <td>
                    <Badge>{platformLabel(install.platform)}</Badge>
                  </td>
                  <td>
                    <div
                      className="font-semibold truncate-cell"
                      title={conversionLocationLabel(install)}
                    >
                      {install.deviceTimezone ?? install.profileTimezone ?? "Unknown"}
                    </div>
                    <div className="muted text-xs truncate-cell">
                      {[install.deviceRegion, install.deviceLocale].filter(Boolean).join(" · ") ||
                        "No region/locale"}
                    </div>
                  </td>
                  <td>
                    <div className="font-semibold">{formatNumber(install.stats.scans)}</div>
                    <div className="muted text-xs">
                      {formatNumber(install.stats.failedScans)} failed ·{" "}
                      {formatNumber(install.stats.meals)} meals
                    </div>
                  </td>
                  <td>{formatDate(install.createdAt)}</td>
                  <td>{formatDate(install.updatedAt)}</td>
                  <td>{install.linkedAt ? formatDate(install.linkedAt) : "Not linked"}</td>
                  <td className="table-actions">
                    {install.profileId ? (
                      <Link className="badge" href={`/users?profileId=${install.profileId}`}>
                        Open user
                      </Link>
                    ) : (
                      <span className="muted text-xs">No profile</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {visibleInstalls.length === 0 ? (
            <EmptyState
              title="No installs matched"
              body="Try removing filters or searching by exact install id."
            />
          ) : null}
        </div>
        <Pagination basePath="/conversions" params={listParams} pageInfo={effectivePageInfo} />
      </section>
    </AdminShell>
  );
}

function conversionListParams(params: ConversionsSearchParams): QueryParams {
  return {
    query: params.query,
    platform: params.platform ?? "all",
    status: params.status ?? "all",
    page: params.page ?? "1",
    pageSize: params.pageSize ?? "50",
    sort: params.sort ?? "updatedAt",
    direction: params.direction ?? "desc",
  };
}

function toApiQuery(params: QueryParams) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (!value || value === "all") continue;
    query.set(key, value);
  }
  return query;
}

function conversionUserLabel(install: AdminConversionInstall) {
  return personLabel({
    displayName: install.displayName,
    email: install.email,
    fallback: install.authMethod === "anonymous" ? "Anonymous user" : "Unnamed account",
  });
}

function conversionLocationLabel(install: AdminConversionInstall) {
  const parts = [
    install.deviceTimezone ?? install.profileTimezone,
    install.deviceRegion,
    install.deviceLocale,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : "No device location";
}

function platformLabel(value: string | undefined) {
  if (value === "ios") return "iOS";
  if (value === "android") return "Android";
  return "Unknown";
}
