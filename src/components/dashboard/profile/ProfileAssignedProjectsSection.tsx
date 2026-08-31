"use client";

import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  WtTable,
} from "@/components/dashboard/ui/wtTable";
import { formatApiDateDisplay } from "@/utils/apiDate";
import { formatRoleDisplayValue } from "@/utils/roles";
import { formatAllocatedPercentDisplay } from "@/utils/allocationPercent";
import { RequestStatusBadge } from "@/components/dashboard/ui/WtStatusBadge";
import { EmptyState } from "@/components/dashboard/ui/EmptyState";
import { TableRowsSkeleton } from "@/components/dashboard/ui/SectionSkeleton";
import {
  PROFILE_TABLE_BODY_CELL,
  PROFILE_TABLE_CLASS,
  PROFILE_TABLE_HEAD_CELL,
  PROFILE_TABLE_SCROLL,
} from "@/components/dashboard/profile/profileTableStyles";
import { parseApiDate } from "@/utils/apiDate";

function displayValue(value: unknown): string {
  const text = String(value ?? "").trim();
  return text && text !== "—" ? text : "—";
}

function readProjectName(row: Record<string, unknown>): string {
  return displayValue(row.project_name ?? row.projectName ?? row.name);
}

function readProjectRole(row: Record<string, unknown>): string {
  return formatRoleDisplayValue(row.role ?? row.designation);
}

function readProjectStartDate(row: Record<string, unknown>): string {
  const raw = row.start_date ?? row.startDate;
  const text = String(raw ?? "").trim();
  if (!text || text === "—") return "—";
  return formatApiDateDisplay(text);
}

function readProjectEndDate(row: Record<string, unknown>): string {
  const raw = row.end_date ?? row.endDate;
  const text = String(raw ?? "").trim();
  if (!text || text === "—") return "—";
  return formatApiDateDisplay(text);
}

function readAllocationPercent(row: Record<string, unknown>): string {
  return formatAllocatedPercentDisplay(row);
}

function readBillingOrStatus(row: Record<string, unknown>): string {
  return displayValue(
    row.billing_status ??
      row.billingStatus ??
      row.project_status ??
      row.projectStatus ??
      row.status
  );
}

/** Determine if allocation is currently active based on start/end dates. */
function getAllocationStatus(row: Record<string, unknown>): "Active" | "Offboarded" | "Upcoming" {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startRaw = String(row.start_date ?? row.startDate ?? "").trim();
  const endRaw = String(row.end_date ?? row.endDate ?? "").trim();

  const start = startRaw && startRaw !== "—" ? parseApiDate(startRaw) : null;
  const end = endRaw && endRaw !== "—" ? parseApiDate(endRaw) : null;

  if (start && start > today) return "Upcoming";
  if (end && end < today) return "Offboarded";
  return "Active";
}

function getAllocationStatusBadge(status: "Active" | "Offboarded" | "Upcoming") {
  const base = "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium";
  switch (status) {
    case "Active":
      return <span className={`${base} bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400`}>Active</span>;
    case "Offboarded":
      return <span className={`${base} bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400`}>Offboarded</span>;
    case "Upcoming":
      return <span className={`${base} bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400`}>Upcoming</span>;
  }
}

function projectRowKey(row: Record<string, unknown>, index: number): string {
  const code = String(row.project_code ?? row.projectCode ?? "").trim();
  const start = String(row.start_date ?? row.startDate ?? "").trim();
  return [code, start, index].filter(Boolean).join("|");
}

export function ProfileAssignedProjectsSection({
  rows,
  loading,
}: {
  rows: Array<Record<string, unknown>>;
  loading: boolean;
}) {
  return (
    <div className="mt-8 border-t border-wt-border pt-6">
      <h4 className="mb-3 text-sm font-semibold text-wt-text">Project Details</h4>
      {loading ? (
        <TableRowsSkeleton rows={3} columns={7} />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No Projects Assigned"
          description="Active project allocations will appear here once staffed on a client engagement."
          className="py-10"
        />
      ) : (
        <div className={PROFILE_TABLE_SCROLL}>
          <WtTable className={PROFILE_TABLE_CLASS}>
            <TableHeader className="bg-wt-surface-1 [&_tr]:border-b">
              <TableRow className="hover:bg-transparent">
                <TableHead className={PROFILE_TABLE_HEAD_CELL}>Project Name</TableHead>
                <TableHead className={PROFILE_TABLE_HEAD_CELL}>Role In Project</TableHead>
                <TableHead className={PROFILE_TABLE_HEAD_CELL}>Allocation %</TableHead>
                <TableHead className={PROFILE_TABLE_HEAD_CELL}>Start Date</TableHead>
                <TableHead className={PROFILE_TABLE_HEAD_CELL}>End Date</TableHead>
                <TableHead className={PROFILE_TABLE_HEAD_CELL}>Allocation Status</TableHead>
                <TableHead className={PROFILE_TABLE_HEAD_CELL}>Billing Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, index) => {
                const billingStatus = readBillingOrStatus(row);
                const allocationStatus = getAllocationStatus(row);
                return (
                  <TableRow key={projectRowKey(row, index)}>
                    <TableCell className={`${PROFILE_TABLE_BODY_CELL} whitespace-nowrap`}>
                      {readProjectName(row)}
                    </TableCell>
                    <TableCell className={PROFILE_TABLE_BODY_CELL}>{readProjectRole(row)}</TableCell>
                    <TableCell className={`${PROFILE_TABLE_BODY_CELL} tabular-nums`}>
                      {readAllocationPercent(row)}
                    </TableCell>
                    <TableCell className={`${PROFILE_TABLE_BODY_CELL} whitespace-nowrap`}>
                      {readProjectStartDate(row)}
                    </TableCell>
                    <TableCell className={`${PROFILE_TABLE_BODY_CELL} whitespace-nowrap`}>
                      {readProjectEndDate(row)}
                    </TableCell>
                    <TableCell className={`${PROFILE_TABLE_BODY_CELL} whitespace-nowrap`}>
                      {getAllocationStatusBadge(allocationStatus)}
                    </TableCell>
                    <TableCell className={`${PROFILE_TABLE_BODY_CELL} whitespace-nowrap`}>
                      {billingStatus === "—" ? (
                        "—"
                      ) : (
                        <RequestStatusBadge status={billingStatus} />
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </WtTable>
        </div>
      )}
    </div>
  );
}
