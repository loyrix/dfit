import Link from "next/link";
import type { PageInfo } from "../lib/api";

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="page-head">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1 className="title">{title}</h1>
        {description ? <p className="muted mt-3 max-w-2xl">{description}</p> : null}
      </div>
      {action}
    </header>
  );
}

export function Metric({
  label,
  value,
  sub,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
}) {
  return (
    <div className="panel">
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      {sub ? <div className="muted mt-1 text-sm">{sub}</div> : null}
    </div>
  );
}

export function Badge({
  children,
  tone = "default",
}: {
  children: React.ReactNode;
  tone?: string;
}) {
  const className =
    tone === "green" ? "badge badge-green" : tone === "red" ? "badge badge-red" : "badge";
  return <span className={className}>{children}</span>;
}

export function EmptyState({ title, body }: { title: string; body?: string }) {
  return (
    <div className="empty-state">
      <div className="font-semibold">{title}</div>
      {body ? <p className="muted mt-1 text-sm">{body}</p> : null}
    </div>
  );
}

export function ResultSummary({ pageInfo, noun }: { pageInfo?: PageInfo; noun: string }) {
  if (!pageInfo) return null;
  const start = pageInfo.total === 0 ? 0 : (pageInfo.page - 1) * pageInfo.pageSize + 1;
  const end = Math.min(pageInfo.total, pageInfo.page * pageInfo.pageSize);
  const fallbackLabel = pageInfo.isClientFallback ? " loaded" : "";
  return (
    <div className="muted text-sm">
      Showing {formatNumber(start)}-{formatNumber(end)} of {formatNumber(pageInfo.total)}
      {fallbackLabel} {noun}
    </div>
  );
}

export function Pagination({
  basePath,
  params,
  pageInfo,
}: {
  basePath: string;
  params: QueryParams;
  pageInfo?: PageInfo;
}) {
  if (!pageInfo) return null;
  return (
    <nav className="pager">
      <Link
        aria-disabled={!pageInfo.hasPreviousPage}
        className={`button button-secondary ${pageInfo.hasPreviousPage ? "" : "is-disabled"}`}
        href={hrefWithParams(basePath, params, { page: String(pageInfo.page - 1) })}
      >
        Previous
      </Link>
      <div className="pager-count">
        Page {formatNumber(pageInfo.page)} of {formatNumber(pageInfo.totalPages)}
      </div>
      <Link
        aria-disabled={!pageInfo.hasNextPage}
        className={`button button-secondary ${pageInfo.hasNextPage ? "" : "is-disabled"}`}
        href={hrefWithParams(basePath, params, { page: String(pageInfo.page + 1) })}
      >
        Next
      </Link>
    </nav>
  );
}

export function SortableHeader({
  basePath,
  params,
  pageInfo,
  sort,
  children,
}: {
  basePath: string;
  params: QueryParams;
  pageInfo?: PageInfo;
  sort: string;
  children: React.ReactNode;
}) {
  const active = pageInfo?.sort === sort;
  const nextDirection = active && pageInfo?.direction === "asc" ? "desc" : "asc";
  return (
    <Link
      className={`sort-link ${active ? "is-active" : ""}`}
      href={hrefWithParams(basePath, params, {
        sort,
        direction: nextDirection,
        page: "1",
      })}
    >
      <span>{children}</span>
      <span aria-hidden>{active ? (pageInfo?.direction === "asc" ? "↑" : "↓") : "↕"}</span>
    </Link>
  );
}

export type QueryParams = Record<string, string | undefined>;

export function fallbackPageInfo(
  params: QueryParams,
  visibleRows: number,
  defaultPageSize: number,
  defaultSort: string,
): PageInfo {
  const pageSize = Number(params.pageSize ?? defaultPageSize);
  const page = Number(params.page ?? 1);
  const normalizedPageSize =
    Number.isFinite(pageSize) && pageSize > 0
      ? Math.min(100, Math.floor(pageSize))
      : defaultPageSize;
  const totalPages = Math.max(1, Math.ceil(visibleRows / normalizedPageSize));
  const normalizedPage =
    Number.isFinite(page) && page > 0 ? Math.min(totalPages, Math.floor(page)) : 1;
  return {
    page: normalizedPage,
    pageSize: normalizedPageSize,
    total: visibleRows,
    totalPages,
    hasPreviousPage: normalizedPage > 1,
    hasNextPage: normalizedPage < totalPages,
    sort: params.sort ?? defaultSort,
    direction: params.direction === "asc" ? "asc" : "desc",
    isClientFallback: true,
  };
}

type SortValue = string | number | boolean | Date | null | undefined;

export function resolveTableState<T>(
  rows: T[],
  pageInfo: PageInfo | undefined,
  params: QueryParams,
  options: {
    defaultPageSize: number;
    defaultSort: string;
    sorters: Record<string, (row: T) => SortValue>;
  },
) {
  if (pageInfo) {
    return { rows, pageInfo };
  }

  const fallback = fallbackPageInfo(
    params,
    rows.length,
    options.defaultPageSize,
    options.defaultSort,
  );
  const sorter = options.sorters[fallback.sort];
  const sortedRows = sorter
    ? [...rows].sort((left, right) =>
        compareSortValues(sorter(left), sorter(right), fallback.direction),
      )
    : [...rows];
  const start = (fallback.page - 1) * fallback.pageSize;

  return {
    rows: sortedRows.slice(start, start + fallback.pageSize),
    pageInfo: fallback,
  };
}

function compareSortValues(left: SortValue, right: SortValue, direction: "asc" | "desc") {
  const leftValue = normalizeSortValue(left);
  const rightValue = normalizeSortValue(right);
  const leftEmpty = leftValue === null;
  const rightEmpty = rightValue === null;

  if (leftEmpty && rightEmpty) return 0;
  if (leftEmpty) return 1;
  if (rightEmpty) return -1;

  const comparison =
    typeof leftValue === "number" && typeof rightValue === "number"
      ? leftValue - rightValue
      : String(leftValue).localeCompare(String(rightValue), "en-IN", {
          numeric: true,
          sensitivity: "base",
        });

  return direction === "asc" ? comparison : comparison * -1;
}

function normalizeSortValue(value: SortValue): string | number | null {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date) return value.getTime();
  if (typeof value === "boolean") return value ? 1 : 0;
  return value;
}

export function hrefWithParams(basePath: string, params: QueryParams, overrides: QueryParams = {}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...params, ...overrides })) {
    const normalized = value?.trim();
    if (!normalized) continue;
    query.set(key, normalized);
  }
  const queryString = query.toString();
  return queryString ? `${basePath}?${queryString}` : basePath;
}

export const formatInr = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);

export const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(value);

export const formatDate = (value: string) =>
  `${new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value))} IST`;
