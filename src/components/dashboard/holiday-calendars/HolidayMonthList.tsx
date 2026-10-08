import { HOLIDAY_MONTH_COPY, HOLIDAY_MONTH_NAMES } from "@/constants/holidayCalendarView";
import { cn } from "@/lib/utils";
import type { YearMonth } from "@/utils/holidayYearCalendar";

/** The month's holidays as a list — date tile, name, weekday and type — beside (or under) the calendar. */
export function HolidayMonthList({ data }: { data: YearMonth }) {
  return (
    <aside className="rounded-2xl border border-wt-border bg-wt-surface-1 p-4 lg:sticky lg:top-4">
      <h3 className="text-sm font-semibold text-wt-text">{HOLIDAY_MONTH_COPY.listTitle(HOLIDAY_MONTH_NAMES[data.month])}</h3>
      {data.holidays.length === 0 ? (
        <p className="mt-3 text-sm text-wt-text-muted">{HOLIDAY_MONTH_COPY.empty}</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {data.holidays.map((h) => (
            <li key={`${h.dayOfMonth}-${h.name}`} className="flex items-center gap-3">
              <span
                className={cn(
                  "flex size-11 shrink-0 flex-col items-center justify-center rounded-xl leading-none",
                  h.optional ? "bg-amber-500/15 text-amber-800 dark:text-amber-300" : "bg-rose-500/12 text-rose-700 dark:text-rose-300"
                )}
                aria-hidden
              >
                <span className="text-lg font-semibold tabular-nums">{h.dayOfMonth}</span>
                <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide">{h.weekday}</span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-wt-text">{h.name}</span>
                <span className="block text-xs text-wt-text-muted">{h.note || (h.optional ? HOLIDAY_MONTH_COPY.optional : HOLIDAY_MONTH_COPY.mandatory)}</span>
              </span>
              <span className={cn("size-2 shrink-0 rounded-full", h.optional ? "bg-amber-500" : "bg-rose-500")} aria-hidden />
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
