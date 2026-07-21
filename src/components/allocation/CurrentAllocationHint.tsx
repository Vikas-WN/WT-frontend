"use client";

import { useEffect, useMemo, useState } from "react";
import { hrmsService } from "@/services/hrms.service";
import {
  isDeallocatedAllocationRow,
  isSupersededAllocationRow,
  isSystemProjectAllocationRow,
  parseEmployeeAllocationsResponse,
} from "@/utils/allocationList";
import { resolveAllocatedPercentFromRow } from "@/utils/allocationPercent";

type AllocationBreakdownItem = {
  projectCode: string;
  projectName: string;
  percent: number;
  isBench: boolean;
};

function activeAllocationRows(allocations: Array<Record<string, unknown>>) {
  return allocations.filter(
    (row) => !isSupersededAllocationRow(row) && !isDeallocatedAllocationRow(row)
  );
}

function buildBreakdown(allocations: Array<Record<string, unknown>>): AllocationBreakdownItem[] {
  const active = activeAllocationRows(allocations);
  const items: AllocationBreakdownItem[] = [];
  for (const row of active) {
    const percent = resolveAllocatedPercentFromRow(row);
    if (percent == null || !Number.isFinite(percent) || percent <= 0) continue;
    const projectCode = String(row.project_code ?? row.projectCode ?? row.allocated_project ?? "")
      .trim()
      .toUpperCase();
    const projectName = String(
      row.project_name ?? row.projectName ?? row.allocated_project ?? projectCode
    ).trim();
    const isBench = isSystemProjectAllocationRow(row);
    items.push({
      projectCode: projectCode || "—",
      projectName: projectName || projectCode || "—",
      percent,
      isBench,
    });
  }
  return items.sort((a, b) => {
    if (a.isBench !== b.isBench) return a.isBench ? 1 : -1;
    return a.projectName.localeCompare(b.projectName);
  });
}

export function CurrentAllocationHint({
  email,
  detailed = false,
}: {
  email: string;
  detailed?: boolean;
}) {
  const [breakdown, setBreakdown] = useState<AllocationBreakdownItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const normalized = email.trim().toLowerCase();
    if (!normalized) {
      setBreakdown([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    void hrmsService
      .getEmployeeAllocations({ userEmail: normalized })
      .then((res) => {
        if (cancelled) return;
        const parsed = parseEmployeeAllocationsResponse(res.data ?? res);
        setBreakdown(buildBreakdown(parsed?.allocations ?? []));
      })
      .catch(() => {
        if (!cancelled) setBreakdown([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [email]);

  const summary = useMemo(() => {
    const projectTotal = breakdown
      .filter((item) => !item.isBench)
      .reduce((sum, item) => sum + item.percent, 0);
    const benchTotal = breakdown
      .filter((item) => item.isBench)
      .reduce((sum, item) => sum + item.percent, 0);
    const assigned = projectTotal + benchTotal;
    const remaining = Math.max(0, 100 - assigned);
    return { projectTotal, benchTotal, assigned, remaining };
  }, [breakdown]);

  if (!email.trim()) return null;

  if (loading) {
    return <p className="text-xs text-wt-text-muted">Loading current allocations…</p>;
  }

  if (!detailed) {
    return (
      <p className="text-xs text-wt-text-muted">
        {breakdown.length
          ? `Allocated to projects: ${summary.projectTotal}%${
              summary.benchTotal > 0 ? ` · Bench: ${summary.benchTotal}%` : ""
            }`
          : "Allocated to projects: —"}
      </p>
    );
  }

  if (!breakdown.length) {
    return (
      <div className="rounded-xl border border-wt-border bg-wt-surface-2/60 p-3 text-sm text-wt-text-muted">
        No active allocations found. This employee is fully available (100% unassigned).
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-xl border border-wt-border bg-wt-surface-2/60 p-3">
      <p className="text-sm font-medium text-wt-text">Current allocations</p>
      <ul className="space-y-1 text-sm">
        {breakdown.map((item) => (
          <li key={`${item.projectCode}-${item.isBench ? "bench" : "project"}`} className="flex justify-between gap-3">
            <span className="min-w-0 truncate text-wt-text">
              {item.isBench ? "Bench" : item.projectName}
              {!item.isBench && item.projectCode ? (
                <span className="text-wt-text-muted"> · {item.projectCode}</span>
              ) : null}
            </span>
            <span className="shrink-0 tabular-nums text-wt-text-muted">{item.percent}%</span>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-wt-border pt-2 text-xs text-wt-text-muted">
        <span>Projects: {summary.projectTotal}%</span>
        <span>Bench: {summary.benchTotal}%</span>
        <span>Total assigned: {summary.assigned}%</span>
        {summary.remaining > 0 ? <span>Available: {summary.remaining}%</span> : null}
      </div>
    </div>
  );
}
