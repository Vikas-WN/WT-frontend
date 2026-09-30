"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WtLoaderCentered } from "@/components/dashboard/ui/WtLoader";
import { FORM_CONTROL_CLASS } from "@/components/dashboard/ui/uiLayout";
import { cn } from "@/lib/utils";
import { formatUiStatusLabel } from "@/utils/statusLabel";
import { TASK_CATEGORY_LABELS } from "@/utils/timelog/categories";
import { resolveTimelogProjectLabel } from "@/utils/timelog/projectLabel";
import { isManagerTimelogDecisionActionable } from "@/utils/timelog/employeeEditability";
import { timelogStatusBadgeClass } from "@/utils/timelog/statusTone";
import { formatDayHeader } from "@/utils/timelog/weekDates";
import { useMemo, useState } from "react";
import type { TimelogGridRow } from "@/utils/timelog/gridState";

type EntryReviewSidePanelProps = {
  row: TimelogGridRow;
  dayKeys: string[];
  dayDates: Date[];
  employeeEmail: string;
  actionLoading: boolean;
  onApprove: (remark: string) => void;
  onReject: (remark: string) => void;
  onClose: () => void;
};

export function EntryReviewSidePanel({
  row,
  dayKeys,
  dayDates,
  employeeEmail,
  actionLoading,
  onApprove,
  onReject,
  onClose,
}: EntryReviewSidePanelProps) {
  const existingRemark = useMemo(() => {
    for (const key of dayKeys) {
      const c = row.manager_comment_by_date?.[key];
      if (c) return c;
    }
    return "";
  }, [row.manager_comment_by_date, dayKeys]);
  const [remark, setRemark] = useState(existingRemark);

  const hasActionableDays = useMemo(
    () =>
      dayKeys.some((key) => {
        const hours = row.hours_by_date[key];
        if (!hours || hours === "0" || hours === "0.00") return false;
        const status = row.status_by_date?.[key];
        return isManagerTimelogDecisionActionable(status);
      }),
    [dayKeys, row.hours_by_date, row.status_by_date]
  );

  const taskLabel = TASK_CATEGORY_LABELS[row.task_category] ?? row.task_category;

  return (
    <div
      className="fixed inset-0 z-[100] animate-in bg-black/30 duration-[var(--wt-duration)] ease-[var(--wt-ease)] fade-in-0 dark:bg-black/55"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="absolute top-0 right-0 flex h-full w-full max-w-md animate-in flex-col border-l border-wt-border bg-wt-surface-1 shadow-[-8px_0_32px_rgba(0,0,0,0.14)] duration-[var(--wt-duration-slow)] ease-[var(--wt-ease-out)] fade-in-0 slide-in-from-right-5 dark:shadow-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-wt-border px-5 py-4">
          <h2 className="text-lg font-semibold text-wt-text">Review Entry</h2>
          <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={actionLoading}>
            Close
          </Button>
        </div>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium tracking-wide text-wt-text-muted uppercase">Employee</span>
            <span className="text-sm text-wt-text">{employeeEmail}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium tracking-wide text-wt-text-muted uppercase">Project</span>
            <span className="text-sm text-wt-text">{resolveTimelogProjectLabel(row)}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium tracking-wide text-wt-text-muted uppercase">Task</span>
            <span className="text-sm text-wt-text">
              {taskLabel}
              {row.sub_category ? ` / ${row.sub_category}` : ""}
            </span>
          </div>
          {row.comment ? (
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium tracking-wide text-wt-text-muted uppercase">Description</span>
              <span className="text-sm text-wt-text">{row.comment}</span>
            </div>
          ) : null}

          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium tracking-wide text-wt-text-muted uppercase">Daily hours</span>
            <div className="flex flex-wrap gap-2">
              {dayKeys.map((key, i) => {
                const hours = row.hours_by_date[key];
                const status = row.status_by_date?.[key];
                if (!hours || hours === "0" || hours === "0.00") return null;
                return (
                  <div
                    key={key}
                    className="flex min-w-20 flex-col items-center gap-1 rounded-lg border border-wt-border px-3 py-2"
                  >
                    <div className="text-xs font-medium text-wt-text-muted">{formatDayHeader(dayDates[i])}</div>
                    <div className="text-base font-semibold text-wt-text">{hours}h</div>
                    {status ? (
                      <Badge variant="outline" className={cn("border", timelogStatusBadgeClass(status))}>
                        {formatUiStatusLabel(status)}
                      </Badge>
                    ) : null}
                    {row.manager_comment_by_date?.[key] ? (
                      <div className="mt-0.5 max-w-20 truncate text-center text-xs leading-tight text-wt-text-muted italic">
                        {row.manager_comment_by_date[key]}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium tracking-wide text-wt-text-muted uppercase">Remark (optional)</span>
            <textarea
              className={cn(FORM_CONTROL_CLASS, "min-h-20 resize-y bg-wt-surface-2 py-2.5")}
              placeholder="Add a remark..."
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              disabled={actionLoading}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-wt-border px-5 py-3">
          {actionLoading ? (
            <WtLoaderCentered label="" />
          ) : hasActionableDays ? (
            <>
              <Button
                variant="destructive"
                size="sm"
                type="button"
                onClick={() => onReject(remark.trim())}
              >
                Reject
              </Button>
              <Button
                variant="brand"
                size="sm"
                type="button"
                onClick={() => onApprove(remark.trim())}
              >
                Approve
              </Button>
            </>
          ) : (
            <p className="text-sm text-wt-text-muted">
              No submitted entries to approve or reject for this row.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
