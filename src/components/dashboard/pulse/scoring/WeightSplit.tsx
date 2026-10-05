"use client";

import { InputField } from "@/components/dashboard/ui/forms";

/** KPIs vs WebKnot values always add up to 100% — drag the handle or type
 *  either number and the other follows (default 90 / 10). */
export function WeightSplit({
  kpi,
  values,
  onChange,
  error,
}: {
  kpi: string;
  values: string;
  /** Receives the KPI weight; the values weight is 100 − it. */
  onChange: (kpiPercent: number, source: "kpi" | "values") => void;
  error?: string;
}) {
  const kpiNum = Math.min(100, Math.max(0, Number(kpi) || 0));
  return (
    <div className="space-y-4">
      <div className="flex h-12 overflow-hidden rounded-xl border border-wt-border text-sm font-semibold" aria-hidden>
        <div className="flex items-center justify-center bg-[var(--wt-brand)] text-white transition-all" style={{ width: `${kpiNum}%` }}>
          {kpiNum >= 12 ? `KPIs ${kpi}%` : null}
        </div>
        <div className="flex flex-1 items-center justify-center bg-amber-400/90 text-amber-950">
          {100 - kpiNum >= 12 ? `WebKnot values ${values}%` : null}
        </div>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={kpiNum}
        onChange={(e) => onChange(Number(e.target.value), "kpi")}
        aria-label="KPI weight"
        className="w-full accent-[var(--wt-brand)]"
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <InputField label="KPIs (%)" type="number" value={kpi} onChange={(v) => onChange(Number(v), "kpi")} />
        <InputField label="WebKnot values (%)" type="number" value={values} onChange={(v) => onChange(Number(v), "values")} error={error} />
      </div>
    </div>
  );
}
