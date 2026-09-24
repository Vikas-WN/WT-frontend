"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { ScrollableTable } from "@/components/dashboard/ui/ScrollableTable";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  WT_STICKY_TABLE_HEAD_CLASS,
  WtTable,
} from "@/components/dashboard/ui/wtTable";
import {
  WT_TABLE_CELL_COMPACT_CLASS,
  WT_TABLE_HEAD_COMPACT_CLASS,
} from "@/components/dashboard/ui/tableLayout";
import {
  ManagementListCard,
  ManagementListContent,
} from "@/components/dashboard/ui/ManagementListCard";
import { SearchInput } from "@/components/dashboard/ui/SearchInput";
import { ToolbarFilterSelect } from "@/components/dashboard/ui/ToolbarFilterSelect";
import { RefreshIconButton } from "@/components/dashboard/ui/RefreshIconButton";
import { EmployeeStatusBadge } from "@/components/dashboard/ui/WtStatusBadge";
import { filledBadgeClass } from "@/components/dashboard/ui/badgeTones";
import { ListPagination } from "@/components/dashboard/ui/ListPagination";
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from "@/hooks/useClientPagination";
import { useComplianceNudges } from "@/hooks/compliance/useComplianceNudges";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useAuth } from "@/context/AuthContext";
import { DASHBOARD_ROUTES } from "@/constants/routes";
import { formatApiDateDisplay } from "@/utils/apiDate";
import type { ComplianceCategory, ComplianceFlagItem } from "@/services/hrms.service";

const CATEGORY_META: Record<ComplianceCategory, { label: string; emptyLabel: string }> = {
  missing_documents: {
    label: "Missing Documents",
    emptyLabel: "All active employees have their documents on file.",
  },
  missing_personal_info: {
    label: "Missing Personal Info",
    emptyLabel: "No personal-info gaps found.",
  },
  exit_survey_pending: {
    label: "Exit Survey Pending",
    emptyLabel: "Every upcoming exit has a submitted survey.",
  },
};

function StatChip({ label, value, active }: { label: string; value: number; active: boolean }) {
  return (
    <div
      className={cn(
        "rounded-xl border px-3.5 py-2.5 transition-colors",
        active
          ? "border-[var(--wt-brand)] bg-[var(--wt-brand-soft)]"
          : "border-wt-border bg-wt-surface-2/60"
      )}
    >
      <p className="text-[11px] font-medium uppercase tracking-wide text-wt-text-muted">{label}</p>
      <p className="mt-0.5 text-lg font-semibold tabular-nums tracking-tight text-wt-text">{value}</p>
    </div>
  );
}

function FlagsCell({ flags }: { flags: string[] }) {
  return (
    <div className="flex max-w-[16rem] flex-wrap gap-1.5">
      {flags.map((flag) => (
        <Badge key={flag} variant="secondary" className={filledBadgeClass("warning")}>
          {flag}
        </Badge>
      ))}
    </div>
  );
}

function EmployeeCell({ item }: { item: ComplianceFlagItem }) {
  const href = item.emp_id
    ? `/dashboard/employee-directory/${encodeURIComponent(item.emp_id)}`
    : null;
  const content = (
    <div className="min-w-0 max-w-[14rem]">
      <p className="truncate font-medium text-wt-text">{item.name}</p>
      <p className="truncate text-xs text-wt-text-muted" title={item.email}>
        {item.email}
      </p>
    </div>
  );
  return href ? (
    <Link href={href} className="hover:underline">
      {content}
    </Link>
  ) : (
    content
  );
}

