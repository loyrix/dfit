import Link from "next/link";
import { AdminShell } from "../../components/shell";
import { logmyplateSource } from "../../sources/logmyplate";
import {
  Badge,
  EmptyState,
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
} from "../../components/ui";
import { adminGet, type AdminScan, type AdminScanCounts, type PageInfo } from "../../lib/api";

export const dynamic = "force-dynamic";

type ScansSearchParams = {
  query?: string;
  profileId?: string;
  platform?: string;
  appVersion?: string;
  appBuild?: string;
  status?: string;
  model?: string;
  promptVersion?: string;
  aiState?: string;
  image?: string;
  from?: string;
  to?: string;
  scanId?: string;
  page?: string;
  pageSize?: string;
  sort?: string;
  direction?: string;
};

export default async function ScansPage({
  params: projectParams,
  searchParams,
}: {
  params: Promise<{ project: string }>;
  searchParams?: Promise<ScansSearchParams>;
}) {
  const { project } = await projectParams;
  const params = (await searchParams) ?? {};
  const listParams = scanListParams(params);
  const apiQuery = toScanApiQuery(listParams);

  const [{ scans, pageInfo }, detail, counts] = await Promise.all([
    adminGet<{ scans: AdminScan[]; pageInfo?: PageInfo }>(`/admin/scans?${apiQuery}`),
    params.scanId ? adminGet<{ scan: AdminScan }>(`/admin/scans/${params.scanId}`) : undefined,
    params.scanId ? undefined : adminGet<{ counts: AdminScanCounts }>("/admin/scans/counts"),
  ]);
  const { rows: visibleScans, pageInfo: effectivePageInfo } = resolveTableState(
    scans,
    pageInfo,
    listParams,
    {
      defaultPageSize: 50,
      defaultSort: "createdAt",
      sorters: {
        confidence: (scan) => scan.ai?.confidence,
        createdAt: (scan) => new Date(scan.createdAt),
        appVersion: (scan) => scan.appVersion,
        latencyMs: (scan) => scan.ai?.latencyMs,
        model: (scan) => scan.ai?.model,
        platform: (scan) => scan.platform,
        status: (scan) => scan.status,
        updatedAt: (scan) => new Date(scan.updatedAt),
      },
    },
  );

  if (detail?.scan) {
    return (
      <AdminShell project={logmyplateSource}>
        <PageHeader
          eyebrow="Debugging"
          title="Scan detail"
          description="Inspect the food photo, profile context, model metadata, timing, confidence, and parsed AI output for this scan."
          action={
            <Link
              className="button button-secondary"
              href={hrefWithParams(`/${project}/scans`, listParams)}
            >
              Back to scans
            </Link>
          }
        />
        <section className="focused-page">
          <ScanDetail scan={detail.scan} />
        </section>
      </AdminShell>
    );
  }

  return (
    <AdminShell project={logmyplateSource}>
      <PageHeader
        eyebrow="Debugging"
        title="Scan history"
        description="Review scan sessions with profile, model, prompt, latency, confidence, image metadata, parsed AI output, and failure state."
      />

      {counts ? <ScanVolumeCard counts={counts.counts} /> : null}

      <form className="toolbar toolbar-four" action={`/${project}/scans`}>
        <input name="page" type="hidden" value="1" />
        <label>
          <span className="metric-label">Search</span>
          <input
            className="input"
            name="query"
            placeholder="Scan id, name, profile id, email, meal, note, timezone, region"
            defaultValue={listParams.query ?? ""}
          />
        </label>
        <label>
          <span className="metric-label">Profile</span>
          <input
            className="input"
            name="profileId"
            placeholder="Profile id"
            defaultValue={listParams.profileId ?? ""}
          />
        </label>
        <label>
          <span className="metric-label">Status</span>
          <select className="select" name="status" defaultValue={listParams.status ?? "attempted"}>
            <option value="attempted">Attempted (hides prepared)</option>
            <option value="all">All statuses</option>
            <option value="failed">Failed</option>
            <option value="ready_for_review">Ready for review</option>
            <option value="confirmed">Confirmed</option>
            <option value="analyzing">Analyzing</option>
            <option value="prepared">Prepared</option>
            <option value="cancelled">Cancelled (abandoned)</option>
          </select>
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
          <span className="metric-label">AI state</span>
          <select className="select" name="aiState" defaultValue={listParams.aiState ?? "all"}>
            <option value="all">All AI states</option>
            <option value="successful_ai">Successful AI</option>
            <option value="failed_ai">Failed AI</option>
            <option value="not_analyzed">Not analyzed</option>
          </select>
        </label>
        <label>
          <span className="metric-label">Image</span>
          <select className="select" name="image" defaultValue={listParams.image ?? "all"}>
            <option value="all">All images</option>
            <option value="has_image">Has image</option>
            <option value="no_image">No image</option>
          </select>
        </label>
        <button className="button" type="submit">
          Apply
        </button>
      </form>

      <form className="toolbar toolbar-four" action={`/${project}/scans`}>
        <input name="page" type="hidden" value="1" />
        {hiddenFilters(listParams, [
          "model",
          "promptVersion",
          "appVersion",
          "appBuild",
          "from",
          "to",
          "page",
          "pageSize",
        ]).map(([key, value]) => (
          <input key={key} name={key} type="hidden" value={value} />
        ))}
        <label>
          <span className="metric-label">Model</span>
          <input
            className="input"
            name="model"
            placeholder="gemini-2.5-flash"
            defaultValue={listParams.model ?? ""}
          />
        </label>
        <label>
          <span className="metric-label">Prompt</span>
          <input
            className="input"
            name="promptVersion"
            placeholder="gemini_food_photo_v5"
            defaultValue={listParams.promptVersion ?? ""}
          />
        </label>
        <label>
          <span className="metric-label">App version</span>
          <input
            className="input"
            name="appVersion"
            placeholder="1.0.0"
            defaultValue={listParams.appVersion ?? ""}
          />
        </label>
        <label>
          <span className="metric-label">Build</span>
          <input
            className="input"
            name="appBuild"
            placeholder="12"
            defaultValue={listParams.appBuild ?? ""}
          />
        </label>
        <label>
          <span className="metric-label">From</span>
          <input className="input" name="from" type="date" defaultValue={listParams.from ?? ""} />
        </label>
        <label>
          <span className="metric-label">To</span>
          <input className="input" name="to" type="date" defaultValue={listParams.to ?? ""} />
        </label>
        <label>
          <span className="metric-label">Rows</span>
          <select className="select" name="pageSize" defaultValue={listParams.pageSize ?? "50"}>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </label>
        <button className="button button-secondary" type="submit">
          Refine
        </button>
      </form>

      <section className="grid">
        <div className="panel">
          <div className="section-head">
            <h2 className="text-xl font-bold">Scan sessions</h2>
            <ResultSummary pageInfo={effectivePageInfo} noun="scans" />
          </div>
          <div className="table-wrap">
            <table className="table table-compact">
              <thead>
                <tr>
                  <th>
                    <SortableHeader
                      basePath={`/${project}/scans`}
                      params={listParams}
                      pageInfo={effectivePageInfo}
                      sort="createdAt"
                    >
                      Created
                    </SortableHeader>
                  </th>
                  <th>User</th>
                  <th>
                    <SortableHeader
                      basePath={`/${project}/scans`}
                      params={listParams}
                      pageInfo={effectivePageInfo}
                      sort="platform"
                    >
                      Platform
                    </SortableHeader>
                  </th>
                  <th>
                    <SortableHeader
                      basePath={`/${project}/scans`}
                      params={listParams}
                      pageInfo={effectivePageInfo}
                      sort="model"
                    >
                      Model
                    </SortableHeader>
                  </th>
                  <th>
                    <SortableHeader
                      basePath={`/${project}/scans`}
                      params={listParams}
                      pageInfo={effectivePageInfo}
                      sort="status"
                    >
                      Status
                    </SortableHeader>
                  </th>
                  <th>
                    <SortableHeader
                      basePath={`/${project}/scans`}
                      params={listParams}
                      pageInfo={effectivePageInfo}
                      sort="latencyMs"
                    >
                      Latency
                    </SortableHeader>
                  </th>
                  <th>
                    <SortableHeader
                      basePath={`/${project}/scans`}
                      params={listParams}
                      pageInfo={effectivePageInfo}
                      sort="confidence"
                    >
                      Conf.
                    </SortableHeader>
                  </th>
                  <th>
                    <SortableHeader
                      basePath={`/${project}/scans`}
                      params={listParams}
                      pageInfo={effectivePageInfo}
                      sort="updatedAt"
                    >
                      Updated
                    </SortableHeader>
                  </th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {visibleScans.map((scan) => (
                  <tr
                    aria-selected={params.scanId === scan.id}
                    className={params.scanId === scan.id ? "row-selected" : undefined}
                    key={scan.id}
                  >
                    <td>
                      <div className="font-semibold truncate-cell" title={scan.id}>
                        {scan.meal?.title ?? shortId(scan.id)}
                      </div>
                      <div className="muted text-xs">{formatDate(scan.createdAt)}</div>
                      <div className="muted text-xs" title={scan.id}>
                        {shortId(scan.id)}
                      </div>
                    </td>
                    <td>
                      {scan.profileId ? (
                        <Link
                          className="font-semibold truncate-cell"
                          href={`/${project}/users?profileId=${scan.profileId}`}
                          title={scan.profileDisplayName ?? scan.profileEmail ?? scan.profileId}
                        >
                          {scanUserLabel(scan)}
                        </Link>
                      ) : (
                        <span className="font-semibold">Unlinked profile</span>
                      )}
                      <div className="muted text-xs truncate-cell" title={scan.profileId}>
                        {scan.profileEmail && scan.profileDisplayName
                          ? scan.profileEmail
                          : scan.profileId
                            ? shortId(scan.profileId)
                            : "AI retained after deletion"}
                      </div>
                    </td>
                    <td>
                      <Badge>{platformLabel(scan.platform)}</Badge>
                      <div className="muted mt-1 text-xs">
                        {scan.appVersion ?? "unknown"} ({scan.appBuild ?? 0})
                      </div>
                      <div className="muted text-xs truncate-cell" title={scanLocationLabel(scan)}>
                        {scanLocationLabel(scan)}
                      </div>
                    </td>
                    <td>
                      <div>{scan.ai?.model ?? "not analyzed"}</div>
                      {scan.ai?.promptVersion ? (
                        <div className="muted text-xs">{scan.ai.promptVersion}</div>
                      ) : null}
                    </td>
                    <td>
                      <Badge tone={scanStatusTone(scan.status)}>{scan.status}</Badge>
                      {scan.ai?.errorCode ? (
                        <div className="muted mt-1 text-xs">{scan.ai.errorCode}</div>
                      ) : null}
                    </td>
                    <td>{scan.ai?.latencyMs ? `${formatNumber(scan.ai.latencyMs)} ms` : "None"}</td>
                    <td>
                      {typeof scan.ai?.confidence === "number"
                        ? `${Math.round(scan.ai.confidence * 100)}%`
                        : "None"}
                    </td>
                    <td>{formatDate(scan.updatedAt)}</td>
                    <td className="table-actions">
                      <Link
                        className="badge"
                        href={hrefWithParams(`/${project}/scans`, listParams, { scanId: scan.id })}
                      >
                        Inspect
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {visibleScans.length === 0 ? (
              <EmptyState
                title="No scans matched"
                body="Try removing filters or searching by the exact scan id."
              />
            ) : null}
          </div>
          <Pagination
            basePath={`/${project}/scans`}
            params={listParams}
            pageInfo={effectivePageInfo}
          />
        </div>
      </section>
    </AdminShell>
  );
}

function ScanVolumeCard({ counts }: { counts: AdminScanCounts }) {
  return (
    <section className="panel">
      <div className="section-head">
        <div>
          <h2 className="text-xl font-bold">Scan volume</h2>
          <p className="muted text-sm">
            Real scans only; abandoned camera warm-ups are excluded. Today is IST calendar day.
          </p>
        </div>
      </div>
      <div className="stat-strip mt-4">
        <div className="stat-tile">
          <div className="metric-label">Today</div>
          <div className="metric-value mt-1">{formatNumber(counts.today)}</div>
        </div>
        <div className="stat-tile">
          <div className="metric-label">Last 7 days</div>
          <div className="metric-value mt-1">{formatNumber(counts.last7d)}</div>
        </div>
        <div className="stat-tile">
          <div className="metric-label">Last 30 days</div>
          <div className="metric-value mt-1">{formatNumber(counts.last30d)}</div>
        </div>
        <div className="stat-tile">
          <div className="metric-label">All time</div>
          <div className="metric-value mt-1">{formatNumber(counts.total)}</div>
        </div>
      </div>
    </section>
  );
}

function ScanDetail({ scan }: { scan?: AdminScan }) {
  if (!scan) {
    return (
      <div className="panel">
        <h2 className="text-xl font-bold">Scan detail</h2>
        <p className="muted mt-3">Choose a scan to inspect.</p>
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="section-head">
        <h2 className="text-xl font-bold">Scan detail</h2>
        <Badge tone={scanStatusTone(scan.status)}>{scan.status}</Badge>
      </div>
      <div className="stat-strip">
        <div className="stat-tile">
          <div className="metric-label">Model</div>
          <div className="mt-1 font-semibold">{scan.ai?.model ?? "Not analyzed"}</div>
        </div>
        <div className="stat-tile">
          <div className="metric-label">Latency</div>
          <div className="mt-1 font-semibold">
            {scan.ai?.latencyMs ? `${formatNumber(scan.ai.latencyMs)} ms` : "None"}
          </div>
        </div>
        <div className="stat-tile">
          <div className="metric-label">Confidence</div>
          <div className="mt-1 font-semibold">
            {typeof scan.ai?.confidence === "number"
              ? `${Math.round(scan.ai.confidence * 100)}%`
              : "None"}
          </div>
        </div>
        <div className="stat-tile">
          <div className="metric-label">Image</div>
          <div className="mt-1 font-semibold">{scan.image ? "Stored" : "Missing"}</div>
        </div>
      </div>

      {scan.image ? (
        <div className="scan-image-preview mt-5">
          <div className="section-head mb-3">
            <div>
              <div className="metric-label">Food photo</div>
              <div className="muted text-sm">
                {scan.image.mimeType ?? "image"} ·{" "}
                {scan.image.byteSize ? formatBytes(scan.image.byteSize) : "size unknown"}
              </div>
            </div>
            {scan.image.url ? (
              <a className="badge" href={scan.image.url} rel="noreferrer" target="_blank">
                Open original
              </a>
            ) : null}
          </div>
          {scan.image.url ? (
            <a href={scan.image.url} rel="noreferrer" target="_blank">
              <img
                alt={`Food photo for scan ${scan.id}`}
                className="scan-image"
                src={scan.image.url}
              />
            </a>
          ) : (
            <div className="panel-light rounded-lg p-4">
              <div className="font-semibold">Image stored, preview unavailable</div>
              <p className="muted mt-1 text-sm">
                The object key is present, but the admin API could not create a temporary read URL.
              </p>
            </div>
          )}
        </div>
      ) : null}

      <div className="detail-grid mt-5">
        <Detail label="Scan id" value={scan.id} />
        <Detail label="Profile" value={scanUserLabel(scan)} />
        <Detail label="Profile id" value={scan.profileId ?? "Unlinked profile"} />
        <Detail label="Profile auth" value={scan.profileAuthMethod ?? "Unknown"} />
        <Detail label="Profile timezone" value={scan.profileTimezone ?? "Unknown"} />
        <Detail label="Install" value={scan.installId ?? "Unknown"} />
        <Detail label="Platform" value={platformLabel(scan.platform)} />
        <Detail label="App" value={`${scan.appVersion ?? "unknown"} (${scan.appBuild ?? 0})`} />
        <Detail label="Device timezone" value={scan.deviceTimezone ?? "Unknown"} />
        <Detail label="Device region" value={scan.deviceRegion ?? "Unknown"} />
        <Detail label="Device locale" value={scan.deviceLocale ?? "Unknown"} />
        <Detail label="Created" value={formatDate(scan.createdAt)} />
        <Detail label="Updated" value={formatDate(scan.updatedAt)} />
        <Detail label="User note" value={scan.userHint ?? "None"} />
        <Detail label="Meal" value={scan.meal?.title ?? "No meal linked"} />
        <Detail label="Prompt" value={scan.ai?.promptVersion ?? "None"} />
        <Detail label="Credit reason" value={scan.creditReason ?? "None"} />
        <Detail
          label="Image size"
          value={scan.image?.byteSize ? formatBytes(scan.image.byteSize) : "No stored image"}
        />
        <Detail label="Image MIME" value={scan.image?.mimeType ?? "None"} />
        <div className="detail-grid-full">
          <Detail label="Image object" value={scan.image?.objectKey ?? "No stored image"} />
        </div>
        <div className="detail-grid-full">
          <div className="metric-label">AI output</div>
          <pre className="code-block mt-2 max-h-[460px] overflow-auto">
            {JSON.stringify(scan.rawAiJson ?? null, null, 2)}
          </pre>
        </div>
      </div>
    </div>
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

function scanListParams(params: ScansSearchParams): QueryParams {
  return {
    query: params.query,
    profileId: params.profileId,
    platform: params.platform ?? "all",
    appVersion: params.appVersion,
    appBuild: params.appBuild,
    status: params.status ?? "attempted",
    model: params.model,
    promptVersion: params.promptVersion,
    aiState: params.aiState ?? "all",
    image: params.image ?? "all",
    from: params.from,
    to: params.to,
    page: params.page ?? "1",
    pageSize: params.pageSize ?? "50",
    sort: params.sort ?? "createdAt",
    direction: params.direction ?? "desc",
  };
}

function platformLabel(value: string | undefined) {
  if (value === "ios") return "iOS";
  if (value === "android") return "Android";
  return "Unknown";
}

function scanStatusTone(status: string) {
  if (status === "failed") return "red";
  if (status === "confirmed" || status === "ready_for_review") return "green";
  if (status === "cancelled") return "gray";
  return "default";
}

function scanUserLabel(scan: Pick<AdminScan, "profileDisplayName" | "profileEmail" | "profileId">) {
  return personLabel({
    displayName: scan.profileDisplayName,
    email: scan.profileEmail,
    fallback: scan.profileId ? `Profile ${shortId(scan.profileId)}` : "Unlinked profile",
  });
}

function scanLocationLabel(scan: AdminScan) {
  const parts = [scan.deviceTimezone, scan.deviceRegion, scan.deviceLocale].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : "No device location";
}

function toScanApiQuery(params: QueryParams) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (!value || value === "all") continue;
    query.set(key, value);
  }
  return query;
}

function hiddenFilters(params: QueryParams, omit: string[]) {
  return Object.entries(params).filter(([key, value]) => value && !omit.includes(key));
}

function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}
