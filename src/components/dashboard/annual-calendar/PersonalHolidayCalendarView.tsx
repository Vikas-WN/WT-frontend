"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { ArrowUpFromLine, CalendarHeart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContentCard } from "@/components/dashboard/ui/ContentCard";
import { EmptyState } from "@/components/dashboard/ui/EmptyState";
import { PageSectionHeader } from "@/components/dashboard/ui/PageSectionHeader";
import { ScrollableTable } from "@/components/dashboard/ui/ScrollableTable";
import { TableRowsSkeleton } from "@/components/dashboard/ui/SectionSkeleton";
import { ToolbarFilterSelect } from "@/components/dashboard/ui/ToolbarFilterSelect";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  WT_STICKY_TABLE_HEAD_CLASS,
  WtTable,
} from "@/components/dashboard/ui/wtTable";
import { CARD_CONTENT_CLASS } from "@/components/dashboard/ui/uiLayout";
import { ApiError } from "@/api/error";
import {
  isValidHolidayCalendarYear,
  useHolidayCalendarStorage,
} from "@/hooks/holiday-calendars/useHolidayCalendarStorage";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { holidayCalendarStorageService } from "@/services/holidayCalendarStorage.service";
import {
  filterHolidayRowsByYear,
  HOLIDAY_CALENDAR_COLUMNS,
  parseHolidayCalendarDate,
  type HolidayCalendarRow,
} from "@/utils/holidayCalendarTable";
import { downloadCsvFile } from "@/utils/parseSpreadsheetFile";

const YEAR_LOOKBACK = 15;

function yearSelectOptions(anchorYear: number): string[] {
  return Array.from({ length: YEAR_LOOKBACK + 1 }, (_, index) => String(anchorYear - index));
}

