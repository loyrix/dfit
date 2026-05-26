import Link from "next/link";
import { AdminShell } from "../components/shell";
import { Badge, PageHeader, formatDate } from "../components/ui";
import { adminGet, type AdminScan } from "../lib/api";

export const dynamic = "force-dynamic";

export default async function ScansPage({
  searchParams,
}: {
  searchParams?: Promise<{ profileId?: string; status?: string; scanId?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const query = new URLSearchParams();
  query.set("limit", "50");
  if (params.profileId) query.set("profileId", params.profileId);
  if (params.status) query.set("status", params.status);

  const [{ scans }, detail] = await Promise.all([
    adminGet<{ scans: AdminScan[] }>(`/admin/scans?${query}`),
    params.scanId ? adminGet<{ scan: AdminScan }>(`/admin/scans/${params.scanId}`) : undefined,
  ]);

  return (
    <AdminShell>
      <PageHeader
        eyebrow="Debugging"
        title="Scan history"
        description="Review failed and successful scan sessions with model, prompt, latency, confidence, image metadata, and parsed AI output."
      />

      <form className="mb-4 grid grid-cols-[1fr_220px_auto] gap-3" action="/scans">
        <input
          className="input"
          name="profileId"
          placeholder="Filter by profile id"
          defaultValue={params.profileId ?? ""}
        />
        <select className="select" name="status" defaultValue={params.status ?? ""}>
          <option value="">All statuses</option>
          <option value="failed">Failed</option>
          <option value="ready_for_review">Ready for review</option>
          <option value="confirmed">Confirmed</option>
          <option value="prepared">Prepared</option>
        </select>
        <button className="button" type="submit">
          Filter
        </button>
      </form>

      <section className="grid two-col">
        <div className="panel">
          <h2 className="text-xl font-bold">Recent scans</h2>
          <table className="table mt-4">
            <thead>
              <tr>
                <th>Scan</th>
                <th>Model</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {scans.map((scan) => (
                <tr key={scan.id}>
                  <td>
                    <div className="font-semibold break-all">{scan.id}</div>
                    <div className="muted text-xs">{formatDate(scan.createdAt)}</div>
                  </td>
                  <td>
                    {scan.ai?.model ?? "not analyzed"}
                    {scan.ai?.promptVersion ? (
                      <div className="muted text-xs">{scan.ai.promptVersion}</div>
                    ) : null}
                  </td>
                  <td>
                    <Badge tone={scan.status === "failed" ? "red" : "green"}>{scan.status}</Badge>
                  </td>
                  <td>
                    <Link
                      className="badge"
                      href={`/scans?scanId=${scan.id}${params.profileId ? `&profileId=${params.profileId}` : ""}`}
                    >
                      Inspect
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="panel">
          <h2 className="text-xl font-bold">Scan detail</h2>
          {detail ? (
            <div className="mt-4 grid gap-4">
              <Detail label="Profile" value={detail.scan.profileId} />
              <Detail label="Status" value={detail.scan.status} />
              <Detail label="User note" value={detail.scan.userHint ?? "None"} />
              <Detail label="Model" value={detail.scan.ai?.model ?? "Not analyzed"} />
              <Detail label="Prompt" value={detail.scan.ai?.promptVersion ?? "None"} />
              <Detail
                label="Latency"
                value={detail.scan.ai?.latencyMs ? `${detail.scan.ai.latencyMs} ms` : "None"}
              />
              <Detail
                label="Image object"
                value={detail.scan.image?.objectKey ?? "No stored image"}
              />
              <div>
                <div className="metric-label">AI output</div>
                <pre className="mt-2 max-h-[460px] overflow-auto rounded-lg bg-black/30 p-3 text-xs">
                  {JSON.stringify(detail.scan.rawAiJson ?? null, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <p className="muted mt-3">Choose a scan to inspect.</p>
          )}
        </div>
      </section>
    </AdminShell>
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
