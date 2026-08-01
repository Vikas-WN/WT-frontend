import { normalizeRequestStatus, pickRowField } from "@/utils/compOff";
import {
  isPendingApprovalStage,
  requestFinalStatus,
  requestManagerStatus,
} from "@/utils/userRequest";

export function pickManagerEmailList(row: Record<string, unknown>, kind: "primary" | "secondary"): string[] {
  const keys =
    kind === "primary"
      ? [
          "primary_managers",
          "primaryManagers",
          "primary_manager_emails",
          "primaryManagerEmails",
          "selected_manager_emails",
          "selectedManagerEmails",
        ]
      : [
          "secondary_managers",
          "secondaryManagers",
          "secondary_manager_emails",
          "secondaryManagerEmails",
        ];

  const raw = pickRowField<unknown>(row, ...keys);
  if (!Array.isArray(raw)) return [];
  return raw.map((value) => String(value ?? "").trim()).filter(Boolean);
}

export function formatManagerLabelList(labels: string[]): { display: string; title?: string } {
  const list = labels.map((value) => value.trim()).filter(Boolean);
  if (!list.length) return { display: "—" };
  if (list.length === 1) return { display: list[0] };
  return {
    display: `${list[0]} +${list.length - 1} more`,
    title: list.join("\n"),
  };
}

export function formatManagerEmailList(emails: string[]): { display: string; title?: string } {
  const list = emails.map((email) => email.trim()).filter(Boolean);
  if (!list.length) return { display: "—" };
  if (list.length === 1) return { display: list[0] };
  return {
    display: `${list[0]} +${list.length - 1} more`,
    title: list.join("\n"),
  };
}

export function isLeaveRequestRow(row: Record<string, unknown>): boolean {
  return String(pickRowField(row, "request_type", "requestType") ?? "").trim().toUpperCase() === "LEAVE";
}

/** Leave, WFH, or OPTIONAL rows that use the primary-manager approval workflow. */
export function isLeaveOrWfhRequestRow(row: Record<string, unknown>): boolean {
  const type = String(pickRowField(row, "request_type", "requestType") ?? "")
    .trim()
    .toUpperCase();
  return type === "LEAVE" || type === "WFH" || type === "OPTIONAL";
}

export function hasPrimaryLeaveManagers(row: Record<string, unknown>): boolean {
  return isLeaveOrWfhRequestRow(row) && pickManagerEmailList(row, "primary").length > 0;
}

export function hasSecondaryLeaveManagers(row: Record<string, unknown>): boolean {
  return isLeaveOrWfhRequestRow(row) && pickManagerEmailList(row, "secondary").length > 0;
}

/**
 * Secondary stage for leave approval.
 * Backend packs secondary stage into `hr_status` for primary-manager leave/WFH rows.
 */
export function requestSecondaryManagerStatus(row: Record<string, unknown>): string {
  if (!hasSecondaryLeaveManagers(row)) return "APPROVED";
  return normalizeRequestStatus(
    pickRowField(
      row,
      "secondary_status",
      "secondaryStatus",
      "hr_status",
      "hrStatus"
    ) ?? "PENDING"
  );
}

export function isOwnUserRequest(
  row: Record<string, unknown>,
  actorEmail: string | null | undefined
): boolean {
  const email = String(actorEmail ?? "").trim().toLowerCase();
  if (!email) return false;
  const empEmail = String(
    pickRowField(row, "emp_email", "empEmail", "email", "user_email", "userEmail") ?? ""
  )
    .trim()
    .toLowerCase();
  return Boolean(empEmail) && email === empEmail;
}

export function isAssignedPrimaryLeaveManager(
  row: Record<string, unknown>,
  actorEmail: string | null | undefined
): boolean {
  const email = String(actorEmail ?? "").trim().toLowerCase();
  if (!email || !isLeaveOrWfhRequestRow(row)) return false;
  return pickManagerEmailList(row, "primary").some(
    (managerEmail) => managerEmail.trim().toLowerCase() === email
  );
}

export function isAssignedSecondaryLeaveManager(
  row: Record<string, unknown>,
  actorEmail: string | null | undefined
): boolean {
  const email = String(actorEmail ?? "").trim().toLowerCase();
  if (!email || !isLeaveOrWfhRequestRow(row)) return false;
  return pickManagerEmailList(row, "secondary").some(
    (managerEmail) => managerEmail.trim().toLowerCase() === email
  );
}

export function isAssignedLeaveManager(
  row: Record<string, unknown>,
  actorEmail: string | null | undefined
): boolean {
  return (
    isAssignedPrimaryLeaveManager(row, actorEmail) ||
    isAssignedSecondaryLeaveManager(row, actorEmail)
  );
}

/** Primary stage: assigned primary, request still open, primary has not decided yet. */
export function canPrimaryManagerActOnLeave(
  row: Record<string, unknown>,
  actorEmail: string | null | undefined
): boolean {
  if (!isAssignedPrimaryLeaveManager(row, actorEmail)) return false;
  if (isOwnUserRequest(row, actorEmail)) return false;
  if (requestFinalStatus(row) !== "PENDING") return false;
  return isPendingApprovalStage(requestManagerStatus(row));
}

/** Secondary can act while overall request is still pending and their stage is open. */
export function canSecondaryManagerRejectOnLeave(
  row: Record<string, unknown>,
  actorEmail: string | null | undefined
): boolean {
  if (!isAssignedSecondaryLeaveManager(row, actorEmail)) return false;
  if (isOwnUserRequest(row, actorEmail)) return false;
  if (requestFinalStatus(row) !== "PENDING") return false;
  return isPendingApprovalStage(requestSecondaryManagerStatus(row));
}

/**
 * Secondary can approve while their stage is open.
 * One assigned-manager approval (primary or secondary) fully approves the request.
 */
export function canSecondaryManagerApproveOnLeave(
  row: Record<string, unknown>,
  actorEmail: string | null | undefined
): boolean {
  return canSecondaryManagerRejectOnLeave(row, actorEmail);
}

/** True when the actor can approve and/or reject as an assigned leave manager. */
export function canAssignedLeaveManagerActOnLeave(
  row: Record<string, unknown>,
  actorEmail: string | null | undefined
): boolean {
  return (
    canPrimaryManagerActOnLeave(row, actorEmail) ||
    canSecondaryManagerRejectOnLeave(row, actorEmail)
  );
}

/**
 * Team Requests visibility: non-HR viewers only see leave/WFH where they are an
 * assigned primary or secondary manager. Other request types pass through unchanged.
 */
export function filterTeamRequestsForPrimaryManager(
  rows: Array<Record<string, unknown>>,
  options: { actorEmail?: string | null; hasHrAccess: boolean }
): Array<Record<string, unknown>> {
  if (options.hasHrAccess) return rows;
  const email = String(options.actorEmail ?? "").trim().toLowerCase();
  return rows.filter((row) => {
    if (!isLeaveOrWfhRequestRow(row)) return true;
    if (!email) return false;
    return isAssignedLeaveManager(row, email);
  });
}
