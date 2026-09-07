import {
  isManagerFlagTruthy,
  isManagerRoleLabel,
  allocationProjectCode,
} from "@/utils/dashboard/allocationDisplay";
import { formatAllocatedHoursPercentLabel } from "@/utils/dashboard/validation";
import { toPagedRows } from "@/utils/apiRows";
import { parseApiDate } from "@/utils/apiDate";

export function normalizeAssignedProjects(rows: Array<Record<string, unknown>>) {
  return rows.map((row) => {
    const nestedProject = row.project as Record<string, unknown> | undefined;
    const isManagerRaw = row.is_manager ?? null;
    const isManager =
      isManagerFlagTruthy(isManagerRaw) || isManagerRoleLabel(row.role ?? row.designation)
        ? "Yes"
        : "No";

    return {
      project_code: row.project_code ?? row.projectCode ?? row.code ?? nestedProject?.project_code ?? nestedProject?.projectCode ?? nestedProject?.code ?? "—",
      project_name: row.project_name ?? row.projectName ?? row.name ?? row.allocated_project_name ?? nestedProject?.project_name ?? nestedProject?.projectName ?? nestedProject?.name ?? "—",
      project_type: row.project_type ?? row.projectType ?? nestedProject?.project_type ?? nestedProject?.projectType ?? "—",
      role: row.role ?? row.designation ?? "—",
      allocated_hours: row.allocated_hours ?? row.allocatedHours ?? row.hours ?? "—",
      allocated_percent: row.allocated_percent ?? row.allocatedPercent ?? "—",
      billing_status: row.billing_status ?? row.billingStatus ?? "—",
      is_manager: isManager,
      start_date: row.start_date ?? row.startDate ?? "—",
      end_date: row.end_date ?? row.endDate ?? "—",
    } as Record<string, unknown>;
  });
}

function isTalentPoolProjectRow(row: Record<string, unknown>): boolean {
  const billingStatus = String(row.billing_status ?? row.billingStatus ?? "")
    .trim()
    .toUpperCase();

  const projectCode = String(row.project_code ?? row.projectCode ?? row.code ?? "")
    .trim()
    .toUpperCase();

  return billingStatus === "TALENT_POOL" || projectCode === "BENCH";
}

function withoutTalentPoolRows(
  rows: Array<Record<string, unknown>>
): Array<Record<string, unknown>> {
  return rows.filter((row) => !isTalentPoolProjectRow(row));
}

/** Map GET /allocation/user/detail current_projects into profile Project Details rows. */
export function buildProfileRowsFromMyAllocationsDetail(
  input: unknown
): Array<Record<string, unknown>> {
  const payload = (input as { data?: unknown })?.data ?? input;
  if (!payload || typeof payload !== "object") return [];
  const root = payload as Record<string, unknown>;
  const currentRaw = root.current_projects ?? root.currentProjects ?? root.current;
  if (!Array.isArray(currentRaw)) return [];

  const rows: Array<Record<string, unknown>> = [];
  for (const item of currentRaw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const nestedProject = o.project as Record<string, unknown> | undefined;
    const my =
      o.my_allocation && typeof o.my_allocation === "object"
        ? (o.my_allocation as Record<string, unknown>)
        : o.myAllocation && typeof o.myAllocation === "object"
          ? (o.myAllocation as Record<string, unknown>)
          : null;
    const projectCode = String(
      o.project_code ?? o.projectCode ?? my?.project_code ?? my?.projectCode ?? nestedProject?.project_code ?? nestedProject?.projectCode ?? nestedProject?.code ?? ""
    ).trim();
    if (!projectCode) continue;

    // A project the user only *manages* (no personal allocation) still comes back
    // in current_projects, but with my_allocation = null. Surface the manager
    // relationship instead of a blank row, and fall back to the nested project
    // record for whatever window/billing detail is available.
    const capacity = String(o.capacity ?? o.Capacity ?? "").trim().toLowerCase();
    const isManagerOnly = !my && (capacity === "project_manager" || capacity === "both");
    const roleValue =
      my?.role ??
      o.role ??
      (isManagerOnly ? "Project Manager" : "—");

    rows.push({
      project_code: projectCode,
      project_name:
        o.project_name ??
        o.projectName ??
        my?.project_name ??
        my?.projectName ??
        nestedProject?.project_name ??
        nestedProject?.projectName ??
        nestedProject?.name ??
        projectCode,
      role: roleValue,
      allocated_hours:
        my?.allocated_hours ?? my?.allocatedHours ?? my?.allocated_percent ?? my?.allocatedPercent,
      allocated_percent: my?.allocated_percent ?? my?.allocatedPercent,
      billing_status:
        my?.billing_status ??
        my?.billingStatus ??
        nestedProject?.billing_status ??
        nestedProject?.billingStatus ??
        "—",
      start_date:
        my?.start_date ??
        my?.startDate ??
        nestedProject?.start_date ??
        nestedProject?.startDate ??
        "—",
      end_date:
        my?.end_date ??
        my?.endDate ??
        nestedProject?.end_date ??
        nestedProject?.endDate ??
        "—",
      is_manager: isManagerOnly || isManagerRoleLabel(roleValue) ? "Yes" : "No",
    });
  }
  return withoutTalentPoolRows(normalizeAssignedProjects(rows));
}

