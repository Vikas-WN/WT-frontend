"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, Sparkles, Trash2 } from "lucide-react";

import { EmptyState } from "@/components/dashboard/ui/EmptyState";
import { SectionLoading } from "@/components/dashboard/ui/SectionLoading";
import { InputField, TextAreaField } from "@/components/dashboard/ui/forms";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import type { WebknotValueItem, WebknotValueWritePayload } from "@/types/kpi";
import { notifyError, notifySuccess } from "@/lib/notify";
import { toUserFriendlyApiErrorMessage } from "@/utils/userFriendlyApiError";

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

type FormState = {
  title: string;
  evaluationCriteria: string;
  active: boolean;
};

const EMPTY_FORM: FormState = { title: "", evaluationCriteria: "", active: true };

/** Admin CRUD for the company's WebKnot values catalog — the 10% "values"
 *  component of an employee's monthly RTP score, rated alongside their KPIs. */
export function WebknotValuesPanel() {
  const [reloadTick, setReloadTick] = useState(0);
  const refresh = useCallback(() => setReloadTick((t) => t + 1), []);

  const rowsQuery = useLoad(
    () => hrmsService.getWebknotValues({ limit: 200 }).then((res) => res.data ?? []),
    [reloadTick]
  );
  const rows: WebknotValueItem[] = rowsQuery.data ?? [];
  const status = rowsQuery.status;

  useEffect(() => {
    if (status === "error") notifyError("Couldn't load WebKnot values.");
  }, [status]);

  const [dialog, setDialog] = useState<{ mode: "add" | "edit"; row?: WebknotValueItem } | null>(
    null
  );
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<WebknotValueItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setFormError(null);
    setDialog({ mode: "add" });
  };

  const openEdit = (row: WebknotValueItem) => {
    setForm({
      title: row.title,
      evaluationCriteria: row.evaluation_criteria ?? "",
      active: row.active,
    });
    setFormError(null);
    setDialog({ mode: "edit", row });
  };

  const submit = async () => {
    if (!form.title.trim()) {
      setFormError("Title is required.");
      return;
    }
    setFormError(null);
    setSaving(true);
    const payload: WebknotValueWritePayload = {
      title: form.title.trim(),
      evaluation_criteria: form.evaluationCriteria.trim() || null,
      active: form.active,
    };
    try {
      if (dialog?.mode === "edit" && dialog.row) {
        await hrmsService.updateWebknotValue(dialog.row.id, payload);
        notifySuccess("Value updated.");
      } else {
        await hrmsService.createWebknotValue(payload);
        notifySuccess("Value added.");
      }
      setDialog(null);
      refresh();
    } catch (error) {
      setFormError(
        toUserFriendlyApiErrorMessage(
          error,
          error instanceof ApiError ? error.message : "Couldn't save this value."
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
      await hrmsService.deleteWebknotValue(deleteTarget.id);
      notifySuccess("Value deleted.");
      setDeleteTarget(null);
      refresh();
    } catch (error) {
      notifyError(
        toUserFriendlyApiErrorMessage(
          error,
          error instanceof ApiError ? error.message : "Couldn't delete this value."
        )
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-wt-text">WebKnot Values</h3>
          <p className="mt-0.5 text-xs text-wt-text-muted">
            The company values every employee rates themselves on each month — 10% of the RTP score.
          </p>
        </div>
        <Button type="button" onClick={openAdd} className="shrink-0">
          <Plus className="mr-1.5 size-4" /> Add value
        </Button>
      </div>

      {status === "loading" ? (
        <SectionLoading label="" />
      ) : status === "error" ? (
        <EmptyState
          title="Couldn't Load Values"
          className="py-12"
          action={
            <Button type="button" variant="outline" size="sm" onClick={refresh}>
              Try again
            </Button>
          }
        />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No Values Yet"
          description="Add the company's first WebKnot value."
          icon={<Sparkles className="size-6" />}
          className="py-12"
        />
      ) : (
        <ul className="divide-y divide-wt-border overflow-hidden rounded-xl border border-wt-border">
          {rows.map((row) => (
            <li key={row.id} className="flex items-start justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-medium text-wt-text">{row.title}</p>
                  {!row.active ? <Badge variant="secondary">Inactive</Badge> : null}
                </div>
                {row.evaluation_criteria ? (
                  <p className="mt-1 max-w-xl text-xs text-wt-text-faint">{row.evaluation_criteria}</p>
                ) : null}
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => openEdit(row)}
                  aria-label={`Edit ${row.title}`}
                >
                  <Pencil className="size-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setDeleteTarget(row)}
                  aria-label={`Delete ${row.title}`}
                >
                  <Trash2 className="size-3.5 text-rose-600" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
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
                {dialog.mode === "add" ? "Add Value" : "Edit Value"}
              </h2>
            </div>
            <div className={MODAL_BODY_CLASS}>
              <div className="space-y-4">
                <InputField
                  label="Title"
                  value={form.title}
                  onChange={(v) => setForm((f) => ({ ...f, title: v }))}
                  required
                  placeholder="e.g. Ownership"
                />
                <TextAreaField
                  label="Evaluation Criteria"
                  value={form.evaluationCriteria}
                  onChange={(v) => setForm((f) => ({ ...f, evaluationCriteria: v }))}
                  placeholder="What meeting this value looks like (optional)"
                  rows={3}
                />
                <label className="flex items-center gap-2 text-sm text-wt-text">
                  <Checkbox
                    checked={form.active}
                    onCheckedChange={(v) => setForm((f) => ({ ...f, active: Boolean(v) }))}
                  />
                  Active
                </label>
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
                {saving ? "Saving…" : dialog.mode === "add" ? "Add value" : "Save changes"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete this value?"
        description={deleteTarget ? `"${deleteTarget.title}" will be removed. This can't be undone.` : ""}
        confirmLabel="Delete"
        tone="danger"
        loading={deleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