export function CompliancePageClient() {
  const { user, status: authStatus } = useAuth();
  const roles = user?.roles ?? [];
  const canView = roles.includes("ROLE_HR") || roles.includes("ROLE_ADMIN");
  const queriesEnabled = authStatus === "authenticated" && canView;

  const [category, setCategory] = useState<ComplianceCategory>("missing_documents");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  useEffect(() => {
    setPage(0);
  }, [category, debouncedSearch, pageSize]);

  const { data, isLoading, isError, refetch, isFetching } = useComplianceNudges({
    enabled: queriesEnabled,
    category,
    page,
    pageSize,
    search: debouncedSearch.trim() || undefined,
  });

  const items = data?.items ?? [];
  const counts = data?.counts;
  const totalItems = data?.total ?? 0;
  const totalPages = Math.max(data?.total_pages ?? 1, 1);
  const rangeStart = totalItems === 0 ? 0 : page * pageSize + 1;
  const rangeEnd = totalItems === 0 ? 0 : Math.min((page + 1) * pageSize, totalItems);
  const meta = CATEGORY_META[category];
  const showLastWorkingDay = category === "exit_survey_pending";

  if (authStatus !== "loading" && !canView) {
    return (
      <DashboardPageShell>
        <div className="rounded-2xl border border-wt-border bg-wt-surface-1 p-8 shadow-sm">
          <h3 className="text-lg font-semibold">Access Restricted</h3>
          <p className="mt-2 text-sm text-wt-text-muted">
            Compliance is available to HR and admin only.
          </p>
          <Link
            href={DASHBOARD_ROUTES.profile}
            className="mt-4 inline-block text-sm text-[var(--wt-brand)] hover:underline"
          >
            Back To Home
          </Link>
        </div>
      </DashboardPageShell>
    );
  }

  return (
    <DashboardPageShell className="wt-detail-page">
      <ManagementListCard
        density="compact"
        title="Compliance"
        description="Proactive flags for the active workforce — catch gaps before they surface during offboarding."
        headerAction={
          <RefreshIconButton onClick={() => void refetch()} loading={isLoading || isFetching} />
        }
        search={
          <SearchInput
            id="compliance-search"
            value={search}
            onChange={setSearch}
            placeholder="Search by name, email, or emp id"
            aria-label="Search flagged employees"
            className="h-9 border-wt-border bg-wt-surface-1 shadow-sm"
          />
        }
        filters={
          <ToolbarFilterSelect
            id="compliance-category-filter"
            value={category}
            onChange={(value) => setCategory(value as ComplianceCategory)}
            options={[
              { value: "missing_documents", label: "Missing Documents" },
              { value: "missing_personal_info", label: "Missing Personal Info" },
              { value: "exit_survey_pending", label: "Exit Survey Pending" },
            ]}
            aria-label="Filter by category"
            compact
          />
        }
      >
        {isError ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">
            <p>Could not load compliance data.</p>
          </div>
        ) : null}

        {counts ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <StatChip label="Total Flagged" value={counts.total_flagged} active={false} />
            <StatChip
              label="Missing Documents"
              value={counts.missing_documents}
              active={category === "missing_documents"}
            />
            <StatChip
              label="Missing Personal Info"
              value={counts.missing_personal_info}
              active={category === "missing_personal_info"}
            />
            <StatChip
              label="Exit Survey Pending"
              value={counts.exit_survey_pending}
              active={category === "exit_survey_pending"}
            />
          </div>
        ) : null}

        <ManagementListContent
          isLoading={isLoading && !items.length}
          isEmpty={!isError && !items.length}
          emptyTitle="Nothing needs attention"
          emptyDescription={
            search.trim() ? "Try adjusting your search." : meta.emptyLabel
          }
          emptyIcon={<ShieldCheck className="size-5" aria-hidden />}
          skeletonRows={8}
          skeletonColumns={showLastWorkingDay ? 4 : 3}
        >
          <div className="wt-detail-scroll-section min-h-0">
            <ScrollableTable scrollChain maxHeightClass="max-h-[min(68vh,640px)]">
              <WtTable className="w-full text-sm">
                <TableHeader className={WT_STICKY_TABLE_HEAD_CLASS}>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className={WT_TABLE_HEAD_COMPACT_CLASS}>Employee</TableHead>
                    <TableHead className={WT_TABLE_HEAD_COMPACT_CLASS}>Status</TableHead>
                    <TableHead className={WT_TABLE_HEAD_COMPACT_CLASS}>Flags</TableHead>
                    {showLastWorkingDay ? (
                      <TableHead className={WT_TABLE_HEAD_COMPACT_CLASS}>
                        Last Working Day
                      </TableHead>
                    ) : null}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={`${item.emp_id ?? item.email}-${item.flags.join(",")}`}>
                      <TableCell className={cn(WT_TABLE_CELL_COMPACT_CLASS, "align-top")}>
                        <EmployeeCell item={item} />
                      </TableCell>
                      <TableCell className={cn(WT_TABLE_CELL_COMPACT_CLASS, "align-top")}>
                        <EmployeeStatusBadge status={item.status} />
                      </TableCell>
                      <TableCell className={cn(WT_TABLE_CELL_COMPACT_CLASS, "align-top")}>
                        <FlagsCell flags={item.flags} />
                      </TableCell>
                      {showLastWorkingDay ? (
                        <TableCell className={cn(WT_TABLE_CELL_COMPACT_CLASS, "align-top")}>
                          {item.last_working_day ? (
                            formatApiDateDisplay(item.last_working_day)
                          ) : (
                            <span className="text-wt-text-muted">—</span>
                          )}
                        </TableCell>
                      ) : null}
                    </TableRow>
                  ))}
                </TableBody>
              </WtTable>
            </ScrollableTable>
          </div>

          {totalItems > 0 ? (
            <ListPagination
              page={page}
              totalPages={totalPages}
              totalItems={totalItems}
              rangeStart={rangeStart}
              rangeEnd={rangeEnd}
              pageSize={pageSize}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(0);
              }}
              loading={isFetching}
              className="mt-3"
            />
          ) : null}
        </ManagementListContent>
      </ManagementListCard>
    </DashboardPageShell>
  );
}
