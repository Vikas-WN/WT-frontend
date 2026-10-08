"use client";

import {
  CALENDAR_COPY,
  CALENDAR_MAX_CHIPS,
  CALENDAR_WEEKDAYS,
  OUT_KINDS,
  OUT_KIND_FALLBACK,
} from "@/constants/whosOutCalendar";
import { cn } from "@/lib/utils";
import { buildMonthCells, isWeekend, type CalendarOccurrence } from "@/utils/whosOutCalendar";

export interface CalendarHoliday {
  name: string;
  is_optional: boolean;
}

const kindOf = (type: string) => OUT_KINDS[type] ?? OUT_KIND_FALLBACK;

function Legend() {
  const items = [
    ...Object.values(OUT_KINDS).map((k) => ({ label: k.label, dot: k.dot })),
    { label: CALENDAR_COPY.legendHoliday, dot: "bg-rose-500" },
    { label: CALENDAR_COPY.legendOptional, dot: "bg-rose-300" },
  ];
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-1 text-xs text-wt-text-muted" aria-label="Legend">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-1.5">
          <span className={cn("size-2 rounded-full", i.dot)} aria-hidden />
          {i.label}
        </li>
      ))}
    </ul>
  );
}

function DayCell({
  day,
  occurrences,
  holiday,
  today,
  selected,
  onSelect,
}: {
  day: string;
  occurrences: readonly CalendarOccurrence[];
  holiday?: CalendarHoliday;
  today: boolean;
  selected: boolean;
  onSelect: (day: string) => void;
}) {
  const date = new Date(`${day}T00:00:00`);
  const out = occurrences.length;
  const shown = occurrences.slice(0, CALENDAR_MAX_CHIPS);
  return (
    <button
      type="button"
      onClick={() => onSelect(day)}
      aria-pressed={selected}
      aria-label={`${date.toDateString()}${out ? `, ${CALENDAR_COPY.outCount(out)}` : ""}${holiday ? `, ${holiday.name}` : ""}`}
      className={cn(
        "relative flex min-h-[64px] flex-col gap-1 border-b border-r border-wt-border/60 p-1.5 text-left transition-colors sm:min-h-[112px]",
        "hover:bg-[var(--wt-brand-soft)]/50 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wt-brand)]",
        isWeekend(day) && "bg-wt-surface-2/40",
        holiday && !holiday.is_optional && "bg-rose-500/[0.05]",
        selected && "z-[1] bg-[var(--wt-brand-soft)]/60 ring-2 ring-inset ring-[var(--wt-brand)]"
      )}
    >
      <span className="flex items-center justify-between">
        <span
          className={cn(
            "inline-flex size-6 items-center justify-center rounded-full text-xs font-medium",
            today ? "bg-[var(--wt-brand)] font-semibold text-[var(--wt-brand-text)]" : "text-wt-text-muted"
          )}
        >
          {date.getDate()}
        </span>
        {out > 0 ? (
          <span className="hidden rounded-full bg-wt-surface-3 px-1.5 text-[10px] font-semibold tabular-nums text-wt-text-muted sm:inline">
            {out}
          </span>
        ) : null}
      </span>
      {holiday ? (
        <span
          className={cn(
            "truncate rounded px-1 text-[10px] font-medium leading-4",
            holiday.is_optional ? "bg-rose-500/8 text-rose-500 dark:text-rose-300" : "bg-rose-500/12 text-rose-700 dark:text-rose-300"
          )}
          title={holiday.name}
        >
          {holiday.name}
        </span>
      ) : null}
      {/* Wide screens: a named chip per person. Phones: coloured dots (the day panel has the names). */}
      <span className="hidden flex-col gap-0.5 sm:flex">
        {shown.map(({ person, entry }, i) => (
          <span
            key={`${person.email}-${i}`}
            className={cn("truncate rounded px-1 text-[11px] leading-[18px]", kindOf(entry.type).chip)}
            title={person.name}
          >
            {entry.is_half_day ? "½ " : ""}
            {person.name.split(" ")[0]}
          </span>
        ))}
        {out > shown.length ? (
          <span className="px-1 text-[10px] font-medium text-wt-text-faint">{CALENDAR_COPY.more(out - shown.length)}</span>
        ) : null}
      </span>
      {out > 0 ? (
        <span className="flex flex-wrap gap-0.5 sm:hidden" aria-hidden>
          {occurrences.slice(0, 6).map(({ person, entry }, i) => (
            <span key={`${person.email}-${i}`} className={cn("size-1.5 rounded-full", kindOf(entry.type).dot)} />
          ))}
        </span>
      ) : null}
    </button>
  );
}

/** Month calendar: who is out each day (coloured by kind), holidays, and a selectable day. */
export function WhosOutCalendar({
  fromIso,
  toIso,
  todayIso,
  holidaysByDay,
  occByDay,
  selectedDay,
  onSelectDay,
}: {
  fromIso: string;
  toIso: string;
  todayIso: string;
  holidaysByDay: ReadonlyMap<string, CalendarHoliday>;
  occByDay: ReadonlyMap<string, readonly CalendarOccurrence[]>;
  selectedDay: string | null;
  onSelectDay: (day: string) => void;
}) {
  const cells = buildMonthCells(fromIso, toIso);
  return (
    <div className="space-y-2.5">
      <Legend />
      <div className="overflow-hidden rounded-2xl border border-wt-border bg-wt-surface-1">
        <div className="grid grid-cols-7 border-b border-wt-border bg-wt-surface-2/60 text-center text-[11px] font-semibold uppercase tracking-wide text-wt-text-faint">
          {CALENDAR_WEEKDAYS.map((w, i) => (
            <div key={w} className={cn("py-2", i >= 5 && "text-wt-text-faint/70")}>
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((day, idx) =>
            day ? (
              <DayCell
                key={day}
                day={day}
                occurrences={occByDay.get(day) ?? []}
                holiday={holidaysByDay.get(day)}
                today={day === todayIso}
                selected={day === selectedDay}
                onSelect={onSelectDay}
              />
            ) : (
              <div key={`blank-${idx}`} className="min-h-[64px] border-b border-r border-wt-border/60 bg-wt-surface-2/25 sm:min-h-[112px]" />
            )
          )}
        </div>
      </div>
    </div>
  );
}
