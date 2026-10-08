import { HOLIDAY_VIEW_COPY, HOLIDAY_WEEKDAYS } from "@/constants/holidayCalendarView";
import { cn } from "@/lib/utils";
import type { YearMonth } from "@/utils/holidayYearCalendar";

/** One month as a large calendar: holiday names sit in their day (dots on a phone), weekends are shaded, today is circled. */
export function HolidayMonthGrid({ data, year, today }: { data: YearMonth; year: number; today: Date }) {
  const byDay = new Map(data.holidays.map((h) => [h.dayOfMonth, h]));
  const isThisMonth = today.getFullYear() === year && today.getMonth() === data.month;
  return (
    <div className="overflow-hidden rounded-2xl border border-wt-border bg-wt-surface-1">
      <div className="grid grid-cols-7 border-b border-wt-border bg-wt-surface-2/60 text-center text-[11px] font-semibold uppercase tracking-wide text-wt-text-faint">
        {HOLIDAY_WEEKDAYS.map((w, i) => (
          <div key={w} className={cn("py-2", i >= 5 && "text-wt-text-faint/70")}>
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {data.cells.map((day, i) => {
          if (day === null) return <div key={`b-${i}`} className="min-h-[56px] border-b border-r border-wt-border/60 bg-wt-surface-2/25 sm:min-h-[104px]" />;
          const holiday = byDay.get(day);
          const isToday = isThisMonth && today.getDate() === day;
          const weekend = i % 7 >= 5;
          return (
            <div
              key={day}
              className={cn(
                "flex min-h-[56px] flex-col gap-1 border-b border-r border-wt-border/60 p-1.5 sm:min-h-[104px]",
                weekend && "bg-wt-surface-2/40",
                holiday && !holiday.optional && "bg-rose-500/[0.06]",
                holiday?.optional && "bg-amber-500/[0.07]"
              )}
            >
              <span
                className={cn(
                  "inline-flex size-6 items-center justify-center rounded-full text-xs font-medium",
                  isToday ? "bg-[var(--wt-brand)] font-semibold text-[var(--wt-brand-text)]" : weekend ? "text-wt-text-faint" : "text-wt-text-muted"
                )}
              >
                {day}
              </span>
              {holiday ? (
                <>
                  <span
                    className={cn(
                      "hidden rounded-md px-1.5 py-1 text-[11px] font-semibold leading-snug sm:block",
                      holiday.optional ? "bg-amber-500/20 text-amber-900 dark:text-amber-200" : "bg-rose-500 text-white"
                    )}
                    title={holiday.note ? `${holiday.name} — ${holiday.note}` : holiday.name}
                  >
                    {holiday.name}
                    {holiday.optional ? <span className="mt-0.5 block text-[10px] font-medium opacity-80">{HOLIDAY_VIEW_COPY.legendOptional}</span> : null}
                  </span>
                  <span className={cn("size-2 rounded-full sm:hidden", holiday.optional ? "bg-amber-500" : "bg-rose-500")} aria-label={holiday.name} />
                </>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

