"use client";

import { CalendarDays } from "lucide-react";

import { CALENDAR_COPY, OUT_KINDS, OUT_KIND_FALLBACK } from "@/constants/whosOutCalendar";
import { cn } from "@/lib/utils";
import { groupByKind, type CalendarOccurrence } from "@/utils/whosOutCalendar";

import type { CalendarHoliday } from "./WhosOutCalendar";

function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

const orderOf = (type: string) => (OUT_KINDS[type] ?? OUT_KIND_FALLBACK).order;

/** Details for the picked day: the holiday, then everyone who is out, grouped by kind. */
export function WhosOutDayPanel({
  day,
  todayIso,
  occurrences,
  holiday,
}: {
  day: string | null;
  todayIso: string;
  occurrences: readonly CalendarOccurrence[];
  holiday?: CalendarHoliday;
}) {
  if (!day) {
    return (
      <aside className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-wt-border p-6 text-center text-sm text-wt-text-muted">
        <CalendarDays className="size-6 text-wt-text-faint" aria-hidden />
        {CALENDAR_COPY.panelPick}
      </aside>
    );
  }
  const date = new Date(`${day}T00:00:00`);
  const groups = groupByKind(occurrences, orderOf);
  const outCount = occurrences.length;
  return (
    <aside className="rounded-xl border border-wt-border bg-wt-surface-1 p-5 lg:sticky lg:top-4" aria-live="polite">
      {day === todayIso ? <p className="text-xs font-semibold uppercase tracking-[0.06em] text-[var(--wt-brand)]">{CALENDAR_COPY.today}</p> : null}
      <h2 className="text-xl font-bold tracking-tight text-wt-text">
        {date.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}
      </h2>
      <p className="mt-0.5 text-sm text-wt-text-muted">{CALENDAR_COPY.peopleOut(outCount)}</p>
      {groups.length === 0 ? (
        <p className="mt-5 text-sm text-wt-text-muted">{CALENDAR_COPY.panelEmpty}</p>
      ) : (
        <div className="mt-5 space-y-5 divide-y divide-wt-border [&>section:not(:first-child)]:pt-5">
          {groups.map((g) => {
            const kind = OUT_KINDS[g.type] ?? OUT_KIND_FALLBACK;
            return (
              <section key={g.type}>
                <h3 className={cn("mb-3 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.06em]", kind.heading)}>
                  <span>{g.type === "LEAVE" ? "On leave" : g.type === "WFH" ? "Working from home" : kind.label}</span>
                  <span className="tabular-nums">{g.items.length}</span>
                </h3>
                <ul className="space-y-3.5">
                  {g.items.map(({ person, entry }, i) => (
                    <li key={`${person.email}-${i}`} className="flex items-center gap-3">
                      <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold", kind.chip)}>
                        {initials(person.name)}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[15px] text-wt-text">{person.name}</span>
                      {entry.is_half_day ? <span className="shrink-0 text-xs text-wt-text-muted">{CALENDAR_COPY.halfDay}</span> : null}
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
      {holiday ? (
        <p className="mt-5 flex items-center gap-2.5 rounded-xl bg-[var(--wt-brand-soft)] px-3.5 py-3 text-sm font-medium text-[var(--wt-brand)]">
          <CalendarDays className="size-4 shrink-0" aria-hidden />
          {holiday.name}
          {holiday.is_optional ? <span className="opacity-70">· {CALENDAR_COPY.optionalTag}</span> : null}
        </p>
      ) : null}
    </aside>
  );
}
