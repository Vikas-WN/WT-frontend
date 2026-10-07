"use client";

import { ChevronRight, Pencil, Trash2 } from "lucide-react";

import { StagePipeline } from "@/components/dashboard/pulse/shared/StagePipeline";
import { StatusPill } from "@/components/dashboard/pulse/shared/StatusPill";
import { statusMeta } from "@/components/dashboard/pulse/shared/submissionStatus";
import { UserAvatar } from "@/components/dashboard/ui/profile";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MonthlySubmissionItem } from "@/types/kpi";

function ScoreChip({ row }: { row: MonthlySubmissionItem }) {
  if (row.final_score == null) return <span className="text-sm text-wt-text-faint">—</span>;
  return (
    <span
      className={cn(
        "inline-flex min-w-12 items-center justify-center rounded-lg border px-2.5 py-1 text-sm font-bold tabular-nums",
        row.promotion_eligible
          ? "border-emerald-500/30 bg-emerald-500/12 text-emerald-700 dark:text-emerald-300"
          : "border-wt-border bg-wt-surface-2 text-wt-text"
      )}
      title={row.promotion_eligible ? "Promotion eligible" : undefined}
    >
      {row.admin_rating_display ?? row.final_score}
    </span>
  );
}

/** One employee's submission for the month: who, how far it has travelled, what it scored — click to review. */
export function SubmissionList({
  rows,
  onOpen,
  onDelete,
}: {
  rows: readonly MonthlySubmissionItem[];
  onOpen: (row: MonthlySubmissionItem) => void;
  onDelete: (row: MonthlySubmissionItem) => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-wt-border bg-wt-surface-1">
      <div className="hidden grid-cols-[minmax(0,2.2fr)_minmax(0,1.3fr)_minmax(0,1.5fr)_5rem_5.5rem] items-center gap-4 border-b border-wt-border bg-wt-surface-2/60 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-wt-text-faint md:grid">
        <span>Employee</span>
        <span>Progress</span>
        <span>Status</span>
        <span className="text-center">Score</span>
        <span className="sr-only">Actions</span>
      </div>
      <ul className="divide-y divide-wt-border">
        {rows.map((row) => {
          const meta = statusMeta(row.review_status);
          return (
            <li key={row.id} className="group/row relative">
              <div className="grid items-center gap-x-4 gap-y-3 px-4 py-3.5 transition-colors group-hover/row:bg-wt-surface-2/50 md:grid-cols-[minmax(0,2.2fr)_minmax(0,1.3fr)_minmax(0,1.5fr)_5rem_5.5rem] md:px-5">
                <button
                  type="button"
                  onClick={() => onOpen(row)}
                  className="flex min-w-0 items-center gap-3 text-left after:absolute after:inset-0 after:content-[''] md:after:right-24"
                  aria-label={`Review ${row.employee.name}'s submission`}
                >
                  <UserAvatar profile={{ name: row.employee.name, emp_id: row.employee.emp_id, email: row.employee.email }} fallbackName={row.employee.name} size="md" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-wt-text">{row.employee.name}</span>
                    <span className="block truncate text-xs text-wt-text-muted">
                      {row.employee.emp_id ?? row.employee.email}
                      {row.reviewer ? ` · reviewer ${row.reviewer.name}` : row.managers.length ? ` · ${row.managers[0].name}${row.managers.length > 1 ? ` +${row.managers.length - 1}` : ""}` : ""}
                    </span>
                  </span>
                </button>

                <div className="hidden md:block">
                  <StagePipeline row={row} showLabels />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill status={row.review_status} />
                  {row.admin_edits?.length ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-wt-border bg-wt-surface-2 px-2 py-0.5 text-[11px] font-medium text-wt-text-muted">
                      <Pencil className="size-3" aria-hidden /> Edited by HR
                    </span>
                  ) : null}
                  <span className="text-xs text-wt-text-faint md:hidden">{meta.waitingOn}</span>
                </div>

                <div className="md:text-center">
                  <ScoreChip row={row} />
                </div>

                <div className="relative z-10 flex items-center justify-end gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onDelete(row)}
                    aria-label={`Delete ${row.employee.name}'s submission`}
                    className="opacity-60 hover:opacity-100 md:opacity-0 md:group-hover/row:opacity-100 md:focus-visible:opacity-100"
                  >
                    <Trash2 className="size-3.5 text-rose-600" />
                  </Button>
                  <ChevronRight className="size-4 text-wt-text-faint transition-transform group-hover/row:translate-x-0.5" aria-hidden />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
