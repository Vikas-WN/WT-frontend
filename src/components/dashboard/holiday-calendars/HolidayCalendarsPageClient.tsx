"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { UI_COPY } from "@/constants/uiCopy";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { ManagementListCard } from "@/components/dashboard/ui/ManagementListCard";
import { ToolbarFilterSelect } from "@/components/dashboard/ui/ToolbarFilterSelect";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  WtTable,
} from "@/components/dashboard/ui/wtTable";
import {
  holidayCalendarStorageQueryKey,
  isValidHolidayCalendarYear,
  useHolidayCalendarStorage,
} from "@/hooks/holiday-calendars/useHolidayCalendarStorage";
import { showErrorToast } from "@/lib/toast";
import { holidayCalendarStorageService } from "@/services/holidayCalendarStorage.service";
import { parseSpreadsheetFile } from "@/utils/parseSpreadsheetFile";
import {
  HOLIDAY_CALENDAR_COLUMNS,
  normalizeHolidayCalendarRows,
  type HolidayCalendarColumnKey,
  type HolidayCalendarRow,
} from "@/utils/holidayCalendarTable";
import { holidayCalendarStorageFileName } from "@/utils/holidayCalendarStorage";
import { downloadCsvFile } from "@/utils/parseSpreadsheetFile";

const YEAR_LOOKBACK = 15;
const HOLIDAY_TABLE_COLUMN_COUNT = HOLIDAY_CALENDAR_COLUMNS.length;

function yearSelectOptions(anchorYear: number): string[] {
  return Array.from({ length: YEAR_LOOKBACK + 1 }, (_, index) => String(anchorYear - index));
}

const HOLIDAY_COLUMN_WIDTHS: Record<HolidayCalendarColumnKey, string> = {
  date: "16%",
  day: "18%",
  holiday: "28%",
  optional: "38%",
};

function cellClassName(key: HolidayCalendarColumnKey): string {
  const base = "px-3 py-2 text-left text-sm align-middle";
  if (key === "optional") return `${base} whitespace-normal`;
  return `${base} whitespace-nowrap`;
}

