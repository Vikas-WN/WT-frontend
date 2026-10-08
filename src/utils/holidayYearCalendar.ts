/** Pure helpers for the annual holiday calendar (no app imports, so they can be unit-tested directly). */

export interface HolidayInput {
  date: string;
  day: string;
  holiday: string;
  optional: string;
}

export interface MonthHoliday {
  dayOfMonth: number;
  /** Mon … Sun, from the date itself (the sheet's "Day" column is not trusted). */
  weekday: string;
  name: string;
  optional: boolean;
  /** The sheet's optional note, e.g. "Optional with Muharram". */
  note: string;
  weekend: boolean;
}

export interface YearMonth {
  /** 0 = January. */
  month: number;
  /** Leading `null`s pad to Monday; trailing `null`s pad to whole weeks. */
  cells: (number | null)[];
  holidays: MonthHoliday[];
}

export interface YearCalendar {
  months: YearMonth[];
  mandatory: number;
  optional: number;
  /** Rows whose date could not be read; they are not on the calendar. */
  unreadable: number;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export function isOptionalRow(row: HolidayInput): boolean {
  const value = row.optional?.trim();
  return Boolean(value && value !== "—");
}

function monthCells(year: number, month: number): (number | null)[] {
  const leading = (new Date(year, month, 1).getDay() + 6) % 7;
  const length = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [...Array.from({ length: leading }, () => null), ...Array.from({ length: length }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

/** Twelve months, each as a grid of weeks plus its holidays in date order. `parseDate` reads the sheet's date text. */
export function buildYearCalendar(
  rows: readonly HolidayInput[],
  year: number,
  parseDate: (value: string, year: number) => Date | null
): YearCalendar {
  const months: YearMonth[] = Array.from({ length: 12 }, (_, month) => ({ month, cells: monthCells(year, month), holidays: [] }));
  let mandatory = 0;
  let optional = 0;
  let unreadable = 0;
  for (const row of rows) {
    const date = parseDate(row.date, year);
    if (!date || date.getFullYear() !== year) {
      unreadable += 1;
      continue;
    }
    const isOptional = isOptionalRow(row);
    if (isOptional) optional += 1;
    else mandatory += 1;
    const weekday = date.getDay();
    months[date.getMonth()].holidays.push({
      dayOfMonth: date.getDate(),
      weekday: WEEKDAYS[weekday],
      name: row.holiday.trim() || "Holiday",
      optional: isOptional,
      note: isOptional && row.optional.trim() !== "Optional" ? row.optional.trim() : "",
      weekend: weekday === 0 || weekday === 6,
    });
  }
  for (const m of months) m.holidays.sort((a, b) => a.dayOfMonth - b.dayOfMonth || a.name.localeCompare(b.name));
  return { months, mandatory, optional, unreadable };
}
