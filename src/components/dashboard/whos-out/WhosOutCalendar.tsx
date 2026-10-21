"use client";

import {
  CALENDAR_COPY,
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

export function Legend() {
  const items = [
    ...Object.values(OUT_KINDS).map((k) => ({ label: k.label, dot: k.dot })),
    { label: CALENDAR_COPY.legendHoliday, dot: "bg-indigo-400" },
  ];
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-wt-text-muted" aria-label="Legend">
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
  const byKind = new Map<string, number>();
  for (const { entry } of occurrences) byKind.set(entry.type, (byKind.get(entry.type) ?? 0) + 1);
  const kinds = [...byKind.entries()].sort((a, b) => kindOf(a[0]).order - kindOf(b[0]).order);
  return (
    <button
      type="button"
      onClick={() => onSelect(day)}
      aria-pressed={selected}
      aria-label={`${date.toDateString()}${out ? `, ${CALENDAR_COPY.outCount(out)}` : ""}${holiday ? `, ${holiday.name}` : ""}`}
      className={cn(
        "relative flex min-h-[64px] flex-col gap-1.5 rounded-xl border border-wt-border bg-wt-surface-1 p-2 text-left transition-colors sm:min-h-[96px]",
        "hover:border-[var(--wt-brand)]/40 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wt-brand)]",
        isWeekend(day) && "bg-wt-surface-2/70",
        (selected || today) && "border-[var(--wt-brand)] ring-2 ring-inset ring-[var(--wt-brand)]"
      )}
    >
      <span className={cn("text-sm font-semibold", today ? "text-[var(--wt-brand)]" : isWeekend(day) ? "text-wt-text-faint" : "text-wt-text")}>{date.getDate()}</span>
      {holiday ? (
        <span className="truncate rounded-md bg-[var(--wt-brand-soft)] px-1.5 text-[11px] font-semibold leading-5 text-[var(--wt-brand)]" title={holiday.name}>
          {holiday.name}
        </span>
      ) : null}
      {/* Wide screens: a count per kind. Phones: coloured dots (the day panel has the names). */}
      <span className="hidden flex-col gap-1 sm:flex">
        {kinds.map(([type, n]) => (
          <span key={type} className={cn("truncate rounded-md px-1.5 text-[11px] font-semibold leading-5", kindOf(type).chip)}>
            {kindOf(type).summary(n)}
          </span>
        ))}
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
    <div>
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {CALENDAR_WEEKDAYS.map((w) => (
          <div key={w} className="px-2 pb-1 text-sm font-semibold text-wt-text-muted">
            {w}
          </div>
        ))}
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
            <div key={`blank-${idx}`} aria-hidden />
          )
        )}
      </div>
    </div>
  );
}
