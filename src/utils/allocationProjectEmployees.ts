import { toRows } from "@/utils/apiRows";

export type AllocationProjectEmployee = {
  employeeEmail: string;
  employeeName: string;
  userId?: number;
  empId?: string;
  allocationId?: number;
  role?: string;
  allocatedPercent?: number;
  allocatedHours?: number;
  startDate?: string | null;
  endDate?: string | null;
  allocationType?: string | null;
};

function rowsFromPayload(data: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(data)) return data as Array<Record<string, unknown>>;
  if (!data || typeof data !== "object") return [];
  const o = data as Record<string, unknown>;
  // Prefer `items` even when empty so we don't pick an unrelated array key.
  if (Array.isArray(o.items)) return o.items as Array<Record<string, unknown>>;
  return toRows(data);
}

/** Parse GET /allocation/project-employees → data.items (one row per active allocation). */
export function parseAllocationProjectEmployees(data: unknown): AllocationProjectEmployee[] {
  const rows = rowsFromPayload(data);
  const out: AllocationProjectEmployee[] = [];

  for (const row of rows) {
    const email = String(
      row.employeeEmail ?? row.employee_email ?? row.userEmail ?? row.user_email ?? row.email ?? ""
    )
      .trim()
      .toLowerCase();
    if (!email) continue;
    const name = String(
      row.employeeName ?? row.employee_name ?? row.name ?? row.user_name ?? row.userName ?? email
    ).trim();
    const userIdRaw = row.userId ?? row.user_id;
    const userId =
      userIdRaw !== undefined && userIdRaw !== null && userIdRaw !== ""
        ? Number(userIdRaw)
        : undefined;
    const allocationIdRaw = row.allocationId ?? row.allocation_id;
    const allocationId =
      allocationIdRaw !== undefined && allocationIdRaw !== null && allocationIdRaw !== ""
        ? Number(allocationIdRaw)
        : undefined;
    const percentRaw = row.allocatedPercent ?? row.allocated_percent;
    const percent =
      percentRaw !== undefined && percentRaw !== null && percentRaw !== ""
        ? Number(percentRaw)
        : undefined;
    const hoursRaw = row.allocatedHours ?? row.allocated_hours;
    const hours =
      hoursRaw !== undefined && hoursRaw !== null && hoursRaw !== ""
        ? Number(hoursRaw)
        : undefined;
    const startDate = String(row.startDate ?? row.start_date ?? "").trim() || null;
    const endDate = String(row.endDate ?? row.end_date ?? "").trim() || null;

    out.push({
      employeeEmail: email,
      employeeName: name || email,
      userId: Number.isFinite(userId) ? userId : undefined,
      empId: String(row.empId ?? row.emp_id ?? "").trim() || undefined,
      allocationId: Number.isFinite(allocationId) ? allocationId : undefined,
      role: String(row.role ?? "").trim() || undefined,
      allocatedPercent: Number.isFinite(percent) ? percent : undefined,
      allocatedHours: Number.isFinite(hours) ? hours : undefined,
      startDate,
      endDate,
      allocationType: String(row.allocationType ?? row.allocation_type ?? "").trim() || null,
    });
  }

  return out.sort((a, b) => {
    const byName = a.employeeName.localeCompare(b.employeeName);
    if (byName !== 0) return byName;
    return String(a.startDate ?? "").localeCompare(String(b.startDate ?? ""));
  });
}

/** Distinct employees for pickers (Assign PM). Keeps first row per email. */
export function uniqueAllocationProjectEmployeesByEmail(
  employees: AllocationProjectEmployee[]
): AllocationProjectEmployee[] {
  const seen = new Set<string>();
  const out: AllocationProjectEmployee[] = [];
  for (const emp of employees) {
    const key = emp.employeeEmail.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(emp);
  }
  return out;
}
