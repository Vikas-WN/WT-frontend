"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarClock, Globe2, Play, Shield, Square, UserCheck } from "lucide-react";

import { SectionLoading } from "@/components/dashboard/ui/SectionLoading";
import { InputField } from "@/components/dashboard/ui/forms";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/api/error";
import { hrmsService } from "@/services/hrms.service";
import type {
  SubmissionCycleItem,
  SubmissionCycleScope,
  SubmissionCycleWritePayload,
} from "@/types/kpi";
import { notifyError, notifySuccess } from "@/lib/notify";
import { toUserFriendlyApiErrorMessage } from "@/utils/userFriendlyApiError";
import { formatApiDateTime, parseApiDate } from "@/utils/apiDate";
import { cn } from "@/lib/utils";

type Load<T> = { status: "loading" | "done" | "error"; data: T | null };

/** Local copy of the small async-fetch hook used across dashboard pages —
 *  kept file-local rather than shared (see HomePageClient's own copy). */
function useLoad<T>(fn: () => Promise<T>, deps: unknown[] = []): Load<T> {
  const [state, setState] = useState<Load<T>>({ status: "loading", data: null });
  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const data = await fn();
        if (alive) setState({ status: "done", data });
      } catch {
        if (alive) setState({ status: "error", data: null });
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return state;
}

const SCOPES: { scope: SubmissionCycleScope; title: string; icon: typeof Globe2 }[] = [
  { scope: "GLOBAL", title: "Global", icon: Globe2 },
  { scope: "EMPLOYEE", title: "Employee", icon: UserCheck },
  { scope: "MANAGER", title: "Manager", icon: Shield },
];

function scopeTitle(scope: SubmissionCycleScope): string {
  return SCOPES.find((s) => s.scope === scope)?.title ?? scope;
}

function currentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/** The row that best represents "the window" for a scope right now: the open
 *  one if there is one, otherwise whichever was touched most recently. */
function pickCurrentRow(
  rows: SubmissionCycleItem[],
  scope: SubmissionCycleScope
): SubmissionCycleItem | null {
  const scoped = rows.filter((r) => r.scope === scope);
  if (!scoped.length) return null;
  const open = scoped.find((r) => r.is_open);
  if (open) return open;
  return [...scoped].sort((a, b) => b.updated_at.localeCompare(a.updated_at))[0] ?? null;
}

function parseApiDateTime(value: string | null | undefined): Date | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const [datePart, timePart] = raw.split(/\s+/);
  const parsed = parseApiDate(datePart);
  if (!parsed) return null;
  if (timePart) {
    const [h, m, s] = timePart.split(":").map((n) => Number(n) || 0);
    parsed.setHours(h, m, s ?? 0, 0);
  }
  return parsed;
}

