"use client";

import { useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RefreshIconButton } from "@/components/dashboard/ui/RefreshIconButton";
import { SectionLoading } from "@/components/dashboard/ui/SectionLoading";
import { TEAM_CALENDAR_COPY, TEAM_CALENDAR_KINDS } from "@/constants/teamTimeCalendar";
import { useTeamTimeCalendar } from "@/hooks/timelog/useTeamTimeCalendar";
import { cn } from "@/lib/utils";
import { TimelogReportDialog } from "@/components/dashboard/timelog/TimelogReportDialog";
import { formatMonthYearLabel, formatSummaryHours, shiftMonth, type MonthRef } from "@/utils/timelog/monthWeeks";
import {
  isWeekend,
  mandatoryHolidays,
  monthTotal,
  teamCalendarCell,
  type TeamCalendarCell,
} from "@/utils/timelog/teamCalendar";

const KIND_STYLE = Object.fromEntries(TEAM_CALENDAR_KINDS.map((k) => [k.kind, k])) as Record<
  TeamCalendarCell["kind"],
  (typeof TEAM_CALENDAR_KINDS)[number]
>;

function cellText(cell: TeamCalendarCell): string {
  if (cell.kind === "hours") return formatSummaryHours(cell.hours);
  if (cell.kind === "half-leave") return cell.hours ? `½L ${formatSummaryHours(cell.hours)}` : "½L";
  return KIND_STYLE[cell.kind].symbol;
}

function cellTitle(cell: TeamCalendarCell, person: string, day: string): string {
  const base = `${person} · ${day}`;
  if (cell.kind === "holiday") return `${base} · ${cell.title}`;
  const label = KIND_STYLE[cell.kind].label;
  return cell.hours ? `${base} · ${label} · ${cell.hours}h${cell.tag ? ` (${cell.tag})` : ""}` : `${base} · ${label}`;
}

