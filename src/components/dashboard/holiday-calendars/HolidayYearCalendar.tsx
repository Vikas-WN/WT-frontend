"use client";

import { useMemo } from "react";

import { HolidayMonthCard } from "@/components/dashboard/holiday-calendars/HolidayMonthCard";
import { HOLIDAY_VIEW_COPY } from "@/constants/holidayCalendarView";
import { parseHolidayCalendarDate, type HolidayCalendarRow } from "@/utils/holidayCalendarTable";
import { buildYearCalendar } from "@/utils/holidayYearCalendar";

function Legend() {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-wt-text-muted" aria-label="Legend">
      <li className="flex items-center gap-1.5">
        <span className="size-3 rounded-full bg-rose-500" aria-hidden />
        {HOLIDAY_VIEW_COPY.legendMandatory}
      </li>
      <li className="flex items-center gap-1.5">
        <span className="size-3 rounded-full bg-amber-500/15 ring-1 ring-inset ring-amber-500/60" aria-hidden />
        {HOLIDAY_VIEW_COPY.legendOptional}
      </li>
      <li className="flex items-center gap-1.5">
        <span className="size-3 rounded-full bg-[var(--wt-brand)]" aria-hidden />
        {HOLIDAY_VIEW_COPY.legendToday}
      </li>
    </ul>
  );
}

/** The whole year as twelve month cards. Shared by the HR and employee holiday pages. */
export function HolidayYearCalendar({ rows, year }: { rows: readonly HolidayCalendarRow[]; year: number }) {
  const calendar = useMemo(() => buildYearCalendar(rows, year, parseHolidayCalendarDate), [rows, year]);
  const today = useMemo(() => new Date(), []);
  const total = calendar.mandatory + calendar.optional;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <p className="text-sm font-medium text-wt-text">{HOLIDAY_VIEW_COPY.summary(total, calendar.mandatory, calendar.optional)}</p>
        <Legend />
      </div>
      <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {calendar.months.map((m) => (
          <HolidayMonthCard key={m.month} data={m} year={year} today={today} />
        ))}
      </div>
      {calendar.unreadable > 0 ? <p className="text-xs text-wt-text-muted">{HOLIDAY_VIEW_COPY.unreadable(calendar.unreadable)}</p> : null}
    </div>
  );
}
