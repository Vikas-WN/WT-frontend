/**
 * Which days of the timelog calendar are on approved leave.
 *
 * No imports, so it can be unit-tested directly; the caller passes in how to read a row's status and dates.
 */

export const LEAVE_REQUEST_TYPES = ["LEAVE", "OPTIONAL"] as const;
export const LEAVE_DAY_LABEL = "On leave";
export const HALF_DAY_LEAVE_LABEL = "Half-day leave";

type Row = Record<string, unknown>;

export function leaveLabelsByDate(
  rows: readonly Row[],
  helpers: {
    statusOf: (row: Row) => string;
    parseDate: (value: string) => Date | null;
    toKey: (date: Date) => string;
  }
): Record<string, string> {
  const labels: Record<string, string> = {};
  for (const row of rows) {
    const type = String(row.request_type ?? row.requestType ?? "").trim().toUpperCase();
    if (!(LEAVE_REQUEST_TYPES as readonly string[]).includes(type)) continue;
    if (helpers.statusOf(row) !== "APPROVED") continue;
    const from = helpers.parseDate(String(row.request_from_date ?? row.requestFromDate ?? ""));
    const to = helpers.parseDate(String(row.request_to_date ?? row.requestToDate ?? "")) ?? from;
    if (!from || !to) continue;
    const half = Boolean(row.is_half_day ?? row.isHalfDay);
    for (let day = new Date(from); day <= to; day.setDate(day.getDate() + 1)) {
      const weekday = day.getDay();
      if (weekday === 0 || weekday === 6) continue; // weekends are not leave days
      const key = helpers.toKey(day);
      // A full day beats a half day if both are recorded for the same date.
      if (labels[key] !== LEAVE_DAY_LABEL) labels[key] = half ? HALF_DAY_LEAVE_LABEL : LEAVE_DAY_LABEL;
    }
  }
  return labels;
}