/** `dd/mm/yyyy HH:MM:SS` (or empty) -> `<input type="datetime-local">` value. */
function apiDateTimeToInputValue(value: string | null | undefined): string {
  const d = parseApiDateTime(value);
  if (!d) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** `<input type="datetime-local">` value -> `dd/mm/yyyy HH:MM:SS`, or null if empty/invalid. */
function inputValueToApiDateTime(value: string): string | null {
  if (!value.trim()) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return formatApiDateTime(d);
}

type WindowFormState = { start: string; end: string };

function WindowCard({
  icon: Icon,
  title,
  row,
  isOpen,
  effectiveOpen,
  busy,
  onToggle,
  onSchedule,
}: {
  icon: typeof Globe2;
  title: string;
  row: SubmissionCycleItem | null;
  isOpen: boolean;
  effectiveOpen: boolean;
  busy: boolean;
  onToggle: () => void;
  onSchedule: (form: WindowFormState) => void;
}) {
  // Seeded once from `row` (the parent remounts this card via `key` when the
  // saved row changes) and freely edited locally after that — no effect
  // needed to keep it in sync with the fetch.
  const [form, setForm] = useState<WindowFormState>(() => ({
    start: apiDateTimeToInputValue(row?.window_start_at),
    end: apiDateTimeToInputValue(row?.window_end_at),
  }));

  return (
    <div className="rounded-xl border border-wt-border bg-wt-surface-1 p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg bg-[var(--wt-brand-soft)] text-[var(--wt-brand)]">
          <Icon className="size-3.5" />
        </span>
        <span className="text-sm font-semibold text-wt-text">{title}</span>
        <span
          className={cn(
            "ml-auto rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
            effectiveOpen
              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
              : "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-400"
          )}
        >
          {effectiveOpen ? "Active" : "Inactive"}
        </span>
      </div>

      {effectiveOpen && !isOpen ? (
        <p className="mb-3 text-[11px] text-emerald-700 dark:text-emerald-400">Open via Global window</p>
      ) : null}

      <div className="space-y-3">
        <InputField
          label="Open at"
          type="datetime-local"
          value={form.start}
          onChange={(v) => setForm((f) => ({ ...f, start: v }))}
        />
        <InputField
          label="Close at"
          type="datetime-local"
          value={form.end}
          onChange={(v) => setForm((f) => ({ ...f, end: v }))}
          description="Leave blank for open-ended."
        />
        <div className="flex gap-2 pt-1">
          <Button
            type="button"
            size="sm"
            disabled={busy}
            onClick={onToggle}
            className={cn(
              "flex-1",
              isOpen
                ? "!bg-rose-500/10 !text-rose-700 hover:!bg-rose-500 hover:!text-white dark:!text-rose-400"
                : "!bg-emerald-600 !text-white hover:!bg-emerald-500"
            )}
          >
            {busy ? (
              "Working…"
            ) : isOpen ? (
              <>
                <Square className="mr-1.5 size-3.5" /> Stop
              </>
            ) : (
              <>
                <Play className="mr-1.5 size-3.5" /> Start
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => onSchedule(form)}
            className="flex-1"
          >
            <CalendarClock className="mr-1.5 size-3.5" /> Schedule
          </Button>
        </div>
        {row?.updated_by ? (
          <p className="text-[11px] text-wt-text-faint">Last updated by {row.updated_by}</p>
        ) : null}
      </div>
    </div>
  );
}

export function SubmissionPortalPanel() {
  const [reloadTick, setReloadTick] = useState(0);
  const refresh = useCallback(() => setReloadTick((t) => t + 1), []);

  const cycles = useLoad<SubmissionCycleItem[]>(async () => {
    const res = await hrmsService.getSubmissionCycles();
    return Array.isArray(res.data) ? res.data : [];
  }, [reloadTick]);
  const rows = useMemo(() => cycles.data ?? [], [cycles.data]);
  const status = cycles.status;

  useEffect(() => {
    if (status === "error") notifyError("Couldn't load the submission portal.");
  }, [status]);

  const [busyScope, setBusyScope] = useState<SubmissionCycleScope | null>(null);

  const globalRow = pickCurrentRow(rows, "GLOBAL");
  const empRow = pickCurrentRow(rows, "EMPLOYEE");
  const mgrRow = pickCurrentRow(rows, "MANAGER");

  const globalOpen = Boolean(globalRow?.is_open);
  const empOwnOpen = Boolean(empRow?.is_open);
  const mgrOwnOpen = Boolean(mgrRow?.is_open);
  const empEffectiveOpen = globalOpen || empOwnOpen;
  const mgrEffectiveOpen = globalOpen || mgrOwnOpen;

  const upsertScope = useCallback(
    async (scope: SubmissionCycleScope, changes: Partial<SubmissionCycleWritePayload>) => {
      const row = pickCurrentRow(rows, scope);
      if (row) {
        return hrmsService.updateSubmissionCycle(row.id, changes);
      }
      return hrmsService.createSubmissionCycle({
        cycle_key: currentMonthKey(),
        scope,
        window_start_at: changes.window_start_at ?? formatApiDateTime(new Date()),
        window_end_at: changes.window_end_at ?? null,
        manual_closed: changes.manual_closed ?? false,
      });
    },
    [rows]
  );

  const handleToggle = async (scope: SubmissionCycleScope, isOpen: boolean) => {
    setBusyScope(scope);
    try {
      if (isOpen) {
        await upsertScope(scope, { manual_closed: true });
        notifySuccess(`${scopeTitle(scope)} window closed.`);
      } else {
        const row = pickCurrentRow(rows, scope);
        const currentEnd = parseApiDateTime(row?.window_end_at);
        const changes: Partial<SubmissionCycleWritePayload> = {
          window_start_at: formatApiDateTime(new Date()),
          manual_closed: false,
          // `/submission-cycles/is-open` (what employees' Pulse gate actually
          // checks) requires the row's cycle_key to match the current month —
          // a stale cycle_key from a prior month would leave this card
          // showing "Active" while the employee-facing check still says
          // closed. Keep it current whenever the window is (re)started.
          cycle_key: currentMonthKey(),
        };
        // A stale end date in the past would leave the window closed right
        // after "opening" it — clear it so Start actually opens the window.
        if (currentEnd && currentEnd.getTime() <= Date.now()) {
          changes.window_end_at = null;
        }
        await upsertScope(scope, changes);
        notifySuccess(`${scopeTitle(scope)} window opened.`);
      }
      refresh();
    } catch (error) {
      notifyError(
        toUserFriendlyApiErrorMessage(
          error,
          error instanceof ApiError ? error.message : "Couldn't update the window."
        )
      );
    } finally {
      setBusyScope(null);
    }
  };

  const handleSchedule = async (scope: SubmissionCycleScope, form: WindowFormState) => {
    const windowStart = inputValueToApiDateTime(form.start);
    if (!windowStart) {
      notifyError("Pick a start date and time.");
      return;
    }
    const windowEnd = form.end ? inputValueToApiDateTime(form.end) : null;
    setBusyScope(scope);
    try {
      await upsertScope(scope, { window_start_at: windowStart, window_end_at: windowEnd });
      notifySuccess(`${scopeTitle(scope)} window scheduled.`);
      refresh();
    } catch (error) {
      notifyError(
        toUserFriendlyApiErrorMessage(
          error,
          error instanceof ApiError ? error.message : "Couldn't schedule the window."
        )
      );
    } finally {
      setBusyScope(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-wt-border bg-wt-surface-2/50 p-4 dark:bg-wt-surface-2">
        <div className="flex flex-wrap items-center gap-4">
          {[
            { label: "Global", effective: globalOpen },
            { label: "Employee", effective: empEffectiveOpen },
            { label: "Manager", effective: mgrEffectiveOpen },
          ].map(({ label, effective }) => (
            <span
              key={label}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-wt-text-muted"
            >
              <span className={cn("size-2 rounded-full", effective ? "bg-emerald-500" : "bg-rose-500")} />
              {label} {effective ? "Open" : "Closed"}
            </span>
          ))}
        </div>
        <p className="mt-2 text-xs text-wt-text-muted">
          When the Global window is open, the Employee and Manager portals are open for everyone. Each
          window can still be scheduled and opened or closed independently.
        </p>
      </div>

      {status === "loading" ? (
        <SectionLoading label="" />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <WindowCard
            key={`global-${globalRow?.id ?? "new"}-${globalRow?.updated_at ?? ""}`}
            icon={Globe2}
            title="Global"
            row={globalRow}
            isOpen={globalOpen}
            effectiveOpen={globalOpen}
            busy={busyScope === "GLOBAL"}
            onToggle={() => void handleToggle("GLOBAL", globalOpen)}
            onSchedule={(form) => void handleSchedule("GLOBAL", form)}
          />
          <WindowCard
            key={`employee-${empRow?.id ?? "new"}-${empRow?.updated_at ?? ""}`}
            icon={UserCheck}
            title="Employee"
            row={empRow}
            isOpen={empOwnOpen}
            effectiveOpen={empEffectiveOpen}
            busy={busyScope === "EMPLOYEE"}
            onToggle={() => void handleToggle("EMPLOYEE", empOwnOpen)}
            onSchedule={(form) => void handleSchedule("EMPLOYEE", form)}
          />
          <WindowCard
            key={`manager-${mgrRow?.id ?? "new"}-${mgrRow?.updated_at ?? ""}`}
            icon={Shield}
            title="Manager"
            row={mgrRow}
            isOpen={mgrOwnOpen}
            effectiveOpen={mgrEffectiveOpen}
            busy={busyScope === "MANAGER"}
            onToggle={() => void handleToggle("MANAGER", mgrOwnOpen)}
            onSchedule={(form) => void handleSchedule("MANAGER", form)}
          />
        </div>
      )}
    </div>
  );
}
