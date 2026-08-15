import Link from "next/link";
import { AdminShell } from "../../components/shell";
import { logmyplateSource } from "../../sources/logmyplate";
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
  personLabel,
  resolveTableState,
  shortId,
  type QueryParams,
} from "../../components/ui";
import { adminGet, type AdminAdsAnalytics, type AdminAdsAnalyticsUser } from "../../lib/api";

export const dynamic = "force-dynamic";

type AdsSearchParams = {
  query?: string;
  page?: string;
  pageSize?: string;
  sort?: string;
  direction?: string;
};

export default async function AdsAnalyticsPage({
  params: projectParams,
  searchParams,
}: {
  params: Promise<{ project: string }>;
  searchParams?: Promise<AdsSearchParams>;
}) {
  const { project } = await projectParams;
  const params = (await searchParams) ?? {};
  const listParams = adsListParams(params);
  const { totals, users } = await adminGet<AdminAdsAnalytics>("/admin/ads/analytics");

  const normalizedQuery = listParams.query?.trim().toLowerCase() ?? "";
  const filteredUsers = normalizedQuery
    ? users.filter((user) =>
        [user.email, user.displayName, user.profileId, user.authMethod, user.platform]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedQuery)),
      )
    : users;

  const { rows: visibleUsers, pageInfo } = resolveTableState(filteredUsers, undefined, listParams, {
    defaultPageSize: 50,
    defaultSort: "ads30d",
    sorters: {
      adsToday: (user) => user.ads.today,
      ads7d: (user) => user.ads.last7d,
      ads30d: (user) => user.ads.last30d,
      adsTotal: (user) => user.ads.total,
      email: (user) => user.email ?? user.profileId,
      grantedByUs: (user) => user.granted30d.byUs,
      lastAdAt: (user) => (user.lastAdAt ? new Date(user.lastAdAt) : null),
      scansLeft: (user) => user.scansLeft.total,
    },
  });

  return (
    <AdminShell project={logmyplateSource}>
      <PageHeader
        eyebrow="Growth"
        title="Ads & Scan Credits"
        description="Rewarded ad watches per user with scan-credit balances, split by how each credit was earned: watched ads versus credits granted by us (ad-suspension offer or manual admin grants)."
      />

      <section className="grid metrics">
        <Metric
          label="Ads watched today"
          value={formatNumber(totals.ads.today)}
          sub={`${formatNumber(totals.watchers.today)} users`}
        />
        <Metric
          label="Ads watched · 7 days"
          value={formatNumber(totals.ads.last7d)}
          sub={`${formatNumber(totals.watchers.last7d)} users`}
        />
        <Metric
          label="Ads watched · 30 days"
          value={formatNumber(totals.ads.last30d)}
          sub={`${formatNumber(totals.watchers.last30d)} users`}
        />
        <Metric
          label="Scans earned via ads · 30 days"
          value={formatNumber(totals.scansFromAds.last30d)}
          sub={`today ${formatNumber(totals.scansFromAds.today)} · 7d ${formatNumber(totals.scansFromAds.last7d)}`}
        />
        <Metric
          label="Scans granted by us · 30 days"
          value={formatNumber(totals.promoScans.last30d + totals.adminScans.last30d)}
          sub={`offer ${formatNumber(totals.promoScans.last30d)} · admin ${formatNumber(totals.adminScans.last30d)}`}
        />
        <Metric
          label="Verified watches not credited · 30 days"
          value={formatNumber(totals.uncreditedWatches30d)}
          sub="AdMob-confirmed ads that earned nothing — investigate if this grows"
        />
      </section>

      <form className="toolbar toolbar-two mt-4" action={`/${project}/ads`}>
        <input name="page" type="hidden" value="1" />
        <label>
          <span className="metric-label">Search</span>
          <input
            className="input"
            name="query"
            placeholder="Email, name, profile id, auth method, platform"
            defaultValue={listParams.query ?? ""}
          />
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
          <h2 className="text-xl font-bold">Per-user ad activity & credits</h2>
          <ResultSummary pageInfo={pageInfo} noun="users" />
        </div>
        <div className="table-wrap">
          <table className="table table-compact">
            <thead>
              <tr>
                <th>
                  <SortableHeader
                    basePath={`/${project}/ads`}
                    params={listParams}
                    pageInfo={pageInfo}
                    sort="email"
                  >
                    User
                  </SortableHeader>
                </th>
                <th>Platform</th>
                <th>
                  <SortableHeader
                    basePath={`/${project}/ads`}
                    params={listParams}
                    pageInfo={pageInfo}
                    sort="adsToday"
                  >
                    Ads today
                  </SortableHeader>
                </th>
                <th>
                  <SortableHeader
                    basePath={`/${project}/ads`}
                    params={listParams}
                    pageInfo={pageInfo}
                    sort="ads7d"
                  >
                    7 days
                  </SortableHeader>
                </th>
                <th>
                  <SortableHeader
                    basePath={`/${project}/ads`}
                    params={listParams}
                    pageInfo={pageInfo}
                    sort="ads30d"
                  >
                    30 days
                  </SortableHeader>
                </th>
                <th>
                  <SortableHeader
                    basePath={`/${project}/ads`}
                    params={listParams}
                    pageInfo={pageInfo}
                    sort="adsTotal"
                  >
                    Lifetime
                  </SortableHeader>
                </th>
                <th>
                  <SortableHeader
                    basePath={`/${project}/ads`}
                    params={listParams}
                    pageInfo={pageInfo}
                    sort="lastAdAt"
                  >
                    Last ad
                  </SortableHeader>
                </th>
                <th>
                  <SortableHeader
                    basePath={`/${project}/ads`}
                    params={listParams}
                    pageInfo={pageInfo}
                    sort="scansLeft"
                  >
                    Scans left
                  </SortableHeader>
                </th>
                <th>
                  <SortableHeader
                    basePath={`/${project}/ads`}
                    params={listParams}
                    pageInfo={pageInfo}
                    sort="grantedByUs"
                  >
                    Granted 30d
                  </SortableHeader>
                </th>
                <th />
              </tr>
            </thead>
            <tbody>
              {visibleUsers.map((user) => (
                <tr key={user.profileId}>
                  <td>
                    <div
                      className="font-semibold truncate-cell"
                      title={user.email ?? user.profileId}
                    >
                      {personLabel({
                        displayName: user.displayName,
                        email: user.email,
                        fallback: "Unnamed account",
                      })}
                    </div>
                    <div className="muted text-xs truncate-cell" title={user.profileId}>
                      <Badge tone={user.authMethod !== "anonymous" ? "green" : "default"}>
                        {user.authMethod}
                      </Badge>{" "}
                      {shortId(user.profileId)}
                    </div>
                  </td>
                  <td>
                    <Badge>{platformLabel(user.platform)}</Badge>
                  </td>
                  <td className="font-semibold">{formatNumber(user.ads.today)}</td>
                  <td>{formatNumber(user.ads.last7d)}</td>
                  <td>{formatNumber(user.ads.last30d)}</td>
                  <td>{formatNumber(user.ads.total)}</td>
                  <td>{user.lastAdAt ? formatDate(user.lastAdAt) : "Never"}</td>
                  <td>
                    <div className="font-semibold">{formatNumber(user.scansLeft.total)}</div>
                    <div className="muted text-xs">{scansLeftBreakdown(user)}</div>
                  </td>
                  <td>
                    <div className="font-semibold">
                      {formatNumber(user.granted30d.byAds + user.granted30d.byUs)}
                    </div>
                    <div className="muted text-xs">{granted30dBreakdown(user)}</div>
                  </td>
                  <td className="table-actions">
                    <Link className="badge" href={`/${project}/users?profileId=${user.profileId}`}>
                      Open user
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {visibleUsers.length === 0 ? (
            <EmptyState
              title="No ad activity matched"
              body="This lists users with rewarded ad watches or scan-credit grants in the last 30 days."
            />
          ) : null}
        </div>
        <Pagination basePath={`/${project}/ads`} params={listParams} pageInfo={pageInfo} />
      </section>
    </AdminShell>
  );
}

function adsListParams(params: AdsSearchParams): QueryParams {
  return {
    query: params.query,
    page: params.page ?? "1",
    pageSize: params.pageSize ?? "50",
    sort: params.sort ?? "ads30d",
    direction: params.direction ?? "desc",
  };
}

function platformLabel(value: string | undefined) {
  if (value === "ios") return "iOS";
  if (value === "android") return "Android";
  return "Unknown";
}

function scansLeftBreakdown(user: AdminAdsAnalyticsUser) {
  const parts = [
    `${formatNumber(user.scansLeft.free)} free`,
    `${formatNumber(user.scansLeft.rewarded)} from ads`,
  ];
  if (user.scansLeft.premium > 0) parts.push(`${formatNumber(user.scansLeft.premium)} premium`);
  return parts.join(" · ");
}

function granted30dBreakdown(user: AdminAdsAnalyticsUser) {
  const parts = [
    `${formatNumber(user.granted30d.byAds)} by ads`,
    `${formatNumber(user.granted30d.promo)} offer`,
  ];
  if (user.granted30d.admin > 0) parts.push(`${formatNumber(user.granted30d.admin)} admin`);
  return parts.join(" · ");
}
