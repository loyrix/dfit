import Link from "next/link";
import { AdminShell } from "../components/shell";
import { Badge, Metric, PageHeader, formatDate, formatNumber } from "../components/ui";
import { grantCreditsAction } from "../lib/actions";
import { adminGet, type AdminUser } from "../lib/api";
import { createMutationKey } from "../lib/idempotency";

export const dynamic = "force-dynamic";

export default async function UsersPage({
  searchParams,
}: {
  searchParams?: Promise<{ query?: string; profileId?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const query = params.query ?? "";
  const usersResponse = await adminGet<{ users: AdminUser[] }>(
    `/admin/users?limit=25&query=${encodeURIComponent(query)}`,
  );
  const selected = params.profileId
    ? await adminGet<{ user: AdminUser }>(`/admin/users/${params.profileId}`)
    : undefined;

  return (
    <AdminShell>
      <PageHeader
        eyebrow="Support"
        title="Users"
        description="Search accounts, inspect quota, review recent scans, and compensate failed experiences with audited scan credits."
      />

      <form className="mb-4 flex gap-3" action="/users">
        <input
          className="input"
          name="query"
          placeholder="Search email, profile id, or provider subject"
          defaultValue={query}
        />
        <button className="button" type="submit">
          Search
        </button>
      </form>

      <section className="grid two-col">
        <div className="panel">
          <h2 className="text-xl font-bold">Matching users</h2>
          <table className="table mt-4">
            <thead>
              <tr>
                <th>User</th>
                <th>Quota</th>
                <th>Scans</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {usersResponse.users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="font-semibold">{user.email ?? user.id}</div>
                    <div className="muted text-xs">
                      {user.authMethod} / {formatDate(user.createdAt)}
                    </div>
                  </td>
                  <td>
                    {user.quota.freeRemaining} free / {user.quota.rewardedRemaining} rewarded /{" "}
                    {user.quota.premiumRemaining} premium
                  </td>
                  <td>{formatNumber(user.stats.scans)}</td>
                  <td>
                    <Link className="badge" href={`/users?profileId=${user.id}&query=${query}`}>
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
        Select a user to inspect quota, scan history, and support grants.
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
        <h2 className="text-xl font-bold">Recent scans</h2>
        <table className="table mt-4">
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
      </div>

      <div className="panel">
        <h2 className="text-xl font-bold">Recent grants</h2>
        <table className="table mt-4">
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
      </div>
    </>
  );
}
