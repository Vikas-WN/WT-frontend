"use client";

import { useEffect, useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
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
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { hrmsService } from "@/services/hrms.service";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { formatApiDateDisplay } from "@/utils/apiDate";
import { Users } from "lucide-react";
import { cn } from "@/lib/utils";

export function ProjectEmployeesDetailDialog({
  open,
  projectCode,
  projectName,
  onClose,
}: {
  open: boolean;
  projectCode: string;
  projectName?: string;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const [deallocatingId, setDeallocatingId] = useState<number | null>(null);
  const debouncedSearch = useDebouncedValue(search, 250);
  const code = projectCode.trim();
  const employeesQ = useAllocationProjectEmployees(
    code,
    open && Boolean(code),
    debouncedSearch.trim() || undefined
  );

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
      description="Active employees on this project. Deallocating returns freed capacity to the talent pool."
      onClose={() => {
        setSearch("");
        onClose();
      }}
      maxWidthClass="max-w-4xl"
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <SearchInput
            id="project-employees-search"
            value={search}
            onChange={setSearch}
            placeholder="Search employee name, email, or emp id"
            aria-label="Search project employees"
            className="h-9 min-w-[16rem] flex-1 border-wt-border bg-wt-surface-1 shadow-sm"
          />
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
          <ScrollableTable maxHeightClass="max-h-[min(55vh,440px)]">
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
      </div>
    </WtFormDialog>
  );
}
