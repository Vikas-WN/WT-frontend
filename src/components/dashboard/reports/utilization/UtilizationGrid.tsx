"use client";

import { ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";

import { UTILIZATION_COPY as COPY, UTILIZATION_LEVEL_STYLE as STYLE, type UtilizationMetric } from "@/constants/utilizationHeatmap";
import { cn } from "@/lib/utils";
import type { UtilizationPerson, UtilizationTeam, UtilizationWeekCell } from "@/types/utilization";
import { parseApiDate } from "@/utils/apiDate";
import { levelFor, mondayOf, percentLabel, shortDay, type Thresholds } from "@/utils/utilizationDisplay";

export interface SelectedCell {
  email: string;
  index: number;
}

interface Props {
  weeks: readonly string[];
  people: readonly UtilizationPerson[];
  teams: readonly UtilizationTeam[];
  metric: UtilizationMetric;
  thresholds: Thresholds;
  selected: SelectedCell | null;
  onSelect: (cell: SelectedCell) => void;
}

function valueOf(cell: UtilizationWeekCell, metric: UtilizationMetric): number | null {
  return metric === "planned" ? cell.planned_percent : cell.actual_percent;
}

/** Weeks across, people down, grouped by department with an average row each; the first column stays put while the weeks scroll. */
export function UtilizationGrid({ weeks, people, teams, metric, thresholds, selected, onSelect }: Props) {
  // UI state: which departments are folded away.
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set());
  const thisWeek = useMemo(() => mondayOf(new Date()).getTime(), []);
  const byDepartment = useMemo(() => {
    const map = new Map<string, UtilizationPerson[]>();
    for (const p of people) map.set(p.department, [...(map.get(p.department) ?? []), p]);
    return map;
  }, [people]);

  const toggle = (name: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });

  return (
    <div className="overflow-x-auto rounded-2xl border border-wt-border bg-wt-surface-1">
      <table className="w-full border-separate border-spacing-0 text-sm">
        <thead>
          <tr>
            <th className="sticky left-0 z-20 min-w-[11rem] border-b border-wt-border bg-wt-surface-2 px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-wt-text-muted">
              {COPY.person}
            </th>
            {weeks.map((w) => {
              const date = parseApiDate(w);
              const isNow = date !== null && date.getTime() === thisWeek;
              return (
                <th
                  key={w}
                  className={cn(
                    "min-w-[4.25rem] border-b border-wt-border px-1 py-2.5 text-center text-xs font-semibold",
                    isNow ? "bg-[var(--wt-brand-soft)] text-[var(--wt-brand)]" : "bg-wt-surface-2 text-wt-text-muted"
                  )}
                >
                  {date ? shortDay(date) : w}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {teams.map((team) => {
            const members = byDepartment.get(team.department) ?? [];
            const folded = collapsed.has(team.department);
            return (
              <TeamBlock
                key={team.department}
                team={team}
                members={members}
                folded={folded}
                onToggle={() => toggle(team.department)}
                metric={metric}
                thresholds={thresholds}
                selected={selected}
                onSelect={onSelect}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Cell({ cell, metric, thresholds, active, onClick, label }: { cell: UtilizationWeekCell; metric: UtilizationMetric; thresholds: Thresholds; active: boolean; onClick: () => void; label: string }) {
  const value = valueOf(cell, metric);
  const tone = STYLE[levelFor(value, thresholds)];
  return (
    <td className="p-0.5">
      <button
        type="button"
        onClick={onClick}
        aria-label={`${label}: ${percentLabel(value)}`}
        className={cn(
          "flex h-9 w-full items-center justify-center rounded-lg text-xs font-semibold tabular-nums transition-transform hover:scale-[1.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wt-brand)]",
          tone.cell,
          active && "ring-2 ring-wt-text ring-offset-1"
        )}
      >
        {value === null ? COPY.onLeaveAllWeek : percentLabel(value)}
      </button>
    </td>
  );
}

function TeamBlock({ team, members, folded, onToggle, metric, thresholds, selected, onSelect }: { team: UtilizationTeam; members: UtilizationPerson[]; folded: boolean; onToggle: () => void; metric: UtilizationMetric; thresholds: Thresholds; selected: SelectedCell | null; onSelect: (c: SelectedCell) => void }) {
  return (
    <>
      <tr>
        <th scope="row" className="sticky left-0 z-10 bg-wt-surface-2/90 px-3 py-2 text-left backdrop-blur">
          <button type="button" onClick={onToggle} aria-expanded={!folded} className="flex w-full items-center gap-2 text-left">
            <ChevronDown className={cn("size-4 shrink-0 text-wt-text-muted transition-transform", folded && "-rotate-90")} aria-hidden />
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-wt-text">{team.department}</span>
              <span className="block text-[11px] font-normal text-wt-text-muted">{COPY.teamRow(team.head_count)}</span>
            </span>
          </button>
        </th>
        {team.weeks.map((w) => {
          const tone = STYLE[levelFor(w.average_planned, thresholds)];
          return (
            <td key={w.week_start} className="bg-wt-surface-2/60 p-0.5 text-center">
              <span className={cn("flex h-8 items-center justify-center rounded-md text-xs font-semibold tabular-nums opacity-90", tone.cell)} title={`${COPY.average}: ${percentLabel(w.average_planned)}`}>
                {percentLabel(w.average_planned)}
              </span>
            </td>
          );
        })}
      </tr>
      {folded
        ? null
        : members.map((person) => (
            <tr key={person.email}>
              <th scope="row" className="sticky left-0 z-10 border-b border-wt-border/60 bg-wt-surface-1 px-3 py-1 text-left font-normal">
                <span className="block max-w-[13rem] truncate text-sm text-wt-text">{person.name}</span>
              </th>
              {person.weeks.map((cell, index) => (
                <Cell
                  key={cell.week_start}
                  cell={cell}
                  metric={metric}
                  thresholds={thresholds}
                  active={selected?.email === person.email && selected.index === index}
                  onClick={() => onSelect({ email: person.email, index })}
                  label={`${person.name}, week ${index + 1}`}
                />
              ))}
            </tr>
          ))}
    </>
  );
}
