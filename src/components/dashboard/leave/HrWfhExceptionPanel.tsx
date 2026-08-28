"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Badge } from "@/components/ui/badge";
import { ListPagination } from "@/components/dashboard/ui/ListPagination";
import { UI_COPY } from "@/constants/uiCopy";
import { FormSection } from "@/components/dashboard/ui/FormSection";
import { ApiDateField, InputField, SelectField } from "@/components/dashboard/ui/forms";
import { UserRequestRejectDialog } from "@/components/dashboard/leave/UserRequestRejectDialog";
import { useHrWfhExceptionRequests } from "@/hooks/leave/useHrWfhExceptionRequests";
import { useClientPagination } from "@/hooks/useClientPagination";
import { formatLeaveDateRange, formatLeaveDaysCount } from "@/utils/leaveRequestDisplay";
import { parseApiDate } from "@/utils/apiDate";
import { requestFinalStatus, updateUserRequestStatus } from "@/utils/userRequest";
import { filledBadgeClass } from "@/components/dashboard/ui/badgeTones";
import { apiClient } from "@/api/httpClient";
import { endpoints } from "@/api/endpoints";
import { showErrorToast, showSuccessToast } from "@/lib/toast";

const TABLE_COL_COUNT = 9;
const TABLE_MIN_HEIGHT = "min-h-[280px]";

function exceptionRowMatchesSearch(row: Record<string, unknown>, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    row.employee_name,
    row.employee_emp_id,
    row.employee_display,
    row.name,
    row.email,
    row.emp_email,
    row.request_from_date,
    row.requestToDate,
    row.comments,
  ]
    .map((v) => String(v ?? "").toLowerCase())
    .join(" ");
  return haystack.includes(q);
}

