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
      <aside className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-wt-border p-6 text-center text-sm text-wt-text-muted">
        <CalendarDays className="size-6 text-wt-text-faint" aria-hidden />
        {CALENDAR_COPY.panelPick}
      </aside>
    );
  }
  const date = new Date(`${day}T00:00:00`);
  const groups = groupByKind(occurrences, orderOf);
  return (
    <aside className="rounded-2xl border border-wt-border bg-wt-surface-1 p-4 lg:sticky lg:top-4" aria-live="polite">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-wt-text">
          {date.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}
        </h2>
        {day === todayIso ? <span className="text-[11px] font-medium text-[var(--wt-brand)]">{CALENDAR_COPY.today}</span> : null}
      </div>
      {holiday ? (
        <p className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-rose-500/10 px-2 py-0.5 text-xs font-medium text-rose-700 dark:text-rose-300">
          {holiday.name}
          {holiday.is_optional ? <span className="text-rose-500/70">· {CALENDAR_COPY.optionalTag}</span> : null}
        </p>
      ) : null}
      {groups.length === 0 ? (
        <p className="mt-4 text-sm text-wt-text-muted">{CALENDAR_COPY.panelEmpty}</p>
      ) : (
        <div className="mt-3 space-y-4">
          {groups.map((g) => {
            const kind = OUT_KINDS[g.type] ?? OUT_KIND_FALLBACK;
            return (
              <section key={g.type}>
                <h3 className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-wt-text-muted">
                  <span className={cn("size-2 rounded-full", kind.dot)} aria-hidden />
                  {kind.label} · {g.items.length}
                </h3>
                <ul className="space-y-1.5">
                  {g.items.map(({ person, entry }, i) => (
                    <li key={`${person.email}-${i}`} className="flex items-center gap-2.5">
                      <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold", kind.chip)}>
                        {initials(person.name)}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm text-wt-text">{person.name}</span>
                      {entry.is_half_day ? <span className="shrink-0 text-[11px] text-wt-text-muted">{CALENDAR_COPY.halfDay}</span> : null}
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </aside>
  );
}
