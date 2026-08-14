/** Statuses an employee may still edit, delete, or submit. Rejected is finalized (no resubmit). */
export const EMPLOYEE_EDITABLE_TIMELOG_STATUSES = new Set(["DRAFT"]);

export function normalizeTimelogStatus(status?: string | null): string {
  return String(status ?? "").trim().toUpperCase();
}

export function isEmployeeTimelogEditable(status?: string | null): boolean {
  const normalized = normalizeTimelogStatus(status);
  if (!normalized) return true; // new / unsaved cell
  return EMPLOYEE_EDITABLE_TIMELOG_STATUSES.has(normalized);
}

/** Rejected reviews are final; Edit/Delete stay visible but disabled so the lock is obvious. */
export function employeeTimelogActionLockReason(status?: string | null): string | null {
  if (normalizeTimelogStatus(status) === "REJECTED") {
    return "Rejected entries cannot be edited or deleted";
  }
  return null;
}

/** Manager Approve/Reject only while pending review. Approved/Rejected decisions are final. */
export function isManagerTimelogDecisionActionable(status?: string | null): boolean {
  return normalizeTimelogStatus(status) === "SUBMITTED";
}
