import type { DayTimelogEntry } from "@/hooks/timelog/useDayTimelog.types";
import type { TimelogWeekSnapshot } from "@/utils/timelog/gridState";
import { toIsoDateKey } from "@/utils/timelog/weekDates";

function entryRowKey(entry: DayTimelogEntry): string {
  return [
    entry.project_code,
    entry.task_category,
    entry.sub_category ?? "",
    entry.description ?? "",
  ].join("||");
}

/** Build a weekly grid snapshot from flat timelog entries (manager-accessible API). */
export function weekSnapshotFromDayEntries(
  entries: DayTimelogEntry[],
  employeeEmail: string,
  weekStart: string,
  weekEnd: string,
  dayKeys: string[]
): TimelogWeekSnapshot {
  const daySet = new Set(dayKeys);
  const rowMap = new Map<string, TimelogWeekSnapshot["rows"][number]>();

  for (const entry of entries) {
    const logDate = toIsoDateKey(entry.log_date);
    if (!daySet.has(logDate)) continue;

    const key = entryRowKey(entry);
    let row = rowMap.get(key);
    if (!row) {
      row = {
        project_code: entry.project_code,
        project_name: entry.project_name?.trim() || undefined,
        task_category: entry.task_category,
        sub_category: entry.sub_category,
        comment: entry.description,
        hours_by_date: {},
        entry_ids_by_date: {},
        status_by_date: {},
        manager_comment_by_date: {},
      };
      rowMap.set(key, row);
    }

    const hours = Number(entry.hours);
    if (Number.isFinite(hours) && hours > 0) {
      row.hours_by_date[logDate] = (row.hours_by_date[logDate] ?? 0) + hours;
    }
    if (entry.id) row.entry_ids_by_date![logDate] = entry.id;
    if (entry.status) row.status_by_date![logDate] = entry.status;
    if (entry.manager_comment) row.manager_comment_by_date![logDate] = entry.manager_comment;
  }

  const daily_totals: Record<string, number> = {};
  for (const key of dayKeys) daily_totals[key] = 0;

  let weekly_total = 0;
  for (const row of rowMap.values()) {
    for (const [date, hours] of Object.entries(row.hours_by_date)) {
      daily_totals[date] = (daily_totals[date] ?? 0) + hours;
      weekly_total += hours;
    }
  }

  return {
    week_start: weekStart,
    week_end: weekEnd,
    days: dayKeys,
    employee_email: employeeEmail,
    rows: Array.from(rowMap.values()),
    daily_totals,
    weekly_total,
  };
}
