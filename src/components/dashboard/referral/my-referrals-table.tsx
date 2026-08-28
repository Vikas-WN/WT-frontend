"use client";

import { RefreshCw, ExternalLink, FileText, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  WT_STICKY_TABLE_HEAD_CLASS,
  WT_TABLE_CELL_CLASS,
  WT_TABLE_HEAD_CLASS,
  WtTable,
} from "@/components/dashboard/ui/wtTable";
import { ScrollableTable } from "@/components/dashboard/ui/ScrollableTable";
import { TableRowsSkeleton } from "@/components/dashboard/ui/SectionSkeleton";
import { EmptyState } from "@/components/dashboard/ui/EmptyState";
import { ListPagination } from "@/components/dashboard/ui/ListPagination";
import { useClientPagination, DEFAULT_PAGE_SIZE } from "@/hooks/useClientPagination";
import type { ReferralListItem } from "@/components/dashboard/referral/hooks/use-referral-list";

const TABLE_COLUMNS = [
  "Candidate Name",
  "Email",
  "Resume",
  "Job Position",
  "Status",
  "Referred Date",
] as const;
const COLUMN_COUNT = TABLE_COLUMNS.length;

function formatDate(iso: string): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function ResumeLink({ url }: { url: string | null | undefined }) {
  if (!url) return <span className="text-wt-text-faint">-</span>;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-sm font-medium text-[var(--wt-brand)] hover:underline"
    >
      <FileText className="size-3.5 shrink-0" />
      View
      <ExternalLink className="size-3 shrink-0" />
    </a>
  );
}


function StatusBadge({ status }: { status: string }) {
  const base = "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium";

  if (status === "SUBMITTED") {
    return (
      <span
        className={`${base} bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400`}
      >
        Submitted
      </span>
    );
  }

  return <span className={`${base} bg-wt-surface-2 text-wt-text-muted`}>{status}</span>;
}

function ReferralMobileCard({ referral }: { referral: ReferralListItem }) {
  return (
    <article className="rounded-xl border border-wt-border bg-wt-surface-1 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-wt-text truncate">{referral.candidate_name}</p>
          <p className="text-sm text-wt-text-muted truncate">{referral.candidate_email}</p>
        </div>
      </div>
      <dl className="mt-3 grid gap-2 text-sm">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-wt-text-muted shrink-0">Role</dt>
          <dd className="text-right text-wt-text truncate">{referral.job_title || "—"}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-wt-text-muted shrink-0">Status</dt>
          <dd>
            <StatusBadge status={referral.status} />
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-wt-text-muted shrink-0">Referred</dt>
          <dd className="text-wt-text">{formatDate(referral.created_at)}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-wt-text-muted shrink-0">Resume</dt>
          <dd>
            <ResumeLink url={referral.resume_url} />
          </dd>
        </div>
      </dl>
    </article>
  );
}

export function MyReferralsTable({
  items,
  total,
  isLoading,
  isRefetching = false,
  error,
  onRefresh,
}: {
  items: ReferralListItem[];
  total: number;
  isLoading: boolean;
  isRefetching?: boolean;
  error: string | null;
  onRefresh: () => void;
}) {
  const {
    page,
    setPage,
    pageSize,
    setPageSize,
    pageItems,
    totalItems,
    totalPages,
    rangeStart,
    rangeEnd,
    pageSizeOptions,
  } = useClientPagination(items, {
    pageSize: DEFAULT_PAGE_SIZE,
    resetKeys: [items.length],
  });

  const loading = isLoading || isRefetching;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-end">
          <Button variant="outline" size="sm" className="gap-1.5" disabled>
            <RefreshCw className="size-3.5" />
            Refresh
          </Button>
        </div>
        <TableRowsSkeleton rows={6} columns={COLUMN_COUNT} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" size="sm" className="gap-1.5 self-start" onClick={onRefresh}>
            <RefreshCw className="size-3.5" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-end">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={onRefresh}>
            <RefreshCw className="size-3.5" />
            Refresh
          </Button>
        </div>
        <EmptyState
          title="No referrals yet"
          description="Referrals you submit will appear here"
          icon={<Inbox className="size-5" />}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 min-w-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-wt-text-muted">
          {total} referral{total !== 1 ? "s" : ""} total
        </p>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 self-start sm:self-auto"
          onClick={onRefresh}
          disabled={loading}
        >
          <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Mobile / narrow: card stack */}
      <div className="grid gap-3 md:hidden">
        {pageItems.map((r) => (
          <ReferralMobileCard key={r.id} referral={r} />
        ))}
      </div>

      {/* Tablet / desktop: table */}
      <div className="hidden md:block min-w-0">
        <ScrollableTable maxHeightClass="max-h-[min(68vh,640px)]">
          <WtTable className="w-full min-w-[720px]">
            <TableHeader className={WT_STICKY_TABLE_HEAD_CLASS}>
              <TableRow className="hover:bg-transparent">
                {TABLE_COLUMNS.map((col) => (
                  <TableHead key={col} className={WT_TABLE_HEAD_CLASS}>
                    {col}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.map((r) => (
                <TableRow
                  key={r.id}
                  className="transition hover:bg-blue-50/40 dark:hover:bg-wt-surface-2"
                >
                  <TableCell className={`${WT_TABLE_CELL_CLASS} font-medium text-wt-text`}>
                    {r.candidate_name}
                  </TableCell>
                  <TableCell className={WT_TABLE_CELL_CLASS}>
                    {r.candidate_email}
                  </TableCell>
                  <TableCell className={WT_TABLE_CELL_CLASS}>
                    <ResumeLink url={r.resume_url} />
                  </TableCell>
                  <TableCell className={`${WT_TABLE_CELL_CLASS} text-wt-text`}>
                    {r.job_title}
                  </TableCell>
                  <TableCell className={WT_TABLE_CELL_CLASS}>
                    <StatusBadge status={r.status} />
                  </TableCell>
                  <TableCell className={WT_TABLE_CELL_CLASS}>
                    {formatDate(r.created_at)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </WtTable>
        </ScrollableTable>
      </div>

      <ListPagination
        page={page}
        totalPages={totalPages}
        totalItems={totalItems}
        rangeStart={rangeStart}
        rangeEnd={rangeEnd}
        pageSize={pageSize}
        pageSizeOptions={pageSizeOptions}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  );
}