/** Map GET /allocation/employee into profile Project Details rows. */
export function buildProfileRowsFromEmployeeAllocations(
  input: unknown
): Array<Record<string, unknown>> {
  const payload = (input as { data?: unknown })?.data ?? input;
  const allocations =
    payload &&
    typeof payload === "object" &&
    Array.isArray((payload as { allocations?: unknown }).allocations)
      ? ((payload as { allocations: Array<Record<string, unknown>> }).allocations)
      : toPagedRows(payload);
  return withoutTalentPoolRows(normalizeAssignedProjects(allocations));
}

/** True when the allocation window includes today (started and not ended). */
export function isCurrentlyActiveAllocationRow(
  row: Record<string, unknown>,
  today: Date = new Date()
): boolean {
  const todayStart = new Date(today);
  todayStart.setHours(0, 0, 0, 0);

  const startRaw = String(row.start_date ?? row.startDate ?? "").trim();
  const endRaw = String(row.end_date ?? row.endDate ?? "").trim();
  const start = startRaw && startRaw !== "—" ? parseApiDate(startRaw) : null;
  const end = endRaw && endRaw !== "—" ? parseApiDate(endRaw) : null;

  if (start && start > todayStart) return false;
  if (end && end < todayStart) return false;
  return true;
}

/** Human-readable current allocation line for profile Work Information. */
export function formatCurrentAllocationSummary(
  rows: Array<Record<string, unknown>>
): string {
  const active = rows.filter((row) => isCurrentlyActiveAllocationRow(row));
  if (!active.length) return "—";

  return active
    .map((row) => {
      const name = String(row.project_name ?? row.projectName ?? "")
        .trim();
      const code = String(row.project_code ?? row.projectCode ?? "").trim();
      const label = name && name !== "—" ? name : code || "—";
      const percent = formatAllocatedHoursPercentLabel(row);
      const role = String(row.role ?? row.designation ?? "").trim();
      const parts = [label];
      if (role && role !== "—") parts.push(role);
      if (percent && percent !== "—") parts.push(percent);
      return parts.join(" · ");
    })
    .filter((line) => line && line !== "—")
    .join("; ");
}

/** Prefer currently active rows for profile Project Details; fall back to all non-bench. */
export function selectProfileAllocationRows(
  rows: Array<Record<string, unknown>>
): Array<Record<string, unknown>> {
  const active = rows.filter((row) => isCurrentlyActiveAllocationRow(row));
  return active.length ? active : rows;
}

export function buildProfileAssignedProjects(
  assignedInput: unknown,
  allocationInput?: unknown
): Array<Record<string, unknown>> {
  const normalizedProjects = normalizeAssignedProjects(toPagedRows(assignedInput));
  const allocationRows =
    allocationInput === undefined ? [] : toPagedRows(allocationInput);

  // Allocations alone should still populate profile when assigned-projects is empty/failed.
  if (!normalizedProjects.length && allocationRows.length) {
    return withoutTalentPoolRows(normalizeAssignedProjects(allocationRows));
  }
  if (allocationInput === undefined) {
    return withoutTalentPoolRows(normalizedProjects);
  }

  return withoutTalentPoolRows(
    mergeProjectAndAllocationData(normalizedProjects, allocationRows)
  );
}

