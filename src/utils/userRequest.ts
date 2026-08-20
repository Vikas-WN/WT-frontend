import { ApiError } from "@/api/error";

import { apiClient } from "@/api/httpClient";

import { endpoints } from "@/api/endpoints";

import type { ApiEnvelope } from "@/api/httpClient";

import type { ApprovalStage } from "@/types/userRequest";

import { applyApiDateQuery, toApiDateParam } from "@/utils/apiDate";

import { toPagedRows, extractFirstObjectArray } from "@/utils/apiRows";

import {

  isAlreadyActedOnRequestError,

  inferStatusFromAlreadyActedError,

  normalizeRequestStatus,

  pickRowField,

} from "@/utils/compOff";

import {
  canPrimaryManagerActOnLeave,
  canPrimaryManagerRejectOnLeave,
  canSecondaryManagerApproveOnLeave,
  canSecondaryManagerRejectOnLeave,
  hasPrimaryLeaveManagers,
  hasSecondaryLeaveManagers,
  isAssignedPrimaryLeaveManager,
  isAssignedSecondaryLeaveManager,
  isLeaveRequestClosedForManagerAction,
  pickManagerEmailList,
} from "@/utils/leaveManagerDisplay";
import { formatUiStatusLabel } from "@/utils/statusLabel";

export type UserRequestStatusValue = ApprovalStage;

/** Canonical request types for list fetches — avoid duplicate alias calls (COMPOFF, COMP-OFF, etc.). */
export const USER_REQUEST_FETCH_TYPES = ["LEAVE", "OPTIONAL", "WFH", "COMP_OFF"] as const;

function dedupeUserRequestRows(
  rows: Array<Record<string, unknown>>
): Array<Record<string, unknown>> {
  return Array.from(
    new Map(
      rows.map((row) => {
        const key = String(
          pickRowField(
            row,
            "user_request_id",
            "userRequestId",
            "request_id",
            "requestId",
            "id"
          ) ?? Math.random()
        );
        return [key, row] as const;
      })
    ).values()
  );
}

export function resolveRequestTypesForFetch(requestType: string): string[] {
  const normalized = requestType.trim().toUpperCase() || "ALL";
  if (normalized === "ALL") return ["ALL"];
  if (normalized === "LEAVE") return ["LEAVE"];
  if (normalized === "OPTIONAL" || normalized === "OPTIONAL_LEAVE") return ["OPTIONAL"];
  if (normalized === "WFH") return ["WFH"];
  if (
    normalized === "COMP_OFF" ||
    normalized === "COMPOFF" ||
    normalized === "COMP-OFF" ||
    normalized === "COMP OFF"
  ) {
    return ["COMP_OFF"];
  }
  return [requestType.trim()];
}

function extractUserRequestListRows(payload: unknown): Array<Record<string, unknown>> {
  const paged = toPagedRows(payload);
  if (paged.length) return paged;
  return extractFirstObjectArray(payload);
}

async function fetchUserRequestsFromRoot(params: {
  fromDate: string;
  toDate: string;
  requestType?: string;
  page?: number;
  size?: number;
  selfOnly?: boolean;
  empEmails?: string;
  hrTeamScope?: boolean;
}): Promise<Array<Record<string, unknown>>> {
  const normalizedFrom = toApiDateParam(params.fromDate) ?? params.fromDate.trim();
  const normalizedTo = toApiDateParam(params.toDate) ?? params.toDate.trim();
  const query: Record<string, string> = {
    fromDate: normalizedFrom,
    toDate: normalizedTo,
    requestType: params.requestType?.trim() || "ALL",
    page: String(params.page ?? 0),
    size: String(params.size ?? 200),
  };
  if (params.selfOnly) query.selfOnly = "true";
  if (params.empEmails?.trim()) query.empEmails = params.empEmails.trim();
  if (params.hrTeamScope) query.hrTeamScope = "true";

  try {
    const res = await apiClient.get<ApiEnvelope<unknown>>(endpoints.userRequest.root, {
      query: applyApiDateQuery(query, ["fromDate", "toDate"]),
    });
    const payload =
      res && typeof res === "object" && "data" in (res as object)
        ? (res as ApiEnvelope<unknown>).data
        : res;
    return dedupeUserRequestRows(extractUserRequestListRows(payload));
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 405)) {
      return [];
    }
    throw error;
  }
}

