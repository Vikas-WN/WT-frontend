"use client";

import { useEffect, useMemo, useState } from "react";
import { Briefcase, Trash2, Users } from "lucide-react";
import { WtFormDialog } from "@/components/allocation/WtFormDialog";
import { SearchInput } from "@/components/dashboard/ui/SearchInput";
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
import { TableRowsSkeleton } from "@/components/dashboard/ui/SectionSkeleton";
import { EmptyState } from "@/components/dashboard/ui/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { filledBadgeClass } from "@/components/dashboard/ui/badgeTones";
import { RefreshIconButton } from "@/components/dashboard/ui/RefreshIconButton";
import { useAllocationProjectEmployees } from "@/hooks/useAllocationProjectEmployees";
import { useClientOpportunities } from "@/hooks/clients/useClientOpportunities";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { hrmsService } from "@/services/hrms.service";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { formatApiDateDisplay } from "@/utils/apiDate";
import { formatOpportunityLabel } from "@/utils/opportunity";
import type { OpportunityRecord } from "@/types/opportunity";
import { cn } from "@/lib/utils";

function OpportunityStatus({ status }: { status: string | null }) {
  if (!status) return <span className="text-wt-text-muted">—</span>;
  const key = status.trim().toLowerCase();
  const tone =
    key === "open" ? "info" : key === "won" ? "success" : key === "lost" ? "danger" : "neutral";
  return (
    <Badge variant="secondary" className={filledBadgeClass(tone)}>
      {formatOpportunityLabel(status)}
    </Badge>
  );
}
export type ProjectDetailContext = {
  code: string;
  name: string;
  clientExternalId?: string | null;
  clientName?: string | null;
  projectType?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  opportunityIds?: string[];
};

