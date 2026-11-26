import { ArrowRight } from "lucide-react";

import { NEXT_BAND_KPIS_COPY as COPY } from "@/constants/nextBandKpis";
import { cn } from "@/lib/utils";
import type { NextBandKpisData } from "@/types/nextBandKpis";

function orNotSet(value: string | null | undefined): string {
  return value?.trim() || COPY.notSet;
}

function BandCard({ label, band, highlight = false }: { label: string; band: string; highlight?: boolean }) {
  return (
    <div
      className={cn(
        "min-w-0 flex-1 rounded-2xl border p-4 sm:p-5",
        highlight ? "border-[var(--wt-brand)]/25 bg-[var(--wt-brand-soft)]" : "border-wt-border bg-wt-surface-1"
      )}
    >
      <p className="text-xs font-medium text-wt-text-muted">{label}</p>
      <p className="mt-1.5 text-3xl font-bold tabular-nums tracking-tight text-wt-text">{band}</p>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-wt-text-muted">{label}</dt>
      <dd className="truncate text-sm font-medium text-wt-text">{value}</dd>
    </div>
  );
}

/** Current band → next band, with the department and designation that decide which KPIs apply. */
export function BandJourney({ data }: { data: NextBandKpisData }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <BandCard label={COPY.currentLabel} band={orNotSet(data.current_band)} />
        <ArrowRight aria-hidden className="size-5 shrink-0 self-center text-wt-text-muted max-sm:rotate-90" />
        <BandCard label={COPY.nextLabel} band={orNotSet(data.next_band)} highlight />
      </div>
      <dl className="grid grid-cols-1 gap-3 rounded-2xl border border-wt-border bg-wt-surface-1 p-4 sm:grid-cols-2 sm:p-5">
        <Fact label={COPY.departmentLabel} value={orNotSet(data.department)} />
        <Fact label={COPY.designationLabel} value={orNotSet(data.current_designation)} />
      </dl>
    </div>
  );
}
