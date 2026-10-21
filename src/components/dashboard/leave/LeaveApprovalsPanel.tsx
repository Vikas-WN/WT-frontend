"use client";

import { giveFeedback } from "@/lib/feedback";
import { useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SegmentedTabs } from "@/components/dashboard/ui/SegmentedTabs";
import { ListPagination } from "@/components/dashboard/ui/ListPagination";
import { RefreshIconButton } from "@/components/dashboard/ui/RefreshIconButton";
import { LeaveRequestStatusBadge } from "@/components/dashboard/leave/LeaveRequestStatusBadge";
import { RequestReversalActions } from "@/components/dashboard/leave/RequestReversalActions";
import { useAuth } from "@/context/AuthContext";
import { UserRequestRejectDialog } from "@/components/dashboard/leave/UserRequestRejectDialog";
import {
  primaryManagerInboxQueryKey,
  usePrimaryManagerLeaveInbox,
} from "@/hooks/leave/usePrimaryManagerLeaveInbox";
import { useNonOptionalHolidayDates } from "@/hooks/leave/useNonOptionalHolidayDates";
import { useClientPagination } from "@/hooks/useClientPagination";
import { formatUserRequestTypeLabel, userRequestActionLabel } from "@/utils/actionToast";
import { formatLeaveDateRange, formatLeaveDaysCount } from "@/utils/leaveRequestDisplay";
import { fireConfetti } from "@/lib/confetti";
import {
  canPrimaryManagerApproveOnLeave,
  canPrimaryManagerRejectOnLeave,
  canSecondaryManagerApproveOnLeave,
  canSecondaryManagerRejectOnLeave,
  hasSecondaryLeaveManagers,
  isLeaveRequestClosedForManagerAction,
  requestSecondaryManagerStatus,
} from "@/utils/leaveManagerDisplay";
import {
  applyLeaveTeamRequestDecisions,
  isAlreadyDecidedUserRequestError,
  isDeletedUserRequestError,
  patchLeaveTeamRequestStatus,
  requestFinalStatus,
  requestManagerStatus,
  requestRejectionReason,
  updateUserRequestStatus,
  type UserRequestStatusValue,
} from "@/utils/userRequest";

function employeeDisplayName(row: Record<string, unknown>): string {
  return (
    String(
      row.employee_display ??
        row.employee_name ??
        row.employeeName ??
        row.name ??
        row.emp_email ??
        row.empEmail ??
        row.email ??
        "—"
    ).trim() || "—"
  );
}

function requestIdFromRow(row: Record<string, unknown>): string {
  return String(
    row.user_request_id ??
      row.userRequestId ??
      row.request_id ??
      row.requestId ??
      row.id ??
      ""
  ).trim();
}

function rowStatusFor(row: Record<string, unknown>): string {
  const rawFinalStatus = requestFinalStatus(row);
  if (rawFinalStatus !== "PENDING" || !isLeaveRequestClosedForManagerAction(row)) return rawFinalStatus;
  const primaryStage = requestManagerStatus(row);
  const secondaryStage = requestSecondaryManagerStatus(row);
  if (primaryStage === "APPROVED" || secondaryStage === "APPROVED") return "APPROVED";
  if (primaryStage === "REJECTED" || secondaryStage === "REJECTED") return "REJECTED";
  return rawFinalStatus;
}

type InboxTab = "pending" | "decided" | "all";

function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

