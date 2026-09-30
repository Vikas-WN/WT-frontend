"use client";

import { createPortal } from "react-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WtLoaderCentered } from "@/components/dashboard/ui/WtLoader";
import { cn } from "@/lib/utils";
import { formatUiStatusLabel } from "@/utils/statusLabel";
import { formatTimelogTableDate } from "@/utils/timelog/weekDates";
import { TASK_CATEGORY_LABELS } from "@/utils/timelog/categories";
import { projectManagerEmailFromEntry } from "@/utils/timelog/entryManager";
import {
  employeeTimelogActionLockReason,
  isEmployeeTimelogEditable,
} from "@/utils/timelog/employeeEditability";
import { resolveTimelogProjectLabel } from "@/utils/timelog/projectLabel";
import { timelogStatusBadgeClass } from "@/utils/timelog/statusTone";
import type { DayEntriesPanelProps } from "./DayEntriesPanel.types";

export function DayEntriesPanel({
  selectedDate,
  entries,
  totalHours,
  loading,
  actionLoading,
  error,
  projectOptions = [],
  onAdd,
  onEdit,
  onDelete,
  onSubmit,
  onClose,
}: DayEntriesPanelProps) {
  if (!selectedDate) return null;

  const dateLabel = selectedDate
    ? formatTimelogTableDate(selectedDate)
    : "";

  const hasSubmittable = entries.some((e) => isEmployeeTimelogEditable(e.status));

  // Render at the document root — the same as DayEntryForm. Rendering inline
  // leaves this fixed-position overlay inside the dashboard's animated <main>
  // (whose transform makes it the containing block), which mispositions the
  // panel over the calendar and causes flicker/ghosting on hover repaints.
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] bg-black/25 dark:bg-black/50"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="absolute top-0 right-0 flex h-full w-full max-w-md flex-col border-l border-wt-border bg-wt-surface-1 shadow-[-4px_0_24px_rgba(0,0,0,0.12)] dark:shadow-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-wt-border px-5 py-4">
          <h2 className="text-lg font-semibold text-wt-text">Entries for {dateLabel}</h2>
          <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={actionLoading}>
            Close
          </Button>
        </div>

        {/* min-h-0 is required for overflow-y-auto to actually scroll here: a flex
            item won't shrink below its content height without it, so with several
            entries the body grew past the panel instead of scrolling, and the
            cards inside it were squashed to fit — clipping each card's description
            and status badge (BUG_ID_335). scrollbar-gutter reserves the scrollbar's
            space so the panel doesn't jump/flicker when it appears on hover/focus. */}
        <div
          className="min-w-0 min-h-0 flex-1 flex-col gap-3 overflow-x-hidden overflow-y-auto px-5 py-4 flex [scrollbar-gutter:stable]"
        >
          {error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-400/30 dark:bg-rose-500/10 dark:text-rose-300">
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="py-8 text-center text-sm text-wt-text-muted">
              <WtLoaderCentered label="Loading entries" />
            </div>
          ) : (
            <>
              <Button
                variant="brand"
                size="sm"
                type="button"
                disabled={actionLoading}
                onClick={onAdd}
                className="w-full"
              >
                Add entry
              </Button>

              {entries.length === 0 ? (
                <div className="py-8 text-center text-sm text-wt-text-muted">
                  No entries for this date. Click &ldquo;Add entry&rdquo; to log hours.
                </div>
              ) : (
                [...entries].reverse().map((entry) => {
                  const taskLabel = TASK_CATEGORY_LABELS[entry.task_category] ?? entry.task_category;
                  const projectManagerEmail = projectManagerEmailFromEntry(entry);
                  const editable = isEmployeeTimelogEditable(entry.status);
                  const lockReason = employeeTimelogActionLockReason(entry.status);
                  const showActions = editable || Boolean(lockReason);
                  return (
                    // flex-none (flex: 0 0 auto) keeps the card at its natural height —
                    // as a flex item it otherwise defaults to flex-shrink: 1, so a panel
                    // with several entries compressed each card and overflow-hidden then
                    // sliced off whatever no longer fit (status badge cut in half,
                    // descriptions truncated — BUG_ID_335). The body scrolls instead.
                    <div
                      key={entry.id}
                      className="min-w-0 max-w-full flex-none overflow-hidden rounded-xl border border-wt-border px-4 py-3 flex flex-col gap-1"
                    >
                      <div className="flex min-w-0 items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="min-w-0 text-sm font-medium break-words text-wt-text [overflow-wrap:anywhere]">
                            {resolveTimelogProjectLabel(entry, projectOptions)}
                          </div>
                          {projectManagerEmail ? (
                            <div className="min-w-0 text-sm break-words text-wt-text-muted [overflow-wrap:anywhere]">
                              Project Manager: {projectManagerEmail}
                            </div>
                          ) : null}
                          <div className="min-w-0 text-sm break-words text-wt-text-muted [overflow-wrap:anywhere]">
                            {taskLabel}
                            {entry.sub_category ? ` / ${entry.sub_category}` : ""}
                          </div>
                        </div>
                        <div className="shrink-0 whitespace-nowrap text-sm font-semibold text-wt-text">
                          {entry.hours}h
                        </div>
                      </div>
                      {entry.description ? (
                        // Show the description in full — it used to sit in its own
                        // 10rem scrollbox, so a longer entry was cut off with only a
                        // faint inner scrollbar hinting there was more (BUG_ID_335).
                        // The panel body scrolls, so letting the card grow is fine.
                        <div className="min-w-0 max-w-full text-xs break-words whitespace-pre-wrap text-wt-text-muted [overflow-wrap:anywhere]">
                          {entry.description}
                        </div>
                      ) : null}
                      <div>
                        <Badge
                          variant="outline"
                          className={cn("border", timelogStatusBadgeClass(entry.status))}
                        >
                          {formatUiStatusLabel(entry.status)}
                        </Badge>
                        {entry.manager_comment ? (
                          <div className="mt-1.5 text-xs text-wt-text-muted italic">
                            Remark: {entry.manager_comment}
                          </div>
                        ) : null}
                      </div>
                      {showActions ? (
                        <div className="mt-1.5 flex gap-2">
                          <Button
                            variant="outline"
                            size="xs"
                            type="button"
                            disabled={actionLoading || !editable}
                            title={lockReason ?? undefined}
                            onClick={() => onEdit(entry)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="xs"
                            type="button"
                            disabled={actionLoading || !editable}
                            title={lockReason ?? undefined}
                            onClick={() => onDelete(entry.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  );
                })
              )}
            </>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-wt-border px-5 py-3">
          <span className="text-sm font-medium text-wt-text">
            Total: {totalHours}h ({entries.length} {entries.length === 1 ? "entry" : "entries"})
          </span>
          <div className="flex gap-2">
            <Button
              variant="brand"
              size="sm"
              type="button"
              disabled={actionLoading || !hasSubmittable}
              onClick={onSubmit}
              title={
                hasSubmittable
                  ? "Submit all draft entries for this date"
                  : "No draft entries to submit"
              }
            >
              {actionLoading ? "Submitting…" : hasSubmittable ? "Submit All" : "All Submitted"}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
