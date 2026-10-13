"use client";

import { ChevronLeft, ChevronRight, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownSelect } from "@/components/dashboard/ui/DropdownSelect";
import { UTILIZATION_COPY as COPY, UTILIZATION_WEEK_OPTIONS, type UtilizationMetric } from "@/constants/utilizationHeatmap";
import { cn } from "@/lib/utils";

/** Stands for "no department filter" (an empty value would show the placeholder instead of a label). */
const ALL_DEPARTMENTS = "__all__";

const METRICS: ReadonlyArray<{ id: UtilizationMetric; label: string; hint: string }> = [
  { id: "planned", label: COPY.planned, hint: COPY.plannedHint },
  { id: "actual", label: COPY.actual, hint: COPY.actualHint },
];

interface Props {
  metric: UtilizationMetric;
  onMetric: (m: UtilizationMetric) => void;
  departments: readonly string[];
  department: string;
  onDepartment: (d: string) => void;
  search: string;
  onSearch: (s: string) => void;
  weeks: number;
  onWeeks: (n: number) => void;
  onShift: (delta: number) => void;
  onReset: () => void;
  shifted: boolean;
}

/** Everything that changes what the heatmap shows: planned vs actual, department, search, range, and moving through time. */
export function UtilizationFilters(p: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <div className="inline-flex rounded-xl border border-wt-border bg-wt-surface-1 p-0.5" role="group" aria-label="Measure">
        {METRICS.map((m) => (
          <button
            key={m.id}
            type="button"
            aria-pressed={p.metric === m.id}
            title={m.hint}
            onClick={() => p.onMetric(m.id)}
            className={cn(
              "h-9 rounded-[10px] px-3.5 text-sm font-medium transition-colors",
              p.metric === m.id ? "bg-[var(--wt-brand-soft)] text-[var(--wt-brand)]" : "text-wt-text-muted hover:text-wt-text"
            )}
          >
            {m.label}
          </button>
        ))}
      </div>
      <DropdownSelect
        id="utilization-department"
        aria-label="Department"
        value={p.department || ALL_DEPARTMENTS}
        onChange={(v) => p.onDepartment(v === ALL_DEPARTMENTS ? "" : v)}
        options={[{ value: ALL_DEPARTMENTS, label: COPY.allDepartments }, ...p.departments.map((d) => ({ value: d, label: d }))]}
        className="w-52"
        clearSelectionOnEmptyInput={false}
      />
      <DropdownSelect
        id="utilization-weeks"
        aria-label="Range"
        value={String(p.weeks)}
        onChange={(v) => {
          const n = Number(v);
          if (Number.isFinite(n) && n > 0) p.onWeeks(n);
        }}
        options={UTILIZATION_WEEK_OPTIONS.map((n) => ({ value: String(n), label: COPY.weeksLabel(n) }))}
        className="w-36"
        clearSelectionOnEmptyInput={false}
      />
      <div className="relative min-w-[11rem] flex-1 sm:max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-wt-text-faint" aria-hidden />
        <Input value={p.search} onChange={(e) => p.onSearch(e.target.value)} placeholder={COPY.searchPlaceholder} className="h-10 pl-9" aria-label="Search" />
      </div>
      <div className="ml-auto flex items-center gap-1">
        <Button variant="outline" size="icon-sm" onClick={() => p.onShift(-p.weeks)} aria-label={COPY.earlier}>
          <ChevronLeft className="size-4" />
        </Button>
        <Button variant="outline" size="icon-sm" onClick={() => p.onShift(p.weeks)} aria-label={COPY.later}>
          <ChevronRight className="size-4" />
        </Button>
        {p.shifted ? (
          <Button variant="ghost" size="sm" onClick={p.onReset}>
            {COPY.thisWeek}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
