"use client";

import { useCallback } from "react";

import { apiClient } from "@/api/httpClient";
import { endpoints } from "@/api/endpoints";
import { WFH_COMMENT_MAX_LENGTH, WFH_COPY, WFH_ERRORS, WFH_REVOKE_CONFIRM } from "@/constants/wfhRequest";
import { showErrorToast } from "@/lib/toast";
import type { LeaveConfirmState, LeaveRequestFormState } from "@/types/leaveRequestForm";
import { normalizeToApiDate, parseApiDate } from "@/utils/apiDate";
import { pickManagerEmailList } from "@/utils/leaveManagerDisplay";
import { buildUserRequestBody } from "@/utils/leaveRequestPayload";
import { createDefaultLeaveRequestForm } from "@/utils/leaveRequestForm";
import { userRequestActionLabel } from "@/utils/actionToast";
import {
  isAlreadyDecidedUserRequestError,
  isEmployeeEditableUserRequest,
  resolveUserRequestId,
  revokeOwnedUserRequest,
  updateOwnedUserRequest,
} from "@/utils/userRequest";

export interface WfhRequestActionsParams {
  form: LeaveRequestFormState;
  setForm: (next: LeaveRequestFormState | ((prev: LeaveRequestFormState) => LeaveRequestFormState)) => void;
  editingRequestId: string;
  setEditingRequestId: (id: string) => void;
  managerEmails: string[];
  setManagerEmails: (emails: string[]) => void;
  setAdditionalRecipientEmails: (emails: string[]) => void;
  setViewTab: (tab: "request" | "view") => void;
  requiresClientApproval: boolean;
  routesToHr: boolean;
  /** The Leave page's shared busy/toast wrapper. */
  runAction: (label: string, fn: () => Promise<unknown>, options?: { splash?: boolean }) => Promise<void>;
  reloadRequests: () => Promise<void>;
  invalidateBalance: () => void;
  confirm: (state: LeaveConfirmState) => void;
}

export interface WfhRequestActions {
  submit: () => void;
  cancelEdit: () => void;
  editRow: (row: Record<string, unknown>) => void;
  revokeRow: (requestId: string) => void;
  refresh: () => void;
}

/**
 * The WFH tab's write paths, lifted out of the Leave page unchanged. Form and
 * selection state stay owned by the page (they survive switching sub-tabs).
 */
export function useWfhRequestActions(params: WfhRequestActionsParams): WfhRequestActions {
  const {
    form,
    setForm,
    editingRequestId,
    setEditingRequestId,
    managerEmails,
    setManagerEmails,
    setAdditionalRecipientEmails,
    setViewTab,
    requiresClientApproval,
    routesToHr,
    runAction,
    reloadRequests,
    invalidateBalance,
    confirm,
  } = params;

  const submit = useCallback(() => {
    void runAction(userRequestActionLabel("WFH", editingRequestId ? "update" : "submit"), async () => {
      const fromDate = normalizeToApiDate(form.request_from_date.trim());
      const toDate = fromDate;
      if (!fromDate || !parseApiDate(fromDate)) throw new Error(WFH_ERRORS.invalidFromDate);
      const comments = form.comments.trim();
      if (!comments) throw new Error(WFH_ERRORS.commentsRequired);
      if (comments.length > WFH_COMMENT_MAX_LENGTH) throw new Error(WFH_ERRORS.commentsTooLong);
      if (requiresClientApproval && !form.client_approval) {
        throw new Error(WFH_ERRORS.clientApprovalRequired);
      }
      if (!routesToHr && !managerEmails.length) throw new Error(WFH_ERRORS.managerRequired);
      const payload = buildUserRequestBody(
        {
          request_from_date: fromDate,
          request_to_date: toDate,
          request_type: "WFH",
          comments,
          is_half_day: form.is_half_day,
          client_approval: requiresClientApproval ? form.client_approval : undefined,
          selected_manager_emails: routesToHr ? [] : managerEmails,
        },
        {
          ...(editingRequestId ? { userRequestId: Number(editingRequestId) } : {}),
          routesToHr,
        }
      );
      if (editingRequestId) {
        await updateOwnedUserRequest(payload);
      } else {
        await apiClient.post(endpoints.userRequest.root, {
          contentType: "application/json",
          body: JSON.stringify(payload),
        });
      }
      setForm(createDefaultLeaveRequestForm());
      setManagerEmails([]);
      setAdditionalRecipientEmails([]);
      setEditingRequestId("");
      try {
        await reloadRequests();
      } catch {
        /* submission succeeded; ignore refresh issue */
      }
      invalidateBalance();
    });
  }, [
    runAction,
    editingRequestId,
    form,
    requiresClientApproval,
    routesToHr,
    managerEmails,
    setForm,
    setManagerEmails,
    setAdditionalRecipientEmails,
    setEditingRequestId,
    reloadRequests,
    invalidateBalance,
  ]);

  const cancelEdit = useCallback(() => {
    setForm(createDefaultLeaveRequestForm());
    setEditingRequestId("");
  }, [setForm, setEditingRequestId]);

  const editRow = useCallback(
    (row: Record<string, unknown>) => {
      if (!isEmployeeEditableUserRequest(row)) {
        showErrorToast(WFH_ERRORS.onlyPendingEditable);
        return;
      }
      const rowType = String(row.request_type ?? row.requestType ?? "WFH");
      const fromDate = String(row.request_from_date ?? row.requestFromDate ?? "");
      setForm({
        request_from_date: fromDate,
        request_to_date: fromDate,
        request_type: rowType,
        comments: String(row.comments ?? ""),
        is_half_day: Boolean(row.is_half_day ?? row.isHalfDay ?? false),
        client_approval: false,
      });
      setManagerEmails(pickManagerEmailList(row, "primary"));
      const requestId = resolveUserRequestId(row);
      if (!requestId) {
        showErrorToast(WFH_ERRORS.missingRequestId);
        return;
      }
      setEditingRequestId(requestId);
      setViewTab("request");
    },
    [setForm, setManagerEmails, setEditingRequestId, setViewTab]
  );

  const revokeRow = useCallback(
    (requestId: string) =>
      confirm({
        ...WFH_REVOKE_CONFIRM,
        tone: "danger",
        run: () =>
          runAction(userRequestActionLabel("WFH", "revoke"), async () => {
            try {
              await revokeOwnedUserRequest(Number(requestId));
            } catch (error) {
              // A reviewer decided it while this list was cached.
              // Refresh so Delete stops being offered.
              if (isAlreadyDecidedUserRequestError(error)) {
                await reloadRequests();
              }
              throw error;
            }
            if (editingRequestId === requestId) {
              setEditingRequestId("");
              setForm(createDefaultLeaveRequestForm());
              setManagerEmails([]);
            }
            await reloadRequests();
          }),
      }),
    [confirm, runAction, reloadRequests, editingRequestId, setEditingRequestId, setForm, setManagerEmails]
  );

  const refresh = useCallback(
    () => void runAction(WFH_COPY.refreshLabel, reloadRequests, { splash: false }),
    [runAction, reloadRequests]
  );

  return { submit, cancelEdit, editRow, revokeRow, refresh };
}
