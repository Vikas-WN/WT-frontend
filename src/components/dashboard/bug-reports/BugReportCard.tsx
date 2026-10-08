import { Clock, Globe } from "lucide-react";

import { BugAttachmentList } from "@/components/dashboard/bug-reports/BugAttachmentList";
import { BugTechnicalDetails } from "@/components/dashboard/bug-reports/BugTechnicalDetails";

import { filledBadgeClass } from "@/components/dashboard/ui/badgeTones";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BUG_DETAIL_COPY,
  BUG_REPORT_COPY,
  BUG_SEVERITY_OPTIONS,
  BUG_SEVERITY_TONE,
  BUG_STATUS_OPTIONS,
  BUG_STATUS_TONE,
} from "@/constants/bugReports";
import { cn } from "@/lib/utils";
import type { BugReport } from "@/types/bugReport";
import { formatApiDateTimeDisplay } from "@/utils/apiDate";

const labelOf = (options: ReadonlyArray<{ value: string; label: string }>, value: string) =>
  options.find((option) => option.value === value)?.label ?? value;

export function BugReportCard({
  bug,
  showReporter,
  highlighted,
  onReview,
}: {
  bug: BugReport;
  showReporter: boolean;
  highlighted?: boolean;
  /** Set for HR/Admin — shows the Review button. */
  onReview?: (bug: BugReport) => void;
}) {
  return (
    <article
      className={cn(
        "rounded-2xl border bg-wt-surface-1 p-4 shadow-[var(--wt-shadow-sm)] transition-shadow",
        highlighted ? "border-[var(--wt-brand)] ring-2 ring-[color-mix(in_srgb,var(--wt-brand)_25%,transparent)]" : "border-wt-border"
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-wt-text">
            <span className="mr-1.5 font-normal text-wt-text-faint">#{bug.id}</span>
            {bug.title}
          </h3>
          <p className="mt-0.5 text-xs text-wt-text-muted">
            {showReporter ? `${bug.reporter.name} · ` : ""}
            {formatApiDateTimeDisplay(bug.created_at)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Badge variant="secondary" className={filledBadgeClass(BUG_SEVERITY_TONE[bug.severity])}>
            {labelOf(BUG_SEVERITY_OPTIONS, bug.severity)}
          </Badge>
          <Badge variant="secondary" className={filledBadgeClass(BUG_STATUS_TONE[bug.status])}>
            {labelOf(BUG_STATUS_OPTIONS, bug.status)}
          </Badge>
        </div>
      </div>
      <p className="mt-3 line-clamp-3 whitespace-pre-wrap text-sm text-wt-text-muted">{bug.description}</p>
      {bug.occurred_at ? (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-wt-text-faint">
          <Clock className="size-3.5 shrink-0" aria-hidden />
          {BUG_DETAIL_COPY.happened} {formatApiDateTimeDisplay(bug.occurred_at)}
        </p>
      ) : null}
      {bug.page_url ? (
        <p className="mt-2 flex items-center gap-1.5 truncate text-xs text-wt-text-faint">
          <Globe className="size-3.5 shrink-0" aria-hidden />
          <span className="truncate">{bug.page_url}</span>
        </p>
      ) : null}
      <BugAttachmentList attachments={bug.attachments ?? []} />
      {onReview ? <BugTechnicalDetails bug={bug} /> : null}
      {bug.resolution_note ? (
        <div className="mt-3 rounded-lg bg-wt-surface-2 px-3 py-2 text-sm text-wt-text">
          <span className="font-medium">{bug.handled_by_name ?? "HR"}: </span>
          {bug.resolution_note}
        </div>
      ) : null}
      {onReview ? (
        <div className="mt-3 flex justify-end">
          <Button type="button" size="sm" variant="outline" onClick={() => onReview(bug)}>
            {BUG_REPORT_COPY.triage}
          </Button>
        </div>
      ) : null}
    </article>
  );
}
