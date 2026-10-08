export type HolidayViewMode = "table" | "calendar";

export const HOLIDAY_VIEW_COPY = {
  table: "Table",
  calendar: "Calendar",
  viewLabel: "View",
  legendMandatory: "Holiday",
  legendOptional: "Optional",
  legendToday: "Today",
  noHolidays: "No holidays",
  weekendNote: "weekend",
  summary: (total: number, mandatory: number, optional: number) =>
    `${total} ${total === 1 ? "holiday" : "holidays"} · ${mandatory} mandatory · ${optional} optional`,
  unreadable: (n: number) => `${n} ${n === 1 ? "row has" : "rows have"} a date that could not be read and ${n === 1 ? "is" : "are"} not shown.`,
} as const;

export const HOLIDAY_MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;

/** Monday-first, single letters like a wall calendar. */
export const HOLIDAY_WEEKDAY_LETTERS = ["M", "T", "W", "T", "F", "S", "S"] as const;
