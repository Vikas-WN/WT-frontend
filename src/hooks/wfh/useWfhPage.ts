"use client";

import { useCallback, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";

import { apiClient } from "@/api/httpClient";
import { endpoints } from "@/api/endpoints";
import { ApiError } from "@/api/error";
import { hrmsService } from "@/services/hrms.service";
import { useAuth } from "@/context/AuthContext";
import { useMyLeaveRequests } from "@/hooks/leave/useMyLeaveRequests";
import { useClientPagination } from "@/hooks/useClientPagination";
import { useWfhRequestActions } from "@/hooks/wfh/useWfhRequestActions";
import { LEAVE_QUERY_ROOT } from "@/constants/leaveQueryKeys";
import { WFH_PAGE_COPY } from "@/constants/wfhRequest";
import { showActionSplash } from "@/lib/actionSplash";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { formatActionErrorMessage, formatActionSuccessMessage, normalizeUserRequestType } from "@/utils/actionToast";
import { toPagedRows } from "@/utils/apiRows";
import { activeAllocationsRequireClientApproval, isTalentPoolLeaveRouting } from "@/utils/leaveAllocations";
import { buildUserRequestBody } from "@/utils/leaveRequestPayload";
import { createDefaultLeaveRequestForm } from "@/utils/leaveRequestForm";
import { lastMonthToThisMonthRange } from "@/utils/leaveRequestRange";
import { applyListSort, LEAVE_REQUEST_SORT_OPTIONS } from "@/utils/listSort";
import { isAccountManagerEmployeeUser } from "@/utils/roles";
import type { LeaveConfirmState, LeaveRequestFormState } from "@/types/leaveRequestForm";

type WfhTab = "request" | "view";

const EMPTY_ROWS: Array<Record<string, unknown>> = [];

/**
 * Everything the Work-from-home page needs: the apply form, the employee's own WFH requests, where a request
 * routes (HR for the talent pool, otherwise the picked managers) and the shared write paths.
 */
export function useWfhPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const userEmail = useMemo(() => String(user?.email ?? "").trim(), [user?.email]);
  const deepLinkRequestId = searchParams.get("requestId")?.trim() ?? "";

  // UI state: the apply form and its manager pickers, which request is being edited, and which tab is showing.
  const [form, setForm] = useState<LeaveRequestFormState>(() => ({ ...createDefaultLeaveRequestForm(), request_type: "WFH" }));
  const [managerEmails, setManagerEmails] = useState<string[]>([]);
  const [additionalEmails, setAdditionalEmails] = useState<string[]>([]);
  const [editingRequestId, setEditingRequestId] = useState("");
  const [tab, setTab] = useState<WfhTab>(deepLinkRequestId || searchParams.get("tab") === "view" ? "view" : "request");
  const [exceptionOpen, setExceptionOpen] = useState(false);
  const [confirmState, setConfirmState] = useState<LeaveConfirmState | null>(null);
  // UI state: the history date filters (last month → this month; a deep link starts wide) and its sort.
  const [fromDate, setFromDate] = useState(() => (deepLinkRequestId ? "" : lastMonthToThisMonthRange(new Date()).from));
  const [toDate, setToDate] = useState(() => (deepLinkRequestId ? "" : lastMonthToThisMonthRange(new Date()).to));
  const [sortId, setSortId] = useState(LEAVE_REQUEST_SORT_OPTIONS[0].id);
  // UI state: a write is in flight (disables the form; no blocking overlay).
  const [busy, setBusy] = useState(false);

  const allocationsQ = useQuery({
    queryKey: WFH_PAGE_COPY.allocationsQueryKey,
    staleTime: 300_000,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const res = await hrmsService.getMyAllocations();
      return toPagedRows(res.data ?? res);
    },
  });
  const allocations = allocationsQ.data ?? EMPTY_ROWS;
  const allocationsLoading = allocationsQ.isLoading;
  const requiresClientApproval = useMemo(() => activeAllocationsRequireClientApproval(allocations), [allocations]);
  const routesToHr = useMemo(
    () => allocationsQ.isSuccess && isTalentPoolLeaveRouting(allocations),
    [allocationsQ.isSuccess, allocations]
  );

  const requestsQ = useMyLeaveRequests(userEmail, true, fromDate, toDate);
  const sortedRows = useMemo(() => {
    const wfhOnly = requestsQ.rows.filter((row) => {
      const type = normalizeUserRequestType(row.request_type ?? row.requestType);
      return type === "WFH" || type === "WFH_EXCEPTION";
    });
    return applyListSort(wfhOnly, sortId, LEAVE_REQUEST_SORT_OPTIONS);
  }, [requestsQ.rows, sortId]);
  const pagination = useClientPagination(sortedRows, { resetKeys: [sortId, fromDate, toDate] });

  const invalidateBalance = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: LEAVE_QUERY_ROOT });
  }, [queryClient]);
  const refetchRequests = requestsQ.refetch;
  const reloadRequests = useCallback(async () => {
    if (refetchRequests) await refetchRequests();
  }, [refetchRequests]);

  const runAction = useCallback(async (label: string, fn: () => Promise<unknown>, options?: { splash?: boolean }) => {
    setBusy(true);
    try {
      const result = await fn();
      if (result === false) return;
      const message = formatActionSuccessMessage(label);
      showSuccessToast(message);
      if (options?.splash !== false) showActionSplash(message);
    } catch (error) {
      const backendMessage = error instanceof ApiError || error instanceof Error ? error.message : "";
      showErrorToast(formatActionErrorMessage(label, backendMessage));
    } finally {
      setBusy(false);
    }
  }, []);

  const actions = useWfhRequestActions({
    form,
    setForm,
    editingRequestId,
    setEditingRequestId,
    managerEmails,
    setManagerEmails,
    setAdditionalRecipientEmails: setAdditionalEmails,
    setViewTab: setTab,
    requiresClientApproval,
    routesToHr,
    runAction,
    reloadRequests,
    invalidateBalance,
    confirm: setConfirmState,
  });

  const submitException = useCallback(
    async (payload: { request_from_date: string; request_to_date: string; comments: string }) => {
      const body = buildUserRequestBody({
        request_from_date: payload.request_from_date,
        request_to_date: payload.request_to_date,
        request_type: "WFH_EXCEPTION",
        comments: payload.comments,
        is_half_day: false,
      });
      await apiClient.post(endpoints.userRequest.root, { contentType: "application/json", body: JSON.stringify(body) });
      showSuccessToast(WFH_PAGE_COPY.exceptionSubmitted);
      showActionSplash(WFH_PAGE_COPY.exceptionSplash);
      invalidateBalance();
      // The request exists; refresh the list in the background rather than holding the dialog on a second round-trip.
      void reloadRequests();
    },
    [invalidateBalance, reloadRequests]
  );

  const confirmPending = useCallback(() => {
    const pending = confirmState;
    setConfirmState(null);
    void pending?.run();
  }, [confirmState]);

  return {
    submitsToHrForReview: isAccountManagerEmployeeUser(user?.roles ?? []),
    form,
    setForm,
    managerEmails,
    setManagerEmails,
    editing: Boolean(editingRequestId),
    tab,
    setTab,
    exceptionOpen,
    setExceptionOpen,
    submitException,
    confirmState,
    closeConfirm: () => setConfirmState(null),
    confirmPending,
    busy,
    allocationsLoading,
    requiresClientApproval,
    routesToHr,
    actions,
    history: {
      rows: sortedRows,
      loading: requestsQ.isFetching,
      sortId,
      onSortChange: setSortId,
      sortOptions: LEAVE_REQUEST_SORT_OPTIONS,
      pagination,
      highlightRequestId: deepLinkRequestId,
      fromDate,
      toDate,
      onFromDateChange: setFromDate,
      onToDateChange: setToDate,
    },
  };
}
