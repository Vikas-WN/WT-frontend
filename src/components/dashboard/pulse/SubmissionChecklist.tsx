"use client";

import { CheckCircle2, Circle } from "lucide-react";
import { PULSE_COPY } from "@/constants/pulseCopy";
import { cn } from "@/lib/utils";
import { summarizeChecklist, type ChecklistGroup, type ChecklistItem } from "@/utils/pulseChecklist";

/**
 * "What have I missed?" — progress plus every outstanding item, by name and with what it still
 * needs. Clicking one takes you to it. Finished groups collapse to a single tick so what is left
 * is what stands out.
 */
export function SubmissionChecklist({
  groups,
  onSelect,
  className,
}: {
  groups: readonly ChecklistGroup[];
  onSelect?: (group: ChecklistGroup, item: ChecklistItem) => void;
  className?: string;
}) {
  const summary = summarizeChecklist(groups);
  if (summary.total === 0) return null;
  const percent = Math.round((summary.done / summary.total) * 100);

  return (
    <section
      aria-label={PULSE_COPY.checklistTitle}
      className={cn("rounded-2xl border border-wt-border bg-wt-surface-1 p-5", className)}
    >
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-semibold text-wt-text">{PULSE_COPY.checklistTitle}</h3>
        <p className="text-xs text-wt-text-muted" aria-live="polite">
          {summary.complete ? PULSE_COPY.checklistDone : `${summary.done} of ${summary.total} done`}
        </p>
      </div>
      <div
        className="mt-3 h-2 overflow-hidden rounded-full bg-wt-surface-3"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn("h-full rounded-full transition-[width] duration-500", summary.complete ? "bg-emerald-500" : "bg-[var(--wt-brand)]")}
          style={{ width: `${percent}%` }}
        />
      </div>

      <ul className="mt-4 space-y-3">
        {groups.map((group) => {
          const outstanding = group.items.filter((item) => !item.done);
          if (outstanding.length === 0) {
            return (
              <li key={group.key} className="flex items-center gap-2 text-xs text-wt-text-muted">
                <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
                {group.title}
                {group.items.length > 1 ? ` — all ${group.items.length} done` : ""}
              </li>
            );
          }
          return (
            <li key={group.key}>
              <p className="text-xs font-semibold text-wt-text">
                {group.title}{" "}
                <span className="font-normal text-wt-text-muted">
                  — {group.items.length - outstanding.length} of {group.items.length} done
                </span>
              </p>
              <ul className="mt-1 space-y-0.5">
                {outstanding.map((item) => (
                  <li key={item.key}>
                    <button
                      type="button"
                      onClick={() => onSelect?.(group, item)}
                      disabled={!onSelect}
                      className="flex w-full items-start gap-2 rounded-md px-1.5 py-1 text-left text-xs text-wt-text hover:bg-wt-surface-2 disabled:cursor-default disabled:hover:bg-transparent"
                    >
                      <Circle className="mt-0.5 size-3.5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
                      <span>
                        {item.label}
                        <span className="text-wt-text-muted"> — {item.missing}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
