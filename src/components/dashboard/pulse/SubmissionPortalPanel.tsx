"use client";

import { useState } from "react";

import { IndividualWindows } from "@/components/dashboard/pulse/portal/IndividualWindows";
import { SharedWindowCard } from "@/components/dashboard/pulse/portal/SharedWindowCard";
import {
  SHARED_SCOPES,
  endIsStale,
  fromInputValue,
  monthsWithWindows,
  sharedRow,
  windowState,
} from "@/components/dashboard/pulse/portal/portalModel";
import { MonthSwitcher } from "@/components/dashboard/pulse/shared/MonthSwitcher";
import { SectionLoading } from "@/components/dashboard/ui/SectionLoading";
import { useChangeCycle, useSubmissionCycles } from "@/hooks/pulse/usePulse";
import { cn } from "@/lib/utils";
import { formatApiDateTime } from "@/utils/apiDate";
import { currentMonthKey, formatMonthLabel } from "@/utils/pulseMonth";
import { WINDOW_SCOPE_LABELS } from "@/constants/pulse";
import type { SubmissionCycleScope } from "@/types/kpi";

type SharedScope = Exclude<SubmissionCycleScope, "PERSON">;

/** Submission Portal, month by month: Global opens Pulse for everyone,
 *  Employee / Manager for just that audience, and individual windows for a
 *  single named employee. */
export function SubmissionPortalPanel() {
  const [month, setMonth] = useState(currentMonthKey);
  // Read the clock once per mount (render must stay pure).
  const [nowMs] = useState(() => Date.now());
  const cycles = useSubmissionCycles();
  const change = useChangeCycle();
  const [busyScope, setBusyScope] = useState<SharedScope | null>(null);
  const rows = cycles.data ?? [];

  const stateOf = (scope: SharedScope) => windowState(sharedRow(rows, month, scope), nowMs);
  const globalOpen = stateOf("GLOBAL") === "open";

  /** Rows are unique per (month, scope) — write to that exact row. */
  const write = (scope: SharedScope, changes: { window_start_at: string; window_end_at: string | null; manual_closed: boolean }, success: string) => {
    const row = sharedRow(rows, month, scope);
    setBusyScope(scope);
    const done = { onSettled: () => setBusyScope(null) };
    if (row) change.mutate({ kind: "update", id: row.id, changes, success }, done);
    else change.mutate({ kind: "create", payload: { cycle_key: month, scope, ...changes }, success }, done);
  };

  const toggle = (scope: SharedScope) => {
    const row = sharedRow(rows, month, scope);
    if (stateOf(scope) === "open" && row) {
      setBusyScope(scope);
      change.mutate(
        { kind: "update", id: row.id, changes: { manual_closed: true }, success: `${WINDOW_SCOPE_LABELS[scope]} window closed.` },
        { onSettled: () => setBusyScope(null) }
      );
      return;
    }
    // A stale close time would leave the window shut right after opening it.
    write(
      scope,
      { window_start_at: formatApiDateTime(new Date()), window_end_at: endIsStale(row, nowMs) ? null : (row?.window_end_at ?? null), manual_closed: false },
      `${WINDOW_SCOPE_LABELS[scope]} window opened for ${formatMonthLabel(month)}.`
    );
  };

  const schedule = (scope: SharedScope, start: string, end: string) =>
    write(
      scope,
      { window_start_at: fromInputValue(start) ?? formatApiDateTime(new Date()), window_end_at: fromInputValue(end), manual_closed: false },
      `${WINDOW_SCOPE_LABELS[scope]} window scheduled.`
    );

  const audiences = [
    { label: "Employees can submit", open: globalOpen || stateOf("EMPLOYEE") === "open" },
    { label: "Managers can submit", open: globalOpen || stateOf("MANAGER") === "open" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <MonthSwitcher value={month} onChange={setMonth} marks={monthsWithWindows(rows)} />
        <div className="flex flex-wrap gap-2">
          {audiences.map((a) => (
            <span key={a.label} className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold", a.open ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "border-wt-border bg-wt-surface-2 text-wt-text-muted")}>
              <span className={cn("size-2 rounded-full", a.open ? "bg-emerald-500" : "bg-wt-text-faint")} />
              {a.label}: {a.open ? "yes" : "no"}
            </span>
          ))}
        </div>
      </div>
      <p className="text-xs text-wt-text-muted">
        Windows belong to a review month — {formatMonthLabel(month)} here. Employees and managers fill in, and managers review,
        only the months whose window is open for them.
      </p>

      {cycles.isLoading ? (
        <SectionLoading label="" />
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {SHARED_SCOPES.map((scope) => (
            <SharedWindowCard
              key={`${month}-${scope}-${sharedRow(rows, month, scope)?.updated_at ?? "new"}`}
              scope={scope}
              row={sharedRow(rows, month, scope)}
              state={stateOf(scope)}
              viaGlobal={scope !== "GLOBAL" && globalOpen}
              busy={busyScope === scope}
              onToggle={() => toggle(scope)}
              onSchedule={(start, end) => schedule(scope, start, end)}
            />
          ))}
        </div>
      )}

      <IndividualWindows rows={rows} month={month} nowMs={nowMs} />
    </div>
  );
}
