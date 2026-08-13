import { AdminShell } from "../../components/shell";
import { privydockSource } from "../../sources/privydock";
import { SourceError, safe } from "../../components/source-error";
import {
  Badge,
  EmptyState,
  Metric,
  PageHeader,
  formatDate,
  formatNumber,
  shortId,
} from "../../components/ui";
import { listActivations, listLicenses } from "../../sources/privydock/supabase";

export const dynamic = "force-dynamic";

const DAY = 24 * 60 * 60 * 1000;

const statusTone: Record<string, string> = {
  active: "green",
  revoked: "red",
  refunded: "gray",
};

function rank(counts: Map<string, number>) {
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

export default async function LicensesPage() {
  const [licenses, activations] = await Promise.all([
    safe(() => listLicenses(200)),
    safe(() => listActivations(500)),
  ]);

  if (!licenses.ok) {
    return (
      <AdminShell project={privydockSource}>
        <PageHeader eyebrow="PrivyDock" title="Licences" />
        <SourceError source="Supabase" message={licenses.error} />
      </AdminShell>
    );
  }

  const rows = licenses.data.rows;
  const byStatus = rows.reduce<Record<string, number>>((acc, license) => {
    acc[license.status] = (acc[license.status] ?? 0) + 1;
    return acc;
  }, {});

  const activationRows = activations.ok ? activations.data.rows : [];
  const devicesByLicense = new Map<string, number>();
  const osVersions = new Map<string, number>();
  const appVersions = new Map<string, number>();

  for (const activation of activationRows) {
    devicesByLicense.set(
      activation.license_id,
      (devicesByLicense.get(activation.license_id) ?? 0) + 1,
    );
    if (activation.os_version) {
      osVersions.set(activation.os_version, (osVersions.get(activation.os_version) ?? 0) + 1);
    }
    if (activation.app_version) {
      appVersions.set(activation.app_version, (appVersions.get(activation.app_version) ?? 0) + 1);
    }
  }

  const dormant = rows.filter(
    (license) =>
      license.status === "active" &&
      (!license.last_validated_at || Date.parse(license.last_validated_at) < Date.now() - 30 * DAY),
  ).length;

  return (
    <AdminShell project={privydockSource}>
      <PageHeader
        eyebrow="PrivyDock"
        title="Licences"
        description="Support tooling first. Every figure here is exact — this is PrivyDock's own database, with no sampling anywhere."
      />

      <section className="metric-grid">
        <Metric label="Total" value={formatNumber(licenses.data.total)} />
        <Metric label="Active" value={formatNumber(byStatus.active ?? 0)} />
        <Metric
          label="Revoked / refunded"
          value={formatNumber((byStatus.revoked ?? 0) + (byStatus.refunded ?? 0))}
        />
        <Metric
          label="Dormant"
          value={formatNumber(dormant)}
          sub="Active but not validated in 30 days"
        />
      </section>

      <section className="panel mt-6">
        <div className="metric-label">Licences</div>
        {rows.length ? (
          <div className="table-scroll mt-3">
            <table className="table">
              <thead>
                <tr>
                  <th>Key</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Devices</th>
                  <th>Activated</th>
                  <th>Last validated</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((license) => (
                  <tr key={license.id}>
                    <td>{shortId(license.license_key)}</td>
                    <td>{license.customer_email}</td>
                    <td>
                      <Badge tone={statusTone[license.status] ?? "default"}>{license.status}</Badge>
                    </td>
                    <td>{devicesByLicense.get(license.id) ?? 0}</td>
                    <td>{license.activated_at ? formatDate(license.activated_at) : "—"}</td>
                    <td>
                      {license.last_validated_at ? formatDate(license.last_validated_at) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No licences yet"
            body="The beta is free, so this fills up once selling starts."
          />
        )}
      </section>

      <section className="mt-6 grid gap-3 md:grid-cols-2">
        <div className="panel">
          <div className="metric-label">macOS versions</div>
          {osVersions.size ? (
            <table className="table mt-3">
              <tbody>
                {rank(osVersions).map(([version, count]) => (
                  <tr key={version}>
                    <td>{version}</td>
                    <td>{formatNumber(count)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="muted mt-2 text-sm">No activations recorded yet.</p>
          )}
        </div>

        <div className="panel">
          <div className="metric-label">App version adoption</div>
          <p className="muted mt-1 text-sm">Whether a Sparkle release actually reached people.</p>
          {appVersions.size ? (
            <table className="table mt-3">
              <tbody>
                {rank(appVersions).map(([version, count]) => (
                  <tr key={version}>
                    <td>{version}</td>
                    <td>{formatNumber(count)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="muted mt-2 text-sm">No activations recorded yet.</p>
          )}
        </div>
      </section>
    </AdminShell>
  );
}
