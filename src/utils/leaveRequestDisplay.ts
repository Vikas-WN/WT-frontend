/** Format leave balance values for summary cards. */
export function formatBalanceDays(value: number | string | null | undefined): {
  amount: string;
  unit: string;
} {
  const parsed = typeof value === "number" ? value : Number.parseFloat(String(value ?? ""));
  if (!Number.isFinite(parsed)) return { amount: "0", unit: "days" };
  const amount = Number.isInteger(parsed) ? String(parsed) : String(Number(parsed.toFixed(1)));
  return { amount, unit: parsed === 1 ? "day" : "days" };
}

import { formatApiDateDisplay, parseApiDate } from "@/utils/apiDate";

export function formatLeaveDateRange(
  fromDate: unknown,
  toDate: unknown,
  isHalfDay?: boolean
): string {
  const from = formatApiDateDisplay(String(fromDate ?? "").trim()) || "—";
  const to = formatApiDateDisplay(String(toDate ?? "").trim()) || "—";
  if (from === to) return from;
  return `${from} – ${to}`;
}

/**
 * Count leave days excluding weekends (Sat/Sun).
 * Matches backend UserRequestService._working_days (holiday hook optional).
 */
export function countLeaveWorkingDays(
  fromDate: string,
  toDate: string,
  holidayDates?: ReadonlySet<string> | readonly string[]
): number {
  const from = parseApiDate(fromDate);
  const to = parseApiDate(toDate);
  if (!from || !to || to < from) return 0;

  const holidays = holidayDates
    ? holidayDates instanceof Set
      ? holidayDates
      : new Set(holidayDates)
    : null;

  let count = 0;
  const cursor = new Date(from);
  while (cursor <= to) {
    const weekday = cursor.getDay(); // 0 Sun … 6 Sat
    const isWeekend = weekday === 0 || weekday === 6;
    const key = [
      String(cursor.getFullYear()),
      String(cursor.getMonth() + 1).padStart(2, "0"),
      String(cursor.getDate()).padStart(2, "0"),
    ].join("-");
    const isHoliday = holidays?.has(key) || holidays?.has(formatApiDateDisplay(key)) || false;
    if (!isWeekend && !isHoliday) count += 1;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}

export function formatLeaveDaysCount(
  fromDate: string,
  toDate: string,
  isHalfDay?: boolean,
  holidayDates?: ReadonlySet<string> | readonly string[]
): string {
  if (isHalfDay) return "0.5";
  const days = countLeaveWorkingDays(fromDate, toDate, holidayDates);
  if (days <= 0) return "—";
  return String(days);
}
