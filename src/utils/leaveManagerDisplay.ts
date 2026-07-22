import { pickRowField } from "@/utils/compOff";
import { isPendingApprovalStage, requestFinalStatus, requestManagerStatus } from "@/utils/userRequest";

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
      : ["secondary_managers", "secondaryManagers", "secondary_manager_emails", "secondaryManagerEmails"];

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

/** Leave or WFH rows that use the primary-manager approval workflow. */
export function isLeaveOrWfhRequestRow(row: Record<string, unknown>): boolean {
  const type = String(pickRowField(row, "request_type", "requestType") ?? "")
    .trim()
    .toUpperCase();
  return type === "LEAVE" || type === "WFH";
}

export function hasPrimaryLeaveManagers(row: Record<string, unknown>): boolean {
  return isLeaveOrWfhRequestRow(row) && pickManagerEmailList(row, "primary").length > 0;
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

/** Primary-manager leave/WFH workflow: assigned approver who is not the request owner and request is pending. */
export function canPrimaryManagerActOnLeave(
  row: Record<string, unknown>,
  actorEmail: string | null | undefined
): boolean {
  if (!isAssignedPrimaryLeaveManager(row, actorEmail)) return false;
  if (isOwnUserRequest(row, actorEmail)) return false;
  if (requestFinalStatus(row) !== "PENDING") return false;
  return isPendingApprovalStage(requestManagerStatus(row));
}

/**
 * Team Requests visibility: non-HR viewers only see leave/WFH where they are an
 * assigned primary manager. Other request types pass through unchanged.
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
    return isAssignedPrimaryLeaveManager(row, email);
  });
}
