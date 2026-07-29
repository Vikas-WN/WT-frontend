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
import { formatAllocatedHoursPercentLabel } from "@/utils/dashboard/validation";
import { RequestStatusBadge } from "@/components/dashboard/ui/WtStatusBadge";
import { EmptyState } from "@/components/dashboard/ui/EmptyState";
import { TableRowsSkeleton } from "@/components/dashboard/ui/SectionSkeleton";
import {
  PROFILE_TABLE_BODY_CELL,
  PROFILE_TABLE_CLASS,
  PROFILE_TABLE_HEAD_CELL,
  PROFILE_TABLE_SCROLL,
} from "@/components/dashboard/profile/profileTableStyles";

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
  const raw =
    row.allocated_percent ??
    row.allocatedPercent ??
    row.allocation_percent ??
    row.allocationPercent ??
    row.allocated_hours ??
    row.allocatedHours;
  const label = formatAllocatedHoursPercentLabel(raw);
  return label && label !== "—" ? label : "—";
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
        <TableRowsSkeleton rows={3} columns={6} />
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
                <TableHead className={PROFILE_TABLE_HEAD_CELL}>Billing Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, index) => {
                const status = readBillingOrStatus(row);
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
                      {status === "—" ? (
                        "—"
                      ) : (
                        <RequestStatusBadge status={status} />
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
