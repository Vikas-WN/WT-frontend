"use client";

import { useEffect, useMemo } from "react";
import { ContentCard } from "@/components/dashboard/ui/ContentCard";
import { EmptyState } from "@/components/dashboard/ui/EmptyState";
import { PageSectionHeader } from "@/components/dashboard/ui/PageSectionHeader";
import { ScrollableTable } from "@/components/dashboard/ui/ScrollableTable";
import { TableRowsSkeleton } from "@/components/dashboard/ui/SectionSkeleton";
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
import { useHolidayCalendarStorage } from "@/hooks/holiday-calendars/useHolidayCalendarStorage";
import { showErrorToast } from "@/lib/toast";
import {
  filterHolidayRowsByYear,
  holidayRowsTomorrow,
  upcomingHolidayRowsInYear,
  type HolidayCalendarRow,
} from "@/utils/holidayCalendarTable";

function formatTomorrowReminder(holidays: HolidayCalendarRow[]): string {
  if (holidays.length === 1) {
    const holiday = holidays[0];
    const day = holiday.day.trim() || "Tomorrow";
    return `${holiday.holiday.trim()} falls on ${day} (${holiday.date.trim()}).`;
  }

  const names = holidays.map((holiday) => holiday.holiday.trim()).filter(Boolean);
  return `${names.join(", ")} fall tomorrow.`;
}

export function PersonalHolidayCalendarView() {
  const currentYear = new Date().getFullYear();
  const storageQuery = useHolidayCalendarStorage(currentYear);

  useEffect(() => {
    if (!storageQuery.isError) return;
    const error = storageQuery.error;
    showErrorToast(
      error instanceof Error ? error.message : "Failed to load holiday calendar."
    );
  }, [storageQuery.isError, storageQuery.error]);

  const rowsInYear = useMemo(() => {
    if (storageQuery.data?.year !== currentYear) return [];
    return filterHolidayRowsByYear(storageQuery.data.rows, currentYear, currentYear);
  }, [storageQuery.data, currentYear]);

  const upcomingRows = useMemo(
    () => upcomingHolidayRowsInYear(rowsInYear, currentYear),
    [rowsInYear, currentYear]
  );

  const tomorrowHolidays = useMemo(
    () => holidayRowsTomorrow(rowsInYear, currentYear),
    [rowsInYear, currentYear]
  );

  const isLoading = storageQuery.isFetching;
  const hasCalendarFile = storageQuery.data != null;

  return (
    <ContentCard>
      <div className={CARD_CONTENT_CLASS}>
        <PageSectionHeader
          title="Upcoming Holidays"
          description={`Holidays remaining in ${currentYear}. Past dates and previous years are not shown.`}
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
          ) : !hasCalendarFile ? (
            <EmptyState
              title="No Holiday Calendar"
              description={`The ${currentYear} holiday calendar has not been published yet.`}
            />
          ) : upcomingRows.length === 0 ? (
            <EmptyState
              title="No Upcoming Holidays"
              description={`There are no remaining holidays in ${currentYear}.`}
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
                  {upcomingRows.map((row) => (
                    <TableRow key={`${row.date}|${row.holiday}|${row.sl_no}`}>
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
