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
  resolveTableState,
  type QueryParams,
} from "../components/ui";
import { grantCreditsAction, reactivateUserAction } from "../lib/actions";
import { adminGet, type AdminUser, type PageInfo } from "../lib/api";
import { createMutationKey } from "../lib/idempotency";

export const dynamic = "force-dynamic";

type UsersSearchParams = {
  query?: string;
  profileId?: string;
  status?: string;
  authMethod?: string;
  risk?: string;
  page?: string;
  pageSize?: string;
  sort?: string;
  direction?: string;
};

export default async function UsersPage({
  searchParams,
}: {
  searchParams?: Promise<UsersSearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const listParams = userListParams(params);
  const apiQuery = toApiQuery(listParams);

  const [{ users, pageInfo }, selected] = await Promise.all([
    adminGet<{ users: AdminUser[]; pageInfo?: PageInfo }>(`/admin/users?${apiQuery}`),
    params.profileId
      ? adminGet<{ user: AdminUser }>(`/admin/users/${params.profileId}`)
      : undefined,
  ]);
  const { rows: visibleUsers, pageInfo: effectivePageInfo } = resolveTableState(
    users,
    pageInfo,
    listParams,
    {
      defaultPageSize: 25,
      defaultSort: "updatedAt",
      sorters: {
        authMethod: (user) => user.authMethod,
        createdAt: (user) => new Date(user.createdAt),
        email: (user) => user.email ?? user.id,
        failedScans: (user) => user.stats.failedScans,
        grants: (user) => user.stats.grants,
        lastScanAt: (user) => (user.lastScanAt ? new Date(user.lastScanAt) : null),
        meals: (user) => user.stats.meals,
        scans: (user) => user.stats.scans,
        updatedAt: (user) => new Date(user.updatedAt),
      },
    },
  );

  return (
    <AdminShell>
      <PageHeader
        eyebrow="Support"
        title="Users"
        description="Search accounts, inspect quota, review scan history, reactivate profiles, and compensate failed experiences with audited scan credits."
      />

      <form className="toolbar toolbar-four" action="/users">
        <input name="page" type="hidden" value="1" />
        <label>
          <span className="metric-label">Search</span>
          <input
            className="input"
            name="query"
            placeholder="Email, profile id, or provider subject"
            defaultValue={listParams.query ?? ""}
          />
        </label>
        <label>
          <span className="metric-label">Status</span>
          <select className="select" name="status" defaultValue={listParams.status ?? "all"}>
            <option value="all">All users</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="deletion_requested">Deletion requested</option>
          </select>
        </label>
        <label>
          <span className="metric-label">Auth</span>
          <select
            className="select"
            name="authMethod"
            defaultValue={listParams.authMethod ?? "all"}
          >
            <option value="all">All auth</option>
            <option value="anonymous">Anonymous</option>
            <option value="email">Email</option>
            <option value="google">Google</option>
            <option value="apple">Apple</option>
          </select>
        </label>
        <label>
          <span className="metric-label">Risk</span>
          <select className="select" name="risk" defaultValue={listParams.risk ?? "all"}>
            <option value="all">All risk</option>
            <option value="failed_scans">Failed scans</option>
            <option value="low_quota">No lifetime credits</option>
            <option value="deactivated">Deactivated</option>
          </select>
        </label>
        <label>
          <span className="metric-label">Rows</span>
          <select className="select" name="pageSize" defaultValue={listParams.pageSize ?? "25"}>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </label>
        <button className="button" type="submit">
          Apply
        </button>
      </form>

      <section className="grid two-col">
        <div className="panel">
          <div className="section-head">
            <h2 className="text-xl font-bold">User directory</h2>
            <ResultSummary pageInfo={effectivePageInfo} noun="profiles" />
          </div>
          <div className="table-wrap">
            <table className="table table-compact">
              <thead>
                <tr>
                  <th>
                    <SortableHeader
                      basePath="/users"
                      params={listParams}
                      pageInfo={effectivePageInfo}
                      sort="email"
                    >
                      User
                    </SortableHeader>
                  </th>
                  <th>
                    <SortableHeader
                      basePath="/users"
                      params={listParams}
                      pageInfo={effectivePageInfo}
                      sort="authMethod"
                    >
                      Auth
                    </SortableHeader>
                  </th>
                  <th>Quota</th>
                  <th>
                    <SortableHeader
                      basePath="/users"
                      params={listParams}
                      pageInfo={effectivePageInfo}
                      sort="scans"
                    >
                      Scans
                    </SortableHeader>
                  </th>
                  <th>
                    <SortableHeader
                      basePath="/users"
                      params={listParams}
                      pageInfo={effectivePageInfo}
                      sort="lastScanAt"
                    >
                      Last scan
                    </SortableHeader>
                  </th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {visibleUsers.map((user) => (
                  <tr
                    aria-selected={params.profileId === user.id}
                    className={params.profileId === user.id ? "row-selected" : undefined}
                    key={user.id}
                  >
                    <td>
                      <div className="font-semibold break-cell">{user.email ?? user.id}</div>
                      <div className="muted text-xs break-cell">{user.id}</div>
                    </td>
                    <td>
                      <Badge tone={user.deactivatedAt ? "red" : "green"}>
                        {user.deactivatedAt ? "inactive" : "active"}
                      </Badge>
                      <div className="muted mt-1 text-xs">{user.authMethod}</div>
                    </td>
                    <td>
                      <div className="font-semibold">
                        {user.quota.freeRemaining +
                          user.quota.rewardedRemaining +
                          user.quota.premiumRemaining}
                      </div>
                      <div className="muted text-xs">
                        F {user.quota.freeRemaining} / R {user.quota.rewardedRemaining} / P{" "}
                        {user.quota.premiumRemaining}
                      </div>
                    </td>
                    <td>
                      <div className="font-semibold">{formatNumber(user.stats.scans)}</div>
                      <div className="muted text-xs">
                        {formatNumber(user.stats.failedScans)} failed
                      </div>
                    </td>
                    <td>
                      <div>{user.lastScanAt ? formatDate(user.lastScanAt) : "No scans yet"}</div>
                      <div className="muted text-xs">
                        Profile updated {formatDate(user.updatedAt)}
                      </div>
                    </td>
                    <td className="table-actions">
                      <Link
                        className="badge"
                        href={hrefWithParams("/users", listParams, { profileId: user.id })}
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {visibleUsers.length === 0 ? (
              <EmptyState
                title="No users matched"
                body="Try removing filters or searching by the exact profile id."
              />
            ) : null}
          </div>
          <Pagination basePath="/users" params={listParams} pageInfo={effectivePageInfo} />
        </div>

        <div className="grid gap-4">
          {selected ? <UserDetail user={selected.user} /> : <EmptyUserDetail />}
        </div>
      </section>
    </AdminShell>
  );
}

function EmptyUserDetail() {
  return (
    <div className="panel">
      <h2 className="text-xl font-bold">User detail</h2>
      <p className="muted mt-2">
        Select a user to inspect quota, support history, scan health, and lifecycle status.
      </p>
    </div>
  );
}

function UserDetail({ user }: { user: AdminUser }) {
  return (
    <>
      <div className="grid metrics">
        <Metric label="Free" value={user.quota.freeRemaining} />
        <Metric label="Rewarded" value={user.quota.rewardedRemaining} />
        <Metric label="Premium" value={user.quota.premiumRemaining} />
        <Metric label="Failed" value={user.stats.failedScans} />
      </div>

      <div className="panel">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">{user.email ?? "Anonymous profile"}</h2>
            <p className="muted mt-1 break-all text-sm">{user.id}</p>
          </div>
          <Badge tone={user.deactivatedAt ? "red" : "green"}>
            {user.deactivatedAt ? "Inactive" : "Active"}
          </Badge>
        </div>

        <div className="detail-grid mt-5">
          <Detail label="Auth method" value={user.authMethod} />
          <Detail label="Timezone" value={user.timezone} />
          <Detail label="Created" value={formatDate(user.createdAt)} />
          <Detail label="Updated" value={formatDate(user.updatedAt)} />
          <Detail
            label="Last scan"
            value={user.lastScanAt ? formatDate(user.lastScanAt) : "No scans yet"}
          />
          <Detail label="Linked" value={user.linkedAt ? formatDate(user.linkedAt) : "Not linked"} />
          <Detail
            label="Deletion requested"
            value={user.deletionRequestedAt ? formatDate(user.deletionRequestedAt) : "No"}
          />
          <Detail
            label="Deactivated"
            value={user.deactivatedAt ? formatDate(user.deactivatedAt) : "No"}
          />
          <Detail label="Grants" value={formatNumber(user.stats.grants)} />
        </div>

        {user.deactivatedAt ? (
          <form
            action={reactivateUserAction}
            className="mt-5 grid gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4"
          >
            <input name="profileId" type="hidden" value={user.id} />
            <input
              name="idempotencyKey"
              type="hidden"
              value={createMutationKey(`reactivate:${user.id}`)}
            />
            <input
              name="reason"
              type="hidden"
              value="Admin reactivated profile after support review"
            />
            <div>
              <h3 className="font-semibold text-slate-950">Reactivate profile</h3>
              <p className="muted mt-1 text-sm">
                Enables this profile for future app access. Existing revoked sessions stay revoked.
              </p>
            </div>
            <button className="button" type="submit">
              Reactivate user
            </button>
          </form>
        ) : null}

        <form action={grantCreditsAction} className="form-grid mt-5">
          <input name="profileId" type="hidden" value={user.id} />
          <input
            name="idempotencyKey"
            type="hidden"
            value={createMutationKey(`grant:${user.id}`)}
          />
          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-2">
              <span className="text-sm muted">Credit type</span>
              <select className="select" name="creditType" defaultValue="rewarded">
                <option value="free">Free</option>
                <option value="rewarded">Rewarded</option>
                <option value="premium">Premium</option>
              </select>
            </label>
            <label className="grid gap-2">
              <span className="text-sm muted">Amount</span>
              <input
                className="input"
                name="amount"
                type="number"
                min="1"
                max="1000"
                defaultValue="1"
                required
              />
            </label>
          </div>
          <label className="grid gap-2">
            <span className="text-sm muted">Reason</span>
            <input
              className="input"
              name="reason"
              placeholder="Example: compensated failed scan reported in support"
              minLength={8}
              maxLength={500}
              required
            />
          </label>
          <button className="button" type="submit">
            Grant scan credits
          </button>
        </form>
      </div>

      <div className="panel">
        <div className="section-head">
          <h2 className="text-xl font-bold">Recent scans</h2>
          <Link className="badge" href={`/scans?profileId=${user.id}`}>
            View all
          </Link>
        </div>
        <div className="table-wrap">
          <table className="table table-compact">
            <tbody>
              {(user.recentScans ?? []).map((scan) => (
                <tr key={scan.id}>
                  <td>
                    <Link className="font-semibold" href={`/scans?scanId=${scan.id}`}>
                      {scan.status}
                    </Link>
                    <div className="muted text-xs">{formatDate(scan.createdAt)}</div>
                  </td>
                  <td>{scan.ai?.model ?? "not analyzed"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {(user.recentScans ?? []).length === 0 ? <EmptyState title="No scans yet" /> : null}
        </div>
      </div>

      <div className="panel">
        <h2 className="text-xl font-bold">Recent grants</h2>
        <div className="table-wrap mt-4">
          <table className="table table-compact">
            <tbody>
              {(user.grants ?? []).map((grant) => (
                <tr key={grant.id}>
                  <td>
                    <div className="font-semibold">
                      {grant.amount} {grant.creditType}
                    </div>
                    <div className="muted text-xs">{grant.reason}</div>
                  </td>
                  <td>{grant.actor}</td>
                  <td>{formatDate(grant.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {(user.grants ?? []).length === 0 ? <EmptyState title="No support grants" /> : null}
        </div>
      </div>
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="metric-label">{label}</div>
      <div className="mt-1 break-all">{value}</div>
    </div>
  );
}

function userListParams(params: UsersSearchParams): QueryParams {
  return {
    query: params.query,
    status: params.status ?? "all",
    authMethod: params.authMethod ?? "all",
    risk: params.risk ?? "all",
    page: params.page ?? "1",
    pageSize: params.pageSize ?? "25",
    sort: params.sort ?? "lastScanAt",
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
