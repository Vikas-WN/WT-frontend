import type { ParsedSpreadsheet, SpreadsheetRow } from "@/utils/parseSpreadsheetFile";

export const HOLIDAY_CALENDAR_COLUMNS = [
  { key: "date", label: "Date" },
  { key: "day", label: "Day" },
  { key: "holiday", label: "Holiday" },
  { key: "optional", label: "Optional" },
] as const;

export type HolidayCalendarColumnKey = (typeof HOLIDAY_CALENDAR_COLUMNS)[number]["key"];

export type HolidayCalendarRow = Record<HolidayCalendarColumnKey, string>;

const MONTHS: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

const HEADER_ALIASES: Record<HolidayCalendarColumnKey, string[]> = {
  date: ["date", "holiday date", "holiday_date"],
  day: ["day", "weekday", "day of week"],
  holiday: ["holiday", "name", "holiday name"],
  optional: ["optional", "is_optional", "optional note", "optional with"],
};

const HEADER_MATCHERS: Record<HolidayCalendarColumnKey, (header: string) => boolean> = {
  date: (header) => header.includes("date"),
  day: (header) => header === "day" || header.includes("weekday") || header.includes("day of week"),
  holiday: (header) => header.includes("holiday") || header === "name" || header === "holiday name",
  optional: (header) => header.includes("optional"),
};

const SL_NO_HEADER_MATCHER = (header: string) =>
  /\bsl\.?\s*no\b/.test(header) || header.includes("serial") || header === "sno";

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/[._]+/g, " ").replace(/\s+/g, " ");
}

function isSlNoHeader(header: string): boolean {
  const normalized = normalizeHeader(header);
  return SL_NO_HEADER_MATCHER(normalized);
}

function resolveSourceColumn(
  columns: string[],
  key: HolidayCalendarColumnKey
): string | null {
  const aliases = new Set(HEADER_ALIASES[key]);
  for (const column of columns) {
    const normalized = normalizeHeader(column);
    if (aliases.has(normalized) || HEADER_MATCHERS[key](normalized)) {
      return column;
    }
  }
  return null;
}

function resolveSourceColumns(columns: string[]): Record<HolidayCalendarColumnKey, string | null> {
  const sourceByKey = Object.fromEntries(
    HOLIDAY_CALENDAR_COLUMNS.map(({ key }) => [key, resolveSourceColumn(columns, key)])
  ) as Record<HolidayCalendarColumnKey, string | null>;

  const usableColumns = columns.filter((column) => column.trim().length > 0);
  const missingRequired = !sourceByKey.date || !sourceByKey.holiday;

  if (missingRequired && usableColumns.length >= 4) {
    const firstIsSlNo = isSlNoHeader(usableColumns[0] ?? "");
    if (usableColumns.length >= 5 && firstIsSlNo) {
      sourceByKey.date = sourceByKey.date ?? usableColumns[1];
      sourceByKey.day = sourceByKey.day ?? usableColumns[2];
      sourceByKey.holiday = sourceByKey.holiday ?? usableColumns[3];
      sourceByKey.optional = sourceByKey.optional ?? usableColumns[4] ?? null;
    } else {
      sourceByKey.date = sourceByKey.date ?? usableColumns[0];
      sourceByKey.day = sourceByKey.day ?? usableColumns[1];
      sourceByKey.holiday = sourceByKey.holiday ?? usableColumns[2];
      sourceByKey.optional = sourceByKey.optional ?? usableColumns[3] ?? null;
    }
  }

  return sourceByKey;
}

function parseHolidayDate(value: string, contextYear?: number): Date | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const dmy = trimmed.match(/^(\d{1,2})[-/\s]+([A-Za-z]{3,})[-/\s]+(\d{4})$/);
  if (dmy) {
    const month = MONTHS[dmy[2].slice(0, 3).toLowerCase()];
    if (month == null) return null;
    const date = new Date(Number(dmy[3]), month, Number(dmy[1]));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const dm = trimmed.match(/^(\d{1,2})[-/\s]+([A-Za-z]{3,})$/);
  if (dm && contextYear != null) {
    const month = MONTHS[dm[2].slice(0, 3).toLowerCase()];
    if (month == null) return null;
    const date = new Date(contextYear, month, Number(dm[1]));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  // Prefer day-first numeric dates used across the app (dd/mm/yyyy, dd-mm-yyyy).
  const numericDmy = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (numericDmy) {
    const day = Number(numericDmy[1]);
    const month = Number(numericDmy[2]) - 1;
    const year = Number(numericDmy[3]);
    if (month >= 0 && month <= 11 && day >= 1 && day <= 31) {
      const date = new Date(year, month, day);
      if (
        !Number.isNaN(date.getTime()) &&
        date.getFullYear() === year &&
        date.getMonth() === month &&
        date.getDate() === day
      ) {
        return date;
      }
    }
  }

  // ISO-style yyyy-mm-dd
  const iso = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) {
    const year = Number(iso[1]);
    const month = Number(iso[2]) - 1;
    const day = Number(iso[3]);
    const date = new Date(year, month, day);
    if (
      !Number.isNaN(date.getTime()) &&
      date.getFullYear() === year &&
      date.getMonth() === month &&
      date.getDate() === day
    ) {
      return date;
    }
  }

  if (/\b(19|20)\d{2}\b/.test(trimmed)) {
    const parsed = Date.parse(trimmed);
    if (!Number.isNaN(parsed)) {
      return new Date(parsed);
    }
  }

  return null;
}