/** Team / scoped lists — single GET on `/userRequest` (no legacy path fallbacks). */
export async function listScopedUserRequests(params: {
  fromDate: string;
  toDate: string;
  requestType?: string;
  empEmails?: string;
  size?: number;
  hrTeamScope?: boolean;
}): Promise<Array<Record<string, unknown>>> {
  return fetchUserRequestsFromRoot({
    fromDate: params.fromDate,
    toDate: params.toDate,
    requestType: params.requestType ?? "ALL",
    empEmails: params.empEmails,
    size: params.size,
    hrTeamScope: params.hrTeamScope,
  });
}

export async function fetchPaginatedScopedUserRequests(params: {
  fromDate: string;
  toDate: string;
  requestType?: string;
  empEmails?: string;
  page: number;
  size: number;
  hrTeamScope?: boolean;
}): Promise<{
  rows: Array<Record<string, unknown>>;
  totalPages: number;
  totalElements: number;
}> {
  const normalizedFrom = toApiDateParam(params.fromDate) ?? params.fromDate.trim();
  const normalizedTo = toApiDateParam(params.toDate) ?? params.toDate.trim();
  const query: Record<string, string> = {
    fromDate: normalizedFrom,
    toDate: normalizedTo,
    requestType: params.requestType?.trim() || "ALL",
    page: String(params.page),
    size: String(params.size),
  };
  if (params.empEmails?.trim()) query.empEmails = params.empEmails.trim();
  if (params.hrTeamScope) query.hrTeamScope = "true";

  try {
    const res = await apiClient.get<ApiEnvelope<unknown>>(endpoints.userRequest.root, {
      query: applyApiDateQuery(query, ["fromDate", "toDate"]),
    });
    const payload =
      res && typeof res === "object" && "data" in (res as object)
        ? (res as ApiEnvelope<unknown>).data
        : res;

    const rows = dedupeUserRequestRows(extractUserRequestListRows(payload));

    const dataObj = payload as Record<string, unknown> | null;
    const tp = Number(dataObj?.total_pages ?? dataObj?.totalPages ?? 1);
    const te = Number(dataObj?.total_elements ?? dataObj?.totalElements ?? rows.length);

    return {
      rows,
      totalPages: Number.isFinite(tp) && tp > 0 ? tp : 1,
      totalElements: Number.isFinite(te) ? te : rows.length,
    };
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 405)) {
      return { rows: [], totalPages: 0, totalElements: 0 };
    }
    throw error;
  }
}



export const STAGE_USER_REQUEST_TYPES = ["LEAVE", "OPTIONAL", "WFH", "COMP_OFF"] as const;



export type StageUserRequestType = (typeof STAGE_USER_REQUEST_TYPES)[number];



export function isStageUserRequestType(value: unknown): boolean {

  const raw = String(value ?? "")

    .trim()

    .toUpperCase()

    .replace(/[\s-]+/g, "_");

  return (STAGE_USER_REQUEST_TYPES as readonly string[]).includes(raw);

}



export function isLeaveOrWfhRequestType(value: unknown): boolean {

  const raw = String(value ?? "")

    .trim()

    .toUpperCase()

    .replace(/[\s-]+/g, "_");

  return raw === "LEAVE" || raw === "OPTIONAL" || raw === "OPTIONAL_LEAVE" || raw === "WFH";

}

/** Custom WFH exceptions — HR-only approval (managers are notified, not decision makers). */
export function isWfhExceptionRequestType(value: unknown): boolean {
  const raw = String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
  return (
    raw === "WFH_EXCEPTION" ||
    raw === "WORK_FROM_HOME_EXCEPTION" ||
    raw === "CUSTOM_WFH"
  );
}

/** Leave, standard WFH, or custom WFH — types HR may decide while pending. */
export function isHrDirectLeaveOrWfhRequestType(value: unknown): boolean {
  return isLeaveOrWfhRequestType(value) || isWfhExceptionRequestType(value);
}



