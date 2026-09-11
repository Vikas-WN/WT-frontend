"use client";

import { useCallback, useEffect, useState } from "react";
import { Lock, LockOpen, Pencil, Plus, Trash2 } from "lucide-react";

import { EmptyState } from "@/components/dashboard/ui/EmptyState";
import { SectionLoading } from "@/components/dashboard/ui/SectionLoading";
import { ScrollableTable } from "@/components/dashboard/ui/ScrollableTable";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  WT_STICKY_TABLE_HEAD_CLASS,
  WtTable,
} from "@/components/dashboard/ui/wtTable";
import { InputField, SelectField } from "@/components/dashboard/ui/forms";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  MODAL_BODY_CLASS,
  MODAL_FOOTER_CLASS,
  MODAL_HEADER_CLASS,
  MODAL_OVERLAY_CLASS,
  MODAL_PANEL_CLASS,
} from "@/components/dashboard/ui/uiLayout";
import { ApiError } from "@/api/error";
import { hrmsService } from "@/services/hrms.service";
import type { SubmissionCycleItem, SubmissionCycleScope, SubmissionCycleWritePayload } from "@/types/kpi";
import { notifyError, notifySuccess } from "@/lib/notify";
import { toUserFriendlyApiErrorMessage } from "@/utils/userFriendlyApiError";
import { formatApiDate, formatApiDateTimeDisplay, parseApiDate } from "@/utils/apiDate";
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

const SCOPE_OPTIONS: { value: SubmissionCycleScope; label: string }[] = [
  { value: "GLOBAL", label: "Global (everyone)" },
  { value: "EMPLOYEE", label: "Employee portal" },
  { value: "MANAGER", label: "Manager portal" },
];

function scopeLabel(scope: string): string {
  return SCOPE_OPTIONS.find((s) => s.value === scope)?.label ?? scope;
}

function currentCycleKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function firstAndLastOfMonth(cycleKey: string): { start: string; end: string } {
  const [y, m] = cycleKey.split("-").map(Number);
  if (!y || !m) return { start: "", end: "" };
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 0);
  return { start: formatApiDate(start), end: formatApiDate(end) };
}

