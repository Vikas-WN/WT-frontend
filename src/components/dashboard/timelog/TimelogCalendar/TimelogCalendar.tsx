"use client";

import { useMemo, useCallback, useId } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { showErrorToast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { DAYS_OF_WEEK } from "@/hooks/timelog/useDayTimelog";
import type { CalendarDayInfo } from "@/hooks/timelog/useDayTimelog.types";
import type { TimelogCalendarProps } from "./TimelogCalendar.types";
import { FieldLabel } from "@/components/dashboard/ui/forms";
import { SearchableSelectCombobox } from "@/components/dashboard/ui/SearchableSelectCombobox";

const MONTH_OPTIONS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/**
 * Cell background/border for each (mutually-exclusive-ish) day state. Order
 * mirrors the legacy CSS's cascade: future overrides everything; otherwise
 * selected tints combine with the entries/drafts tone; today always keeps a
 * brand-colored border on top of whatever fill it has.
 */
function calendarCellClass(day: CalendarDayInfo, isSelected: boolean): string {
  const hasEntries = day.entryCount > 0;
  const hasDrafts = day.draftCount > 0;
  const selected = isSelected && !day.isFuture;

  if (day.isFuture) {
    return "cursor-not-allowed border-wt-border-md bg-wt-surface-2 text-wt-text-faint opacity-60";
  }

  if (hasEntries) {
    return cn(
      "border-emerald-200 bg-emerald-50 hover:bg-emerald-100 dark:border-emerald-500/35 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20",
      selected && "border-wt-indigo-400 bg-emerald-100 dark:bg-emerald-500/25",
      day.isToday && "border-2 border-[var(--wt-brand)]"
    );
  }

  if (hasDrafts) {
    return cn(
      "border-amber-200 bg-amber-50 hover:bg-amber-100 dark:border-amber-600/35 dark:bg-amber-600/10 dark:hover:bg-amber-600/20",
      selected && "border-wt-indigo-400 bg-amber-100 dark:bg-amber-600/20",
      day.isToday && "border-2 border-[var(--wt-brand)]"
    );
  }

  if (selected) {
    return "border-wt-indigo-400 bg-wt-indigo-50 hover:bg-wt-indigo-50 dark:bg-wt-indigo-500/20";
  }

  if (day.isToday) {
    return "border-2 border-[var(--wt-brand)] bg-wt-surface-1 hover:bg-wt-surface-2";
  }

  return "border-wt-border bg-wt-surface-1 hover:bg-wt-surface-2";
}

export function TimelogCalendar({
  calendar,
  selectedDate,
  loading,
  viewYear,
  viewMonth,
  doj,
  onSelectDate,
  onNavigate,
  onGoToToday,
  onGoToMonth,
}: TimelogCalendarProps) {
  const monthFieldId = useId();
  const yearFieldId = useId();
  const now = useMemo(() => new Date(), []);
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const dojDate = useMemo(() => {
    if (!doj) return null;
    const d = new Date(doj);
    return isNaN(d.getTime()) ? null : d;
  }, [doj]);

  const yearOptions = useMemo(() => {
    // Without DOJ (common for HR/Manager viewing their own logs), allow a
    // multi-year window so month navigation still works.
    const startYear = dojDate ? dojDate.getFullYear() : currentYear - 5;
    const years: number[] = [];
    for (let y = startYear; y <= currentYear; y++) years.push(y);
    return years;
  }, [dojDate, currentYear]);

  const monthOptions = useMemo(() => {
    if (!dojDate || viewYear > dojDate.getFullYear()) {
      return viewYear >= currentYear
        ? MONTH_OPTIONS.map((_, i) => i).filter((m) => m <= currentMonth)
        : MONTH_OPTIONS.map((_, i) => i);
    }
    if (viewYear === dojDate.getFullYear()) {
      return MONTH_OPTIONS.map((_, i) => i).filter((m) => m >= dojDate.getMonth() && (viewYear < currentYear || m <= currentMonth));
    }
    return viewYear >= currentYear
      ? MONTH_OPTIONS.map((_, i) => i).filter((m) => m <= currentMonth)
      : MONTH_OPTIONS.map((_, i) => i);
  }, [dojDate, viewYear, currentYear, currentMonth]);

  const earliestYear = yearOptions[0] ?? currentYear;
  const earliestMonth = dojDate && dojDate.getFullYear() === earliestYear ? dojDate.getMonth() : 0;
  const canGoPrevious =
    viewYear > earliestYear || (viewYear === earliestYear && viewMonth > earliestMonth);
  const canGoNext =
    viewYear < currentYear || (viewYear === currentYear && viewMonth < currentMonth);

  const handleSelectDate = useCallback(
    (dateKey: string, isFuture: boolean) => {
      if (isFuture) {
        showErrorToast("You cannot add time logs for future dates");
        return;
      }
      onSelectDate(dateKey);
    },
    [onSelectDate]
  );

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-end">
        <div className="flex flex-wrap items-end gap-2">
          <Button
            variant="outline"
            size="sm"
            type="button"
            disabled={loading || !canGoPrevious}
            onClick={() => onNavigate(-1)}
            aria-label="Previous month"
          >
            <ChevronLeft className="size-4" aria-hidden />
          </Button>
          <Button
            variant="outline"
            size="sm"
            type="button"
            disabled={loading || !canGoNext}
            onClick={() => onNavigate(1)}
            aria-label="Next month"
          >
            <ChevronRight className="size-4" aria-hidden />
          </Button>
          <div className="flex min-w-[8.5rem] flex-col gap-1">
            <FieldLabel label="Month" htmlFor={monthFieldId} />
            <SearchableSelectCombobox
              id={monthFieldId}
              value={String(viewMonth)}
              onChange={(value) => {
                if (!value.trim()) return;
                onGoToMonth(viewYear, Number(value));
              }}
              options={monthOptions.map((value) => ({
                value: String(value),
                label: MONTH_OPTIONS[value],
              }))}
              placeholder="Search months…"
              aria-label="Month"
              showChevron
              clearSelectionOnEmptyInput={false}
            />
          </div>
          <div className="flex min-w-[8.5rem] flex-col gap-1">
            <FieldLabel label="Year" htmlFor={yearFieldId} />
            <SearchableSelectCombobox
              id={yearFieldId}
              value={String(viewYear)}
              onChange={(value) => {
                if (!value.trim()) return;
                onGoToMonth(Number(value), viewMonth);
              }}
              options={yearOptions.map((value) => ({
                value: String(value),
                label: String(value),
              }))}
              placeholder="Search years…"
              aria-label="Year"
              showChevron
              clearSelectionOnEmptyInput={false}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            type="button"
            disabled={loading}
            onClick={onGoToToday}
          >
            Today
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-[3px]">
        {DAYS_OF_WEEK.map((d) => (
          <div key={d} className="py-1.5 text-center text-xs font-medium text-wt-text-muted">
            {d}
          </div>
        ))}
        {calendar.days.map((day) => {
          const isSelected = selectedDate === day.dateKey;
          const hasEntries = day.entryCount > 0;
          const hasDrafts = day.draftCount > 0;
          return (
            <div
              key={day.dateKey}
              className={cn(
                "relative flex min-h-20 cursor-pointer flex-col rounded-xl border p-1.5 transition-colors",
                !day.isCurrentMonth && "opacity-35",
                calendarCellClass(day, isSelected)
              )}
              onClick={() => handleSelectDate(day.dateKey, day.isFuture)}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "text-sm leading-none font-medium text-wt-text",
                    hasEntries && "font-semibold text-emerald-600 dark:text-emerald-400"
                  )}
                >
                  {day.day}
                </span>
                {hasEntries ? (
                  <span className="mt-0.5 inline-block size-1.5 shrink-0 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                ) : null}
              </div>
              {hasEntries || hasDrafts ? (
                <div className="mt-1 flex flex-col gap-0.5">
                  {hasEntries ? (
                    <>
                      <span className="text-xs leading-tight font-semibold text-emerald-600 dark:text-emerald-400">
                        {day.totalHours}h
                      </span>
                      <span className="text-xs leading-tight font-medium text-wt-text-muted">
                        {day.entryCount} {day.entryCount === 1 ? "entry" : "entries"}
                      </span>
                    </>
                  ) : null}
                  {hasDrafts ? (
                    <span className="text-xs leading-tight font-semibold text-amber-700 dark:text-amber-400">
                      {day.draftCount} draft{day.draftCount === 1 ? "" : "s"}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
