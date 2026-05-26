import { AdminShell } from "../components/shell";
import { Badge, PageHeader, formatDate } from "../components/ui";
import { createNoticeAction, updateFeatureFlagAction, updateNoticeAction } from "../lib/actions";
import { adminGet, type AppNotice, type FeatureFlag } from "../lib/api";

export const dynamic = "force-dynamic";

export default async function FlagsPage() {
  const [{ flags }, { notices }] = await Promise.all([
    adminGet<{ flags: FeatureFlag[] }>("/admin/feature-flags"),
    adminGet<{ notices: AppNotice[] }>("/admin/notices"),
  ]);

  return (
    <AdminShell>
      <PageHeader
        eyebrow="Runtime"
        title="Feature flags and notices"
        description="Control client-visible feature availability and publish in-app notices without an App Store or Play Store release."
      />

      <section className="grid two-col">
        <div className="panel">
          <h2 className="text-xl font-bold">Feature flags</h2>
          <div className="mt-4 grid gap-3">
            {flags.map((flag) => (
              <form
                action={updateFeatureFlagAction}
                className="panel-light rounded-lg p-4"
                key={flag.key}
              >
                <input name="key" type="hidden" value={flag.key} />
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-bold">{flag.key}</div>
                    <input
                      className="input mt-2"
                      name="description"
                      defaultValue={flag.description ?? ""}
                      placeholder="Description"
                    />
                    <div className="muted mt-2 text-xs">Updated {formatDate(flag.updatedAt)}</div>
                  </div>
                  <label className="flex items-center gap-2">
                    <input name="value" type="checkbox" defaultChecked={flag.value === true} />{" "}
                    Enabled
                  </label>
                </div>
                <div className="mt-3 flex gap-3">
                  <input
                    className="input"
                    name="reason"
                    placeholder="Reason for flag change"
                    required
                  />
                  <button className="button" type="submit">
                    Save
                  </button>
                </div>
              </form>
            ))}
          </div>
        </div>

        <div className="panel">
          <h2 className="text-xl font-bold">Create in-app notice</h2>
          <form action={createNoticeAction} className="form-grid mt-4">
            <input className="input" name="title" placeholder="Notice title" required />
            <textarea className="textarea" name="body" placeholder="Notice message" required />
            <select className="select" name="severity" defaultValue="info">
              <option value="info">Info</option>
              <option value="success">Success</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </select>
            <label className="flex items-center gap-2">
              <input name="active" type="checkbox" /> Active now
            </label>
            <input className="input" name="ctaLabel" placeholder="CTA label, optional" />
            <input className="input" name="ctaUrl" placeholder="CTA URL, optional" />
            <input className="input" name="reason" placeholder="Reason for notice" required />
            <button className="button" type="submit">
              Publish notice
            </button>
          </form>
        </div>
      </section>

      <section className="panel mt-4">
        <h2 className="text-xl font-bold">Notices</h2>
        <table className="table mt-4">
          <thead>
            <tr>
              <th>Notice</th>
              <th>Severity</th>
              <th>Status</th>
              <th>Updated</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {notices.map((notice) => (
              <tr key={notice.id}>
                <td>
                  <div className="font-semibold">{notice.title}</div>
                  <div className="muted text-xs">{notice.body}</div>
                </td>
                <td>{notice.severity}</td>
                <td>
                  <Badge tone={notice.active ? "green" : "red"}>
                    {notice.active ? "Active" : "Inactive"}
                  </Badge>
                </td>
                <td>{formatDate(notice.updatedAt)}</td>
                <td>
                  <form action={updateNoticeAction} className="flex gap-2">
                    <input name="noticeId" type="hidden" value={notice.id} />
                    <label className="flex items-center gap-2">
                      <input name="active" type="checkbox" defaultChecked={notice.active} /> Active
                    </label>
                    <input className="input" name="reason" placeholder="Reason" required />
                    <button className="button" type="submit">
                      Save
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </AdminShell>
  );
}
