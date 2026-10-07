"use client";

import { ALL, STATUS_ORDER, type MonthStats, type StatusFilter } from "@/components/dashboard/pulse/submissions/submissionsModel";
import { statusMeta } from "@/components/dashboard/pulse/shared/submissionStatus";
import { cn } from "@/lib/utils";

/** One chip per status that actually has submissions this month, each with its count. "All" is always first. */
export function StatusChips({ stats, value, onChange }: { stats: MonthStats; value: StatusFilter; onChange: (next: StatusFilter) => void }) {
  const chips: { key: StatusFilter; label: string; count: number }[] = [
    { key: ALL, label: "All", count: stats.total },
    ...STATUS_ORDER.filter((s) => (stats.byStatus[s] ?? 0) > 0).map((s) => ({ key: s as StatusFilter, label: statusMeta(s).label, count: stats.byStatus[s] })),
  ];
  return (
    <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Filter by status">
      {chips.map((chip) => {
        const active = chip.key === value;
        return (
          <button
            key={chip.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(chip.key)}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
              active
                ? "border-[var(--wt-brand)] bg-[var(--wt-brand)] text-[var(--wt-brand-text)]"
                : "border-wt-border bg-wt-surface-1 text-wt-text-muted hover:border-[var(--wt-brand)]/40 hover:text-wt-text"
            )}
          >
            {chip.label}
            <span className={cn("rounded-full px-1.5 text-[11px] tabular-nums", active ? "bg-white/20" : "bg-wt-surface-3 text-wt-text-muted")}>{chip.count}</span>
          </button>
        );
      })}
    </div>
  );
}
