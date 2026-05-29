import { AdminShell } from "../components/shell";
import { Badge, EmptyState, PageHeader, formatDate } from "../components/ui";
import { createNoticeAction, updateFeatureFlagAction, updateNoticeAction } from "../lib/actions";
import { adminGet, type AppNotice, type FeatureFlag } from "../lib/api";
import { createMutationKey } from "../lib/idempotency";

export const dynamic = "force-dynamic";

type FlagsSearchParams = {
  flagQuery?: string;
  noticeQuery?: string;
  noticeStatus?: string;
  noticeSeverity?: string;
};

export default async function FlagsPage({
  searchParams,
}: {
  searchParams?: Promise<FlagsSearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const [{ flags }, { notices }] = await Promise.all([
    adminGet<{ flags: FeatureFlag[] }>("/admin/feature-flags"),
    adminGet<{ notices: AppNotice[] }>("/admin/notices"),
  ]);
  const filteredFlags = filterFlags(flags, params.flagQuery);
  const filteredNotices = filterNotices(notices, params);

  return (
    <AdminShell>
      <PageHeader
        eyebrow="Runtime"
        title="Feature flags and notices"
        description="Control client-visible feature availability and publish in-app notices without an App Store or Play Store release."
      />

      <section className="grid two-col">
        <div className="panel">
          <div className="section-head">
            <h2 className="text-xl font-bold">Feature flags</h2>
            <span className="muted text-sm">{filteredFlags.length} shown</span>
          </div>
          <form className="toolbar toolbar-two" action="/flags">
            <label>
              <span className="metric-label">Search flags</span>
              <input
                className="input"
                name="flagQuery"
                placeholder="Flag key or description"
                defaultValue={params.flagQuery ?? ""}
              />
            </label>
            <button className="button" type="submit">
              Filter
            </button>
          </form>
          <div className="table-wrap">
            <table className="table table-compact">
              <thead>
                <tr>
                  <th>Flag</th>
                  <th>Status</th>
                  <th>Updated</th>
                  <th>Reasoned update</th>
                </tr>
              </thead>
              <tbody>
                {filteredFlags.map((flag) => (
                  <tr key={flag.key}>
                    <td>
                      <div className="font-semibold break-cell">{flag.key}</div>
                      <div className="muted text-xs break-cell">
                        {flag.description ?? "No description"}
                      </div>
                    </td>
                    <td>
                      <Badge tone={flag.value === true ? "green" : "red"}>
                        {flag.value === true ? "Enabled" : "Disabled"}
                      </Badge>
                    </td>
                    <td>
                      <div>{formatDate(flag.updatedAt)}</div>
                      <div className="muted text-xs">{flag.updatedBy ?? "unknown"}</div>
                    </td>
                    <td>
                      <form action={updateFeatureFlagAction} className="form-grid">
                        <input name="key" type="hidden" value={flag.key} />
                        <input
                          name="idempotencyKey"
                          type="hidden"
                          value={createMutationKey(`flag:${flag.key}:update`)}
                        />
                        <label className="inline-controls text-sm">
                          <input
                            name="value"
                            type="checkbox"
                            defaultChecked={flag.value === true}
                          />
                          Enabled
                        </label>
                        <input
                          className="input"
                          name="description"
                          defaultValue={flag.description ?? ""}
                          placeholder="Description"
                          maxLength={500}
                        />
                        <div className="mini-form">
                          <input
                            className="input"
                            name="reason"
                            placeholder="Reason for flag change"
                            minLength={8}
                            maxLength={500}
                            required
                          />
                          <button className="button" type="submit">
                            Save
                          </button>
                        </div>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredFlags.length === 0 ? <EmptyState title="No flags matched" /> : null}
          </div>
        </div>

        <div className="panel">
          <h2 className="text-xl font-bold">Create in-app notice</h2>
          <form action={createNoticeAction} className="form-grid mt-4">
            <input name="idempotencyKey" type="hidden" value={createMutationKey("notice:create")} />
            <input
              className="input"
              name="title"
              placeholder="Notice title"
              minLength={3}
              maxLength={120}
              required
            />
            <textarea
              className="textarea"
              name="body"
              placeholder="Notice message"
              minLength={3}
              maxLength={500}
              required
            />
            <select className="select" name="severity" defaultValue="info">
              <option value="info">Info</option>
              <option value="success">Success</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </select>
            <label className="inline-controls">
              <input name="active" type="checkbox" /> Active now
            </label>
            <input
              className="input"
              name="ctaLabel"
              placeholder="CTA label, optional"
              maxLength={80}
            />
            <input
              className="input"
              name="ctaUrl"
              placeholder="CTA URL, optional"
              maxLength={500}
            />
            <input
              className="input"
              name="reason"
              placeholder="Reason for notice"
              minLength={8}
              maxLength={500}
              required
            />
            <button className="button" type="submit">
              Publish notice
            </button>
          </form>
        </div>
      </section>

      <section className="panel mt-4">
        <div className="section-head">
          <h2 className="text-xl font-bold">Notices</h2>
          <span className="muted text-sm">{filteredNotices.length} shown</span>
        </div>
        <form className="toolbar toolbar-four" action="/flags">
          <label>
            <span className="metric-label">Search notices</span>
            <input
              className="input"
              name="noticeQuery"
              placeholder="Title or body"
              defaultValue={params.noticeQuery ?? ""}
            />
          </label>
          <label>
            <span className="metric-label">Status</span>
            <select
              className="select"
              name="noticeStatus"
              defaultValue={params.noticeStatus ?? "all"}
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>
          <label>
            <span className="metric-label">Severity</span>
            <select
              className="select"
              name="noticeSeverity"
              defaultValue={params.noticeSeverity ?? "all"}
            >
              <option value="all">All severities</option>
              <option value="info">Info</option>
              <option value="success">Success</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </select>
          </label>
          <button className="button" type="submit">
            Filter
          </button>
        </form>
        <div className="table-wrap">
          <table className="table table-compact">
            <thead>
              <tr>
                <th>Notice</th>
                <th>Severity</th>
                <th>Status</th>
                <th>CTA</th>
                <th>Updated</th>
                <th>Reasoned update</th>
              </tr>
            </thead>
            <tbody>
              {filteredNotices.map((notice) => (
                <tr key={notice.id}>
                  <td>
                    <div className="font-semibold">{notice.title}</div>
                    <div className="muted text-xs break-cell">{notice.body}</div>
                  </td>
                  <td>{notice.severity}</td>
                  <td>
                    <Badge tone={notice.active ? "green" : "red"}>
                      {notice.active ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td>
                    {notice.ctaLabel ? (
                      <div>
                        <div className="font-semibold">{notice.ctaLabel}</div>
                        <div className="muted text-xs break-cell">{notice.ctaUrl ?? "No URL"}</div>
                      </div>
                    ) : (
                      "None"
                    )}
                  </td>
                  <td>
                    <div>{formatDate(notice.updatedAt)}</div>
                    <div className="muted text-xs">{notice.updatedBy ?? "unknown"}</div>
                  </td>
                  <td>
                    <form action={updateNoticeAction} className="mini-form">
                      <input name="noticeId" type="hidden" value={notice.id} />
                      <input
                        name="idempotencyKey"
                        type="hidden"
                        value={createMutationKey(`notice:${notice.id}:update`)}
                      />
                      <label className="inline-controls text-sm">
                        <input name="active" type="checkbox" defaultChecked={notice.active} />{" "}
                        Active
                      </label>
                      <input
                        className="input"
                        name="reason"
                        placeholder="Reason"
                        minLength={8}
                        maxLength={500}
                        required
                      />
                      <button className="button" type="submit">
                        Save
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredNotices.length === 0 ? <EmptyState title="No notices matched" /> : null}
        </div>
      </section>
    </AdminShell>
  );
}

function filterFlags(flags: FeatureFlag[], query: string | undefined) {
  const normalized = query?.trim().toLowerCase();
  if (!normalized) return flags;
  return flags.filter(
    (flag) =>
      flag.key.toLowerCase().includes(normalized) ||
      (flag.description ?? "").toLowerCase().includes(normalized),
  );
}

function filterNotices(notices: AppNotice[], params: FlagsSearchParams) {
  const normalized = params.noticeQuery?.trim().toLowerCase();
  return notices.filter((notice) => {
    const matchesQuery =
      !normalized ||
      notice.title.toLowerCase().includes(normalized) ||
      notice.body.toLowerCase().includes(normalized);
    const matchesStatus =
      !params.noticeStatus ||
      params.noticeStatus === "all" ||
      (params.noticeStatus === "active" && notice.active) ||
      (params.noticeStatus === "inactive" && !notice.active);
    const matchesSeverity =
      !params.noticeSeverity ||
      params.noticeSeverity === "all" ||
      notice.severity === params.noticeSeverity;
    return matchesQuery && matchesStatus && matchesSeverity;
  });
}
