"use client";

import { Check } from "lucide-react";

import { REVIEW_STEPS, type ReviewProgress, type ReviewStepId } from "@/components/dashboard/pulse/employee/review/reviewModel";
import { cn } from "@/lib/utils";

/** The four steps with live completion — a vertical rail on desktop, a
 *  horizontal strip on small screens. Click any step to jump to it. */
export function StepRail({
  active,
  progress,
  onSelect,
}: {
  active: ReviewStepId;
  progress: ReviewProgress;
  onSelect: (step: ReviewStepId) => void;
}) {
  return (
    <nav aria-label="Review steps" className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
      {REVIEW_STEPS.map((step, i) => {
        const p = progress[step.id];
        const complete = p.total > 0 ? p.done >= p.total : true;
        const isActive = step.id === active;
        return (
          <button
            key={step.id}
            type="button"
            onClick={() => onSelect(step.id)}
            aria-current={isActive ? "step" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors lg:w-full",
              isActive
                ? "border-[var(--wt-brand)] bg-[var(--wt-brand-soft)]"
                : "border-wt-border bg-wt-surface-1 hover:border-[var(--wt-brand)]/40"
            )}
          >
            <span
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                complete ? "bg-emerald-500 text-white" : isActive ? "bg-[var(--wt-brand)] text-[var(--wt-brand-text)]" : "bg-wt-surface-3 text-wt-text-muted"
              )}
            >
              {complete ? <Check className="size-4" aria-hidden /> : i + 1}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-wt-text">{step.title}</span>
              <span className="hidden truncate text-xs text-wt-text-muted lg:block">
                {p.total > 1 ? `${p.done}/${p.total} done` : step.hint}
              </span>
            </span>
          </button>
        );
      })}
    </nav>
  );
}