function sortHolidayRowsByDate(rows: HolidayCalendarRow[], year: number): HolidayCalendarRow[] {
  return [...rows].sort((left, right) => {
    const leftDate = parseHolidayCalendarDate(left.date, year);
    const rightDate = parseHolidayCalendarDate(right.date, year);
    if (!leftDate && !rightDate) return 0;
    if (!leftDate) return 1;
    if (!rightDate) return -1;
    return leftDate.getTime() - rightDate.getTime();
  });
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function isOptionalHoliday(row: HolidayCalendarRow): boolean {
  const value = row.optional?.trim();
  return Boolean(value && value !== "—");
}

/** Rows (already date-sorted) grouped into month sections for a calendar-like read. */
function groupRowsByMonth(
  rows: HolidayCalendarRow[],
  year: number
): { month: string; rows: HolidayCalendarRow[] }[] {
  const buckets = new Map<number, HolidayCalendarRow[]>();
  for (const row of rows) {
    const parsed = parseHolidayCalendarDate(row.date, year);
    const monthIndex = parsed ? parsed.getMonth() : 12; // undated rows sink to the end
    const list = buckets.get(monthIndex) ?? [];
    list.push(row);
    buckets.set(monthIndex, list);
  }
  return [...buckets.entries()]
    .sort(([a], [b]) => a - b)
    .map(([monthIndex, monthRows]) => ({
      month: MONTH_NAMES[monthIndex] ?? "Other",
      rows: monthRows,
    }));
}

function daysUntil(row: HolidayCalendarRow, year: number, today: Date): number | null {
  const parsed = parseHolidayCalendarDate(row.date, year);
  if (!parsed) return null;
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const target = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  return Math.round((target.getTime() - start.getTime()) / 86_400_000);
}

function relativeDayLabel(days: number): string {
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `In ${days} days`;
}

export function PersonalHolidayCalendarView() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(String(currentYear));
  const [downloading, setDownloading] = useState(false);
  const yearNumber = Number(selectedYear);
  const storageQuery = useHolidayCalendarStorage(selectedYear);

  useEffect(() => {
    if (!isValidHolidayCalendarYear(selectedYear)) return;
    if (!storageQuery.isError) return;
    const error = storageQuery.error;
    const message =
      error instanceof Error ? error.message : "Failed to load holiday calendar.";
    if (/file not found|nosuchkey|not found/i.test(message)) return;
    if (error instanceof ApiError && (error.status === 400 || error.status === 503)) return;
    showErrorToast(message);
  }, [selectedYear, storageQuery.isError, storageQuery.error]);

  function handleYearChange(next: string) {
    if (!next.trim() || !isValidHolidayCalendarYear(next)) {
      setSelectedYear(String(currentYear));
      return;
    }
    setSelectedYear(next);
  }

  const rowsInYear = useMemo(() => {
    if (storageQuery.data?.year !== yearNumber) return [];
    return filterHolidayRowsByYear(storageQuery.data.rows, yearNumber, yearNumber);
  }, [storageQuery.data, yearNumber]);

  const displayRows = useMemo(
    () => sortHolidayRowsByDate(rowsInYear, yearNumber),
    [rowsInYear, yearNumber]
  );

  const isLoading = storageQuery.isFetching && isValidHolidayCalendarYear(selectedYear);
  const isServiceUnavailable =
    storageQuery.isError &&
    storageQuery.error instanceof ApiError &&
    storageQuery.error.status === 503;
  const missingCalendar =
    isValidHolidayCalendarYear(selectedYear) &&
    !storageQuery.isFetching &&
    !isServiceUnavailable &&
    (storageQuery.data == null ||
      (storageQuery.isError &&
        /file not found|nosuchkey|not found/i.test(
          storageQuery.error instanceof Error
            ? storageQuery.error.message
            : String(storageQuery.error ?? "")
        )));
  const hasCalendarFile = storageQuery.data != null;

  function downloadParsedRowsAsCsv() {
    const exportColumns = HOLIDAY_CALENDAR_COLUMNS.map((column) => column.label);
    const exportRows = displayRows.map((row) =>
      Object.fromEntries(
        HOLIDAY_CALENDAR_COLUMNS.map(({ key, label }) => [label, row[key]?.trim() ?? ""])
      )
    );

    downloadCsvFile(`holiday_calendar_${selectedYear}.csv`, exportColumns, exportRows);
  }

  async function handleExport() {
    if (!displayRows.length) {
      showErrorToast("No holidays available to export for the selected year.");
      return;
    }

    setDownloading(true);
    try {
      try {
        await holidayCalendarStorageService.downloadStoredFile(yearNumber);
      } catch {
        downloadParsedRowsAsCsv();
      }
      showSuccessToast(`Holiday calendar for ${selectedYear} downloaded.`);
    } catch (error) {
      showErrorToast(
        error instanceof Error ? error.message : "Could not export the holiday calendar."
      );
    } finally {
      setDownloading(false);
    }
  }

  // The nearest holiday from today — only meaningful while looking at the
  // current year (a past/future year has no "next").
  const nextHoliday = useMemo(() => {
    if (yearNumber !== currentYear) return null;
    const today = new Date();
    let best: { row: HolidayCalendarRow; days: number } | null = null;
    for (const row of displayRows) {
      const days = daysUntil(row, yearNumber, today);
      if (days == null || days < 0) continue;
      if (!best || days < best.days) best = { row, days };
    }
    return best;
  }, [displayRows, yearNumber, currentYear]);

  const monthGroups = useMemo(
    () => groupRowsByMonth(displayRows, yearNumber),
    [displayRows, yearNumber]
  );

  const yearOptions = useMemo(() => yearSelectOptions(currentYear), [currentYear]);
  const yearSelectItems = useMemo(
    () => yearOptions.map((year) => ({ value: year, label: year })),
    [yearOptions]
  );
  const canExport = displayRows.length > 0 && !isLoading && !downloading;

  return (
    <ContentCard>
      <div className={CARD_CONTENT_CLASS}>
        <PageSectionHeader
          title="Holiday Calendar"
          description={
            isValidHolidayCalendarYear(selectedYear)
              ? `View and export organization holidays for ${selectedYear}.`
              : "Select a year to view organization holidays."
          }
          action={
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button
                type="button"
                variant="brand"
                className="h-10 shrink-0 gap-2 px-4"
                disabled={!canExport}
                title={
                  canExport
                    ? "Download the holiday calendar for offline reference"
                    : "Load a year with holidays to enable export"
                }
                aria-label="Export holiday calendar"
                onClick={() => void handleExport()}
              >
                <ArrowUpFromLine className="size-4" aria-hidden />
                {downloading ? "Exporting…" : "Export"}
              </Button>
              <ToolbarFilterSelect
                id="personal-holiday-calendar-year"
                label="Year"
                value={selectedYear}
                onChange={handleYearChange}
                options={yearSelectItems}
                digitsOnly
                className="w-32 min-w-32"
                contentClassName="min-w-[min(8rem,calc(100vw-1rem))] w-max max-w-[min(var(--available-width,100vw),calc(100vw-1rem))] z-[260]"
              />
            </div>
          }
        />

        {nextHoliday ? (
          <button
            type="button"
            onClick={() => {
              document
                .getElementById(`holiday-row-${nextHoliday.row.date}-${nextHoliday.row.holiday}`)
                ?.scrollIntoView({ block: "center", behavior: "smooth" });
            }}
            className="mt-6 flex w-full items-center gap-3 rounded-2xl border border-wt-border bg-gradient-to-br from-wt-surface-1 to-wt-surface-2/40 px-4 py-3.5 text-left transition-colors hover:border-[var(--wt-brand)]/40"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--wt-brand-soft)] text-[var(--wt-brand)]">
              <CalendarHeart className="size-5" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-wt-text">
                {nextHoliday.row.holiday.trim() || "Holiday"}
              </span>
              <span className="block text-xs text-wt-text-muted">
                {relativeDayLabel(nextHoliday.days)} · {nextHoliday.row.day.trim()},{" "}
                {nextHoliday.row.date.trim()}
                {isOptionalHoliday(nextHoliday.row) ? " · Optional" : ""}
              </span>
            </span>
          </button>
        ) : null}

        <div className="mt-6">
          {isLoading ? (
            <TableRowsSkeleton rows={5} columns={4} />
          ) : isServiceUnavailable ? (
            <EmptyState
              title="Holiday Calendar Unavailable"
              description="The holiday calendar could not be loaded right now. Please try again in a few minutes."
            />
          ) : missingCalendar || !hasCalendarFile ? (
            <EmptyState
              title="There is no holiday calendar configured"
              description={`No holiday calendar is configured for ${selectedYear}.`}
            />
          ) : displayRows.length === 0 ? (
            <EmptyState
              title="No Holidays"
              description={`No holidays are listed for ${selectedYear}.`}
            />
          ) : (
            <ScrollableTable maxHeightClass="max-h-[min(70vh,560px)]">
              <WtTable>
                <TableHeader className={WT_STICKY_TABLE_HEAD_CLASS}>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Date</TableHead>
                    <TableHead>Day</TableHead>
                    <TableHead>Holiday</TableHead>
                    <TableHead>Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthGroups.map(({ month, rows }) => (
                    <Fragment key={month}>
                      <TableRow className="hover:bg-transparent">
                        <TableCell
                          colSpan={4}
                          className="bg-wt-surface-2/60 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-wt-text-faint"
                        >
                          {month}
                        </TableCell>
                      </TableRow>
                      {rows.map((row) => {
                        const weekend = /^(sat|sun)/i.test(row.day.trim());
                        const optional = isOptionalHoliday(row);
                        return (
                          <TableRow
                            key={`${row.date}|${row.holiday}`}
                            id={`holiday-row-${row.date}-${row.holiday}`}
                          >
                            <TableCell className="px-3 py-2 whitespace-nowrap tabular-nums">
                              {row.date}
                            </TableCell>
                            <TableCell
                              className={`px-3 py-2 whitespace-nowrap ${weekend ? "text-wt-text-faint" : ""}`}
                            >
                              {row.day}
                            </TableCell>
                            <TableCell className="px-3 py-2 font-medium text-wt-text">
                              {row.holiday}
                            </TableCell>
                            <TableCell className="px-3 py-2 whitespace-nowrap">
                              {optional ? (
                                <span className="rounded-md bg-amber-500/12 px-1.5 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-400">
                                  Optional{row.optional.trim() !== "Optional" ? ` · ${row.optional.trim()}` : ""}
                                </span>
                              ) : (
                                <span className="rounded-md bg-emerald-500/12 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                                  Mandatory
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </Fragment>
                  ))}
                </TableBody>
              </WtTable>
            </ScrollableTable>
          )}
        </div>
      </div>
    </ContentCard>
  );
}