const STATUS_FILTER_OPTIONS = [
  { value: "ALL", label: "All Statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

export function HrWfhExceptionPanel({
  actionLoading,
  runAction,
}: {
  actionLoading: boolean;
  runAction: (label: string, fn: () => Promise<unknown>) => Promise<void>;
}) {
  const { rows, loading, filters, setFilters, load } = useHrWfhExceptionRequests();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [pendingFromDate, setPendingFromDate] = useState(filters.fromDate);
  const [pendingToDate, setPendingToDate] = useState(filters.toDate);
  const [rejectDialog, setRejectDialog] = useState<{
    open: boolean;
    row: Record<string, unknown> | null;
    reason: string;
  }>({ open: false, row: null, reason: "" });

  useEffect(() => {
    if (!parseApiDate(filters.fromDate) || !parseApiDate(filters.toDate)) return;
    void load().catch(() => undefined);
  }, [load, filters.fromDate, filters.toDate]);

  const filteredRows = useMemo(() => {
    let result = rows.filter((row) => exceptionRowMatchesSearch(row, search));
    if (statusFilter !== "ALL") {
      result = result.filter((row) => {
        const s = requestFinalStatus(row as Record<string, unknown>);
        return s === statusFilter;
      });
    }
    return result;
  }, [rows, search, statusFilter]);

  const pagination = useClientPagination(filteredRows, {
    resetKeys: [search, statusFilter, filters.fromDate, filters.toDate],
  });

  const handleApprove = async (row: Record<string, unknown>) => {
    const requestId = String(
      row.user_request_id ?? row.userRequestId ?? row.request_id ?? row.requestId ?? row.id ?? ""
    ).trim();
    if (!requestId) return;
    try {
      await apiClient.put(endpoints.userRequest.status, {
        contentType: "application/json",
        body: JSON.stringify({
          user_request_id: Number(requestId),
          user_request_status: "APPROVED",
        }),
      });
      showSuccessToast("Work From Home Request Updated");
      await load();
    } catch {
      showErrorToast("Failed to approve request.");
    }
  };

  const handleReject = async (reason: string) => {
    const row = rejectDialog.row;
    if (!row) return;
    const requestId = String(
      row.user_request_id ?? row.userRequestId ?? row.request_id ?? row.requestId ?? row.id ?? ""
    ).trim();
    if (!requestId) return;
    try {
      const payload = {
        user_request_id: Number(requestId),
        user_request_status: "REJECTED",
        message: reason,
      };
      await apiClient.put(endpoints.userRequest.status, {
        contentType: "application/json",
        body: JSON.stringify(payload),
      });
      showSuccessToast("Custom WFH request rejected.");
      setRejectDialog({ open: false, row: null, reason: "" });
      await load();
    } catch {
      showErrorToast("Failed to reject request.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex w-full flex-wrap items-end gap-3">
        <div className="min-w-0 flex-[2]">
          <InputField
            label="Search"
            type="search"
            value={search}
            onChange={setSearch}
            placeholder="Search by employee, date…"
          />
        </div>
        <SelectField
          label="Status"
          value={statusFilter}
          options={STATUS_FILTER_OPTIONS}
          onChange={setStatusFilter}
          className="min-w-0 flex-1"
        />
        <ApiDateField
          label="From Date"
          value={pendingFromDate}
          onChange={(v) => setPendingFromDate(v)}
          className="min-w-0 flex-1"
        />
        <ApiDateField
          label="To Date"
          value={pendingToDate}
          onChange={(v) => setPendingToDate(v)}
          className="min-w-0 flex-1"
        />
        <Button
          variant="brand"
          type="button"
          className="h-10 shrink-0 px-3 py-2"
          onClick={() => {
            if (!parseApiDate(pendingFromDate) || !parseApiDate(pendingToDate)) return;
            setFilters({ fromDate: pendingFromDate, toDate: pendingToDate });
            void runAction("Refresh WFH exceptions", () =>
              load({ fromDate: pendingFromDate, toDate: pendingToDate })
            );
          }}
          disabled={actionLoading || loading}
        >
          Fetch Requests
        </Button>
      </div>

      <FormSection title="Custom Work From Home Requests" className="rounded-2xl shadow-sm">
        <ScrollableTable maxHeightClass="max-h-[min(70vh,520px)]" className={TABLE_MIN_HEIGHT}>
          <WtTable>
            <TableHeader className={WT_STICKY_TABLE_HEAD_CLASS}>
              <TableRow className="hover:bg-transparent">
                <TableHead>Employee Name</TableHead>
                <TableHead>Employee ID</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Total Days</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Requested On</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, rowIndex) => (
                  <TableRow key={`hr-wfh-exc-skeleton-${rowIndex}`}>
                    {Array.from({ length: TABLE_COL_COUNT }).map((_, colIndex) => (
                      <TableCell key={colIndex} className="px-3 py-2.5">
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : pagination.pageItems.length ? (
                pagination.pageItems.map((row, idx) => {
                  const rowRecord = row as Record<string, unknown>;
                  const requestId = String(
                    rowRecord.user_request_id ??
                      rowRecord.userRequestId ??
                      rowRecord.request_id ??
                      rowRecord.requestId ??
                      rowRecord.id ??
                      ""
                  ).trim();
                  const finalStatus = requestFinalStatus(rowRecord);
                  const fromDate = String(
                    rowRecord.request_from_date ?? rowRecord.requestFromDate ?? ""
                  );
                  const toDate = String(rowRecord.request_to_date ?? rowRecord.requestToDate ?? "");
                  const isPending = finalStatus === "PENDING";
                  const employee = String(rowRecord.employee_name ?? rowRecord.employee_display ?? rowRecord.name ?? "—").trim();
                  const empId = String(rowRecord.employee_emp_id ?? rowRecord.emp_id ?? rowRecord.empId ?? "—").trim();
                  const comments = String(rowRecord.comments ?? "—");
                  const createdAt = String(rowRecord.created_at ?? rowRecord.createdAt ?? "—");

                  return (
                    <TableRow key={`${requestId || "exc"}-${idx}`}>
                      <TableCell className="px-3 py-2.5 whitespace-nowrap">{employee}</TableCell>
                      <TableCell className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">{empId}</TableCell>
                      <TableCell className="px-3 py-2.5 whitespace-nowrap">{fromDate}</TableCell>
                      <TableCell className="px-3 py-2.5 whitespace-nowrap">{toDate}</TableCell>
                      <TableCell className="px-3 py-2.5 whitespace-nowrap tabular-nums">
                        {formatLeaveDaysCount(fromDate, toDate, false)}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate px-3 py-2.5">{comments}</TableCell>
                      <TableCell className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">{createdAt}</TableCell>
                      <TableCell className="px-3 py-2.5 whitespace-nowrap">
                        <Badge
                          className={
                            finalStatus === "APPROVED"
                              ? `rounded-full border-0 font-normal ${filledBadgeClass("success")}`
                              : finalStatus === "REJECTED"
                                ? `rounded-full border-0 font-normal ${filledBadgeClass("danger")}`
                                : "rounded-full border-0 font-normal bg-muted/60 text-muted-foreground"
                          }
                        >
                          {finalStatus === "PENDING" ? "Pending HR Approval" : finalStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-3 py-2.5 whitespace-nowrap">
                        {isPending ? (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="brand"
                              size="xs"
                              type="button"
                              disabled={actionLoading}
                              onClick={() => runAction("Approve exception", () => handleApprove(rowRecord))}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="destructive"
                              size="xs"
                              type="button"
                              disabled={actionLoading}
                              onClick={() => setRejectDialog({ open: true, row: rowRecord, reason: "" })}
                            >
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={TABLE_COL_COUNT}
                    className="px-3 py-10 text-center text-sm text-muted-foreground"
                  >
                    {rows.length ? UI_COPY.noSearchResults : UI_COPY.noRecordsFound}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </WtTable>
        </ScrollableTable>

        {pagination.totalItems > 0 ? (
          <ListPagination
            className="mt-4"
            page={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            rangeStart={pagination.rangeStart}
            rangeEnd={pagination.rangeEnd}
            pageSize={pagination.pageSize}
            pageSizeOptions={pagination.pageSizeOptions}
            onPageChange={pagination.setPage}
            onPageSizeChange={pagination.setPageSize}
          />
        ) : null}
      </FormSection>

      <UserRequestRejectDialog
        open={rejectDialog.open}
        title="Reject Custom WFH Request"
        description="Are you sure you want to reject this custom Work From Home request?"
        reason={rejectDialog.reason}
        onReasonChange={(v) => setRejectDialog((prev) => ({ ...prev, reason: v }))}
        onCancel={() => setRejectDialog({ open: false, row: null, reason: "" })}
        onConfirm={() => handleReject(rejectDialog.reason)}
        confirmLabel="Reject"
        confirmingLabel="Rejecting..."
        confirmDisabled={!rejectDialog.reason.trim()}
        loading={actionLoading}
      />
    </div>
  );
}
