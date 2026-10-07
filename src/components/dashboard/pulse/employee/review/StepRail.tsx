"use client";

import { Check } from "lucide-react";

import { REVIEW_STEPS, type ReviewProgress, type ReviewStepId } from "@/components/dashboard/pulse/employee/review/reviewModel";
import { cn } from "@/lib/utils";

/** The four steps with live completion — a connected vertical stepper on desktop, a horizontal strip on small
 *  screens. Click any step to jump to it. */
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
    <nav aria-label="Review steps" className="max-w-full rounded-2xl border border-wt-border bg-wt-surface-1 p-2 lg:p-3">
      <ol className="flex max-w-full gap-1 overflow-x-auto lg:flex-col lg:gap-0 lg:overflow-visible">
        {REVIEW_STEPS.map((step, i) => {
          const p = progress[step.id];
          const complete = p.total > 0 ? p.done >= p.total : true;
          const isActive = step.id === active;
          const last = i === REVIEW_STEPS.length - 1;
          const pct = p.total > 0 ? Math.round((p.done / p.total) * 100) : 100;
          return (
            <li key={step.id} className="relative shrink-0 lg:shrink">
              {!last ? (
                <span
                  aria-hidden
                  className={cn("absolute left-[1.45rem] top-10 hidden h-[calc(100%-1.6rem)] w-0.5 rounded-full lg:block", complete ? "bg-emerald-500/60" : "bg-wt-border-md")}
                />
              ) : null}
              <button
                type="button"
                onClick={() => onSelect(step.id)}
                aria-current={isActive ? "step" : undefined}
                className={cn(
                  "relative flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors lg:items-start",
                  isActive ? "bg-[var(--wt-brand-soft)]" : "hover:bg-wt-surface-2"
                )}
              >
                <span
                  className={cn(
                    "relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ring-4 ring-wt-surface-1 transition-colors",
                    complete ? "bg-emerald-500 text-white" : isActive ? "bg-[var(--wt-brand)] text-[var(--wt-brand-text)]" : "bg-wt-surface-3 text-wt-text-muted",
                    isActive && "ring-[var(--wt-brand-soft)]"
                  )}
                >
                  {complete ? <Check className="size-4" strokeWidth={3} aria-hidden /> : i + 1}
                </span>
                <span className="min-w-0 flex-1 pt-0.5">
                  <span className={cn("block truncate text-sm font-semibold", isActive ? "text-wt-text" : "text-wt-text")}>{step.title}</span>
                  <span className="hidden truncate text-xs text-wt-text-muted lg:block">{p.total > 1 ? `${p.done} of ${p.total} done` : step.hint}</span>
                  {p.total > 1 ? (
                    <span className="mt-1.5 hidden h-1 overflow-hidden rounded-full bg-wt-surface-3 lg:block" aria-hidden>
                      <span className={cn("block h-full rounded-full transition-[width] duration-500", complete ? "bg-emerald-500" : "bg-[var(--wt-brand)]")} style={{ width: `${pct}%` }} />
                    </span>
                  ) : null}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
