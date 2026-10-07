import { statusMeta, TONE_DOT_CLASS, TONE_PILL_CLASS } from "@/components/dashboard/pulse/shared/submissionStatus";
import { cn } from "@/lib/utils";
import type { MonthlySubmissionReviewStatus } from "@/types/kpi";

export function StatusPill({ status, className }: { status: MonthlySubmissionReviewStatus | null | undefined; className?: string }) {
  const meta = statusMeta(status);
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold", TONE_PILL_CLASS[meta.tone], className)}>
      <span aria-hidden className={cn("size-1.5 rounded-full", TONE_DOT_CLASS[meta.tone])} />
      {meta.label}
    </span>
  );
}
