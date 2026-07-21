"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { hrmsService } from "@/services/hrms.service";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { formatApiDateDisplay } from "@/utils/apiDate";
import {
  allocationRowId,
  isSystemProjectAllocationRow,
  parseEmployeeAllocationsResponse,
} from "@/utils/allocationList";
import { formatAllocatedPercentDisplay, resolveAllocatedPercentFromRow } from "@/utils/allocationPercent";
import { formatRoleDisplayValue } from "@/utils/roles";
import { formatUiStatusLabel } from "@/utils/statusLabel";

function formatDateLabel(value: unknown): string {
  const text = String(value ?? "").trim();
  if (!text) return "—";
  return formatApiDateDisplay(text);
}

export function EmployeeCurrentAllocationsPanel({
  email,
  onChanged,
}: {
  email: string;
  onChanged?: () => void | Promise<void>;
}) {
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(false);
  const [deallocatingId, setDeallocatingId] = useState("");

  const loadAllocations = useCallback(async () => {
    const normalized = email.trim().toLowerCase();
    if (!normalized) {
      setRows([]);
      return;
    }

    setLoading(true);
    try {
      const res = await hrmsService.getEmployeeAllocations({ userEmail: normalized });
      const parsed = parseEmployeeAllocationsResponse(res.data ?? res);
      const allocations = (parsed?.allocations ?? []).filter(
        (row) => !isSystemProjectAllocationRow(row)
      );
      setRows(allocations);
    } catch (error) {
      setRows([]);
      showErrorToast(
        error instanceof Error ? error.message : "Could not load current allocations."
      );
    } finally {
      setLoading(false);
    }
  }, [email]);

  useEffect(() => {
    void loadAllocations();
  }, [loadAllocations]);

  const summary = useMemo(() => {
    const projectTotal = rows.reduce((sum, row) => {
      const pct = resolveAllocatedPercentFromRow(row);
      return pct != null && Number.isFinite(pct) ? sum + pct : sum;
    }, 0);
    return {
      projectCount: rows.length,
      projectTotal,
      benchTotal: Math.max(0, 100 - projectTotal),
    };
  }, [rows]);

  async function handleDeallocate(allocationId: string) {
    if (!allocationId || deallocatingId) return;
    setDeallocatingId(allocationId);
    try {
      await hrmsService.deleteAllocation(allocationId);
      showSuccessToast("Employee deallocated from project.");
      await loadAllocations();
      await onChanged?.();
    } catch (error) {
      showErrorToast(error instanceof Error ? error.message : "Could not deallocate employee.");
    } finally {
      setDeallocatingId("");
    }
  }

  if (!email.trim()) return null;

  return (
    <div className="space-y-3 rounded-xl border border-wt-border bg-wt-surface-2/60 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-wt-text">Current project allocations</p>
          <p className="mt-1 text-xs text-wt-text-muted">
            Review active assignments before allocating to a new project. Bench is auto-calculated
            after changes.
          </p>
        </div>
        <p className="text-xs text-wt-text-muted">
          Projects: {summary.projectTotal}% · Bench: {summary.benchTotal}%
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-wt-text-muted">Loading current allocations…</p>
      ) : !rows.length ? (
        <p className="text-sm text-wt-text-muted">
          No active project allocations. This employee is fully on bench (100%).
        </p>
      ) : (
        <ScrollableTable maxHeightClass="max-h-[min(40vh,320px)]">
          <WtTable>
            <TableHeader className={WT_STICKY_TABLE_HEAD_CLASS}>
              <TableRow className="hover:bg-transparent">
                <TableHead>Project</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Allocation %</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-28 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const allocationId = allocationRowId(row);
                const projectCode = String(row.project_code ?? row.projectCode ?? "").trim();
                const projectName = String(row.project_name ?? row.projectName ?? projectCode).trim();
                const percent = resolveAllocatedPercentFromRow(row);
                return (
                  <TableRow key={allocationId || `${projectCode}-${String(row.start_date ?? row.startDate ?? "")}`}>
                    <TableCell className="whitespace-nowrap">
                      <p className="font-medium text-wt-text">{projectName || projectCode || "—"}</p>
                      {projectCode ? (
                        <p className="text-xs text-wt-text-muted">{projectCode}</p>
                      ) : null}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatRoleDisplayValue(row.role)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap tabular-nums">
                      {formatAllocatedPercentDisplay(percent)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatDateLabel(row.start_date ?? row.startDate)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatDateLabel(row.end_date ?? row.endDate)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatUiStatusLabel(
                        String(row.allocation_type ?? row.allocationType ?? "—")
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatUiStatusLabel(
                        String(row.billing_status ?? row.billingStatus ?? "—")
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-rose-600 hover:bg-rose-500/10 hover:text-rose-700"
                        disabled={!allocationId || deallocatingId === allocationId}
                        onClick={() => void handleDeallocate(allocationId)}
                      >
                        <Trash2 className="size-4" aria-hidden />
                        Deallocate
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </WtTable>
        </ScrollableTable>
      )}
    </div>
  );
}
