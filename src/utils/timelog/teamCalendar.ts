/**
 * What each cell of the team-time calendar shows: one person on one day.
 *
 * No imports, so it can be unit-tested directly. Dates are ISO (yyyy-mm-dd) throughout.
 */

export type TeamCalendarCellKind =
  | "weekend"
  | "holiday"
  | "leave"
  | "half-leave"
  | "hours"
  | "wfh"
  | "missing"
  | "future";

export type TeamCalendarCell = {
  kind: TeamCalendarCellKind;
  /** Approved hours logged that day, when there are any. */
  hours?: number;
  /** A short tag shown with the hours, e.g. work from home on a day that also has time logged. */
  tag?: string;
  /** The holiday's name, for a holiday cell. */
  title?: string;
};

export type TeamCalendarAbsence = {
  type: string;
  from_date: string;
  to_date: string;
  is_half_day: boolean;
  excluded_dates?: string[];
};

export type TeamCalendarHoliday = { date: string; name: string; is_optional: boolean };

export function isoDay(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/** Every day of a month, as ISO strings. */
export function daysOfMonth(year: number, month: number): string[] {
  const count = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: count }, (_, i) => isoDay(new Date(year, month, i + 1)));
}

export function isWeekend(day: string): boolean {
  const weekday = new Date(`${day}T00:00:00`).getDay();
  return weekday === 0 || weekday === 6;
}

/**
 * The mandatory holidays by date. An optional holiday is a choice, not a closure, so it does not turn a day into a
 * holiday for everyone — it is listed separately by the caller.
 */
export function mandatoryHolidays(holidays: readonly TeamCalendarHoliday[]): Record<string, string> {
  const byDate: Record<string, string> = {};
  for (const holiday of holidays) {
    if (holiday.is_optional) continue;
    byDate[holiday.date] = byDate[holiday.date] ? `${byDate[holiday.date]}, ${holiday.name}` : holiday.name;
  }
  return byDate;
}

function absenceOn(absences: readonly TeamCalendarAbsence[], day: string, kind: "leave" | "wfh") {
  for (const absence of absences) {
    const isLeave = absence.type.toUpperCase() === "LEAVE";
    if ((kind === "leave") !== isLeave) continue;
    if (day < absence.from_date || day > absence.to_date) continue;
    if (absence.excluded_dates?.includes(day)) continue;
    return absence;
  }
  return null;
}

export function teamCalendarCell(input: {
  day: string;
  today: string;
  hours?: number;
  absences: readonly TeamCalendarAbsence[];
  holidays: Record<string, string>;
}): TeamCalendarCell {
  const { day, today, absences, holidays } = input;
  const hours = input.hours && input.hours > 0 ? input.hours : undefined;
  if (isWeekend(day)) return hours ? { kind: "hours", hours, tag: "Weekend" } : { kind: "weekend" };
  if (holidays[day]) return hours ? { kind: "hours", hours, tag: "Holiday" } : { kind: "holiday", title: holidays[day] };
  const leave = absenceOn(absences, day, "leave");
  if (leave) {
    if (!leave.is_half_day) return { kind: "leave" };
    return { kind: "half-leave", hours };
  }
  const wfh = absenceOn(absences, day, "wfh");
  if (hours) return wfh ? { kind: "hours", hours, tag: "WFH" } : { kind: "hours", hours };
  if (wfh) return { kind: "wfh" };
  return { kind: day > today ? "future" : "missing" };
}

/** Hours a person logged across the month. */
export function monthTotal(hoursByDay: Record<string, number> | undefined, days: readonly string[]): number {
  if (!hoursByDay) return 0;
  const total = days.reduce((sum, day) => sum + (hoursByDay[day] ?? 0), 0);
  return Math.round(total * 100) / 100;
}
