"use client";

import { InputField } from "@/components/dashboard/ui/forms";

/** The full name when the segment is wide, a short one when it is narrow, and just the number when tiny. */
function segmentLabel(full: string, short: string, percent: number, shown: string): string {
  if (percent >= 28) return `${full} ${shown}%`;
  if (percent >= 9) return `${short} ${shown}%`;
  return `${shown}%`;
}

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
        <div className="flex items-center justify-center overflow-hidden whitespace-nowrap bg-[var(--wt-brand)] px-1 text-white transition-all" style={{ width: `${kpiNum}%` }}>
          {segmentLabel("KPIs", "KPIs", kpiNum, kpi)}
        </div>
        <div className="flex flex-1 items-center justify-center overflow-hidden whitespace-nowrap bg-amber-400/90 px-1 text-amber-950">
          {segmentLabel("WebKnot values", "Values", 100 - kpiNum, values)}
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