export function mergeProjectAndAllocationData(
  projectsRows: Array<Record<string, unknown>>,
  allocationRows: Array<Record<string, unknown>>
) {
  const allocationByProject = allocationRows.reduce<Record<string, Record<string, unknown>>>(
    (acc, row) => {
      const key = String(row.project_code ?? row.projectCode ?? "").trim();
      if (!key) return acc;
      const existing = acc[key];
      if (!existing) {
        acc[key] = row;
        return acc;
      }
      const existingIsManager =
        isManagerFlagTruthy(existing.is_manager) ||
        isManagerRoleLabel(existing.role ?? existing.designation);
      const nextIsManager =
        isManagerFlagTruthy(row.is_manager) ||
        isManagerRoleLabel(row.role ?? row.designation);
      acc[key] = nextIsManager && !existingIsManager ? row : existing;
      return acc;
    },
    {}
  );

  return projectsRows.map((row) => {
    const projectKey = String(row.project_code ?? "").trim();
    const allocation = allocationByProject[projectKey] ?? {};
    return {
      ...row,
      role: row.role === "—" ? allocation.role ?? allocation.designation ?? "—" : row.role,
      allocated_hours:
        row.allocated_hours === "—"
          ? allocation.allocated_hours ?? allocation.allocatedHours ?? allocation.hours ?? "—"
          : row.allocated_hours,
      allocated_percent:
        row.allocated_percent === "—" || row.allocated_percent == null || row.allocated_percent === ""
          ? allocation.allocated_percent ?? allocation.allocatedPercent ?? "—"
          : row.allocated_percent,
      billing_status:
        row.billing_status === "—"
          ? allocation.billing_status ?? allocation.billingStatus ?? "—"
          : row.billing_status,
      is_manager:
        row.is_manager === "No" &&
        (allocation.is_manager !== undefined ||
          isManagerRoleLabel(allocation.role ?? allocation.designation))
          ? (() => {
              const raw = allocation.is_manager;
              return isManagerFlagTruthy(raw) ||
                isManagerRoleLabel(allocation.role ?? allocation.designation)
                ? "Yes"
                : "No";
            })()
          : row.is_manager,
      start_date:
        row.start_date === "—"
          ? allocation.start_date ?? allocation.startDate ?? "—"
          : row.start_date,
      end_date:
        row.end_date === "—"
          ? allocation.end_date ?? allocation.endDate ?? "—"
          : row.end_date,
    } as Record<string, unknown>;
  });
}

export function managerProjectCode(row: Record<string, unknown>) {
  const nestedProject = row.project as Record<string, unknown> | undefined;
  return String(
    row.project_code ??
      row.projectCode ??
      row.project_code_id ??
      row.projectCodeId ??
      row.allocated_project ??
      row.code ??
      nestedProject?.project_code ??
      nestedProject?.projectCode ??
      nestedProject?.code ??
      row.project_id ??
      row.projectId ??
      ""
  ).trim();
}

export function managerProjectName(row: Record<string, unknown>) {
  const nestedProject = row.project as Record<string, unknown> | undefined;
  return String(
    row.project_name ??
      row.projectName ??
      row.name ??
      row.allocated_project_name ??
      nestedProject?.project_name ??
      nestedProject?.projectName ??
      nestedProject?.name ??
      ""
  ).trim();
}

export function managerTeamEmails(rows: Array<Record<string, unknown>>) {
  return Array.from(
    new Set(
      rows
        .flatMap((row) => {
          const direct = String(
            row.employee_email ?? row.email ?? row.user_email ?? row.userEmail ?? ""
          )
            .trim()
            .toLowerCase();
          const nestedEmployees = Array.isArray(row.employees)
            ? (row.employees as Array<Record<string, unknown>>)
                .map((emp) =>
                  String(emp.email ?? emp.user_email ?? emp.userEmail ?? "")
                    .trim()
                    .toLowerCase()
                )
                .filter(Boolean)
            : [];
          return [direct, ...nestedEmployees];
        })
        .filter(Boolean)
    )
  );
}

