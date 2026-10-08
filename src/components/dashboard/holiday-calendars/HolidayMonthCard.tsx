import {
  HOLIDAY_MONTH_NAMES,
  HOLIDAY_VIEW_COPY,
  HOLIDAY_WEEKDAY_LETTERS,
} from "@/constants/holidayCalendarView";
import { cn } from "@/lib/utils";
import type { YearMonth } from "@/utils/holidayYearCalendar";

/** One month: a small wall-calendar grid with holidays marked, and the holidays' names listed beneath. */
export function HolidayMonthCard({ data, year, today }: { data: YearMonth; year: number; today: Date }) {
  const byDay = new Map(data.holidays.map((h) => [h.dayOfMonth, h]));
  const isThisMonth = today.getFullYear() === year && today.getMonth() === data.month;
  return (
    <section
      className={cn(
        "flex flex-col rounded-2xl border bg-wt-surface-1 p-3.5 shadow-[var(--wt-shadow-sm)]",
        isThisMonth ? "border-[var(--wt-brand)]/50 ring-1 ring-[var(--wt-brand)]/20" : "border-wt-border"
      )}
      aria-label={`${HOLIDAY_MONTH_NAMES[data.month]} ${year}`}
    >
      <header className="mb-2 flex items-baseline justify-between">
        <h3 className="text-sm font-semibold text-wt-text">{HOLIDAY_MONTH_NAMES[data.month]}</h3>
        {data.holidays.length > 0 ? (
          <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-rose-700 dark:text-rose-300">
            {data.holidays.length}
          </span>
        ) : null}
      </header>

      <div className="grid grid-cols-7 gap-y-0.5 text-center text-[10px] font-semibold text-wt-text-faint" aria-hidden>
        {HOLIDAY_WEEKDAY_LETTERS.map((letter, i) => (
          <span key={i} className={cn("py-0.5", i >= 5 && "text-wt-text-faint/70")}>
            {letter}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5 text-center">
        {data.cells.map((day, i) => {
          if (day === null) return <span key={`b-${i}`} />;
          const holiday = byDay.get(day);
          const isToday = isThisMonth && today.getDate() === day;
          const weekend = i % 7 >= 5;
          return (
            <span
              key={day}
              title={holiday ? `${holiday.name}${holiday.optional ? ` (${HOLIDAY_VIEW_COPY.legendOptional.toLowerCase()})` : ""}` : undefined}
              className={cn(
                "mx-auto flex size-7 items-center justify-center rounded-full text-xs tabular-nums",
                weekend ? "text-wt-text-faint" : "text-wt-text-muted",
                holiday && !holiday.optional && "bg-rose-500 font-semibold text-white",
                holiday?.optional && "bg-amber-500/15 font-semibold text-amber-800 ring-1 ring-inset ring-amber-500/60 dark:text-amber-300",
                isToday && !holiday && "bg-[var(--wt-brand)] font-semibold text-[var(--wt-brand-text)]",
                isToday && holiday && "outline outline-2 outline-offset-1 outline-[var(--wt-brand)]"
              )}
            >
              {day}
            </span>
          );
        })}
      </div>

      <ul className="mt-3 space-y-1.5 border-t border-wt-border/70 pt-2.5">
        {data.holidays.length === 0 ? (
          <li className="text-xs text-wt-text-faint">{HOLIDAY_VIEW_COPY.noHolidays}</li>
        ) : (
          data.holidays.map((h) => (
            <li key={`${h.dayOfMonth}-${h.name}`} className="flex items-baseline gap-2 text-[13px]">
              <span className="w-14 shrink-0 whitespace-nowrap tabular-nums text-wt-text-muted">
                {h.dayOfMonth} {h.weekday}
              </span>
              <span className="min-w-0 flex-1 text-wt-text">
                {h.name}
                {h.note ? <span className="block text-[11px] text-wt-text-faint">{h.note}</span> : null}
              </span>
              <span className={cn("mt-1 size-2 shrink-0 rounded-full", h.optional ? "bg-amber-500" : "bg-rose-500")} aria-hidden />
              {h.weekend ? <span className="sr-only">{HOLIDAY_VIEW_COPY.weekendNote}</span> : null}
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
