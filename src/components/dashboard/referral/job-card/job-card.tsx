"use client";

import { Building2, MapPin, Clock, ExternalLink, MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { showSuccessToast } from "@/lib/toast";
import { CAREER_PAGE_URL } from "@/components/dashboard/referral/referral-page-client.constants";
import { JOB_CARD_COPY } from "@/components/dashboard/referral/job-card/job-card.constants";
import type { JobCardProps } from "@/components/dashboard/referral/job-card/job-card.types";
import "./job-card.css";

function copyJobId(id: string): void {
  const shortId = id.split("-")[0];
  navigator.clipboard.writeText(shortId).then(() => {
    showSuccessToast(JOB_CARD_COPY.copiedToast);
  });
}

function JobIdChip({ id }: { id: string }) {
  return (
    <span
      onClick={(e) => { e.stopPropagation(); copyJobId(id); }}
      className={cn(
        "inline-flex items-center gap-1 rounded-md border border-wt-border-md px-2 py-0.5 font-mono text-[10px]",
        "text-wt-text-faint bg-wt-surface-2 cursor-pointer select-none",
        "transition-colors hover:border-wt-border hover:text-wt-text"
      )}
      title={JOB_CARD_COPY.copyTitle}
    >
      Job ID : #{id.split("-")[0]}
    </span>
  );
}

function CareerPageLink({ jobId }: { jobId: string }) {
  const url = `${CAREER_PAGE_URL}?jobId=${encodeURIComponent(jobId)}`;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "inline-flex items-center gap-1 text-[11px] font-medium transition-colors",
        "text-wt-text-muted hover:text-[var(--wt-brand)]"
      )}
    >
      <ExternalLink className="size-3" />
      {JOB_CARD_COPY.careerPage}
    </a>
  );
}

export function JobCard({ job, selected, onSelect }: JobCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(job)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(job);
        }
      }}
      className={cn(
        "job-card w-full rounded-xl border p-4 text-left transition-all duration-[var(--wt-duration)] ease-[var(--wt-ease)]",
        "hover:shadow-md hover:-translate-y-0.5 cursor-pointer",
        selected ? "job-card--selected" : "job-card--default"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-wt-text">{job.title}</h4>
            {job.urgency === "Urgent" && (
              <Badge variant="destructive" className="shrink-0 px-1.5 py-0 text-[10px] uppercase tracking-wider">
                Urgent
              </Badge>
            )}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-wt-text-muted">
            <span className="inline-flex items-center gap-1">
              <Building2 className="size-3.5" />
              {job.department}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" />
              {job.location}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" />
              {job.postedAt}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary" className="text-[11px] font-normal">
              {job.type}
            </Badge>
            <JobIdChip id={job.id} />
            <CareerPageLink jobId={job.id} />
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(job);
          }}
          className="flex size-8 shrink-0 items-center justify-center rounded-lg text-wt-text-muted hover:bg-wt-surface-2 hover:text-wt-text transition-colors"
          title={JOB_CARD_COPY.referNow}
        >
          <MoreHorizontal className="size-5" />
        </button>
      </div>
    </div>
  );
}