export function isLeaveRequestType(value: unknown): boolean {
  const raw = String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
  return raw === "LEAVE" || raw === "OPTIONAL" || raw === "OPTIONAL_LEAVE";
}



/** @deprecated Legacy Phase 1 email-only leave is superseded; always false. */
export function isLeaveEmailOnlyWorkflow(_row: Record<string, unknown>): boolean {
  return false;
}



export function isCompOffRequestType(value: unknown): boolean {

  const raw = String(value ?? "")

    .trim()

    .toUpperCase()

    .replace(/[\s-]+/g, "_");

  return raw === "COMP_OFF" || raw === "COMPOFF" || raw === "COMP-OFF";

}

/** Comp-off earn credit requests (manager-approved; separate from usage COMP_OFF). */
export function isCompOffEarnRequestType(value: unknown): boolean {
  const raw = String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
  return raw === "COMP_OFF_EARN" || raw === "COMPOFF_EARN" || raw === "COMP_OFF_EARNED";
}

/**
 * Managers approve/reject pending comp-off earn on Team Requests.
 * (HR may view earn rows but credit approval is manager-gated.)
 */
export function canManagerActOnCompOffEarn(
  row: Record<string, unknown>,
  options: { hasManagerAccess: boolean; actorEmail?: string | null }
): boolean {
  if (!isCompOffEarnRequestType(pickRowField(row, "request_type", "requestType"))) {
    return false;
  }
  if (requestFinalStatus(row) !== "PENDING") return false;
  if (!isPendingApprovalStage(requestManagerStatus(row))) return false;
  const actor = String(options.actorEmail ?? "")
    .trim()
    .toLowerCase();
  if (!actor) return false;
  const empEmail = String(
    pickRowField(row, "emp_email", "empEmail", "email", "user_email", "userEmail") ?? ""
  )
    .trim()
    .toLowerCase();
  if (empEmail && empEmail === actor) return false;

  const primary = pickManagerEmailList(row, "primary");
  const secondary = pickManagerEmailList(row, "secondary");
  if (primary.length || secondary.length) {
    return (
      primary.some((email) => email.trim().toLowerCase() === actor) ||
      secondary.some((email) => email.trim().toLowerCase() === actor)
    );
  }

  // Legacy rows without stored manager emails: any manager who can see the inbox may act.
  return Boolean(options.hasManagerAccess);
}



export function isPendingApprovalStage(value: unknown): boolean {

  const normalized = normalizeRequestStatus(value);

  return normalized === "PENDING" || normalized === "";

}



export function requestManagerStatus(row: Record<string, unknown>): string {

  return normalizeRequestStatus(

    pickRowField(row, "manager_status", "managerStatus") ?? "PENDING"

  );

}



export function requestHrStatus(row: Record<string, unknown>): string {

  return normalizeRequestStatus(pickRowField(row, "hr_status", "hrStatus") ?? "PENDING");

}



/** Canonical server status for a user request row (prefer `status` from list API). */
export function requestRowFinalStatus(row: Record<string, unknown>): string {
  const raw = normalizeRequestStatus(
    pickRowField(row, "status", "user_request_status", "userRequestStatus") ?? "PENDING"
  );
  if (
    raw === "SUBMITTED" &&
    isHrDirectLeaveOrWfhRequestType(pickRowField(row, "request_type", "requestType"))
  ) {
    return "PENDING";
  }
  return raw;
}

export function requestFinalStatus(row: Record<string, unknown>): string {
  return requestRowFinalStatus(row);
}

export function resolveUserRequestId(row: Record<string, unknown>): string {
  return String(
    pickRowField(row, "user_request_id", "userRequestId", "request_id", "requestId", "id") ??
      ""
  ).trim();
}

/** Employee self-service edit/revoke — must match backend update/delete gates. */
export function isEmployeeEditableUserRequest(row: Record<string, unknown>): boolean {
  const status = requestRowFinalStatus(row);
  return status === "PENDING" || status === "SUBMITTED";
}

