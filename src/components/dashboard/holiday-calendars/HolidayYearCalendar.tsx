"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

import { HolidayMonthGrid } from "@/components/dashboard/holiday-calendars/HolidayMonthGrid";
import { HolidayMonthList } from "@/components/dashboard/holiday-calendars/HolidayMonthList";
import { Button } from "@/components/ui/button";
import { HOLIDAY_MONTH_COPY, HOLIDAY_MONTH_NAMES, HOLIDAY_VIEW_COPY } from "@/constants/holidayCalendarView";
import { cn } from "@/lib/utils";
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
        <span className="size-3 rounded-full bg-amber-500/25 ring-1 ring-inset ring-amber-500/60" aria-hidden />
        {HOLIDAY_VIEW_COPY.legendOptional}
      </li>
      <li className="flex items-center gap-1.5">
        <span className="size-3 rounded-full bg-[var(--wt-brand)]" aria-hidden />
        {HOLIDAY_VIEW_COPY.legendToday}
      </li>
    </ul>
  );
}

function MonthStrip({ counts, selected, currentMonth, onSelect }: { counts: number[]; selected: number; currentMonth: number | null; onSelect: (m: number) => void }) {
  return (
    <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1" role="tablist" aria-label={HOLIDAY_MONTH_COPY.monthsLabel}>
      {HOLIDAY_MONTH_NAMES.map((name, m) => (
        <button
          key={name}
          type="button"
          role="tab"
          aria-selected={m === selected}
          onClick={() => onSelect(m)}
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
            m === selected
              ? "border-[var(--wt-brand)] bg-[var(--wt-brand-soft)] text-[var(--wt-brand)]"
              : "border-wt-border text-wt-text-muted hover:border-[var(--wt-brand)]/40 hover:text-wt-text"
          )}
        >
          {name.slice(0, 3)}
          {counts[m] > 0 ? <span className="rounded-full bg-rose-500/12 px-1.5 text-[10px] font-semibold tabular-nums text-rose-700 dark:text-rose-300">{counts[m]}</span> : null}
          {m === currentMonth ? <span className="size-1.5 rounded-full bg-[var(--wt-brand)]" aria-label={HOLIDAY_MONTH_COPY.thisMonth} /> : null}
        </button>
      ))}
    </div>
  );
}

function MonthWise({ rows, year }: { rows: readonly HolidayCalendarRow[]; year: number }) {
  const calendar = useMemo(() => buildYearCalendar(rows, year, parseHolidayCalendarDate), [rows, year]);
  const today = useMemo(() => new Date(), []);
  const currentMonth = today.getFullYear() === year ? today.getMonth() : null;
  // UI state: the month being looked at; starts on this month (or January when browsing another year). Remounted per year.
  const [month, setMonth] = useState(currentMonth ?? 0);
  const total = calendar.mandatory + calendar.optional;
  const data = calendar.months[month];
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <p className="text-sm font-medium text-wt-text">{HOLIDAY_VIEW_COPY.summary(total, calendar.mandatory, calendar.optional)}</p>
        <Legend />
      </div>
      <MonthStrip counts={calendar.months.map((m) => m.holidays.length)} selected={month} currentMonth={currentMonth} onSelect={setMonth} />
      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon-sm" disabled={month === 0} onClick={() => setMonth((m) => m - 1)} aria-label={HOLIDAY_MONTH_COPY.prev}>
          <ChevronLeft className="size-4" />
        </Button>
        <span className="min-w-[10rem] text-center text-base font-semibold text-wt-text">
          {HOLIDAY_MONTH_NAMES[month]} {year}
        </span>
        <Button variant="outline" size="icon-sm" disabled={month === 11} onClick={() => setMonth((m) => m + 1)} aria-label={HOLIDAY_MONTH_COPY.next}>
          <ChevronRight className="size-4" />
        </Button>
        {currentMonth !== null && month !== currentMonth ? (
          <Button variant="ghost" size="sm" onClick={() => setMonth(currentMonth)}>
            {HOLIDAY_MONTH_COPY.thisMonth}
          </Button>
        ) : null}
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start">
        <HolidayMonthGrid data={data} year={year} today={today} />
        <HolidayMonthList data={data} />
      </div>
      {calendar.unreadable > 0 ? <p className="text-xs text-wt-text-muted">{HOLIDAY_VIEW_COPY.unreadable(calendar.unreadable)}</p> : null}
    </div>
  );
}

/** The holiday calendar, one month at a time. Shared by the HR and employee holiday pages. */
export function HolidayYearCalendar({ rows, year }: { rows: readonly HolidayCalendarRow[]; year: number }) {
  return <MonthWise key={year} rows={rows} year={year} />;
}
