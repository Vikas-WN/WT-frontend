"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";

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
import { InputField, SelectField, TextAreaField } from "@/components/dashboard/ui/forms";
import { DesignationCombobox } from "@/components/employee-onboarding/DesignationCombobox";
import { Button } from "@/components/ui/button";
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
import type { BandListItem, DepartmentListItem } from "@/types/masters";
import type { KpiDefinitionItem, KpiDefinitionWritePayload } from "@/types/kpi";
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
  designation: string;
  kpiName: string;
  evaluationCriteria: string;
  weightage: string;
  active: boolean;
};

const EMPTY_FORM: FormState = {
  designation: "",
  kpiName: "",
  evaluationCriteria: "",
  weightage: "20",
  active: true,
};

function weightageError(raw: string): string | null {
  const n = Number(raw);
  if (raw.trim() === "" || Number.isNaN(n)) return "Enter a weightage.";
  if (n < 5 || n > 100) return "Weightage must be between 5 and 100.";
  return null;
}

export function KpiDefinitionsPanel() {
  const [bands, setBands] = useState<BandListItem[]>([]);
  const [departments, setDepartments] = useState<DepartmentListItem[]>([]);
  const [bandId, setBandId] = useState("");
  const [department, setDepartment] = useState("");

  const [dialog, setDialog] = useState<{ mode: "add" | "edit"; row?: KpiDefinitionItem } | null>(
    null
  );
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<KpiDefinitionItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Bands / departments load once — used for the filter and locked into the
  // add/edit form once a band + department are picked.
  useEffect(() => {
    void (async () => {
      try {
        const [bandsRes, deptRes] = await Promise.all([
          hrmsService.getBands(),
          hrmsService.getDepartments(),
        ]);
        setBands(bandsRes.data ?? []);
        setDepartments(deptRes.data ?? []);
      } catch {
        notifyError("Couldn't load bands and departments.");
      }
    })();
  }, []);

  // Bump to re-run the fetch below (retry button, after a create/update/delete).
  const [reloadTick, setReloadTick] = useState(0);
  const refresh = useCallback(() => setReloadTick((t) => t + 1), []);

  const canManage = Boolean(bandId && department);
  const kpis = useLoad<KpiDefinitionItem[]>(
    () =>
      canManage
        ? hrmsService
            .getKpiDefinitions({ bandId: Number(bandId), department })
            .then((res) => (Array.isArray(res.data) ? res.data : []))
        : Promise.resolve([]),
    [bandId, department, canManage, reloadTick]
  );
  const rows = kpis.data ?? [];
  const status = canManage ? kpis.status : "idle";

  useEffect(() => {
    if (canManage && status === "error") notifyError("Couldn't load KPI definitions.");
  }, [canManage, status]);

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setFormError(null);
    setDialog({ mode: "add" });
  };

  const openEdit = (row: KpiDefinitionItem) => {
    setForm({
      designation: row.designation,
      kpiName: row.kpi_name,
      evaluationCriteria: row.evaluation_criteria ?? "",
      weightage: String(row.weightage),
      active: row.active,
    });
    setFormError(null);
    setDialog({ mode: "edit", row });
  };

  const submit = async () => {
    if (!bandId || !department) return;
    if (!form.designation.trim()) {
      setFormError("Pick or add a designation.");
      return;
    }
    if (!form.kpiName.trim()) {
      setFormError("KPI name is required.");
      return;
    }
    const wErr = weightageError(form.weightage);
    if (wErr) {
      setFormError(wErr);
      return;
    }
    setFormError(null);
    setSaving(true);
    const payload: KpiDefinitionWritePayload = {
      band_id: Number(bandId),
      department,
      designation: form.designation.trim(),
      kpi_name: form.kpiName.trim(),
      evaluation_criteria: form.evaluationCriteria.trim() || null,
      weightage: Number(form.weightage),
      active: form.active,
    };
    try {
      if (dialog?.mode === "edit" && dialog.row) {
        await hrmsService.updateKpiDefinition(dialog.row.id, payload);
        notifySuccess("KPI updated.");
      } else {
        await hrmsService.createKpiDefinition(payload);
        notifySuccess("KPI added.");
      }
      setDialog(null);
      refresh();
    } catch (error) {
      const message = toUserFriendlyApiErrorMessage(
        error,
        error instanceof ApiError ? error.message : "Couldn't save the KPI."
      );
      setFormError(message);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await hrmsService.deleteKpiDefinition(deleteTarget.id);
      notifySuccess("KPI deleted.");
      setDeleteTarget(null);
      refresh();
    } catch (error) {
      notifyError(
        toUserFriendlyApiErrorMessage(
          error,
          error instanceof ApiError ? error.message : "Couldn't delete the KPI."
        )
      );
    } finally {
      setDeleting(false);
    }
  };

  const bandOptions = bands
    .filter((b) => b.name)
    .map((b) => ({ value: String(b.id), label: b.name as string }));
  const departmentOptions = departments.map((d) => ({ value: d.name, label: d.name }));

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-xl border border-wt-border bg-wt-surface-2/50 p-4 sm:flex-row sm:items-end sm:justify-between dark:bg-wt-surface-2">
        <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2 sm:max-w-md">
          <SelectField
            label="Band"
            value={bandId}
            onChange={setBandId}
            options={bandOptions}
            placeholder="Select band"
          />
          <SelectField
            label="Department"
            value={department}
            onChange={setDepartment}
            options={departmentOptions}
            placeholder="Select department"
          />
        </div>
        <Button type="button" onClick={openAdd} disabled={!canManage} className="shrink-0">
          <Plus className="mr-1.5 size-4" /> Add KPI
        </Button>
      </div>

      {!canManage ? (
        <EmptyState
          title="Pick a Band and Department"
          description="Choose both to see and manage the KPIs defined for every designation in that combination."
          className="py-12"
        />
      ) : status === "loading" ? (
        <SectionLoading label="" />
      ) : status === "error" ? (
        <EmptyState
          title="Couldn't Load KPIs"
          className="py-12"
          action={
            <Button type="button" variant="outline" size="sm" onClick={refresh}>
              Try again
            </Button>
          }
        />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No KPIs Yet"
          description="Add the first KPI for this band and department."
          className="py-12"
        />
      ) : (
        <ScrollableTable maxHeightClass="max-h-[min(60vh,520px)]">
          <WtTable>
            <TableHeader className={WT_STICKY_TABLE_HEAD_CLASS}>
              <TableRow className="hover:bg-transparent">
                <TableHead>Designation</TableHead>
                <TableHead>KPI</TableHead>
                <TableHead>Evaluation Criteria</TableHead>
                <TableHead>Weightage</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="whitespace-nowrap font-medium text-wt-text">
                    {row.designation}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{row.kpi_name}</TableCell>
                  <TableCell className="max-w-xs truncate text-wt-text-muted">
                    {row.evaluation_criteria || "—"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap tabular-nums">
                    {Number(row.weightage)}%
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <span
                      className={
                        row.active
                          ? "rounded-md bg-emerald-500/12 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400"
                          : "rounded-md bg-wt-surface-3 px-1.5 py-0.5 text-[11px] font-medium text-wt-text-muted"
                      }
                    >
                      {row.active ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openEdit(row)}
                        aria-label={`Edit ${row.kpi_name}`}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setDeleteTarget(row)}
                        aria-label={`Delete ${row.kpi_name}`}
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
                {dialog.mode === "add" ? "Add KPI" : "Edit KPI"}
              </h2>
              <p className="mt-1 text-xs text-wt-text-muted">
                {bandOptions.find((b) => b.value === bandId)?.label ?? bandId} · {department}
              </p>
            </div>
            <div className={MODAL_BODY_CLASS}>
              <div className="space-y-4">
                <DesignationCombobox
                  bandId={Number(bandId)}
                  department={department}
                  value={form.designation}
                  onChange={(v) => setForm((f) => ({ ...f, designation: v }))}
                  canCreate
                  required
                />
                <InputField
                  label="KPI Name"
                  value={form.kpiName}
                  onChange={(v) => setForm((f) => ({ ...f, kpiName: v }))}
                  required
                  placeholder="e.g. Code Quality"
                />
                <TextAreaField
                  label="Evaluation Criteria"
                  value={form.evaluationCriteria}
                  onChange={(v) => setForm((f) => ({ ...f, evaluationCriteria: v }))}
                  placeholder="What meeting this KPI looks like, or which roles it applies to (optional)"
                  rows={3}
                />
                <InputField
                  label="Weightage (%)"
                  value={form.weightage}
                  onChange={(v) => setForm((f) => ({ ...f, weightage: v }))}
                  type="number"
                  required
                  description="Between 5 and 100."
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
                {saving ? "Saving…" : dialog.mode === "add" ? "Add KPI" : "Save changes"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete this KPI?"
        description={
          deleteTarget
            ? `"${deleteTarget.kpi_name}" for ${deleteTarget.designation} will be removed. This can't be undone.`
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
