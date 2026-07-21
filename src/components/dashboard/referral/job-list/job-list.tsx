"use client";

import { Search, Loader2, PanelRightOpen, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { JobCard } from "@/components/dashboard/referral/job-card/job-card";
import { JobListSkeleton } from "@/components/dashboard/referral/job-list/job-list-skeleton";
import { JOB_LIST_COPY } from "@/components/dashboard/referral/job-list/job-list.constants";
import type { JobListProps } from "@/components/dashboard/referral/job-list/job-list.types";
import "./job-list.css";

function OpenCountChip({ count }: { count: number }) {
  return (
    <span className="open-count-chip">
      <span className="open-count-dot" />
      {count} Opening(s)
    </span>
  );
}

function SearchInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-wt-text-muted" />
      <Input
        placeholder={JOB_LIST_COPY.searchPlaceholder}
        className="h-10 pl-10"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Loader2 className="size-8 animate-spin text-wt-text-faint" />
      <p className="mt-3 text-sm text-wt-text-muted">{JOB_LIST_COPY.loading}</p>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <p className="text-sm text-destructive">{message}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Search className="size-8 text-wt-text-faint" />
      <p className="mt-3 text-sm text-wt-text-muted">{JOB_LIST_COPY.noResults}</p>
    </div>
  );
}

function PaginationBar({
  page,
  total,
  pageSize,
  onPageChange,
}: {
  page: number;
  total: number;
  pageSize: number;
  onPageChange: (p: number) => void;
}) {
  if (total <= pageSize) return null;

  const rangeStart = Math.min((page - 1) * pageSize + 1, total);
  const rangeEnd = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between border-t border-wt-border px-5 py-3 sm:px-6">
      <p className="text-xs text-wt-text-muted">
        {rangeStart} - {rangeEnd} of {total}
      </p>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
          aria-label={JOB_LIST_COPY.previous}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          disabled={page * pageSize >= total}
          onClick={() => onPageChange(page + 1)}
          aria-label={JOB_LIST_COPY.next}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

export function JobList({
  jobs,
  total,
  isLoading,
  error,
  selectedJob,
  page,
  pageSize,
  searchQuery,
  onSearchChange,
  onSelectJob,
  onPageChange,
  onMobileDrawerOpen,
}: JobListProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{JOB_LIST_COPY.openPositions}</CardTitle>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onMobileDrawerOpen}
              className={cn(
                "mobile-drawer-trigger lg:hidden",
              )}
              title={JOB_LIST_COPY.referTitle}
            >
              <PanelRightOpen className="size-4" />
            </button>
            <OpenCountChip count={total} />
          </div>
        </div>
      </CardHeader>

      <div className="border-t border-wt-border px-5 py-4 sm:px-6">
        <SearchInput value={searchQuery} onChange={onSearchChange} />
      </div>

      <div className="space-y-3 px-5 pb-6 sm:px-6">
        {isLoading ? (
          <JobListSkeleton count={3} />
        ) : error ? (
          <ErrorState message={error} />
        ) : jobs.length === 0 ? (
          <EmptyState />
        ) : (
          jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              selected={selectedJob?.id === job.id}
              onSelect={onSelectJob}
            />
          ))
        )}
      </div>

      <PaginationBar
        page={page}
        total={total}
        pageSize={pageSize}
        onPageChange={onPageChange}
      />
    </Card>
  );
}
