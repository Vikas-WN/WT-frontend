export type HolidayViewMode = "table" | "calendar";

export const HOLIDAY_VIEW_COPY = {
  table: "Table",
  calendar: "Calendar",
  viewLabel: "View",
  legendMandatory: "Holiday",
  legendOptional: "Optional",
  legendToday: "Today",
  summary: (total: number, mandatory: number, optional: number) =>
    `${total} ${total === 1 ? "holiday" : "holidays"} · ${mandatory} mandatory · ${optional} optional`,
  unreadable: (n: number) => `${n} ${n === 1 ? "row has" : "rows have"} a date that could not be read and ${n === 1 ? "is" : "are"} not shown.`,
} as const;

export const HOLIDAY_MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;

/** Monday-first, as on the Who's Out calendar. */
export const HOLIDAY_WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export const HOLIDAY_MONTH_COPY = {
  prev: "Previous month",
  next: "Next month",
  thisMonth: "This month",
  monthsLabel: "Months",
  listTitle: (month: string) => `Holidays in ${month}`,
  empty: "No holidays this month.",
  mandatory: "Mandatory",
  optional: "Optional",
  more: (n: number) => `+${n} more`,
} as const;
