"use client";

import { useCallback, useMemo, useState } from "react";
import { AlertTriangle, Check, Pencil } from "lucide-react";

import { WtFormDialog } from "@/components/allocation/WtFormDialog";
import { Checkbox } from "@/components/ui/checkbox";
import { hrmsService } from "@/services/hrms.service";
import { notifyError, notifySuccess } from "@/lib/notify";
import { toUserFriendlyApiErrorMessage } from "@/utils/userFriendlyApiError";
import { ApiError } from "@/api/error";
import { cn } from "@/lib/utils";
import { formatWeight } from "@/utils/kpiParameters";
import { BRAND_FOCUS_RING_CLASS } from "@/components/dashboard/ui/uiLayout";
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
import type { KpiDefinitionItem, KpiDefinitionWritePayload } from "@/types/kpi";

type Row = {
  id: number;
  kpiName: string;
  parameter: string;
  weightage: string;
  active: boolean;
};

const CELL_INPUT = cn(
  BRAND_FOCUS_RING_CLASS,
  "w-full rounded-lg border border-wt-border bg-wt-surface-1 px-2 py-1.5 text-sm text-wt-text placeholder:text-wt-text-faint dark:border-wt-border-md dark:bg-wt-surface-2"
);

function toRow(k: KpiDefinitionItem): Row {
  return {
    id: k.id,
    kpiName: k.kpi_name,
    parameter: k.parameter ?? "",
    weightage: String(Number(k.weightage)),
    active: k.active,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Edit a whole KPI set (one designation in one band + department) at once:
 *  rename the designation, rename or reassign parameters, and change every
 *  KPI's name, weight and active flag, with live parameter and set totals.
 *  Only rows that actually changed are saved. */
export function KpiSetEditorDialog({
  open,
  title,
  designation,
  goals,
  onClose,
  onSaved,
}: {
  open: boolean;
  title: string;
  designation: string;
  goals: KpiDefinitionItem[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const initial = useMemo(() => goals.map(toRow), [goals]);
  const [rows, setRows] = useState<Row[]>(initial);
  const [setDesignation, setSetDesignation] = useState(designation);
  const [renaming, setRenaming] = useState<{ from: string; to: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const patch = (id: number, change: Partial<Row>) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...change } : r)));

  // Only active KPIs count toward the weights employees are scored against.
  const parameters = useMemo(() => {
    const byKey = new Map<string, { name: string; weight: number; count: number }>();
    for (const r of rows) {
      const name = r.parameter.trim();
      const key = name.toLowerCase();
      const entry = byKey.get(key) ?? { name, weight: 0, count: 0 };
      if (r.active) entry.weight += Number(r.weightage) || 0;
      entry.count += 1;
      byKey.set(key, entry);
    }
    return Array.from(byKey.values()).map((p) => ({ ...p, weight: round2(p.weight) }));
  }, [rows]);
  const total = round2(parameters.reduce((sum, p) => sum + p.weight, 0));

  const applyRename = () => {
    if (!renaming) return;
    const to = renaming.to.trim();
    setRows((prev) =>
      prev.map((r) =>
        r.parameter.trim().toLowerCase() === renaming.from.toLowerCase() ? { ...r, parameter: to } : r
      )
    );
    setRenaming(null);
  };

  const validate = (): string | null => {
    if (!setDesignation.trim()) return "Designation can't be empty.";
    const names = new Set<string>();
    for (const r of rows) {
      const name = r.kpiName.trim();
      if (!name) return "Every KPI needs a name.";
      const key = name.toLowerCase();
      if (names.has(key)) return `Two KPIs are named "${name}". Names must be unique within a set.`;
      names.add(key);
      const w = Number(r.weightage);
      if (r.weightage.trim() === "" || Number.isNaN(w) || !(w > 0) || w > 100)
        return `Weight for "${name}" must be greater than 0 and at most 100.`;
    }
    return null;
  };

  const save = useCallback(async () => {
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    const designationChanged = setDesignation.trim() !== designation.trim();
    const changes: { id: number; name: string; payload: Partial<KpiDefinitionWritePayload> }[] = [];
    for (const r of rows) {
      const before = initial.find((i) => i.id === r.id);
      if (!before) continue;
      const payload: Partial<KpiDefinitionWritePayload> = {};
      if (r.kpiName.trim() !== before.kpiName.trim()) payload.kpi_name = r.kpiName.trim();
      // "" clears the parameter on the server.
      if (r.parameter.trim() !== before.parameter.trim()) payload.parameter = r.parameter.trim();
      if (Number(r.weightage) !== Number(before.weightage)) payload.weightage = Number(r.weightage);
      if (r.active !== before.active) payload.active = r.active;
      if (designationChanged) payload.designation = setDesignation.trim();
      if (Object.keys(payload).length) changes.push({ id: r.id, name: r.kpiName.trim(), payload });
    }
    if (changes.length === 0) {
      setError("Nothing has changed yet.");
      return;
    }
    setError(null);
    setSaving(true);
    // Sequential: each save is validated against the rows already saved
    // (e.g. duplicate-name checks), and a failure stops cleanly mid-way.
    let saved = 0;
    try {
      for (const change of changes) {
        await hrmsService.updateKpiDefinition(change.id, change.payload);
        saved += 1;
      }
      notifySuccess(`Saved ${saved} KPI${saved === 1 ? "" : "s"}.`);
      onSaved();
    } catch (err) {
      const message = toUserFriendlyApiErrorMessage(
        err,
        err instanceof ApiError ? err.message : "Couldn't save the changes."
      );
      const failed = changes[saved];
      setError(
        `${saved ? `Saved ${saved} of ${changes.length}. ` : ""}Stopped at "${failed?.name}": ${message}`
      );
      if (saved) notifyError(`Only ${saved} of ${changes.length} KPIs were saved.`);
    } finally {
      setSaving(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, setDesignation, designation, initial, onSaved]);

  const close = useCallback(() => {
    if (!saving) onClose();
  }, [saving, onClose]);

  return (
    <WtFormDialog
      open={open}
      title="Edit KPI Set"
      description={title}
      onClose={close}
      onSubmit={() => void save()}
      submitLabel="Save Changes"
      loading={saving}
      maxWidthClass="max-w-5xl"
    >
      <div className="space-y-5">
        <div>
          <label className="text-sm font-medium text-wt-text" htmlFor="kpi-set-designation">
            Designation
          </label>
          <input
            id="kpi-set-designation"
            value={setDesignation}
            onChange={(e) => setSetDesignation(e.target.value)}
            className={cn(CELL_INPUT, "mt-1.5 max-w-md")}
          />
          <p className="mt-1 text-xs text-wt-text-muted">Renaming applies to every KPI in this set.</p>
        </div>

        <div>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-sm font-semibold text-wt-text">Parameters</h3>
            <span
              className={cn(
                "flex items-center gap-1 text-xs font-semibold",
                total === 100 ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400"
              )}
            >
              {total === 100 ? <Check className="size-3.5" /> : <AlertTriangle className="size-3.5" />}
              Set total {formatWeight(total)}
              {total === 100 ? "" : " (should be 100%)"}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {parameters.map((p) => {
              const isRenaming = renaming?.from.toLowerCase() === p.name.toLowerCase();
              return (
                <div
                  key={p.name.toLowerCase() || "_none"}
                  className="flex items-center gap-2 rounded-lg border border-wt-border bg-wt-surface-2/40 px-2.5 py-1.5 text-xs"
                >
                  {isRenaming ? (
                    <input
                      autoFocus
                      value={renaming.to}
                      onChange={(e) => setRenaming({ from: renaming.from, to: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          applyRename();
                        }
                        if (e.key === "Escape") {
                          e.stopPropagation();
                          setRenaming(null);
                        }
                      }}
                      onBlur={applyRename}
                      aria-label={`Rename parameter ${p.name || "(none)"}`}
                      className="w-44 rounded border border-wt-border bg-wt-surface-1 px-1.5 py-0.5 text-xs text-wt-text focus:outline-none focus:ring-2 focus:ring-wt-brand/40"
                    />
                  ) : (
                    <span className="font-medium text-wt-text">{p.name || "No parameter"}</span>
                  )}
                  <span className="font-mono text-wt-text-muted">{formatWeight(p.weight)}</span>
                  <span className="text-wt-text-faint">
                    {p.count} KPI{p.count === 1 ? "" : "s"}
                  </span>
                  {!isRenaming ? (
                    <button
                      type="button"
                      onClick={() => setRenaming({ from: p.name, to: p.name })}
                      aria-label={`Rename parameter ${p.name || "(none)"}`}
                      className="rounded p-0.5 text-wt-text-faint hover:text-wt-text"
                    >
                      <Pencil className="size-3" />
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        <datalist id="kpi-set-parameters">
          {parameters
            .filter((p) => p.name)
            .map((p) => (
              <option key={p.name} value={p.name} />
            ))}
        </datalist>

        <ScrollableTable maxHeightClass="max-h-[min(55vh,480px)]">
          <WtTable className="min-w-[640px]">
            <TableHeader className={WT_STICKY_TABLE_HEAD_CLASS}>
              <TableRow className="hover:bg-transparent">
                <TableHead>KPI</TableHead>
                <TableHead className="w-56">Parameter</TableHead>
                <TableHead className="w-28">Weight %</TableHead>
                <TableHead className="w-20 text-center">Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => {
                const before = initial.find((i) => i.id === r.id);
                const dirty =
                  before &&
                  (r.kpiName !== before.kpiName ||
                    r.parameter !== before.parameter ||
                    Number(r.weightage) !== Number(before.weightage) ||
                    r.active !== before.active);
                return (
                  <TableRow
                    key={r.id}
                    className={cn(dirty && "bg-wt-brand-soft/40", !r.active && "opacity-70")}
                  >
                    <TableCell className="whitespace-normal py-1.5">
                      <input
                        value={r.kpiName}
                        onChange={(e) => patch(r.id, { kpiName: e.target.value })}
                        aria-label="KPI name"
                        className={CELL_INPUT}
                      />
                    </TableCell>
                    <TableCell className="whitespace-normal py-1.5">
                      <input
                        value={r.parameter}
                        onChange={(e) => patch(r.id, { parameter: e.target.value })}
                        list="kpi-set-parameters"
                        placeholder="None"
                        aria-label={`Parameter for ${r.kpiName}`}
                        className={CELL_INPUT}
                      />
                    </TableCell>
                    <TableCell className="whitespace-normal py-1.5">
                      <input
                        type="number"
                        min={0.01}
                        max={100}
                        step={0.01}
                        value={r.weightage}
                        onChange={(e) => patch(r.id, { weightage: e.target.value })}
                        aria-label={`Weight for ${r.kpiName}`}
                        className={cn(CELL_INPUT, "font-mono")}
                      />
                    </TableCell>
                    <TableCell className="py-1.5 text-center">
                      <Checkbox
                        checked={r.active}
                        onCheckedChange={(v) => patch(r.id, { active: Boolean(v) })}
                        aria-label={`${r.kpiName} active`}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </WtTable>
        </ScrollableTable>
        <p className="text-xs text-wt-text-muted">
          Inactive KPIs aren&apos;t rated and don&apos;t count toward the totals. Use the single-KPI editor for
          evaluation criteria, band or department.
        </p>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </WtFormDialog>
  );
}
