import { UTILIZATION_COPY as COPY, UTILIZATION_LEVEL_STYLE as STYLE } from "@/constants/utilizationHeatmap";
import { cn } from "@/lib/utils";

interface Counts {
  over: number;
  full: number;
  partial: number;
  bench: number;
}

const TILES = [
  { key: "over", label: COPY.summaryOver, hint: COPY.summaryOverHint, accent: "border-rose-500/40" },
  { key: "full", label: COPY.summaryFull, hint: COPY.summaryFullHint, accent: "border-emerald-500/40" },
  { key: "partial", label: COPY.summaryPartial, hint: COPY.summaryPartialHint, accent: "border-amber-400/50" },
  { key: "bench", label: COPY.summaryBench, hint: COPY.summaryBenchHint, accent: "border-slate-400/40" },
] as const;

/** Four headline counts for the focus week, each in the colour it has on the grid. */
export function UtilizationSummary({ counts, weekLabel }: { counts: Counts; weekLabel: string }) {
  return (
    <section aria-label={COPY.focusWeek(weekLabel)}>
      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-wt-text-muted">{COPY.focusWeek(weekLabel)}</p>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {TILES.map((t) => (
          <div key={t.key} className={cn("rounded-2xl border bg-wt-surface-1 p-3.5 shadow-[var(--wt-shadow-sm)]", t.accent)}>
            <p className="flex items-center gap-2 text-xs font-medium text-wt-text-muted">
              <span className={cn("size-2.5 rounded-full", STYLE[t.key].dot)} aria-hidden />
              {t.label}
            </p>
            <p className="mt-1.5 text-3xl font-semibold tabular-nums text-wt-text">{counts[t.key]}</p>
            <p className="text-xs text-wt-text-faint">{t.hint}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