export function extractYearFromHolidayDate(date: string, contextYear?: number): number | null {
  const trimmed = date.trim();
  if (!trimmed) return null;

  const explicitYear = trimmed.match(/\b(19|20)\d{2}\b/);
  if (explicitYear) {
    return Number(explicitYear[0]);
  }

  const fromParsed = parseHolidayDate(trimmed, contextYear);
  if (fromParsed) {
    return fromParsed.getFullYear();
  }

  return contextYear ?? null;
}

function formatDayName(value: string, contextYear?: number): string {
  const parsed = parseHolidayDate(value, contextYear);
  if (!parsed) return "";
  return parsed.toLocaleDateString("en-US", { weekday: "long" });
}

export function yearsFromHolidayRows(rows: HolidayCalendarRow[]): number[] {
  const years = new Set<number>();
  for (const row of rows) {
    const year = extractYearFromHolidayDate(row.date);
    if (year != null) years.add(year);
  }
  return Array.from(years).sort((a, b) => b - a);
}

export function filterHolidayRowsByYear(
  rows: HolidayCalendarRow[],
  year: number,
  contextYear: number = year
): HolidayCalendarRow[] {
  const hasExplicitYearData = rows.some((row) => /\b(19|20)\d{2}\b/.test(row.date));
  if (!hasExplicitYearData) return rows;

  return rows.filter((row) => extractYearFromHolidayDate(row.date, contextYear) === year);
}

function startOfDay(date: Date): Date {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

export function parseHolidayCalendarDate(value: string, contextYear?: number): Date | null {
  const parsed = parseHolidayDate(value, contextYear);
  return parsed ? startOfDay(parsed) : null;
}

export function upcomingHolidayRowsInYear(
  rows: HolidayCalendarRow[],
  year: number,
  referenceDate: Date = new Date()
): HolidayCalendarRow[] {
  const today = startOfDay(referenceDate);

  return rows
    .map((row) => {
      const parsed = parseHolidayCalendarDate(row.date, year);
      if (!parsed || parsed.getFullYear() !== year || parsed < today) return null;
      return { row, parsed };
    })
    .filter((item): item is { row: HolidayCalendarRow; parsed: Date } => item != null)
    .sort((left, right) => left.parsed.getTime() - right.parsed.getTime())
    .map(({ row }) => row);
}

export function holidayRowsTomorrow(
  rows: HolidayCalendarRow[],
  year: number,
  referenceDate: Date = new Date()
): HolidayCalendarRow[] {
  const today = startOfDay(referenceDate);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowTime = tomorrow.getTime();

  return rows.filter((row) => {
    const parsed = parseHolidayCalendarDate(row.date, year);
    return parsed?.getFullYear() === year && parsed.getTime() === tomorrowTime;
  });
}

export function normalizeHolidayCalendarRows(parsed: ParsedSpreadsheet): HolidayCalendarRow[] {
  const sourceByKey = resolveSourceColumns(parsed.columns);
  const normalized: HolidayCalendarRow[] = [];

  for (let index = 0; index < parsed.rows.length; index += 1) {
    const row = normalizeHolidayCalendarRow(parsed.rows[index], sourceByKey);

    if (normalized.length > 0 && !row.holiday.trim() && !row.date.trim()) {
      break;
    }

    if (!isHolidayDataRow(row)) continue;
    normalized.push(row);
  }

  return dedupeHolidayCalendarRows(normalized);
}

/** Excel edits often leave stale rows in the file. Keep the last row per date + holiday. */
export function dedupeHolidayCalendarRows(rows: HolidayCalendarRow[]): HolidayCalendarRow[] {
  const byKey = new Map<string, HolidayCalendarRow>();

  for (const row of rows) {
    const key = `${row.date.trim().toLowerCase()}|${row.holiday.trim().toLowerCase()}`;
    byKey.set(key, row);
  }

  return Array.from(byKey.values()).sort((left, right) => {
    const leftDate = parseHolidayCalendarDate(left.date);
    const rightDate = parseHolidayCalendarDate(right.date);
    if (!leftDate && !rightDate) return 0;
    if (!leftDate) return 1;
    if (!rightDate) return -1;
    return leftDate.getTime() - rightDate.getTime();
  });
}

function isHolidayDataRow(row: HolidayCalendarRow): boolean {
  const holiday = row.holiday.trim();
  const date = row.date.trim();
  if (!holiday || !date) return false;
  if (/^holiday\s*calendar\b/i.test(holiday)) return false;
  return true;
}

function normalizeHolidayCalendarRow(
  row: SpreadsheetRow,
  sourceByKey: Record<HolidayCalendarColumnKey, string | null>
): HolidayCalendarRow {
  const read = (key: HolidayCalendarColumnKey) => {
    const source = sourceByKey[key];
    return source ? String(row[source] ?? "").trim() : "";
  };

  const date = read("date");
  const day = read("day") || formatDayName(date);

  return {
    date,
    day,
    holiday: read("holiday"),
    optional: read("optional"),
  };
}
