import type {
  ProjectEmployee,
  ProjectTimelogProject,
  ProjectTimelogsData,
  ProjectWeekEmployeeTotal,
  ProjectWeekTotalsData,
} from "@/hooks/timelog/useProjectTimelogs.types";
import { extractFirstObjectArray, toPagedRows } from "@/utils/apiRows";

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function readString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return "";
}

function normalizeEmployee(raw: unknown): ProjectEmployee | null {
  const row = asRecord(raw);
  if (!row) return null;
  const email = readString(
    row.email,
    row.employee_email,
    row.employeeEmail,
    row.user_email,
    row.userEmail,
    row.emp_email,
    row.empEmail
  ).toLowerCase();
  if (!email) return null;
  const name = readString(
    row.name,
    row.employee_name,
    row.employeeName,
    row.full_name,
    row.fullName,
    email
  );
  const empId = readString(row.emp_id, row.empId, row.employee_id, row.employeeId);
  return {
    email,
    name: name || email,
    emp_id: empId || null,
  };
}

function normalizeProject(raw: unknown): ProjectTimelogProject | null {
  const row = asRecord(raw);
  if (!row) return null;
  const project_code = readString(
    row.project_code,
    row.projectCode,
    row.code,
    row.project_id,
    row.projectId
  );
  if (!project_code) return null;

  const employeesRaw = asArray(
    row.employees ?? row.members ?? row.team ?? row.team_members ?? row.teamMembers
  );
  const employees = employeesRaw
    .map(normalizeEmployee)
    .filter((employee): employee is ProjectEmployee => Boolean(employee));

  return {
    project_code,
    project_name: readString(row.project_name, row.projectName, row.name, project_code),
    project_type: readString(row.project_type, row.projectType, "—") || "—",
    employees,
  };
}

function collectProjects(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;

  const root = asRecord(payload);
  if (!root) return [];

  const nested = asRecord(root.data);
  const deep = asRecord(nested?.data);

  for (const candidate of [root, nested, deep]) {
    if (!candidate) continue;
    const direct = asArray(
      candidate.projects ??
        candidate.projectList ??
        candidate.project_list ??
        candidate.managerProjects ??
        candidate.manager_projects
    );
    if (direct.length) return direct;
  }

  const paged = toPagedRows(payload);
  if (paged.length) return paged;

  return extractFirstObjectArray(payload);
}

/** Normalize GET /timelog/projects (camelCase or snake_case). */
export function normalizeProjectTimelogsData(payload: unknown): ProjectTimelogsData {
  return {
    projects: collectProjects(payload)
      .map(normalizeProject)
      .filter((project): project is ProjectTimelogProject => Boolean(project)),
    pendingApprovals: [],
  };
}

function normalizeWeekEmployeeTotal(raw: unknown): ProjectWeekEmployeeTotal | null {
  const row = asRecord(raw);
  if (!row) return null;
  const email = readString(
    row.email,
    row.employee_email,
    row.employeeEmail,
    row.user_email,
    row.userEmail
  ).toLowerCase();
  if (!email) return null;
  const weekTotal = Number(row.week_total ?? row.weekTotal ?? row.total_hours ?? row.totalHours ?? 0);
  return {
    email,
    name: readString(row.name, email) || email,
    week_total: Number.isFinite(weekTotal) ? weekTotal : 0,
  };
}

export function normalizeProjectWeekTotalsData(payload: unknown): ProjectWeekTotalsData {
  const root = asRecord(payload) ?? {};
  const nested = asRecord(root.data) ?? root;
  return {
    project_code: readString(nested.project_code, nested.projectCode, root.project_code, root.projectCode),
    week_start: readString(nested.week_start, nested.weekStart, root.week_start, root.weekStart),
    employees: asArray(nested.employees ?? root.employees)
      .map(normalizeWeekEmployeeTotal)
      .filter((employee): employee is ProjectWeekEmployeeTotal => Boolean(employee)),
  };
}