export function LeaveApprovalsPanel({
  actorEmail,
  actionLoading,
  runAction,
}: {
  actorEmail: string;
  actionLoading: boolean;
  runAction: (label: string, fn: () => Promise<unknown>) => Promise<void>;
}) {
  const { user } = useAuth();
  const isHrOrAdmin = (user?.roles ?? []).some((role) => role === "ROLE_HR" || role === "ROLE_ADMIN");
  const queryClient = useQueryClient();
  const inboxQ = usePrimaryManagerLeaveInbox(actorEmail, Boolean(actorEmail));
  const holidayDates = useNonOptionalHolidayDates();
  const [search, setSearch] = useState("");
  // UI state: which group of requests is showing.
  const [tab, setTab] = useState<InboxTab>("pending");
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [pendingReject, setPendingReject] = useState<{
    requestId: string;
    requestType: unknown;
  } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  // Decisions made here that the server list has not caught up with yet (replaced, never mutated).
  const [decisions, setDecisions] = useState<
    ReadonlyMap<string, { status: UserRequestStatusValue; reason?: string }>
  >(() => new Map());
  const forgetDecision = (requestId: string) =>
    setDecisions((prev) => {
      const next = new Map(prev);
      next.delete(requestId);
      return next;
    });

  const displayRows = useMemo(
    () => applyLeaveTeamRequestDecisions(inboxQ.rows, decisions, actorEmail),
    [inboxQ.rows, decisions, inboxQ.dataUpdatedAt, actorEmail]
  );

  const tabCounts = useMemo(() => {
    const pending = displayRows.filter((row) => rowStatusFor(row) === "PENDING").length;
    return { pending, decided: displayRows.length - pending, all: displayRows.length };
  }, [displayRows]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const inTab = displayRows.filter((row) => {
      if (tab === "all") return true;
      const pending = rowStatusFor(row) === "PENDING";
      return tab === "pending" ? pending : !pending;
    });
    if (!q) return inTab;
    return inTab.filter((row) => {
      const haystack = [
        employeeDisplayName(row),
        row.request_from_date,
        row.requestFromDate,
        row.request_to_date,
        row.requestToDate,
        row.request_type,
        row.requestType,
        requestFinalStatus(row),
        row.comments,
        row.manager_reason,
        row.managerReason,
        row.hr_reason,
        row.hrReason,
      ]
        .map((value) => String(value ?? "").toLowerCase())
        .join(" ");
      return haystack.includes(q);
    });
  }, [displayRows, search, tab]);

  const pagination = useClientPagination(filteredRows, {
    resetKeys: [search, tab, inboxQ.dataUpdatedAt, decisions],
  });


  function applyLocalDecision(
    requestId: string,
    status: UserRequestStatusValue,
    reason?: string
  ) {
    setDecisions((prev) => new Map(prev).set(requestId, { status, reason }));
    queryClient.setQueryData(
      primaryManagerInboxQueryKey(actorEmail.trim()),
      (prev: Array<Record<string, unknown>> | undefined) => {
        if (!prev) return prev;
        return prev.map((row) => {
          const rowId = requestIdFromRow(row);
          return rowId === requestId
            ? patchLeaveTeamRequestStatus(row, status, { reason, actorEmail })
            : row;
        });
      }
    );
  }

  async function refreshInbox() {
    await inboxQ.refetch();
  }

  /** Drop a row the backend reports as deleted, so its actions disappear at once. */
  function dropDeletedRow(requestId: string) {
    forgetDecision(requestId);
    queryClient.setQueryData(
      primaryManagerInboxQueryKey(actorEmail.trim()),
      (prev: Array<Record<string, unknown>> | undefined) =>
        prev ? prev.filter((row) => requestIdFromRow(row) !== requestId) : prev
    );
  }

  async function submitDecision(
    requestId: string,
    status: UserRequestStatusValue,
    reason?: string
  ) {
    try {
      await updateUserRequestStatus(Number(requestId), status, {
        ...(reason ? { reason } : {}),
        requireReasonOnReject: status === "REJECTED",
      });
    } catch (error) {
      // The employee deleted it while it sat in this cached list — stop offering actions.
      if (isDeletedUserRequestError(error)) {
        dropDeletedRow(requestId);
        void refreshInbox();
      } else if (isAlreadyDecidedUserRequestError(error)) {
        // Another reviewer decided it first. Pull the server state so this row stops
        // offering actions that can only fail.
        forgetDecision(requestId);
        void refreshInbox();
      }
      throw error;
    }
    applyLocalDecision(requestId, status, reason);
    giveFeedback(status === "APPROVED" ? "approve" : "reject");
    void refreshInbox();
  }

  function openRejectDialog(requestId: string, requestType: unknown) {
    setRejectReason("");
    setPendingReject({ requestId, requestType });
  }

  function closeRejectDialog() {
    setPendingReject(null);
    setRejectReason("");
  }

  async function confirmRejectRequest() {
    if (!pendingReject) return;
    const reason = rejectReason.trim();
    if (!reason) {
      throw new Error("Reason is required when rejecting a request.");
    }
    const requestId = pendingReject.requestId;
    await submitDecision(requestId, "REJECTED", reason);
    closeRejectDialog();
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SegmentedTabs
            label="Request group"
            value={tab}
            onChange={(value) => setTab(value as InboxTab)}
            options={[
              { value: "pending", label: `Pending ${tabCounts.pending}` },
              { value: "decided", label: `Decided ${tabCounts.decided}` },
              { value: "all", label: `All ${tabCounts.all}` },
            ]}
          />
          <div className="flex items-center gap-2">
            <input
              type="search"
              className="input-field h-10 w-full px-3 py-2 text-sm sm:min-w-[240px]"
              placeholder="Search by employee, date, status..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search leave and WFH approvals"
            />
            <RefreshIconButton
              onClick={() => void runAction("Refresh leave and WFH approvals", refreshInbox)}
              disabled={actionLoading}
              loading={inboxQ.isFetching}
              label="Refresh Approvals"
            />
          </div>
        </div>

        {inboxQ.isLoading ? (
          <ul className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <li key={`approval-skeleton-${i}`} className="rounded-[1.25rem] border border-wt-border bg-wt-surface-1 p-5">
                <Skeleton className="h-10 w-full" />
              </li>
            ))}
          </ul>
        ) : pagination.pageItems.length ? (
          <ul className="space-y-3">
            {pagination.pageItems.map((row, idx) => {
              const rowRecord = row as Record<string, unknown>;
              const requestId = requestIdFromRow(rowRecord);
              const fromDate = String(rowRecord.request_from_date ?? rowRecord.requestFromDate ?? "");
              const toDate = String(rowRecord.request_to_date ?? rowRecord.requestToDate ?? "");
              const isHalfDay = Boolean(rowRecord.is_half_day ?? rowRecord.isHalfDay ?? false);
              const isUpdating = statusUpdatingId === requestId;
              const primaryStage = requestManagerStatus(rowRecord);
              const secondaryStage = requestSecondaryManagerStatus(rowRecord);
              const rowStatus = rowStatusFor(rowRecord);
              const canApprove =
                canPrimaryManagerApproveOnLeave(rowRecord, actorEmail) ||
                canSecondaryManagerApproveOnLeave(rowRecord, actorEmail);
              const canReject =
                canPrimaryManagerRejectOnLeave(rowRecord, actorEmail) ||
                canSecondaryManagerRejectOnLeave(rowRecord, actorEmail);
              const rejectionReason = rowStatus === "REJECTED" ? requestRejectionReason(rowRecord) : null;
              const leaveReason = String(rowRecord.comments ?? "").trim();
              const name = employeeDisplayName(rowRecord);

              return (
                <li
                  key={`${requestId || "approval"}-${idx}`}
                  className="grid items-center gap-x-6 gap-y-3 rounded-[1.25rem] border border-wt-border bg-wt-surface-1 px-5 py-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1.3fr)_auto]"
                >
                  <div className="flex min-w-0 items-center gap-3.5">
                    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[var(--wt-brand-soft)] text-sm font-semibold text-[var(--wt-brand)]" aria-hidden>
                      {initials(name)}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[15px] font-semibold text-wt-text">{name}</span>
                      <span className="mt-0.5 inline-block rounded-md bg-amber-500/14 px-2 py-0.5 text-[13px] font-medium text-amber-800 dark:text-amber-300">
                        {formatUserRequestTypeLabel(rowRecord.request_type ?? rowRecord.requestType, isHalfDay)}
                      </span>
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-wt-text">{formatLeaveDateRange(fromDate, toDate, isHalfDay)}</p>
                    <p className="text-sm text-wt-text-muted">{formatLeaveDaysCount(fromDate, toDate, isHalfDay, holidayDates)}</p>
                  </div>
                  <div className="min-w-0 text-[15px] text-wt-text-muted">
                    {leaveReason ? <p className="line-clamp-2" title={leaveReason}>{leaveReason}</p> : <span aria-hidden>—</span>}
                    {rejectionReason ? (
                      <p className="mt-1 truncate text-xs text-rose-700/90" title={rejectionReason}>
                        {rejectionReason}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    {rowStatus !== "PENDING" || !(canApprove || canReject) ? (
                      <div className="flex flex-col items-end gap-1">
                        <LeaveRequestStatusBadge status={rowStatus} request={rowRecord} />
                        {hasSecondaryLeaveManagers(rowRecord) && (primaryStage !== "PENDING" || secondaryStage !== "PENDING") ? (
                          <p className="text-[11px] text-wt-text-muted">
                            Primary: {primaryStage || "PENDING"} · Secondary: {secondaryStage || "PENDING"}
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                    {canApprove || canReject ? (
                      <>
                        {canReject ? (
                          <Button
                            type="button"
                            variant="outline"
                            disabled={actionLoading || !requestId || isUpdating}
                            onClick={() => openRejectDialog(requestId, rowRecord.request_type ?? rowRecord.requestType)}
                          >
                            Reject
                          </Button>
                        ) : null}
                        {canApprove ? (
                          <Button
                            type="button"
                            variant="brand"
                            disabled={actionLoading || !requestId || isUpdating}
                            onClick={() =>
                              void runAction(
                                userRequestActionLabel(rowRecord.request_type ?? rowRecord.requestType, "approve"),
                                async () => {
                                  setStatusUpdatingId(requestId);
                                  try {
                                    await submitDecision(requestId, "APPROVED");
                                    fireConfetti();
                                  } finally {
                                    setStatusUpdatingId(null);
                                  }
                                }
                              )
                            }
                          >
                            {isUpdating ? "…" : "Approve"}
                          </Button>
                        ) : null}
                      </>
                    ) : (
                      <RequestReversalActions
                        row={rowRecord}
                        actorEmail={actorEmail}
                        isHrOrAdmin={isHrOrAdmin}
                        onChanged={async () => {
                          forgetDecision(requestId);
                          await refreshInbox();
                        }}
                        fallback={null}
                      />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="rounded-[1.25rem] border border-dashed border-wt-border px-6 py-14 text-center text-sm text-wt-text-muted">
            {inboxQ.isError
              ? "Could not load leave approvals. Try refreshing."
              : search.trim()
                ? "No requests match your search."
                : tab === "pending"
                  ? "Nothing is waiting for your decision."
                  : "No leave requests assigned to you for approval."}
          </p>
        )}

        {pagination.totalItems > 0 ? (
          <ListPagination
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
      </div>

      <UserRequestRejectDialog
        open={Boolean(pendingReject)}
        title={
          pendingReject
            ? userRequestActionLabel(pendingReject.requestType, "reject")
            : "Reject request"
        }
        description="A reason is required when rejecting a leave request."
        reasonPlaceholder="Enter rejection reason"
        confirmLabel="Reject"
        confirmingLabel="Rejecting…"
        reason={rejectReason}
        onReasonChange={setRejectReason}
        onCancel={closeRejectDialog}
        onConfirm={() =>
          runAction(
            pendingReject
              ? userRequestActionLabel(pendingReject.requestType, "reject")
              : "Reject request",
            confirmRejectRequest
          )
        }
        loading={actionLoading}
      />
    </>
  );
}