/** Month view of the team: who logged what each day, who was on leave or working from home, and the holidays. */
export function TeamTimeCalendar({
  month,
  onMonthChange,
}: {
  month: MonthRef;
  onMonthChange: (month: MonthRef) => void;
}) {
  // UI-only: the search box.
  const [query, setQuery] = useState("");
  const [exportOpen, setExportOpen] = useState(false);
  const data = useTeamTimeCalendar(month);
  const holidayByDay = useMemo(() => mandatoryHolidays(data.holidays), [data.holidays]);
  const people = useMemo(() => {
    const q = query.trim().toLowerCase();
    const everyone = data.people.map((p) => ({ email: p.email, label: p.name || p.email }));
    return q ? everyone.filter((e) => e.label.toLowerCase().includes(q) || e.email.includes(q)) : everyone;
  }, [data.people, query]);
  const isCurrentMonth = month.year === new Date().getFullYear() && month.month === new Date().getMonth();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" type="button" onClick={() => onMonthChange(shiftMonth(month, -1))}>
            {TEAM_CALENDAR_COPY.previousMonth}
          </Button>
          <span className="min-w-[10rem] text-center text-sm font-semibold tabular-nums">{formatMonthYearLabel(month)}</span>
          <Button variant="outline" size="sm" type="button" disabled={isCurrentMonth} onClick={() => onMonthChange(shiftMonth(month, 1))}>
            {TEAM_CALENDAR_COPY.nextMonth}
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <label className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-wt-text-muted" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={TEAM_CALENDAR_COPY.searchPlaceholder}
              aria-label={TEAM_CALENDAR_COPY.searchPlaceholder}
              className="h-9 w-56 rounded-lg border border-wt-border bg-wt-surface-1 pr-3 pl-8 text-sm"
            />
          </label>
          <Button variant="outline" size="sm" type="button" onClick={() => setExportOpen(true)}>
            <Download className="size-4" aria-hidden />
            {TEAM_CALENDAR_COPY.exportReport}
          </Button>
          <RefreshIconButton onClick={data.reload} loading={data.refreshing} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-wt-text-muted">
        {TEAM_CALENDAR_KINDS.filter((k) => k.kind !== "future").map((k) => (
          <span key={k.kind} className="inline-flex items-center gap-1.5">
            <span className={cn("inline-grid h-5 min-w-5 place-items-center rounded px-1 text-[0.6875rem] font-semibold", k.className)}>
              {k.symbol || " "}
            </span>
            {k.label}
          </span>
        ))}
      </div>

      <div className="text-xs text-wt-text-muted">
        <span className="font-medium text-wt-text">{TEAM_CALENDAR_COPY.holidaysHeading}: </span>
        {data.holidays.length
          ? data.holidays
              .map((h) => `${h.date.slice(8)}/${h.date.slice(5, 7)} ${h.name}${h.is_optional ? ` (${TEAM_CALENDAR_COPY.optionalSuffix})` : ""}`)
              .join(" · ")
          : TEAM_CALENDAR_COPY.noHolidays}
      </div>

      {data.error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{data.error}</div>
      ) : null}

      {data.loading ? (
        <SectionLoading className="py-10" label={TEAM_CALENDAR_COPY.loading} />
      ) : !people.length ? (
        <p className="py-10 text-center text-sm text-wt-text-muted">{TEAM_CALENDAR_COPY.empty}</p>
      ) : (
        // `isolate`: the sticky header/first column use z-20/z-30. Without their own stacking context those values compete with
        // the app header (z-20), so the table painted over the notification panel that drops down from it.
        <div className="isolate max-h-[min(70vh,640px)] overflow-auto rounded-xl border border-wt-border">
          <table className="w-max min-w-full border-separate border-spacing-0 text-xs">
            <thead className="sticky top-0 z-20 bg-wt-surface-1">
              <tr>
                <th className="sticky left-0 z-30 min-w-[11rem] border-b border-wt-border bg-wt-surface-1 px-3 py-2 text-left font-semibold">
                  {TEAM_CALENDAR_COPY.person}
                </th>
                {data.days.map((day) => {
                  const holiday = holidayByDay[day];
                  const weekend = isWeekend(day);
                  const weekday = new Date(`${day}T00:00:00`).toLocaleString(undefined, { weekday: "narrow" });
                  return (
                    <th
                      key={day}
                      title={holiday ?? undefined}
                      className={cn(
                        "min-w-9 border-b border-wt-border px-1 py-1.5 text-center font-medium",
                        weekend && "bg-wt-surface-2 text-wt-text-faint",
                        holiday && "bg-amber-500/20 text-amber-800 dark:text-amber-300",
                        day === data.today && "text-[var(--wt-brand)]"
                      )}
                    >
                      <div className="text-[0.625rem] uppercase">{weekday}</div>
                      <div className="tabular-nums">{Number(day.slice(8))}</div>
                    </th>
                  );
                })}
                <th className="sticky right-0 z-30 border-b border-l border-wt-border bg-wt-surface-1 px-3 py-2 text-right font-semibold">
                  {TEAM_CALENDAR_COPY.total}
                </th>
              </tr>
            </thead>
            <tbody>
              {people.map((person) => {
                const hours = data.hoursByEmail[person.email];
                const absences = data.absencesByEmail[person.email] ?? [];
                return (
                  <tr key={person.email} className="hover:bg-wt-surface-2/50">
                    <td className="sticky left-0 z-10 max-w-[14rem] truncate border-b border-wt-border bg-wt-surface-1 px-3 py-1.5 font-medium" title={person.label}>
                      {person.label}
                    </td>
                    {data.days.map((day) => {
                      const cell = teamCalendarCell({ day, today: data.today, hours: hours?.[day], absences, holidays: holidayByDay });
                      return (
                        <td key={day} className="border-b border-wt-border p-0.5 text-center" title={cellTitle(cell, person.label, day)}>
                          <div className={cn("grid h-7 min-w-8 place-items-center rounded px-0.5 text-[0.6875rem] font-semibold tabular-nums", KIND_STYLE[cell.kind].className)}>
                            {cellText(cell)}
                            {cell.tag ? <span className="-mt-1 text-[0.5rem] font-medium opacity-80">{cell.tag}</span> : null}
                          </div>
                        </td>
                      );
                    })}
                    <td className="sticky right-0 z-10 border-b border-l border-wt-border bg-wt-surface-1 px-3 py-1.5 text-right font-semibold tabular-nums">
                      {formatSummaryHours(monthTotal(hours, data.days))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-wt-text-muted">{TEAM_CALENDAR_COPY.hint}</p>
      {/* Mounted only while open so the filters reset to the calendar's current month each time. */}
      {exportOpen ? <TimelogReportDialog open initialMonth={month} onClose={() => setExportOpen(false)} /> : null}
    </div>
  );
}
