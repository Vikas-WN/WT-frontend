import { Check } from "lucide-react";

import { stagesOf, type Stage } from "@/components/dashboard/pulse/shared/submissionStatus";
import { cn } from "@/lib/utils";
import type { MonthlySubmissionItem } from "@/types/kpi";

/** Three connected dots: Submitted → Manager → Final. Compact enough for a table row, readable on its own. */
export function StagePipeline({
  row,
  className,
  showLabels = false,
}: {
  row: Pick<MonthlySubmissionItem, "review_status" | "reviewer">;
  className?: string;
  showLabels?: boolean;
}) {
  const stages = stagesOf(row);
  return (
    <ol className={cn("flex items-center", className)} aria-label="Review progress">
      {stages.map((stage, index) => (
        <li key={stage.key} className="flex items-center" aria-current={stage.state === "current" ? "step" : undefined}>
          {index > 0 ? <span aria-hidden className={cn("h-0.5 w-5 rounded-full sm:w-7", connector(stages[index - 1], stage))} /> : null}
          <span className="flex flex-col items-center gap-1">
            <span
              className={cn(
                "flex size-[18px] items-center justify-center rounded-full border-2 transition-colors",
                stage.state === "done" && "border-emerald-500 bg-emerald-500 text-white",
                stage.state === "current" && "border-[var(--wt-brand)] bg-wt-surface-1",
                stage.state === "todo" && "border-wt-border-md bg-wt-surface-1"
              )}
            >
              {stage.state === "done" ? <Check className="size-2.5" strokeWidth={4} aria-hidden /> : null}
              {stage.state === "current" ? <span className="size-1.5 rounded-full bg-[var(--wt-brand)]" /> : null}
            </span>
            {showLabels ? <span className={cn("text-[10px] font-medium", stage.state === "todo" ? "text-wt-text-faint" : "text-wt-text-muted")}>{stage.label}</span> : null}
          </span>
        </li>
      ))}
    </ol>
  );
}

function connector(prev: Stage, next: Stage): string {
  if (prev.state === "done" && next.state !== "todo") return "bg-emerald-500";
  return "bg-wt-border-md";
}
