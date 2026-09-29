"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Hash, Layers3, Pencil, Plus, Trash2, Upload } from "lucide-react";

import { EmptyState } from "@/components/dashboard/ui/EmptyState";
import { ListPagination } from "@/components/dashboard/ui/ListPagination";
import { SectionLoading } from "@/components/dashboard/ui/SectionLoading";
import { MetricCard } from "@/components/dashboard/ui/MetricCard";
import { SearchInput } from "@/components/dashboard/ui/SearchInput";
import { ToolbarFilterSelect } from "@/components/dashboard/ui/ToolbarFilterSelect";
import { SelectField, TextAreaField, InputField } from "@/components/dashboard/ui/forms";
import { DesignationCombobox } from "@/components/employee-onboarding/DesignationCombobox";
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
import { ModalPortal } from "@/components/dashboard/ui/ModalPortal";
import { ApiError } from "@/api/error";
import { hrmsService } from "@/services/hrms.service";
import { useClientPagination } from "@/hooks/useClientPagination";
import type { BandListItem, DepartmentListItem } from "@/types/masters";
import type { KpiDefinitionItem, KpiDefinitionWritePayload } from "@/types/kpi";
import { notifyError, notifySuccess } from "@/lib/notify";
import { toUserFriendlyApiErrorMessage } from "@/utils/userFriendlyApiError";
import { formatWeight, groupKpisByParameter, hasKpiParameters } from "@/utils/kpiParameters";

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
  bandId: string;
  department: string;
  designation: string;
  kpiName: string;
  parameter: string;
  evaluationCriteria: string;
  weightage: string;
  active: boolean;
};

function emptyForm(defaults: { bandId: string; department: string }): FormState {
  return {
    bandId: defaults.bandId,
    department: defaults.department,
    designation: "",
    kpiName: "",
    parameter: "",
    evaluationCriteria: "",
    weightage: "20",
    active: true,
  };
}

function weightageError(raw: string): string | null {
  const n = Number(raw);
  if (raw.trim() === "" || Number.isNaN(n)) return "Enter a weightage.";
  if (!(n > 0) || n > 100) return "Weightage must be greater than 0 and at most 100.";
  return null;
}

/** Groups KPIs by designation (the role a set of goals apply to) so weight
 *  overlap within a band + department can be caught at a glance. */
function normKey(value: string): string {
  const s = value.trim();
  return s ? s.toLowerCase() : "unassigned";
}

type WeightCombo = {
  key: string;
  designation: string;
  bandId: number;
  department: string;
  sum: number;
  count: number;
};

