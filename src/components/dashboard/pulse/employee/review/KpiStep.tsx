"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";

import { EmptyState } from "@/components/dashboard/ui/EmptyState";
import { ExplainedRatingRow, explainedRowDomId } from "@/components/dashboard/pulse/ExplainedRatingRow";
import type { ReviewContext } from "@/components/dashboard/pulse/employee/review/reviewModel";
import type { ReviewFormApi } from "@/components/dashboard/pulse/employee/review/useReviewForm";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatWeight, groupKpisByParameter, hasKpiParameters } from "@/utils/kpiParameters";
import type { KpiDefinitionItem } from "@/types/kpi";

/** Without parameters a long KPI list is paged in sets of this size. */
const FLAT_PAGE_SIZE = 5;
const OTHER_GROUP = "Other";

type KpiGroup = { key: string; title: string; weight: string | null; items: KpiDefinitionItem[] };

function buildGroups(rows: KpiDefinitionItem[]): KpiGroup[] {
  if (hasKpiParameters(rows)) {
    return groupKpisByParameter(rows).map((g) => ({
      key: g.parameter ?? "_none",
      title: g.parameter ?? OTHER_GROUP,
      weight: formatWeight(g.weight),
      items: g.items,
    }));
  }
  const pages: KpiGroup[] = [];
  for (let i = 0; i < rows.length; i += FLAT_PAGE_SIZE) {
    pages.push({ key: `page-${i}`, title: `KPIs ${i + 1}–${Math.min(rows.length, i + FLAT_PAGE_SIZE)}`, weight: null, items: rows.slice(i, i + FLAT_PAGE_SIZE) });
  }
  return pages;
}

/** Step 2 — one KPI group at a time (so nothing needs a long scroll): tabs
 *  show each group's progress, rows rate inline, "Next group" keeps flow. */
export function KpiStep({ api, ctx }: { api: ReviewFormApi; ctx: ReviewContext }) {
  const groups = buildGroups(ctx.kpiRows);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const entryOf = (id: number) => api.form.kpi_ratings.find((r) => r.kpi_id === id);
  // A KPI counts once it has both a level and a reason.
  const isDone = (id: number) => {
    const entry = entryOf(id);
    return Boolean(entry && entry.rating >= 1 && entry.comment.trim());
  };

  if (groups.length === 0) {
    return <EmptyState title="No KPIs defined yet" description="HR hasn't defined KPIs for your band and department yet." />;
  }

  const index = Math.max(0, groups.findIndex((g) => g.key === activeKey));
  const group = groups[index];
  const doneIn = (g: KpiGroup) => g.items.filter((k) => isDone(k.id)).length;
  const next = groups[index + 1];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="KPI groups">
        {groups.map((g) => {
          const done = doneIn(g);
          const complete = done === g.items.length;
          return (
            <button
              key={g.key}
              type="button"
              role="tab"
              aria-selected={g.key === group.key}
              onClick={() => setActiveKey(g.key)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
                g.key === group.key
                  ? "border-[var(--wt-brand)] bg-[var(--wt-brand)] text-white"
                  : "border-wt-border bg-wt-surface-1 text-wt-text-muted hover:border-[var(--wt-brand)]/40"
              )}
            >
              {complete ? <Check className="size-3.5" aria-hidden /> : null}
              {g.title}
              <span className={cn("tabular-nums", g.key === group.key ? "text-white/80" : "text-wt-text-faint")}>
                {done}/{g.items.length}
              </span>
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-wt-border bg-wt-surface-1">
        <header className="flex items-baseline justify-between gap-3 border-b border-wt-border px-4 py-3 sm:px-5">
          <h3 className="text-sm font-semibold text-wt-text">{group.title}</h3>
          {group.weight ? <span className="text-xs text-wt-text-muted">Weight {group.weight}</span> : null}
        </header>
        <div className="space-y-3 p-3 sm:p-4">
          {group.items.map((kpi) => {
            const entry = entryOf(kpi.id);
            return (
              <ExplainedRatingRow
                key={kpi.id}
                domId={explainedRowDomId("kpi", kpi.id)}
                title={kpi.kpi_name}
                detail={kpi.evaluation_criteria}
                meta={hasKpiParameters(ctx.kpiRows) ? null : `Weight ${formatWeight(kpi.weightage)}`}
                rating={entry?.rating ?? null}
                comment={entry?.comment ?? ""}
                onRating={(rating) => api.actions.setKpi(kpi.id, { rating })}
                onComment={(comment) => api.actions.setKpi(kpi.id, { comment })}
              />
            );
          })}
        </div>
        {next ? (
          <footer className="flex justify-end border-t border-wt-border px-4 py-3 sm:px-5">
            <Button type="button" variant="outline" size="sm" onClick={() => setActiveKey(next.key)}>
              Next: {next.title} <ArrowRight className="size-3.5" />
            </Button>
          </footer>
        ) : null}
      </div>
    </div>
  );
}