export async function updateOwnedUserRequest(
  body: Record<string, unknown>
): Promise<ApiEnvelope<unknown>> {
  return apiClient.put<ApiEnvelope<unknown>>(endpoints.userRequest.root, {
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

export async function revokeOwnedUserRequest(userRequestId: number): Promise<ApiEnvelope<unknown>> {
  const idNum = Number(userRequestId);
  if (!Number.isFinite(idNum) || idNum <= 0) {
    throw new Error("Invalid request id.");
  }
  return apiClient.delete<ApiEnvelope<unknown>>(endpoints.userRequest.root, {
    contentType: "application/json",
    body: JSON.stringify({
      user_request_id: idNum,
      userRequestId: idNum,
    }),
  });
}



/** HR toggle value for LEAVE/WFH — prefer hr_status, fall back to status. */

export function hrToggleStatusFromRow(row: Record<string, unknown>): UserRequestStatusValue {

  const requestType = pickRowField(row, "request_type", "requestType");

  if (isLeaveOrWfhRequestType(requestType)) {

    const hr = requestHrStatus(row);

    if (hr === "APPROVED" || hr === "REJECTED" || hr === "PENDING") return hr;

  }

  if (isWfhExceptionRequestType(requestType)) {
    const final = requestFinalStatus(row);
    if (final === "APPROVED" || final === "REJECTED" || final === "PENDING") return final;
  }

  const final = requestFinalStatus(row);

  if (final === "APPROVED" || final === "REJECTED" || final === "PENDING") return final;

  return "PENDING";

}



export function isManagerApprovedForHr(row: Record<string, unknown>): boolean {

  return requestManagerStatus(row) === "APPROVED";

}



/** HR may approve/reject pending leave/WFH (override manager routing when needed). */
export function canHrReviewUserRequest(
  row: Record<string, unknown>,
  options: { hasHrAccess: boolean }
): boolean {
  if (!options.hasHrAccess) return false;
  if (requestFinalStatus(row) !== "PENDING") return false;
  const requestType = pickRowField(row, "request_type", "requestType");
  // Leave, WFH, and Custom WFH (HR-direct) — do not wait on manager approval.
  if (isHrDirectLeaveOrWfhRequestType(requestType)) return true;
  if (!isManagerApprovedForHr(row)) return false;
  return true;
}

export function canHrToggleLeaveWfh(
  row: Record<string, unknown>,
  options: { hasHrAccess: boolean }
): boolean {
  if (!options.hasHrAccess) return false;
  const requestType = pickRowField(row, "request_type", "requestType");
  if (isHrDirectLeaveOrWfhRequestType(requestType)) {
    return requestFinalStatus(row) === "PENDING";
  }
  if (isLeaveEmailOnlyWorkflow(row)) return false;
  return canHrReviewUserRequest(row, options);
}



/** HR on COMP_OFF usage: approve/reject only after manager approved. */

export function canHrActOnCompOff(

  row: Record<string, unknown>,

  options: { hasHrAccess: boolean }

): boolean {

  if (!options.hasHrAccess) return false;

  if (!isCompOffRequestType(pickRowField(row, "request_type", "requestType"))) return false;

  if (!canHrReviewUserRequest(row, options)) return false;

  return isPendingApprovalStage(requestHrStatus(row));

}

/** HR team table: show Approve/Reject for leave/WFH or comp-off usage. */

export function canHrShowTeamRequestActions(
  row: Record<string, unknown>,
  options: { hasHrAccess: boolean }
): boolean {
  return canHrToggleLeaveWfh(row, options) || canHrActOnCompOff(row, options);
}

export function hrTeamActionBlockedHint(

  row: Record<string, unknown>,

  options: { hasHrAccess: boolean }

): string | null {

  if (!options.hasHrAccess) return null;

  const requestType = pickRowField(row, "request_type", "requestType");

  if (isLeaveRequestType(requestType) || isHrDirectLeaveOrWfhRequestType(requestType)) {
    return null;
  }

  if (isCompOffEarnRequestType(requestType)) {
    // Earn is manager-final: once approved/rejected, Actions should not keep saying
    // "Awaiting manager approval".
    const final = requestFinalStatus(row);
    const mgr = requestManagerStatus(row);
    if (final === "APPROVED" || mgr === "APPROVED") return null;
    if (final === "REJECTED" || mgr === "REJECTED") return "Manager rejected";
    return "Awaiting manager approval";
  }

  if (!isLeaveOrWfhRequestType(requestType) && !isCompOffRequestType(requestType)) {

    return null;

  }

  if (canHrToggleLeaveWfh(row, options) || canHrActOnCompOff(row, options)) {

    return null;

  }

  const mgr = requestManagerStatus(row);

  if (mgr === "PENDING") return "Awaiting manager/DM approval";

  if (mgr === "REJECTED") return "Manager rejected";

  return null;

}



export function canManagerActOnRequest(
  row: Record<string, unknown>,
  options: { hasManagerAccess: boolean; hasDmAccess?: boolean; actorEmail?: string | null }
): boolean {
  // Never show Approve/Reject once the request is fully decided.
  if (requestFinalStatus(row) !== "PENDING") return false;

  const requestType = pickRowField(row, "request_type", "requestType");
  // Custom WFH is HR-only; managers are notified but cannot decide.
  if (isWfhExceptionRequestType(requestType)) return false;

  // Leave/WFH/optional: one manager decision closes the request for everyone else.
  if (isLeaveOrWfhRequestType(requestType) && isLeaveRequestClosedForManagerAction(row)) {
    return false;
  }

  if (canPrimaryManagerActOnLeave(row, options.actorEmail)) return true;
  if (canSecondaryManagerApproveOnLeave(row, options.actorEmail)) return true;
  if (canSecondaryManagerRejectOnLeave(row, options.actorEmail)) return true;

  if (hasPrimaryLeaveManagers(row)) return false;

  if (isLeaveEmailOnlyWorkflow(row)) return false;
  const hasManager = Boolean(options.hasManagerAccess);
  const hasDm = Boolean(options.hasDmAccess);
  if (!hasManager && !hasDm) return false;

  if (!isStageUserRequestType(requestType)) {
    return true;
  }
  if (!isPendingApprovalStage(requestManagerStatus(row))) {
    return false;
  }
  // DM-only users approve manager leave/WFH; PMs never see those in their scoped list.
  if (hasDm && !hasManager) return true;
  return hasManager;
}



export function canManagerRejectRequest(

  row: Record<string, unknown>,

  options: { hasManagerAccess: boolean; hasDmAccess?: boolean; actorEmail?: string | null }

): boolean {

  if (canPrimaryManagerRejectOnLeave(row, options.actorEmail)) return true;
  if (canSecondaryManagerRejectOnLeave(row, options.actorEmail)) return true;

  if (!canManagerActOnRequest(row, options)) return false;

  const requestType = pickRowField(row, "request_type", "requestType");

  if (isLeaveOrWfhRequestType(requestType) && isLeaveRequestClosedForManagerAction(row)) {
    return false;
  }

  if (isLeaveOrWfhRequestType(requestType) && requestFinalStatus(row) === "APPROVED") {

    return false;

  }

  return true;

}



/** @deprecated Use canManagerActOnRequest / canHrToggleLeaveWfh */

export function canApproverActOnRequest(

  row: Record<string, unknown>,

  options: { hasHrAccess: boolean; hasManagerAccess?: boolean; hasDmAccess?: boolean }

): boolean {

  if (options.hasHrAccess) {

    return canHrToggleLeaveWfh(row, options) || canHrActOnCompOff(row, options);

  }

  return canManagerActOnRequest(row, {
    hasManagerAccess: Boolean(options.hasManagerAccess),
    hasDmAccess: Boolean(options.hasDmAccess),
  });

}



/** PUT /api/v1/userRequest/status */

export async function updateUserRequestStatus(

  userRequestId: number,

  status: UserRequestStatusValue,

  options?: { reason?: string; requireReasonOnReject?: boolean }

): Promise<ApiEnvelope<unknown>> {

  const idNum = Number(userRequestId);

  if (!Number.isFinite(idNum) || idNum <= 0) {

    throw new Error("Invalid request id.");

  }

  const requireReason = options?.requireReasonOnReject ?? false;

  const trimmedReason = options?.reason?.trim() ?? "";

  if (status === "REJECTED" && requireReason && !trimmedReason) {

    throw new Error("Reason is required when rejecting a request.");

  }



  const body: Record<string, unknown> = {

    user_request_id: idNum,

    userRequestId: idNum,

    user_request_status: status,

    userRequestStatus: status,

  };

  if (status === "REJECTED" && requireReason && trimmedReason) {

    body.reason = trimmedReason;

    body.message = trimmedReason;

  }



  try {

    return await apiClient.put<ApiEnvelope<unknown>>(endpoints.userRequest.status, {

      contentType: "application/json",

      body: JSON.stringify(body),

    });

  } catch (firstError) {

    if (isAlreadyActedOnRequestError(firstError)) {
      // Idempotent only when the server already matches the requested action.
      // e.g. reject after another manager approved must not look like success.
      const inferred = inferStatusFromAlreadyActedError(firstError);
      if (inferred === status) {
        return { message: "ok", data: null } as ApiEnvelope<unknown>;
      }
      throw firstError;
    }

    if (status === "PENDING") {

      throw firstError;

    }

    try {

      const legacyStatus =

        status === "APPROVED" ? "APPROVE" : status === "REJECTED" ? "REJECT" : status;

      const legacy: Record<string, unknown> = {

        user_request_id: idNum,

        user_request_status: legacyStatus,

      };

      if (status === "REJECTED" && requireReason && trimmedReason) {

        legacy.reason = trimmedReason;

        legacy.message = trimmedReason;

      }

      return await apiClient.put<ApiEnvelope<unknown>>(endpoints.userRequest.status, {

        contentType: "application/json",

        body: JSON.stringify(legacy),

      });

    } catch (secondError) {

      if (isAlreadyActedOnRequestError(secondError)) {
        const inferred = inferStatusFromAlreadyActedError(secondError);
        if (inferred === status) {
          return { message: "ok", data: null } as ApiEnvelope<unknown>;
        }
      }

      throw firstError;

    }

  }

}



export function mergeStatusUpdateIntoRow(
  row: Record<string, unknown>,
  data: Record<string, unknown> | null | undefined
): Record<string, unknown> {
  if (!data || typeof data !== "object") return row;
  return { ...row, ...data };
}

/** Optimistic leave/WFH status patch so the table updates before/without a full refetch. */
export function patchLeaveTeamRequestStatus(
  row: Record<string, unknown>,
  status: UserRequestStatusValue,
  options?: { reason?: string; actorEmail?: string | null }
): Record<string, unknown> {
  const reason = options?.reason?.trim();
  const actorEmail = options?.actorEmail;
  const isPrimary = isAssignedPrimaryLeaveManager(row, actorEmail);
  const isSecondary = isAssignedSecondaryLeaveManager(row, actorEmail);
  const hasSecondary = hasSecondaryLeaveManagers(row);

  if (status === "REJECTED") {
    // One rejection finalizes the request — both primary and secondary stages show REJECTED
    // (same pattern as APPROVED painting both stages approved).
    return {
      ...row,
      status: "REJECTED",
      user_request_status: "REJECTED",
      userRequestStatus: "REJECTED",
      manager_status: "REJECTED",
      managerStatus: "REJECTED",
      ...(hasSecondary
        ? {
            hr_status: "REJECTED",
            hrStatus: "REJECTED",
            secondary_status: "REJECTED",
            secondaryStatus: "REJECTED",
          }
        : {
            hr_status: "REJECTED",
            hrStatus: "REJECTED",
          }),
      ...(isPrimary && reason
        ? {
            manager_reason: reason,
            managerReason: reason,
          }
        : {}),
      ...(isSecondary && reason
        ? {
            hr_reason: reason,
            hrReason: reason,
          }
        : {}),
      ...(!isPrimary && !isSecondary && reason
        ? {
            manager_reason: reason,
            managerReason: reason,
            hr_reason: reason,
            hrReason: reason,
          }
        : {}),
      ...(reason
        ? {
            reason,
            message: reason,
          }
        : {}),
    };
  }

  if (status !== "APPROVED") {
    return row;
  }


  return {
    ...row,
    status: "APPROVED",
    user_request_status: "APPROVED",
    userRequestStatus: "APPROVED",
    manager_status: "APPROVED",
    managerStatus: "APPROVED",
    ...(hasSecondary
      ? {
          hr_status: "APPROVED",
          hrStatus: "APPROVED",
          secondary_status: "APPROVED",
          secondaryStatus: "APPROVED",
        }
      : {
          hr_status: "APPROVED",
          hrStatus: "APPROVED",
        }),
  };
}

export function applyLeaveTeamRequestDecisions(
  rows: Array<Record<string, unknown>>,
  decisions: ReadonlyMap<string, { status: UserRequestStatusValue; reason?: string }>,
  actorEmail?: string | null
): Array<Record<string, unknown>> {
  if (!decisions.size) return rows;
  return rows.map((row) => {
    const id = String(
      row.user_request_id ??
        row.userRequestId ??
        row.request_id ??
        row.requestId ??
        row.id ??
        ""
    ).trim();
    if (!id) return row;
    const decision = decisions.get(id);
    if (!decision) return row;
    const serverStatus = requestFinalStatus(row);
    // Never let a session decision override a finalized server status.
    if (serverStatus === "APPROVED" || serverStatus === "REJECTED") return row;
    if (decision.status === "REJECTED") {
      return patchLeaveTeamRequestStatus(row, "REJECTED", {
        reason: decision.reason,
        actorEmail,
      });
    }
    return patchLeaveTeamRequestStatus(row, decision.status, {
      reason: decision.reason,
      actorEmail,
    });
  });
}

export function extractStatusUpdateData(envelope: ApiEnvelope<unknown>): Record<string, unknown> | null {
  const data = envelope?.data;
  if (data && typeof data === "object" && !Array.isArray(data)) {
    return data as Record<string, unknown>;
  }
  return null;
}



export function formatApprovalStageLabel(value: unknown): string {
  return formatUiStatusLabel(normalizeRequestStatus(value));
}



export function approvalStageTone(value: unknown): string {

  const s = normalizeRequestStatus(value);

  if (s === "SUBMITTED") return "text-[var(--wt-brand)]";

  if (s === "APPROVED") return "text-emerald-700";

  if (s === "REJECTED") return "text-rose-700";

  return "text-wt-text";

}



/** Show rejection reason only when the stage status is REJECTED (manager / legacy HR). */
export function formatStageRejectionReason(stage: unknown, reason: unknown): string {
  if (normalizeRequestStatus(stage) !== "REJECTED") return "—";
  const text = String(reason ?? "").trim();
  return text || "—";
}

/** Manager-stage rejection comment when that stage is REJECTED. */
export function requestManagerRejectionReason(row: Record<string, unknown>): string | null {
  if (requestManagerStatus(row) !== "REJECTED" && requestFinalStatus(row) !== "REJECTED") {
    return null;
  }
  const text = String(
    pickRowField(row, "manager_reason", "managerReason") ?? ""
  ).trim();
  return text || null;
}

/** HR-stage rejection comment when that stage is REJECTED. */
export function requestHrRejectionReason(row: Record<string, unknown>): string | null {
  if (requestHrStatus(row) !== "REJECTED" && requestFinalStatus(row) !== "REJECTED") {
    return null;
  }
  const text = String(pickRowField(row, "hr_reason", "hrReason") ?? "").trim();
  return text || null;
}

/**
 * Best rejection reason to show in list UIs: prefer manager_reason, then hr_reason.
 * Returns null unless the request is REJECTED overall.
 */
export function requestRejectionReason(row: Record<string, unknown>): string | null {
  if (requestFinalStatus(row) !== "REJECTED") return null;
  return requestManagerRejectionReason(row) ?? requestHrRejectionReason(row);
}

/** GET /api/v1/userRequest?... — logged-in user's own requests (session-scoped). */
export async function listSelfUserRequests(params: {
  fromDate: string;
  toDate: string;
  requestType?: string;
  page?: number;
  size?: number;
}): Promise<Array<Record<string, unknown>>> {
  return fetchUserRequestsFromRoot({
    fromDate: params.fromDate,
    toDate: params.toDate,
    requestType: params.requestType ?? "ALL",
    page: params.page,
    size: params.size,
    selfOnly: true,
  });
}


