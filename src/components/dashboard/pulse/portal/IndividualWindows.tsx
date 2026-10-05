"use client";

import { useState } from "react";
import { Search, Trash2, UserPlus } from "lucide-react";

import { personRows, fromInputValue, windowState } from "@/components/dashboard/pulse/portal/portalModel";
import { InputField } from "@/components/dashboard/ui/forms";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useChangeCycle, useWindowCandidates } from "@/hooks/pulse/usePulse";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { notifyError } from "@/lib/notify";
import { cn } from "@/lib/utils";
import { formatApiDateTime } from "@/utils/apiDate";
import { formatMonthLabel } from "@/utils/pulseMonth";
import type { EmployeeSummary, SubmissionCycleItem } from "@/types/kpi";

/** Individual windows: open Pulse for one named employee for this month —
 *  a late submission, a new joiner, anyone the shared windows missed. */
export function IndividualWindows({ rows, month, nowMs }: { rows: SubmissionCycleItem[]; month: string; nowMs: number }) {
  const mine = personRows(rows, month);
  const change = useChangeCycle();
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<EmployeeSummary | null>(null);
  const [end, setEnd] = useState("");
  const [removing, setRemoving] = useState<SubmissionCycleItem | null>(null);
  const debounced = useDebouncedValue(query, 300);
  const candidates = useWindowCandidates(debounced);
  const showList = query.trim().length > 0 && !picked;

  const open = () => {
    if (!picked) return;
    const closes = fromInputValue(end);
    if (end && !closes) return notifyError("Pick a valid close time.");
    if (end && new Date(end).getTime() <= Date.now()) return notifyError("Close time must be in the future.");
    const existing = mine.find((r) => r.user_id === picked.id);
    const changes = { window_start_at: formatApiDateTime(new Date()), window_end_at: closes, manual_closed: false };
    const done = () => {
      setPicked(null);
      setQuery("");
      setEnd("");
    };
    const success = `Opened ${formatMonthLabel(month)} for ${picked.name}.`;
    if (existing) change.mutate({ kind: "update", id: existing.id, changes, success }, { onSuccess: done });
    else change.mutate({ kind: "create", payload: { cycle_key: month, scope: "PERSON", user_id: picked.id, ...changes }, success }, { onSuccess: done });
  };

  return (
    <section className="space-y-4 rounded-2xl border border-wt-border bg-wt-surface-1 p-4 sm:p-5">
      <header>
        <h3 className="text-sm font-semibold text-wt-text">Individual windows · {formatMonthLabel(month)}</h3>
        <p className="mt-0.5 text-xs text-wt-text-muted">Open Pulse for one employee only — it works even when the shared windows are closed.</p>
      </header>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_14rem_auto] lg:items-end">
        <div className="relative">
          <label className="mb-1.5 block text-sm font-medium text-wt-text" htmlFor="person-search">Employee</label>
          <Search className="pointer-events-none absolute left-3 top-[2.45rem] size-4 text-wt-text-faint" aria-hidden />
          <input
            id="person-search"
            value={picked ? `${picked.name}${picked.emp_id ? ` (${picked.emp_id})` : ""}` : query}
            onChange={(e) => { setPicked(null); setQuery(e.target.value); }}
            placeholder="Search by name, email or employee ID"
            className="h-10 w-full rounded-xl border border-wt-border bg-wt-surface-1 pl-9 pr-3 text-sm text-wt-text placeholder:text-wt-text-faint focus:outline-none focus:ring-2 focus:ring-[var(--wt-brand)]/40"
          />
          {showList ? (
            <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-wt-border bg-wt-surface-1 p-1 shadow-[var(--wt-shadow-lg)]">
              {candidates.isLoading ? <li className="px-3 py-2 text-sm text-wt-text-muted">Searching…</li> : null}
              {!candidates.isLoading && (candidates.data ?? []).length === 0 ? <li className="px-3 py-2 text-sm text-wt-text-muted">No employee found.</li> : null}
              {(candidates.data ?? []).map((c) => (
                <li key={c.id}>
                  <button type="button" onClick={() => setPicked(c)} className="flex w-full flex-col rounded-lg px-3 py-2 text-left hover:bg-wt-surface-2">
                    <span className="text-sm font-medium text-wt-text">{c.name}</span>
                    <span className="text-xs text-wt-text-muted">{[c.emp_id, c.email].filter(Boolean).join(" · ")}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <InputField label="Closes at" type="datetime-local" value={end} onChange={setEnd} description="Blank = stays open." />
        <Button type="button" variant="brand" disabled={!picked || change.isPending} onClick={open}>
          <UserPlus className="size-4" /> Open window
        </Button>
      </div>

      {mine.length === 0 ? (
        <p className="rounded-xl border border-dashed border-wt-border px-4 py-6 text-center text-sm text-wt-text-muted">No individual windows for {formatMonthLabel(month)}.</p>
      ) : (
        <ul className="divide-y divide-wt-border rounded-xl border border-wt-border">
          {mine.map((r) => {
            const state = windowState(r, nowMs);
            return (
              <li key={r.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-wt-text">{r.user?.name ?? `User #${r.user_id}`}</p>
                  <p className="truncate text-xs text-wt-text-muted">
                    {[r.user?.emp_id, r.window_end_at ? `closes ${r.window_end_at.slice(0, 16)}` : "open-ended"].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-semibold", state === "open" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-wt-surface-3 text-wt-text-muted")}>
                  {state === "open" ? "Open" : state === "scheduled" ? "Scheduled" : "Closed"}
                </span>
                {state === "open" ? (
                  <Button type="button" variant="outline" size="xs" disabled={change.isPending} onClick={() => change.mutate({ kind: "update", id: r.id, changes: { manual_closed: true }, success: "Window closed." })}>
                    Close
                  </Button>
                ) : null}
                <Button type="button" variant="ghost" size="xs" aria-label={`Remove ${r.user?.name ?? "window"}`} onClick={() => setRemoving(r)}>
                  <Trash2 className="size-3.5" />
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        open={removing != null}
        title="Remove this individual window?"
        description={removing ? `${removing.user?.name ?? "This employee"} will follow the shared windows again.` : undefined}
        confirmLabel="Remove"
        tone="danger"
        loading={change.isPending}
        onCancel={() => setRemoving(null)}
        onConfirm={() => removing && change.mutate({ kind: "delete", id: removing.id, success: "Window removed." }, { onSuccess: () => setRemoving(null) })}
      />
    </section>
  );
}
