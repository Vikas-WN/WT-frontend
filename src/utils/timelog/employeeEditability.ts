/** Statuses an employee may still edit, delete, or submit. Rejected is finalized. */
export const EMPLOYEE_EDITABLE_TIMELOG_STATUSES = new Set(["DRAFT"]);

export function isEmployeeTimelogEditable(status?: string | null): boolean {
  const normalized = String(status ?? "").trim().toUpperCase();
  if (!normalized) return true; // new / unsaved cell
  return EMPLOYEE_EDITABLE_TIMELOG_STATUSES.has(normalized);
}
