"use client";

import { useState } from "react";
import { CalendarClock, Globe2, Play, Shield, Square, UserCheck } from "lucide-react";

import { WINDOW_SCOPE_HINTS, WINDOW_SCOPE_LABELS } from "@/constants/pulse";
import { fromInputValue, toInputValue, type WindowState } from "@/components/dashboard/pulse/portal/portalModel";
import { InputField } from "@/components/dashboard/ui/forms";
import { Button } from "@/components/ui/button";
import { notifyError } from "@/lib/notify";
import { cn } from "@/lib/utils";
import type { SubmissionCycleItem, SubmissionCycleScope } from "@/types/kpi";

const ICONS = { GLOBAL: Globe2, EMPLOYEE: UserCheck, MANAGER: Shield, PERSON: UserCheck } as const;

const STATE_STYLE: Record<WindowState, { label: string; className: string }> = {
  open: { label: "Open", className: "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" },
  scheduled: { label: "Scheduled", className: "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-400" },
  closed: { label: "Closed", className: "border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-400" },
  unset: { label: "Not set", className: "border-wt-border bg-wt-surface-2 text-wt-text-muted" },
};

/** One shared window (Global / Employee / Manager) for the month on screen. */
export function SharedWindowCard({
  scope,
  row,
  state,
  viaGlobal,
  busy,
  onToggle,
  onSchedule,
}: {
  scope: Exclude<SubmissionCycleScope, "PERSON">;
  row: SubmissionCycleItem | null;
  state: WindowState;
  /** The audience can submit only because the Global window is open. */
  viaGlobal: boolean;
  busy: boolean;
  onToggle: () => void;
  onSchedule: (start: string, end: string) => void;
}) {
  // Seeded once from the saved row; the parent remounts this card (via key)
  // when the row changes, so no effect is needed to keep it in sync.
  const [start, setStart] = useState(() => toInputValue(row?.window_start_at));
  const [end, setEnd] = useState(() => toInputValue(row?.window_end_at));
  const Icon = ICONS[scope];
  const style = STATE_STYLE[state];
  const isOpen = state === "open";

  const schedule = () => {
    if (!fromInputValue(start)) return notifyError("Pick when it should open.");
    if (end && new Date(end).getTime() <= new Date(start).getTime()) return notifyError("Close time must be after the open time.");
    onSchedule(start, end);
  };

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-wt-border bg-wt-surface-1 p-4 sm:p-5">
      <header className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--wt-brand-soft)] text-[var(--wt-brand)]">
          <Icon className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-wt-text">{WINDOW_SCOPE_LABELS[scope]} window</h3>
          <p className="mt-0.5 text-xs text-wt-text-muted">{WINDOW_SCOPE_HINTS[scope]}</p>
        </div>
        <span className={cn("shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold", style.className)}>{style.label}</span>
      </header>

      {viaGlobal && !isOpen ? (
        <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-400">Currently open through the Global window.</p>
      ) : null}
      {state === "scheduled" ? <p className="text-xs text-amber-700 dark:text-amber-400">Opens {row?.window_start_at}</p> : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <InputField label="Opens at" type="datetime-local" value={start} onChange={setStart} />
        <InputField label="Closes at" type="datetime-local" value={end} onChange={setEnd} description="Blank = stays open." />
      </div>

      <div className="mt-auto flex gap-2">
        <Button
          type="button"
          size="sm"
          disabled={busy}
          onClick={onToggle}
          className={cn("flex-1", isOpen ? "!bg-rose-500/10 !text-rose-700 hover:!bg-rose-500 hover:!text-white dark:!text-rose-400" : "!bg-emerald-600 !text-white hover:!bg-emerald-500")}
        >
          {isOpen ? <Square className="size-3.5" /> : <Play className="size-3.5" />}
          {busy ? "Working…" : isOpen ? "Stop now" : "Open now"}
        </Button>
        <Button type="button" variant="outline" size="sm" disabled={busy} onClick={schedule} className="flex-1">
          <CalendarClock className="size-3.5" /> Schedule
        </Button>
      </div>
      {row?.updated_by ? <p className="text-[11px] text-wt-text-faint">Last updated by {row.updated_by}</p> : null}
    </section>
  );
}
