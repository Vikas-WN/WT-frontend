// This file has no imports so the unit tests can load it directly.

/** Filter value for "everything". */
export const ALL_FILTER = "ALL";
/** Filter value for allocations that carry no billing status (NB: non-billable has none). */
export const NO_STATUS_FILTER = "__NONE__";

/** dd/mm/yyyy (the API's date format) as a day number, or null when it is not a date. */
function dayNumber(value: string | null | undefined): number | null {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(String(value ?? "").trim());
  if (!m) return null;
  const d = Date.UTC(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  return Number.isNaN(d) ? null : Math.floor(d / 86_400_000);
}

type Row = Record<string, unknown>;

export interface PeopleAllocationRow {
  id: string;
  employee_name: string;
  employee_email: string;
  project_code: string;
  project_name: string;
  client_name: string;
  role: string;
  allocated_percent: string;
  allocation_type: string;
  billing_status: string;
  start_date: string;
  end_date: string;
}

export interface PeopleAllocationFilters {
  search: string;
  endFrom: string;
  endTo: string;
  status: string;
  type: string;
  project: string;
  client: string;
}

export const EMPTY_PEOPLE_ALLOCATION_FILTERS: PeopleAllocationFilters = {
  search: "",
  endFrom: "",
  endTo: "",
  status: ALL_FILTER,
  type: ALL_FILTER,
  project: ALL_FILTER,
  client: ALL_FILTER,
};

function text(value: unknown): string {
  const t = String(value ?? "").trim();
  return t === "—" ? "" : t;
}

function pick(row: Row, ...keys: string[]): string {
  for (const key of keys) {
    const t = text(row[key]);
    if (t) return t;
  }
  return "";
}

/** One row per allocation, with the client of its project joined on from the project list. */
export function buildPeopleAllocationRows(allocations: readonly Row[], projects: readonly Row[]): PeopleAllocationRow[] {
  const clientByProject = new Map<string, string>();
  for (const project of projects) {
    const code = pick(project, "project_code", "projectCode", "code").toUpperCase();
    const client = pick(project, "client_name", "clientName");
    if (code && client) clientByProject.set(code, client);
  }
  return allocations.map((row, index) => {
    const code = pick(row, "project_code", "projectCode");
    const billing = pick(row, "billing_status", "billingStatus").toUpperCase().replace(/[\s-]+/g, "_");
    return {
      id: pick(row, "id", "allocation_id", "allocationId") || String(index),
      employee_name: pick(row, "employee_name", "employeeName", "name"),
      employee_email: pick(row, "employee_email", "employeeEmail", "email"),
      project_code: code,
      project_name: pick(row, "project_name", "projectName") || code,
      client_name: pick(row, "client_name", "clientName") || clientByProject.get(code.toUpperCase()) || "",
      role: pick(row, "role", "project_role", "projectRole"),
      allocated_percent: pick(row, "allocated_percent", "allocatedPercent") ? `${pick(row, "allocated_percent", "allocatedPercent")}%` : "",
      allocation_type: pick(row, "allocation_type", "allocationType").toUpperCase(),
      billing_status: billing,
      start_date: pick(row, "start_date", "startDate"),
      end_date: pick(row, "end_date", "endDate"),
    };
  });
}

function endInRange(end: string, from: string, to: string): boolean {
  if (!from && !to) return true;
  // An open-ended allocation has no end date to fall in a range.
  const endDay = dayNumber(end);
  if (endDay === null) return false;
  const fromDay = dayNumber(from);
  const toDay = dayNumber(to);
  if (fromDay !== null && endDay < fromDay) return false;
  if (toDay !== null && endDay > toDay) return false;
  return true;
}

export function filterPeopleAllocations(rows: readonly PeopleAllocationRow[], f: PeopleAllocationFilters): PeopleAllocationRow[] {
  const q = f.search.trim().toLowerCase();
  return rows.filter((row) => {
    if (q && ![row.employee_name, row.employee_email, row.role, row.project_name, row.project_code].some((v) => v.toLowerCase().includes(q))) return false;
    if (f.status !== ALL_FILTER) {
      if (f.status === NO_STATUS_FILTER ? row.billing_status !== "" : row.billing_status !== f.status) return false;
    }
    if (f.type !== ALL_FILTER && row.allocation_type !== f.type) return false;
    if (f.project !== ALL_FILTER && row.project_code.toUpperCase() !== f.project.toUpperCase()) return false;
    if (f.client !== ALL_FILTER && row.client_name !== f.client) return false;
    return endInRange(row.end_date, f.endFrom, f.endTo);
  });
}

export function projectFilterOptions(rows: readonly PeopleAllocationRow[]): Array<{ value: string; label: string }> {
  const seen = new Map<string, string>();
  for (const r of rows) if (r.project_code) seen.set(r.project_code.toUpperCase(), r.project_name || r.project_code);
  return [...seen.entries()].sort((a, b) => a[1].localeCompare(b[1])).map(([value, label]) => ({ value, label }));
}

export function clientFilterOptions(rows: readonly PeopleAllocationRow[]): Array<{ value: string; label: string }> {
  return [...new Set(rows.map((r) => r.client_name).filter(Boolean))].sort((a, b) => a.localeCompare(b)).map((c) => ({ value: c, label: c }));
}

/** Soonest end first; open-ended allocations last. */
export function sortByEndDate(rows: readonly PeopleAllocationRow[]): PeopleAllocationRow[] {
  const time = (r: PeopleAllocationRow) => dayNumber(r.end_date) ?? Number.POSITIVE_INFINITY;
  return [...rows].sort((a, b) => time(a) - time(b) || a.employee_name.localeCompare(b.employee_name));
}
