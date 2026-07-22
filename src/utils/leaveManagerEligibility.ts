import { normalizeEmployeeStatusKey } from "@/utils/userStatus";

const LEAVE_MANAGER_PICKER_STATUSES = new Set(["ACTIVE", "INVITED"]);

/** Matches backend LEAVE_MANAGER_PICKER_STATUSES / is_leave_manager_picker_eligible. */
export function isEligibleLeaveManagerStatus(status: string | null | undefined): boolean {
  const normalized = normalizeEmployeeStatusKey(status);
  if (!normalized) return true;
  return LEAVE_MANAGER_PICKER_STATUSES.has(normalized);
}

export function filterEligibleLeaveManagers<
  T extends { email?: string | null; status?: string | null },
>(options: T[]): T[] {
  return options.filter(
    (option) => Boolean(String(option.email ?? "").trim()) && isEligibleLeaveManagerStatus(option.status)
  );
}