/** dd/mm/yyyy -> dd/mm/yyyy HH:MM:SS at start or end of that day. */
function toWindowDateTime(apiDate: string, endOfDay: boolean): string | null {
  const parsed = parseApiDate(apiDate);
  if (!parsed) return null;
  if (endOfDay) parsed.setHours(23, 59, 59, 0);
  else parsed.setHours(0, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${formatApiDate(parsed)} ${pad(parsed.getHours())}:${pad(parsed.getMinutes())}:${pad(parsed.getSeconds())}`;
}

type FormState = {
  cycleKey: string;
  scope: SubmissionCycleScope;
  windowStart: string;
  windowEnd: string;
};

function emptyForm(): FormState {
  const cycleKey = currentCycleKey();
  const { start, end } = firstAndLastOfMonth(cycleKey);
  return { cycleKey, scope: "GLOBAL", windowStart: start, windowEnd: end };
}

export function SubmissionPortalPanel() {
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const [dialog, setDialog] = useState<{ mode: "add" | "edit"; row?: SubmissionCycleItem } | null>(
    null
  );
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<SubmissionCycleItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Bump to re-run the fetch below (retry button, after any create/update/delete/toggle).
  const [reloadTick, setReloadTick] = useState(0);
  const refresh = useCallback(() => setReloadTick((t) => t + 1), []);

  const cycles = useLoad<SubmissionCycleItem[]>(async () => {
    const res = await hrmsService.getSubmissionCycles();
    const list = Array.isArray(res.data) ? [...res.data] : [];
    list.sort((a, b) => b.cycle_key.localeCompare(a.cycle_key) || a.scope.localeCompare(b.scope));
    return list;
  }, [reloadTick]);
  const rows = cycles.data ?? [];
  const status = cycles.status;

  useEffect(() => {
    if (status === "error") notifyError("Couldn't load the submission portal.");
  }, [status]);

  const toggle = async (row: SubmissionCycleItem) => {
    setTogglingId(row.id);
    try {
      await hrmsService.updateSubmissionCycle(row.id, { manual_closed: !row.manual_closed });
      notifySuccess(row.manual_closed ? "Portal opened." : "Portal closed.");
      refresh();
    } catch (error) {
      notifyError(
        toUserFriendlyApiErrorMessage(
          error,
          error instanceof ApiError ? error.message : "Couldn't update the portal."
        )
      );
    } finally {
      setTogglingId(null);
    }
  };

  const openAdd = () => {
    setForm(emptyForm());
    setFormError(null);
    setDialog({ mode: "add" });
  };

  const openEdit = (row: SubmissionCycleItem) => {
    setForm({
      cycleKey: row.cycle_key,
      scope: row.scope,
      windowStart: row.window_start_at,
      windowEnd: row.window_end_at ?? "",
    });
    setFormError(null);
    setDialog({ mode: "edit", row });
  };

  const submit = async () => {
    const ck = form.cycleKey.trim();
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(ck)) {
      setFormError("Cycle key must look like 2026-09.");
      return;
    }
    const windowStart = toWindowDateTime(form.windowStart, false);
    if (!windowStart) {
      setFormError("Pick a window start date.");
      return;
    }
    const windowEnd = form.windowEnd ? toWindowDateTime(form.windowEnd, true) : null;

    setFormError(null);
    setSaving(true);
    const payload: SubmissionCycleWritePayload = {
      cycle_key: ck,
      scope: form.scope,
      window_start_at: windowStart,
      window_end_at: windowEnd,
      manual_closed: dialog?.row?.manual_closed ?? false,
    };
    try {
      if (dialog?.mode === "edit" && dialog.row) {
        await hrmsService.updateSubmissionCycle(dialog.row.id, payload);
        notifySuccess("Portal cycle updated.");
      } else {
        await hrmsService.createSubmissionCycle(payload);
        notifySuccess("Portal cycle created.");
      }
      setDialog(null);
      refresh();
    } catch (error) {
      setFormError(
        toUserFriendlyApiErrorMessage(
          error,
          error instanceof ApiError ? error.message : "Couldn't save the portal cycle."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await hrmsService.deleteSubmissionCycle(deleteTarget.id);
      notifySuccess("Portal cycle deleted.");
      setDeleteTarget(null);
      refresh();
    } catch (error) {
      notifyError(
        toUserFriendlyApiErrorMessage(
          error,
          error instanceof ApiError ? error.message : "Couldn't delete the portal cycle."
        )
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3 rounded-xl border border-wt-border bg-wt-surface-2/50 p-4 dark:bg-wt-surface-2">
        <p className="text-sm text-wt-text-muted">
          Each row is one submission window — a cycle key (month), a scope (who it&apos;s
          for), and a date range. The portal is open when the window covers today
          <em> and</em> it hasn&apos;t been manually closed.
        </p>
        <Button type="button" onClick={openAdd} className="shrink-0">
          <Plus className="mr-1.5 size-4" /> New cycle
        </Button>
      </div>

      {status === "loading" ? (
        <SectionLoading label="" />
      ) : status === "error" ? (
        <EmptyState
          title="Couldn't Load the Portal"
          className="py-12"
          action={
            <Button type="button" variant="outline" size="sm" onClick={refresh}>
              Try again
            </Button>
          }
        />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No Submission Cycles Yet"
          description="Create one to open the portal for a month."
          className="py-12"
        />
      ) : (
        <ScrollableTable maxHeightClass="max-h-[min(60vh,520px)]">
          <WtTable>
            <TableHeader className={WT_STICKY_TABLE_HEAD_CLASS}>
              <TableRow className="hover:bg-transparent">
                <TableHead>Cycle</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead>Window</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated by</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="whitespace-nowrap font-medium text-wt-text">
                    {row.cycle_key}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{scopeLabel(row.scope)}</TableCell>
                  <TableCell className="whitespace-nowrap text-wt-text-muted">
                    {formatApiDateTimeDisplay(row.window_start_at)}
                    {row.window_end_at ? ` – ${formatApiDateTimeDisplay(row.window_end_at)}` : " – open-ended"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <span
                      className={cn(
                        "rounded-md px-1.5 py-0.5 text-[11px] font-medium",
                        row.is_open
                          ? "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400"
                          : "bg-rose-500/12 text-rose-700 dark:text-rose-400"
                      )}
                    >
                      {row.is_open ? "Open now" : "Closed now"}
                    </span>
                    {!row.is_open && !row.manual_closed ? (
                      <span className="ml-1.5 text-[11px] text-wt-text-faint">outside window</span>
                    ) : null}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-wt-text-muted">
                    {row.updated_by || "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={togglingId === row.id}
                        onClick={() => void toggle(row)}
                      >
                        {row.manual_closed ? (
                          <>
                            <LockOpen className="mr-1.5 size-3.5" /> Open portal
                          </>
                        ) : (
                          <>
                            <Lock className="mr-1.5 size-3.5" /> Close portal
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openEdit(row)}
                        aria-label={`Edit ${row.cycle_key} ${row.scope}`}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setDeleteTarget(row)}
                        aria-label={`Delete ${row.cycle_key} ${row.scope}`}
                      >
                        <Trash2 className="size-3.5 text-rose-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </WtTable>
        </ScrollableTable>
      )}

      {dialog ? (
        <div
          className={MODAL_OVERLAY_CLASS}
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget && !saving) setDialog(null);
          }}
        >
          <div role="dialog" aria-modal="true" className={MODAL_PANEL_CLASS}>
            <div className={MODAL_HEADER_CLASS}>
              <h2 className="text-base font-semibold text-wt-text">
                {dialog.mode === "add" ? "New submission cycle" : "Edit submission cycle"}
              </h2>
              <p className="mt-1 text-xs text-wt-text-muted">
                Defines the window during which this scope&apos;s portal is open.
              </p>
            </div>
            <div className={MODAL_BODY_CLASS}>
              <div className="space-y-4">
                <InputField
                  label="Cycle Key"
                  value={form.cycleKey}
                  onChange={(v) => setForm((f) => ({ ...f, cycleKey: v }))}
                  placeholder="2026-09"
                  required
                  description="Year-month, e.g. 2026-09."
                />
                <SelectField
                  label="Scope"
                  value={form.scope}
                  onChange={(v) => setForm((f) => ({ ...f, scope: v as SubmissionCycleScope }))}
                  options={SCOPE_OPTIONS}
                />
                <InputField
                  label="Window Start"
                  type="date"
                  value={form.windowStart}
                  onChange={(v) => setForm((f) => ({ ...f, windowStart: v }))}
                  required
                />
                <InputField
                  label="Window End"
                  type="date"
                  value={form.windowEnd}
                  onChange={(v) => setForm((f) => ({ ...f, windowEnd: v }))}
                  description="Leave blank for an open-ended window (closes only when you close it manually)."
                />
                {formError ? (
                  <p className="text-sm text-destructive" role="alert">
                    {formError}
                  </p>
                ) : null}
              </div>
            </div>
            <div className={MODAL_FOOTER_CLASS}>
              <Button type="button" variant="outline" onClick={() => setDialog(null)} disabled={saving}>
                Cancel
              </Button>
              <Button type="button" onClick={() => void submit()} disabled={saving}>
                {saving ? "Saving…" : dialog.mode === "add" ? "Create cycle" : "Save changes"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete this submission cycle?"
        description={
          deleteTarget
            ? `${deleteTarget.cycle_key} · ${scopeLabel(deleteTarget.scope)} will be removed. This can't be undone.`
            : ""
        }
        confirmLabel="Delete"
        tone="danger"
        loading={deleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