export function managerTeamRowsForProject(
  rows: Array<Record<string, unknown>>,
  projectCode: string
) {
  const normalizedCode = projectCode.trim().toLowerCase();
  if (!normalizedCode) return [];
  return rows
    .filter((row) => managerProjectCode(row).trim().toLowerCase() === normalizedCode)
    .flatMap((row) => {
      const nestedEmployees = Array.isArray(row.employees)
        ? (row.employees as Array<Record<string, unknown>>)
        : [];
      const nestedUser =
        (row.user as Record<string, unknown> | undefined) ??
        (row.employee as Record<string, unknown> | undefined) ??
        (row.member as Record<string, unknown> | undefined) ??
        (row.user_master as Record<string, unknown> | undefined) ??
        (row.userMaster as Record<string, unknown> | undefined);
      const projectName = managerProjectName(row);
      const projectType = String(
        row.project_type ??
          row.projectType ??
          row.type ??
          (row.project as Record<string, unknown> | undefined)?.project_type ??
          (row.project as Record<string, unknown> | undefined)?.projectType ??
          "—"
      ).trim();
      const employeeFromRow = String(
        row.employee_name ??
          row.employeeName ??
          row.emp_name ??
          row.empName ??
          row.name ??
          row.user_name ??
          row.userName ??
          nestedUser?.name ??
          nestedUser?.employee_name ??
          nestedUser?.employeeName ??
          row.email ??
          row.user_email ??
          ""
      ).trim();
      const emailFromRow = String(
        row.email ??
          row.user_email ??
          row.userEmail ??
          row.employee_email ??
          row.employeeEmail ??
          row.emp_email ??
          row.empEmail ??
          nestedUser?.email ??
          nestedUser?.user_email ??
          nestedUser?.userEmail ??
          ""
      ).trim();
      const roleFromRow = String(
        row.role ??
          row.designation ??
          row.employee_role ??
          row.employeeRole ??
          nestedUser?.role ??
          nestedUser?.designation ??
          "—"
      ).trim();
      if (nestedEmployees.length) {
        return nestedEmployees.map((emp) => ({
          project_code: managerProjectCode(row) || "—",
          project_name: projectName || "—",
          project_type: projectType || "—",
          employee: String(emp.name ?? emp.employee_name ?? emp.employeeName ?? "—").trim() || "—",
          email: String(emp.email ?? emp.user_email ?? emp.userEmail ?? "—").trim() || "—",
          role: String(emp.project_role ?? emp.role ?? emp.designation ?? "—").trim() || "—",
          allocated_hours: formatAllocatedHoursPercentLabel(
            emp.allocated_hours ?? emp.allocatedHours ?? row.allocated_hours
          ),
          allocation_type: String(emp.allocation_type ?? emp.allocationType ?? row.allocation_type ?? "—").trim(),
          is_manager: String(emp.is_manager ?? emp.isManager ?? row.is_manager ?? "—").trim(),
          start_date: String(emp.start_date ?? emp.startDate ?? row.start_date ?? "—").trim(),
          end_date: String(emp.end_date ?? emp.endDate ?? row.end_date ?? "—").trim(),
        }));
      }
      return [
        {
          project_code: managerProjectCode(row) || "—",
          project_name: projectName || "—",
          project_type: projectType || "—",
          employee: employeeFromRow || "—",
          email: emailFromRow || "—",
          role: roleFromRow || "—",
          allocated_hours: formatAllocatedHoursPercentLabel(
            row.allocated_hours ?? row.allocatedHours ?? row.hours
          ),
          allocation_type: String(row.allocation_type ?? row.allocationType ?? "—").trim(),
          is_manager: String(row.is_manager ?? row.isManager ?? "—").trim(),
          start_date: String(row.start_date ?? row.startDate ?? "—").trim(),
          end_date: String(row.end_date ?? row.endDate ?? "—").trim(),
        },
      ];
    })
    .filter((row) => row.employee !== "—" || row.email !== "—");
}
