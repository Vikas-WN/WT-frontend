import type { DayTimelogEntry } from "@/hooks/timelog/useDayTimelog.types";
import type { TimelogWeekSnapshot } from "@/utils/timelog/gridState";
import { toIsoDateKey } from "@/utils/timelog/weekDates";

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

function normalizeHoursByDate(raw: unknown): Record<string, number> {
  const source = asRecord(raw) ?? {};
  const out: Record<string, number> = {};
  for (const [key, value] of Object.entries(source)) {
    const hours = Number(value);
    if (Number.isFinite(hours) && hours > 0) out[toIsoDateKey(key) || key] = hours;
  }
  return out;
}

function normalizeIdByDate(raw: unknown): Record<string, number> {
  const source = asRecord(raw) ?? {};
  const out: Record<string, number> = {};
  for (const [key, value] of Object.entries(source)) {
    const id = Number(value);
    if (Number.isFinite(id) && id > 0) out[toIsoDateKey(key) || key] = id;
  }
  return out;
}

function normalizeStatusByDate(raw: unknown): Record<string, string> {
  const source = asRecord(raw) ?? {};
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(source)) {
    const status = readString(value).toUpperCase();
    if (status) out[toIsoDateKey(key) || key] = status;
  }
  return out;
}

function normalizeCommentByDate(raw: unknown): Record<string, string | null> {
  const source = asRecord(raw) ?? {};
  const out: Record<string, string | null> = {};
  for (const [key, value] of Object.entries(source)) {
    const comment = readString(value);
    out[toIsoDateKey(key) || key] = comment || null;
  }
  return out;
}

function normalizeWeekRow(raw: unknown): TimelogWeekSnapshot["rows"][number] | null {
  const row = asRecord(raw);
  if (!row) return null;
  const project_code = readString(row.project_code, row.projectCode, row.code);
  if (!project_code) return null;
  const task_category =
    readString(row.task_category, row.taskCategory, row.category) || "GENERAL";
  return {
    project_code,
    project_name: readString(row.project_name, row.projectName) || undefined,
    task_category,
    sub_category: readString(row.sub_category, row.subCategory) || null,
    comment: readString(row.comment, row.description) || null,
    hours_by_date: normalizeHoursByDate(
      row.hours_by_date ?? row.hoursByDate ?? row.daily_hours ?? row.dailyHours
    ),
    entry_ids_by_date: normalizeIdByDate(
      row.entry_ids_by_date ?? row.entryIdsByDate ?? row.timelog_ids_by_date ?? row.timelogIdsByDate
    ),
    status_by_date: normalizeStatusByDate(row.status_by_date ?? row.statusByDate),
    manager_comment_by_date: normalizeCommentByDate(
      row.manager_comment_by_date ??
        row.managerCommentByDate ??
        row.approverCommentByDate ??
        row.approver_comment_by_date
    ),
  };
}

/** Normalize GET /timelog/week (camelCase or snake_case). */
export function normalizeWeekSnapshot(payload: unknown): TimelogWeekSnapshot {
  let root = asRecord(payload) ?? {};
  const nested = asRecord(root.data);
  if (
    nested &&
    (Array.isArray(nested.rows) ||
      Array.isArray(nested.entries) ||
      nested.rows ||
      nested.entries ||
      nested.week_start ||
      nested.weekStart)
  ) {
    root = nested;
  }

  const rowSource = asArray(root.rows ?? root.entries ?? root.timelogs);
  const rows = rowSource
    .map(normalizeWeekRow)
    .filter((row): row is TimelogWeekSnapshot["rows"][number] => Boolean(row));

  const days = asArray(root.days).map((day) => toIsoDateKey(String(day)) || String(day));
  const dailySource = asRecord(root.daily_totals ?? root.dailyTotals) ?? {};
  const daily_totals: Record<string, number> = {};
  for (const [key, value] of Object.entries(dailySource)) {
    const hours = Number(value);
    daily_totals[toIsoDateKey(key) || key] = Number.isFinite(hours) ? hours : 0;
  }

  const weeklyTotal = Number(root.weekly_total ?? root.weeklyTotal ?? 0);

  return {
    week_start: readString(root.week_start, root.weekStart),
    week_end: readString(root.week_end, root.weekEnd),
    days,
    employee_email: readString(root.employee_email, root.employeeEmail).toLowerCase(),
    rows,
    daily_totals,
    weekly_total: Number.isFinite(weeklyTotal) ? weeklyTotal : 0,
  };
}

function readManagerEmails(row: Record<string, unknown>): string[] | null {
  const raw = row.primary_manager_emails ?? row.primaryManagerEmails;
  if (!Array.isArray(raw)) return null;
  const emails = raw
    .map((value) => String(value ?? "").trim().toLowerCase())
    .filter(Boolean);
  return emails.length ? emails : null;
}

/** Normalize GET /timelog/employee/entries items (camelCase or snake_case). */
export function normalizeDayTimelogEntry(raw: unknown, fallbackId = 0): DayTimelogEntry | null {
  const row = asRecord(raw);
  if (!row) return null;
  const parsedId = Number(row.id ?? row.timelog_id ?? row.timelogId);
  const id = Number.isFinite(parsedId) && parsedId > 0 ? parsedId : fallbackId;
  const project_code = readString(row.project_code, row.projectCode, row.code);
  const log_date = readString(row.log_date, row.logDate, row.date, row.work_date, row.workDate);
  if (!project_code || !log_date) return null;

  const hours = Number(row.hours ?? row.logged_hours ?? row.loggedHours ?? row.logged_hrs ?? 0);
  const managers = readManagerEmails(row);

  return {
    id,
    employee_email: readString(row.employee_email, row.employeeEmail).toLowerCase(),
    project_code,
    project_name: readString(row.project_name, row.projectName) || null,
    project_manager:
      readString(row.project_manager, row.projectManager) || managers?.[0] || null,
    primary_manager_emails: managers,
    primaryManagerEmails: managers,
    log_date,
    hours: Number.isFinite(hours) ? hours : 0,
    task_category: readString(row.task_category, row.taskCategory, row.category) || "GENERAL",
    sub_category: readString(row.sub_category, row.subCategory) || null,
    description: readString(row.description, row.comment) || null,
    status: readString(row.status).toUpperCase() || "DRAFT",
    manager_comment:
      readString(row.manager_comment, row.managerComment, row.approver_comment, row.approverComment) ||
      null,
    reviewed_by: readString(row.reviewed_by, row.reviewedBy) || null,
    reviewed_at: readString(row.reviewed_at, row.reviewedAt) || null,
    created_at: readString(row.created_at, row.createdAt),
    updated_at: readString(row.updated_at, row.updatedAt),
  };
}

export function normalizeDayTimelogEntries(payload: unknown): DayTimelogEntry[] {
  if (Array.isArray(payload)) {
    return payload
      .map((item, index) => normalizeDayTimelogEntry(item, index + 1))
      .filter((entry): entry is DayTimelogEntry => Boolean(entry));
  }

  const root = asRecord(payload);
  if (!root) return [];

  const candidates: unknown[] = [
    root.items,
    root.entries,
    root.timelogs,
    root.content,
    asRecord(root.data)?.items,
    asRecord(root.data)?.entries,
    asRecord(root.data)?.timelogs,
    asRecord(root.data)?.content,
    root.data,
  ];

  for (const candidate of candidates) {
    if (!Array.isArray(candidate)) continue;
    const entries = candidate
      .map((item, index) => normalizeDayTimelogEntry(item, index + 1))
      .filter((entry): entry is DayTimelogEntry => Boolean(entry));
    if (entries.length) return entries;
  }

  return [];
}
