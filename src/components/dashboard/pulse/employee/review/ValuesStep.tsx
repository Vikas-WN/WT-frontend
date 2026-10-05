"use client";

import { EmptyState } from "@/components/dashboard/ui/EmptyState";
import { ExplainedRatingRow, explainedRowDomId } from "@/components/dashboard/pulse/ExplainedRatingRow";
import type { ReviewContext } from "@/components/dashboard/pulse/employee/review/reviewModel";
import type { ReviewFormApi } from "@/components/dashboard/pulse/employee/review/useReviewForm";

/** Step 3 — Company values, two to a row: a level and a short real example
 *  each (the example is required). */
export function ValuesStep({ api, ctx }: { api: ReviewFormApi; ctx: ReviewContext }) {
  if (ctx.valueRows.length === 0) {
    return <EmptyState title="No company values yet" description="Nothing to rate here right now." />;
  }
  return (
    <div className="space-y-3">
      <p className="text-xs text-wt-text-muted">Rate yourself and say why with a real example for each value — both are required.</p>
      <div className="grid gap-3 lg:grid-cols-2">
        {ctx.valueRows.map((v) => {
          const entry = api.form.value_ratings.find((r) => r.value_id === v.id);
          return (
            <ExplainedRatingRow
              key={v.id}
              domId={explainedRowDomId("value", v.id)}
              title={v.title}
              detail={v.evaluation_criteria}
              rating={entry?.rating || null}
              comment={entry?.comment ?? ""}
              onRating={(rating) => api.actions.setValue(v.id, { rating })}
              onComment={(comment) => api.actions.setValue(v.id, { comment })}
            />
          );
        })}
      </div>
    </div>
  );
}