export function ProjectEmployeesDetailDialog({
  open,
  projectCode,
  projectName,
  clientExternalId,
  clientName,
  projectType,
  startDate,
  endDate,
  opportunityIds,
  onClose,
}: {
  open: boolean;
  projectCode: string;
  projectName?: string;
  clientExternalId?: string | null;
  clientName?: string | null;
  projectType?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  opportunityIds?: string[];
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const [deallocatingId, setDeallocatingId] = useState<number | null>(null);
  const debouncedSearch = useDebouncedValue(search, 250);
  const code = projectCode.trim();
  const wkClientId = String(clientExternalId ?? "").trim() || null;
  const linkedOppIds = useMemo(
    () =>
      (opportunityIds ?? [])
        .map((id) => String(id ?? "").trim())
        .filter(Boolean),
    [opportunityIds]
  );
  const linkedOppKeys = useMemo(
    () => new Set(linkedOppIds.map((id) => id.toUpperCase())),
    [linkedOppIds]
  );

  const employeesQ = useAllocationProjectEmployees(
    code,
    open && Boolean(code),
    debouncedSearch.trim() || undefined
  );
  const opportunitiesQ = useClientOpportunities({
    clientId: wkClientId,
    enabled: open && Boolean(wkClientId),
  });

  useEffect(() => {
    if (!open) {
      setSearch("");
      setDeallocatingId(null);
    }
  }, [open, code]);

  const employees = employeesQ.data?.employees ?? [];
  const metaName = employeesQ.data?.meta.projectName;
  const titleName = projectName?.trim() || metaName || code;
  const rows = useMemo(() => employees, [employees]);
  const opportunities = useMemo(
    () => opportunitiesQ.data?.items ?? [],
    [opportunitiesQ.data]
  );

  async function handleDeallocate(allocationId: number | null | undefined) {
    if (allocationId == null || deallocatingId != null) return;
    setDeallocatingId(allocationId);
    try {
      await hrmsService.deleteAllocation(String(allocationId));
      showSuccessToast("Employee deallocated. Capacity returned to the talent pool.");
      await employeesQ.refetch();
    } catch (error) {
      showErrorToast(error instanceof Error ? error.message : "Could not deallocate employee.");
    } finally {
      setDeallocatingId(null);
    }
  }

  return (
    <WtFormDialog
      open={open && Boolean(code)}
      title={titleName}
      description="Project details, client opportunities, and active employees."
      onClose={() => {
        setSearch("");
        onClose();
      }}
      maxWidthClass="max-w-5xl"
    >
      <div className="space-y-6">
        <section className="grid gap-3 rounded-xl border border-wt-border bg-wt-surface-1 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-wt-text-muted">Project code</p>
            <p className="mt-0.5 text-sm font-medium text-wt-text">{code || "—"}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-wt-text-muted">Client</p>
            <p className="mt-0.5 text-sm font-medium text-wt-text">{clientName?.trim() || "—"}</p>
            {wkClientId ? (
              <p className="mt-0.5 truncate text-[11px] text-wt-text-faint" title={wkClientId}>
                {wkClientId}
              </p>
            ) : null}
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-wt-text-muted">Type</p>
            <p className="mt-0.5 text-sm font-medium text-wt-text">{projectType?.trim() || "—"}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-wt-text-muted">Dates</p>
            <p className="mt-0.5 text-sm font-medium text-wt-text">
              {(formatApiDateDisplay(startDate ?? "") || "—") +
                " → " +
                (endDate ? formatApiDateDisplay(endDate) || "—" : "Open")}
            </p>
          </div>
        </section>

        <section>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-wt-text">Opportunities</h3>
            <div className="flex items-center gap-2">
              {!opportunitiesQ.isLoading && !opportunitiesQ.isError && wkClientId ? (
                <p className="text-xs text-wt-text-muted tabular-nums">
                  {opportunities.length} opportunit
                  {opportunities.length === 1 ? "y" : "ies"}
                  {linkedOppIds.length ? ` · ${linkedOppIds.length} linked` : ""}
                </p>
              ) : null}
              {wkClientId ? (
                <RefreshIconButton
                  onClick={() => void opportunitiesQ.refetch()}
                  loading={opportunitiesQ.isFetching}
                  label="Refresh opportunities"
                />
              ) : null}
            </div>
          </div>
          {!wkClientId ? (
            <EmptyState
              title="No WK client linked"
              description="This project has no WK Business client id, so opportunities cannot be loaded."
              icon={<Briefcase className="size-5" aria-hidden />}
            />
          ) : opportunitiesQ.isLoading ? (
            <TableRowsSkeleton rows={4} columns={5} />
          ) : opportunitiesQ.isError ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
              Could not load opportunities for this client.
            </div>
          ) : !opportunities.length ? (
            <EmptyState
              title="No opportunities"
              description="No opportunities are currently linked to this client."
              icon={<Briefcase className="size-5" aria-hidden />}
            />
          ) : (
            <ScrollableTable maxHeightClass="max-h-[min(35vh,280px)]">
              <WtTable className="w-full text-sm">
                <TableHeader className={WT_STICKY_TABLE_HEAD_CLASS}>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Opportunity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Domain</TableHead>
                    <TableHead>Business Type</TableHead>
                    <TableHead className="text-right">Probability</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {opportunities.map((opp: OpportunityRecord) => {
                    const isLinked =
                      Boolean(opp.oppId) && linkedOppKeys.has(String(opp.oppId).toUpperCase());
                    return (
                      <TableRow
                        key={opp.id}
                        className={cn(isLinked && "bg-blue-50/40 dark:bg-wt-surface-2/60")}
                      >
                        <TableCell className="align-top">
                          <div className="min-w-0 max-w-[18rem]">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <p className="font-medium text-wt-text">{opp.opportunityName}</p>
                              {isLinked ? (
                                <Badge
                                  variant="secondary"
                                  className={cn(filledBadgeClass("info"), "text-[10px]")}
                                >
                                  Linked
                                </Badge>
                              ) : null}
                            </div>
                            {opp.oppId ? (
                              <p className="text-[11px] text-wt-text-faint">{opp.oppId}</p>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="align-top whitespace-nowrap">
                          <OpportunityStatus status={opp.currentStatus} />
                        </TableCell>
                        <TableCell className="align-top whitespace-nowrap">
                          {opp.domain || "—"}
                        </TableCell>
                        <TableCell className="align-top whitespace-nowrap">
                          {opp.businessType || "—"}
                        </TableCell>
                        <TableCell className="align-top whitespace-nowrap text-right tabular-nums">
                          {opp.probabilityPercent != null ? `${opp.probabilityPercent}%` : "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </WtTable>
            </ScrollableTable>
          )}
        </section>

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-wt-text">Employees</h3>
            <div className="flex items-center gap-2">
              {!employeesQ.isLoading && !employeesQ.isError ? (
                <p className="text-xs text-wt-text-muted tabular-nums">
                  {rows.length} allocation{rows.length === 1 ? "" : "s"}
                </p>
              ) : null}
              <RefreshIconButton
                onClick={() => void employeesQ.refetch()}
                loading={employeesQ.isFetching}
                label="Refresh project employees"
              />
            </div>
          </div>

          <SearchInput
            id="project-employees-search"
            value={search}
            onChange={setSearch}
            placeholder="Search employee name, email, or emp id"
            aria-label="Search project employees"
            className="h-9 min-w-[16rem] w-full border-wt-border bg-wt-surface-1 shadow-sm sm:max-w-md"
          />

          {employeesQ.isLoading ? (
            <TableRowsSkeleton rows={5} columns={6} />
          ) : employeesQ.isError ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
              Could not load employees for this project.
            </div>
          ) : !rows.length ? (
            <EmptyState
              title="No active employees"
              description="There are no current allocations on this project."
              icon={<Users className="size-5" aria-hidden />}
            />
          ) : (
            <ScrollableTable maxHeightClass="max-h-[min(45vh,360px)]">
              <WtTable className="w-full text-sm">
                <TableHeader className={WT_STICKY_TABLE_HEAD_CLASS}>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Employee</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Allocation %</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, idx) => (
                    <TableRow
                      key={
                        row.allocationId != null
                          ? `alloc-${row.allocationId}`
                          : `${row.employeeEmail}-${row.startDate ?? ""}-${idx}`
                      }
                    >
                      <TableCell className="align-top">
                        <div className="min-w-0 max-w-[16rem]">
                          <p className="truncate font-medium text-wt-text">{row.employeeName}</p>
                          <p className="truncate text-xs text-wt-text-muted">{row.employeeEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell className="align-top whitespace-nowrap">{row.role || "—"}</TableCell>
                      <TableCell className="align-top">
                        {row.allocatedPercent != null ? (
                          <Badge
                            variant="secondary"
                            className={cn(filledBadgeClass("info"), "tabular-nums")}
                          >
                            {row.allocatedPercent}%
                          </Badge>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="align-top whitespace-nowrap">
                        {formatApiDateDisplay(row.startDate ?? "") || "—"}
                      </TableCell>
                      <TableCell className="align-top whitespace-nowrap">
                        {row.endDate ? formatApiDateDisplay(row.endDate) || "—" : "Open"}
                      </TableCell>
                      <TableCell className="align-top text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-rose-600 hover:bg-rose-500/10 hover:text-rose-700"
                          disabled={row.allocationId == null || deallocatingId === row.allocationId}
                          title="Deallocate from project (returns to talent pool)"
                          onClick={() => void handleDeallocate(row.allocationId)}
                        >
                          <Trash2 className="size-4" aria-hidden />
                          Deallocate
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </WtTable>
            </ScrollableTable>
          )}
        </section>
      </div>
    </WtFormDialog>
  );
}