export function HolidayCalendarsPageClient() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(String(currentYear));
  const [uploading, setUploading] = useState(false);

  const storageQuery = useHolidayCalendarStorage(selectedYear);
  const loading = storageQuery.isFetching || uploading;

  const rows = useMemo(() => {
    if (storageQuery.data?.year !== Number(selectedYear)) return [];
    return storageQuery.data.rows;
  }, [storageQuery.data, selectedYear]);

  const loadedStorageFileName = storageQuery.data?.fileName ?? "";

  useEffect(() => {
    if (!isValidHolidayCalendarYear(selectedYear)) return;
    if (!storageQuery.isError) return;
    const error = storageQuery.error;
    showErrorToast(
      error instanceof Error ? error.message : "Failed to load holiday calendar from storage."
    );
  }, [selectedYear, storageQuery.isError, storageQuery.error]);

  function handleYearChange(next: string) {
    // Empty / cleared year snaps back to the current year so we never call the API with year 0.
    if (!next.trim() || !isValidHolidayCalendarYear(next)) {
      setSelectedYear(String(currentYear));
      return;
    }
    setSelectedYear(next);
  }

  const yearOptions = useMemo(() => yearSelectOptions(currentYear), [currentYear]);

  const filteredRows = useMemo(() => rows, [rows]);

  const yearSelectItems = useMemo(
    () => yearOptions.map((year) => ({ value: year, label: year })),
    [yearOptions]
  );

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const parsed = await parseSpreadsheetFile(file);
      if (!parsed.columns.length) {
        throw new Error("No columns were found in the uploaded file.");
      }

      const normalizedRows = normalizeHolidayCalendarRows(parsed);
      if (!normalizedRows.length) {
        throw new Error(
          "No holiday rows were found. Use columns Date, Day, Holiday, and Optional."
        );
      }

      const uploadYear = Number(selectedYear);
      if (!Number.isFinite(uploadYear)) {
        throw new Error("Select a valid year before uploading.");
      }

      await holidayCalendarStorageService.uploadFile(file, uploadYear, normalizedRows);

      setSelectedYear(String(uploadYear));
      await queryClient.invalidateQueries({
        queryKey: holidayCalendarStorageQueryKey(uploadYear),
      });
    } catch (error) {
      showErrorToast(error instanceof Error ? error.message : "Could not upload the holiday calendar.");
    } finally {
      setUploading(false);
    }
  }

  function handleDownload() {
    const exportColumns = HOLIDAY_CALENDAR_COLUMNS.map((column) => column.label);
    const exportRows = (filteredRows.length ? filteredRows : [{} as HolidayCalendarRow]).map((row) =>
      Object.fromEntries(
        HOLIDAY_CALENDAR_COLUMNS.map(({ key, label }) => [label, row[key]?.trim() ?? ""])
      )
    );

    downloadCsvFile(`holiday_calendar_${selectedYear}.csv`, exportColumns, exportRows);
  }

  const storageLabel =
    loadedStorageFileName || holidayCalendarStorageFileName(Number(selectedYear), ".csv");

  const yearIsValid = isValidHolidayCalendarYear(selectedYear);
  const description = !yearIsValid
    ? "Select a year to view or upload the holiday calendar."
    : storageQuery.data
      ? `Showing holidays for ${selectedYear}. Loaded file: ${storageLabel}`
      : `Upload a CSV or XLSX file to store holidays for ${selectedYear}.`;

  return (
    <DashboardPageShell>
      <ManagementListCard
        title="Holiday Calendar"
        description={description}
        headerAction={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (!file) return;
                void handleUpload(file);
              }}
            />
            <Button
              variant="brand"
              type="button"
              className="h-10 shrink-0 gap-2 px-4"
              disabled={loading || !yearIsValid}
              onClick={() => fileInputRef.current?.click()}
            >
              <ArrowDownToLine className="size-4" aria-hidden />
              Import
            </Button>
            <Button
              variant="outline"
              type="button"
              className="h-10 shrink-0 gap-2 px-4"
              disabled={loading || !filteredRows.length}
              onClick={handleDownload}
            >
              <ArrowUpFromLine className="size-4" aria-hidden />
              Export
            </Button>
            <ToolbarFilterSelect
              id="holiday-calendar-year"
              label="Year"
              value={selectedYear}
              onChange={handleYearChange}
              options={yearSelectItems}
              digitsOnly
              className="w-32 min-w-32"
              contentClassName="min-w-[min(9rem,calc(100vw-1rem))] w-max max-w-[min(var(--available-width,100vw),calc(100vw-1rem))]"
            />
          </div>
        }
      >
        <div className="w-full overflow-x-auto rounded-xl border border-wt-border">
          <WtTable className="w-full table-fixed">
            <colgroup>
              {HOLIDAY_CALENDAR_COLUMNS.map((column) => (
                <col key={column.key} style={{ width: HOLIDAY_COLUMN_WIDTHS[column.key] }} />
              ))}
            </colgroup>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {HOLIDAY_CALENDAR_COLUMNS.map((column) => (
                  <TableHead key={column.key} className="text-left">
                    {column.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, rowIndex) => (
                  <TableRow key={`holiday-skeleton-${rowIndex}`}>
                    {HOLIDAY_CALENDAR_COLUMNS.map((column) => (
                      <TableCell key={column.key} className={cellClassName(column.key)}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredRows.length ? (
                filteredRows.map((row, rowIndex) => (
                  <TableRow key={`holiday-row-${rowIndex}`}>
                    {HOLIDAY_CALENDAR_COLUMNS.map((column) => (
                      <TableCell key={column.key} className={cellClassName(column.key)}>
                        {row[column.key]?.trim() ? row[column.key] : "—"}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={HOLIDAY_TABLE_COLUMN_COUNT}
                    className="py-16 text-center text-sm text-wt-text-muted"
                  >
                    {UI_COPY.noRecordsFound}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </WtTable>
        </div>
      </ManagementListCard>
    </DashboardPageShell>
  );
}