export function KpiDefinitionsPanel() {
  const [bands, setBands] = useState<BandListItem[]>([]);
  const [departments, setDepartments] = useState<DepartmentListItem[]>([]);

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

  const bandNameById = useMemo(() => {
    const map = new Map<number, string>();
    for (const b of bands) map.set(b.id, b.name?.trim() || `Band ${b.id}`);
    return map;
  }, [bands]);

  // Bump to re-run the fetch below (retry button, after a create/update/delete).
  const [reloadTick, setReloadTick] = useState(0);
  const refresh = useCallback(() => setReloadTick((t) => t + 1), []);

  // No band/department gate — every KPI loads once, grouped and filterable below.
  const kpis = useLoad<KpiDefinitionItem[]>(
    () => hrmsService.getKpiDefinitions({}).then((res) => (Array.isArray(res.data) ? res.data : [])),
    [reloadTick]
  );
  const allRows = useMemo(() => kpis.data ?? [], [kpis.data]);
  const status = kpis.status;

  useEffect(() => {
    if (status === "error") notifyError("Couldn't load KPI definitions.");
  }, [status]);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterBandId, setFilterBandId] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allRows.filter((row) => {
      if (filterBandId && String(row.band_id) !== filterBandId) return false;
      if (filterDepartment && row.department !== filterDepartment) return false;
      if (!q) return true;
      const bandLabel = bandNameById.get(row.band_id) ?? "";
      return (
        row.kpi_name.toLowerCase().includes(q) ||
        (row.parameter ?? "").toLowerCase().includes(q) ||
        (row.evaluation_criteria ?? "").toLowerCase().includes(q) ||
        row.designation.toLowerCase().includes(q) ||
        row.department.toLowerCase().includes(q) ||
        bandLabel.toLowerCase().includes(q)
      );
    });
  }, [allRows, searchQuery, filterBandId, filterDepartment, bandNameById]);

  // One group per designation *per band*: the same designation (e.g. Architect)
  // can carry a different KPI set in each band it spans. Keyed like weightReport.
  const grouped = useMemo(() => {
    const map = new Map<
      string,
      { key: string; label: string; bandId: number; department: string; goals: KpiDefinitionItem[] }
    >();
    for (const row of filtered) {
      const label = row.designation.trim() || "Unassigned";
      const key = `${normKey(label)}||${row.band_id}||${normKey(row.department)}`;
      if (!map.has(key)) map.set(key, { key, label, bandId: row.band_id, department: row.department, goals: [] });
      map.get(key)?.goals.push(row);
    }
    const bandLabel = (id: number) => bandNameById.get(id) ?? `Band ${id}`;
    return Array.from(map.values()).sort(
      (a, b) =>
        bandLabel(b.bandId).localeCompare(bandLabel(a.bandId)) ||
        a.department.localeCompare(b.department) ||
        a.label.localeCompare(b.label)
    );
  }, [filtered, bandNameById]);

  // A designation's KPIs for one band + department must not add up past 100% —
  // this is the check HR actually relies on before opening a submission window.
  const weightReport = useMemo(() => {
    const combos = new Map<string, WeightCombo>();
    for (const row of filtered) {
      const key = `${normKey(row.designation)}||${row.band_id}||${normKey(row.department)}`;
      const prev = combos.get(key) ?? {
        key,
        designation: row.designation.trim() || "Unassigned",
        bandId: row.band_id,
        department: row.department,
        sum: 0,
        count: 0,
      };
      prev.sum += Number(row.weightage) || 0;
      prev.count += 1;
      combos.set(key, prev);
    }
    const all = Array.from(combos.values()).map((c) => ({ ...c, sum: Math.round(c.sum * 10) / 10 }));
    return { overweight: all.filter((c) => c.sum > 100) };
  }, [filtered]);

  // Paged by KPI set (one designation in one band + department, ~20-25 KPIs
  // each) so a set is never split across pages.
  const groupPages = useClientPagination(grouped, {
    pageSize: 5,
    pageSizeOptions: [5, 10, 25],
    resetKeys: [searchQuery, filterBandId, filterDepartment],
  });

  const bandOptions = bands
    .filter((b) => b.name)
    .map((b) => ({ value: String(b.id), label: b.name as string }));
  const departmentOptions = departments.map((d) => ({ value: d.name, label: d.name }));

  const [dialog, setDialog] = useState<{ mode: "add" | "edit"; row?: KpiDefinitionItem } | null>(
    null
  );
  const [form, setForm] = useState<FormState>(emptyForm({ bandId: "", department: "" }));
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<KpiDefinitionItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const importInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  const handleImport = async (file: File) => {
    setImporting(true);
    try {
      const res = await hrmsService.importKpiDefinitionsCsv(file);
      notifySuccess(res.message ?? "KPI definitions imported.");
      refresh();
    } catch (error) {
      notifyError(
        toUserFriendlyApiErrorMessage(
          error,
          error instanceof ApiError ? error.message : "Couldn't import the CSV."
        )
      );
    } finally {
      setImporting(false);
    }
  };

  const openAdd = () => {
    setForm(emptyForm({ bandId: filterBandId, department: filterDepartment }));
    setFormError(null);
    setDialog({ mode: "add" });
  };

  const openEdit = (row: KpiDefinitionItem) => {
    setForm({
      bandId: String(row.band_id),
      department: row.department,
      designation: row.designation,
      kpiName: row.kpi_name,
      parameter: row.parameter ?? "",
      evaluationCriteria: row.evaluation_criteria ?? "",
      weightage: String(row.weightage),
      active: row.active,
    });
    setFormError(null);
    setDialog({ mode: "edit", row });
  };

  const submit = async () => {
    if (!form.bandId) {
      setFormError("Pick a band.");
      return;
    }
    if (!form.department) {
      setFormError("Pick a department.");
      return;
    }
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
      band_id: Number(form.bandId),
      department: form.department,
      designation: form.designation.trim(),
      kpi_name: form.kpiName.trim(),
      parameter: form.parameter.trim() || null,
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

  const formBandId = form.bandId ? Number(form.bandId) : 0;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MetricCard label="Total KPIs" value={filtered.length} loading={status === "loading"} icon={Hash} />
        <MetricCard
          label="Designations"
          value={grouped.length}
          loading={status === "loading"}
          icon={Layers3}
        />
        <MetricCard
          label="Overweight combos"
          value={weightReport.overweight.length}
          loading={status === "loading"}
          icon={AlertTriangle}
        />
      </div>

      {weightReport.overweight.length > 0 ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-destructive">
            <AlertTriangle className="size-4" /> Weightage exceeds 100%
          </div>
          <p className="mt-1 text-xs text-wt-text-muted">
            A designation&apos;s KPIs for one band + department shouldn&apos;t add up past 100%.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {weightReport.overweight.map((c) => (
              <span
                key={c.key}
                className="rounded-md border border-destructive/30 bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive"
              >
                {c.designation} · {bandNameById.get(c.bandId) ?? `Band ${c.bandId}`} · {c.department} —{" "}
                {c.sum}%
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 rounded-xl border border-wt-border bg-wt-surface-2/50 p-4 sm:flex-row sm:items-center sm:justify-between dark:bg-wt-surface-2">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search KPI, designation, department…"
            className="sm:max-w-xs"
            aria-label="Search KPIs"
          />
          <div className="flex flex-wrap gap-2">
            <ToolbarFilterSelect
              value={filterBandId}
              onChange={setFilterBandId}
              options={bandOptions}
              placeholder="All bands"
              aria-label="Filter by band"
              compact
            />
            <ToolbarFilterSelect
              value={filterDepartment}
              onChange={setFilterDepartment}
              options={departmentOptions}
              placeholder="All departments"
              aria-label="Filter by department"
              compact
            />
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <input
            ref={importInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (!file) return;
              void handleImport(file);
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => importInputRef.current?.click()}
            disabled={importing}
          >
            <Upload className="mr-1.5 size-4" /> {importing ? "Importing…" : "Import CSV"}
          </Button>
          <Button type="button" onClick={openAdd}>
            <Plus className="mr-1.5 size-4" /> Add KPI
          </Button>
        </div>
      </div>

      {status === "loading" ? (
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
      ) : grouped.length === 0 ? (
        <EmptyState
          title="No KPIs Yet"
          description="Add the first KPI to get started."
          className="py-12"
        />
      ) : (
        <div className="space-y-4">
          {groupPages.pageItems.map((group) => {
            const groupOverweight = weightReport.overweight.some((c) => c.key === group.key);
            const groupTotal = group.goals.reduce((sum, row) => sum + (Number(row.weightage) || 0), 0);
            const showParameters = hasKpiParameters(group.goals);
            return (
              <div key={group.key} className="overflow-hidden rounded-xl border border-wt-border">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-wt-border bg-wt-surface-2/50 px-4 py-3">
                  <div>
                    <h3 className="text-sm font-semibold text-wt-text">
                      {group.label}
                      <span className="ml-2 font-normal text-wt-text-muted">
                        {bandNameById.get(group.bandId) ?? `Band ${group.bandId}`} · {group.department}
                      </span>
                    </h3>
                    <p className="mt-0.5 text-xs text-wt-text-muted">
                      {group.goals.length} KPI{group.goals.length === 1 ? "" : "s"} · total {formatWeight(groupTotal)}
                    </p>
                  </div>
                  {groupOverweight ? <Badge variant="destructive">Over 100%</Badge> : null}
                </div>
                {groupKpisByParameter(group.goals).map((param) => (
                  <div key={param.parameter ?? "_none"} className="border-b border-wt-border last:border-b-0">
                    {showParameters ? (
                      <div className="flex items-baseline justify-between gap-3 border-b border-wt-border bg-wt-surface-2/30 px-4 py-2">
                        <span className="text-xs font-semibold tracking-wide text-wt-text-muted uppercase">
                          {param.parameter ?? "No parameter"}
                        </span>
                        <span className="font-mono text-xs font-semibold text-wt-text">
                          {formatWeight(param.weight)}
                        </span>
                      </div>
                    ) : null}
                    <ul className="divide-y divide-wt-border">
                      {param.items.map((row) => (
                          <li
                            key={row.id}
                            className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                          >
                            <div className="min-w-0">
                              <p className="font-medium text-wt-text">{row.kpi_name}</p>
                              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                <span className="text-xs text-wt-text-muted">
                                  Weight ·{" "}
                                  <span className="font-mono font-semibold text-wt-text">
                                    {formatWeight(row.weightage)}
                                  </span>
                                </span>
                                {!row.active ? <Badge variant="secondary">Inactive</Badge> : null}
                              </div>
                              {row.evaluation_criteria ? (
                                <p className="mt-1 max-w-xl truncate text-xs text-wt-text-faint">
                                  {row.evaluation_criteria}
                                </p>
                              ) : null}
                            </div>
                            <div className="flex shrink-0 gap-1">
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
                          </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            );
          })}
          <ListPagination
            page={groupPages.page}
            totalPages={groupPages.totalPages}
            totalItems={groupPages.totalItems}
            rangeStart={groupPages.rangeStart}
            rangeEnd={groupPages.rangeEnd}
            pageSize={groupPages.pageSize}
            pageSizeOptions={groupPages.pageSizeOptions}
            onPageChange={groupPages.setPage}
            onPageSizeChange={groupPages.setPageSize}
          />
        </div>
      )}

      {dialog ? (
        <ModalPortal onEscape={saving ? undefined : () => setDialog(null)}>
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
              </div>
              <div className={MODAL_BODY_CLASS}>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <SelectField
                      label="Band"
                      value={form.bandId}
                      onChange={(v) => setForm((f) => ({ ...f, bandId: v, designation: "" }))}
                      options={bandOptions}
                      placeholder="Select band"
                      required
                    />
                    <SelectField
                      label="Department"
                      value={form.department}
                      onChange={(v) => setForm((f) => ({ ...f, department: v, designation: "" }))}
                      options={departmentOptions}
                      placeholder="Select department"
                      required
                    />
                  </div>
                  <DesignationCombobox
                    bandId={formBandId}
                    department={form.department}
                    value={form.designation}
                    onChange={(v) => setForm((f) => ({ ...f, designation: v }))}
                    disabled={!formBandId || !form.department}
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
                  <InputField
                    label="Parameter"
                    value={form.parameter}
                    onChange={(v) => setForm((f) => ({ ...f, parameter: v }))}
                    placeholder="e.g. Technical Excellence"
                    description="The group this KPI rolls up to. A parameter's weight is the sum of its KPIs' weights."
                  />
                  <TextAreaField
                    label="Evaluation Criteria"
                    value={form.evaluationCriteria}
                    onChange={(v) => setForm((f) => ({ ...f, evaluationCriteria: v }))}
                    placeholder="What meeting this KPI looks like (optional)"
                    rows={3}
                  />
                  <InputField
                    label="Weightage (%)"
                    value={form.weightage}
                    onChange={(v) => setForm((f) => ({ ...f, weightage: v }))}
                    type="number"
                    required
                    description="This KPI's share of the total: greater than 0, up to 100."
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
        </ModalPortal>
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
