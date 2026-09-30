"use client";

import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { WtLoaderCentered } from "@/components/dashboard/ui/WtLoader";
import { RefreshIconButton } from "@/components/dashboard/ui/RefreshIconButton";
import { WeeklyTimelogGrid } from "@/components/dashboard/timelog/WeeklyTimelogGrid";
import { WeekPickerField } from "@/components/dashboard/timelog/WeekPickerField";
import { EntryReviewSidePanel } from "@/components/dashboard/timelog/EntryReviewSidePanel/EntryReviewSidePanel";
import { useState, useCallback } from "react";
import type { EmployeeWeekDetailProps } from "./EmployeeWeekDetail.types";
import type { TimelogGridRow } from "@/utils/timelog/gridState";

export function EmployeeWeekDetail({
  employeeEmail,
  weekStart,
  dayKeys,
  dayDates,
  gridRows,
  loading,
  error,
  actionLoading,
  onBack,
  onWeekChange,
  onRefresh,
  onApprove,
  onReject,
}: EmployeeWeekDetailProps) {
  const [selectedRow, setSelectedRow] = useState<TimelogGridRow | null>(null);

  const handleRowClick = useCallback((row: TimelogGridRow) => {
    setSelectedRow(row);
  }, []);

  const handleApprove = useCallback(
    async (remark: string) => {
      if (!selectedRow) return;
      await onApprove(selectedRow, remark);
      setSelectedRow(null);
    },
    [selectedRow, onApprove]
  );

  const handleReject = useCallback(
    async (remark: string) => {
      if (!selectedRow) return;
      await onReject(selectedRow, remark);
      setSelectedRow(null);
    },
    [selectedRow, onReject]
  );

  return (
    <>
      <Card>
        <CardContent className="flex flex-col gap-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-sm font-semibold text-wt-text">
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-1 rounded-lg border border-wt-border px-2.5 py-1 text-xs font-medium text-wt-text-muted transition-colors hover:bg-wt-surface-2 hover:text-wt-text"
              >
                <ArrowLeft className="size-3.5" aria-hidden />
                Back
              </button>
              <span>{employeeEmail}</span>
            </div>
            <div className="flex items-center gap-2">
              <WeekPickerField
                weekStart={weekStart}
                onWeekStartChange={onWeekChange}
                placeholder="Select Week"
              />
              <RefreshIconButton onClick={onRefresh} loading={loading} />
            </div>
          </div>
          {loading ? (
            <WtLoaderCentered label="" />
          ) : error ? (
            <p className="py-8 text-center text-sm text-rose-600 dark:text-rose-400">{error}</p>
          ) : gridRows.length === 0 ? (
            <p className="py-8 text-center text-sm text-wt-text-muted">No timelog entries for this week.</p>
          ) : (
            <WeeklyTimelogGrid
              rows={gridRows}
              dayDates={dayDates}
              dayKeys={dayKeys}
              projectOptions={[]}
              readOnly
              onRowClick={handleRowClick}
              onRowsChange={() => {}}
            />
          )}
        </CardContent>
      </Card>
      {selectedRow ? (
        <EntryReviewSidePanel
          row={selectedRow}
          dayKeys={dayKeys}
          dayDates={dayDates}
          employeeEmail={employeeEmail}
          actionLoading={actionLoading}
          onApprove={handleApprove}
          onReject={handleReject}
          onClose={() => setSelectedRow(null)}
        />
      ) : null}
    </>
  );
}
