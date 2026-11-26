import { Target } from "lucide-react";

import { NEXT_BAND_KPIS_COPY as COPY } from "@/constants/nextBandKpis";
import type { NextBandDesignationKpis } from "@/types/nextBandKpis";

/** One designation's KPIs in the next band. */
export function DesignationKpiCard({ group }: { group: NextBandDesignationKpis }) {
  return (
    <section className="rounded-2xl border border-wt-border bg-wt-surface-1">
      <header className="flex items-center justify-between gap-3 border-b border-wt-border/80 px-4 py-3 sm:px-5">
        <h4 className="min-w-0 truncate text-sm font-semibold text-wt-text">{group.designation}</h4>
        <span className="shrink-0 rounded-full bg-wt-surface-3 px-2.5 py-1 text-xs font-medium text-wt-text-muted">
          {COPY.kpiCount(group.kpis.length)}
        </span>
      </header>
      <ul className="divide-y divide-wt-border/70">
        {group.kpis.map((kpi) => (
          <li key={kpi.kpi_name} className="flex items-start gap-3 px-4 py-3 sm:px-5">
            <Target aria-hidden className="mt-0.5 size-4 shrink-0 text-[var(--wt-brand)]" />
            <span className="min-w-0 text-sm text-wt-text">{kpi.kpi_name}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
