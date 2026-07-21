"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpFromLine } from "lucide-react";
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
import {
  CARD_CONTENT_CLASS,
  INFO_BANNER_BODY_CLASS,
  INFO_BANNER_CLASS,
  INFO_BANNER_TITLE_CLASS,
} from "@/components/dashboard/ui/uiLayout";
import { ApiError } from "@/api/error";
import { useHolidayCalendarStorage } from "@/hooks/holiday-calendars/useHolidayCalendarStorage";
import { showErrorToast, showSuccessToast } from "@/lib/toast";
import { holidayCalendarStorageService } from "@/services/holidayCalendarStorage.service";
import {
  filterHolidayRowsByYear,
  HOLIDAY_CALENDAR_COLUMNS,
  holidayRowsTomorrow,
  parseHolidayCalendarDate,
  type HolidayCalendarRow,
} from "@/utils/holidayCalendarTable";
import { downloadCsvFile } from "@/utils/parseSpreadsheetFile";

const YEAR_LOOKBACK = 15;

function yearSelectOptions(anchorYear: number): string[] {
  return Array.from({ length: YEAR_LOOKBACK + 1 }, (_, index) => String(anchorYear - index));
}

function formatTomorrowReminder(holidays: HolidayCalendarRow[]): string {
  if (holidays.length === 1) {
    const holiday = holidays[0];
    const day = holiday.day.trim() || "Tomorrow";
    return `${holiday.holiday.trim()} falls on ${day} (${holiday.date.trim()}).`;
  }

  const names = holidays.map((holiday) => holiday.holiday.trim()).filter(Boolean);
  return `${names.join(", ")} fall tomorrow.`;
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

export function PersonalHolidayCalendarView() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(String(currentYear));
  const [downloading, setDownloading] = useState(false);
  const yearNumber = Number(selectedYear);
  const storageQuery = useHolidayCalendarStorage(selectedYear);

  useEffect(() => {
    if (!storageQuery.isError) return;
    const error = storageQuery.error;
    const message =
      error instanceof Error ? error.message : "Failed to load holiday calendar.";
    if (/file not found|nosuchkey|not found/i.test(message)) return;
    if (error instanceof ApiError && error.status === 503) return;
    showErrorToast(message);
  }, [storageQuery.isError, storageQuery.error]);

  const rowsInYear = useMemo(() => {
    if (storageQuery.data?.year !== yearNumber) return [];
    return filterHolidayRowsByYear(storageQuery.data.rows, yearNumber, yearNumber);
  }, [storageQuery.data, yearNumber]);

  const displayRows = useMemo(
    () => sortHolidayRowsByDate(rowsInYear, yearNumber),
    [rowsInYear, yearNumber]
  );

  const isLoading = storageQuery.isFetching;
  const isServiceUnavailable =
    storageQuery.isError &&
    storageQuery.error instanceof ApiError &&
    storageQuery.error.status === 503;
  const missingCalendar =
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

  const tomorrowHolidays = useMemo(() => {
    if (yearNumber !== currentYear) return [];
    return holidayRowsTomorrow(rowsInYear, yearNumber);
  }, [rowsInYear, yearNumber, currentYear]);

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
          description={`View and export organization holidays for ${selectedYear}.`}
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
                onChange={setSelectedYear}
                options={yearSelectItems}
                digitsOnly
                className="w-32 min-w-32"
                contentClassName="min-w-[8rem] w-max z-[260]"
              />
            </div>
          }
        />

        {tomorrowHolidays.length > 0 ? (
          <div className={`${INFO_BANNER_CLASS} mt-6`}>
            <p className={INFO_BANNER_TITLE_CLASS}>Holiday Tomorrow</p>
            <p className={INFO_BANNER_BODY_CLASS}>{formatTomorrowReminder(tomorrowHolidays)}</p>
          </div>
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
            <ScrollableTable maxHeightClass="max-h-[min(70vh,520px)]">
              <WtTable>
                <TableHeader className={WT_STICKY_TABLE_HEAD_CLASS}>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Date</TableHead>
                    <TableHead>Day</TableHead>
                    <TableHead>Holiday</TableHead>
                    <TableHead>Optional</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayRows.map((row) => (
                    <TableRow key={`${row.date}|${row.holiday}`}>
                      <TableCell className="px-3 py-2 whitespace-nowrap">{row.date}</TableCell>
                      <TableCell className="px-3 py-2 whitespace-nowrap">{row.day}</TableCell>
                      <TableCell className="px-3 py-2">{row.holiday}</TableCell>
                      <TableCell className="px-3 py-2 whitespace-normal">{row.optional || "—"}</TableCell>
                    </TableRow>
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
