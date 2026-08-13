import { AdminShell } from "../../components/shell";
import { privydockSource } from "../../sources/privydock";
import { SourceError, safe } from "../../components/source-error";
import { Metric, PageHeader, formatNumber } from "../../components/ui";
import { cachedDownloadObjects } from "../../sources/privydock/cloudflare";

export const dynamic = "force-dynamic";

const DAY = 24 * 60 * 60 * 1000;
const MB = 1_000_000;

export default async function DownloadsPage() {
  const objects = await safe(() =>
    cachedDownloadObjects(new Date(Date.now() - 90 * DAY).toISOString(), new Date().toISOString()),
  );

  if (!objects.ok) {
    return (
      <AdminShell project={privydockSource}>
        <PageHeader eyebrow="PrivyDock" title="Downloads" />
        <SourceError source="Cloudflare R2" message={objects.error} />
      </AdminShell>
    );
  }

  const dmgs = objects.data.filter((object) => object.object.endsWith(".dmg"));
  const appcast = objects.data.find((object) => object.object === "appcast.xml");
  const noise = objects.data.filter(
    (object) => !object.object.endsWith(".dmg") && object.object !== "appcast.xml",
  );

  const totalDownloads = dmgs.reduce((sum, object) => sum + object.completed, 0);
  const totalBytes = dmgs.reduce((sum, object) => sum + object.bytes, 0);

  return (
    <AdminShell project={privydockSource}>
      <PageHeader
        eyebrow="PrivyDock"
        title="Downloads"
        description="R2 object activity over 90 days. Counts are 1:10 sampled, so treat ±10 as the resolution. Bytes are the honest signal — request counts include range and revalidation requests that never transfer a whole file."
      />

      <section className="metric-grid">
        <Metric
          label="DMG downloads · 90d"
          value={formatNumber(totalDownloads)}
          sub="Bytes ÷ file size"
        />
        <Metric
          label="Data served"
          value={`${(totalBytes / MB).toFixed(1)} MB`}
          sub="DMG objects only"
        />
        <Metric
          label="Update checks"
          value={formatNumber(appcast?.requests ?? 0)}
          sub="appcast.xml — proxy for live installs"
        />
        <Metric
          label="Scanner probes"
          value={formatNumber(noise.reduce((sum, object) => sum + object.requests, 0))}
          sub={`${noise.length} distinct paths, 0 bytes served`}
        />
      </section>

      <section className="panel mt-6">
        <div className="metric-label">Per file</div>
        <div className="table-scroll mt-3">
          <table className="table">
            <thead>
              <tr>
                <th>Object</th>
                <th>Requests</th>
                <th>Bytes</th>
                <th>Whole downloads</th>
              </tr>
            </thead>
            <tbody>
              {[...dmgs, ...(appcast ? [appcast] : [])].map((object) => (
                <tr key={object.object}>
                  <td>{object.object}</td>
                  <td>{formatNumber(object.requests)}</td>
                  <td>{(object.bytes / MB).toFixed(2)} MB</td>
                  <td>{object.completed ? formatNumber(object.completed) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {noise.length ? (
        <section className="panel mt-6">
          <div className="metric-label">Probed paths</div>
          <p className="muted mt-1 text-sm">
            Vulnerability scanners looking for credentials in the public bucket. All return zero
            bytes — the bucket holds three objects and none of these exist.
          </p>
          <div className="table-scroll mt-3">
            <table className="table">
              <thead>
                <tr>
                  <th>Path</th>
                  <th>Requests</th>
                </tr>
              </thead>
              <tbody>
                {noise.slice(0, 30).map((object) => (
                  <tr key={object.object}>
                    <td>{object.object}</td>
                    <td>{formatNumber(object.requests)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </AdminShell>
  );
}
