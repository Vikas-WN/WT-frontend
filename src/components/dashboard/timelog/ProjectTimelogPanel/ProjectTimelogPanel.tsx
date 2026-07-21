"use client";

import { useMemo, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshIconButton } from "@/components/dashboard/ui/RefreshIconButton";
import { WtLoaderCentered } from "@/components/dashboard/ui/WtLoader";
import { DatePicker } from "@/components/ui/date-picker";
import { ProjectTimelogCardList } from "@/components/dashboard/timelog/ProjectTimelogCardList/ProjectTimelogCardList";
import { useProjectTimelogs } from "@/hooks/timelog/useProjectTimelogs";
import { useDashboardAction } from "@/components/dashboard/shared/useDashboardAction";
import { hrmsService } from "@/services/hrms.service";
import { formatUiStatusLabel } from "@/utils/statusLabel";
import { TASK_CATEGORY_LABELS } from "@/utils/timelog/categories";
import { toIsoDateKey } from "@/utils/timelog/weekDates";
import type { DayTimelogEntry } from "@/hooks/timelog/useDayTimelog.types";
import type { ProjectWeekEmployeeTotal } from "@/hooks/timelog/useProjectTimelogs.types";
import type { ProjectTimelogPanelProps } from "./ProjectTimelogPanel.types";
import { ApprovalRemarkModal } from "@/components/dashboard/timelog/ApprovalRemarkModal/ApprovalRemarkModal";

type EmployeeDetailCache = {
  mode: "all" | "week";
  entries: DayTimelogEntry[];
  snapshot: null;
};

function entryStatusClass(status: string): string {
  const map: Record<string, string> = {
    DRAFT: "rounded-md bg-wt-surface-3 px-2 py-0.5 text-xs font-medium text-wt-text-muted",
    SUBMITTED: "rounded-md bg-[var(--wt-brand-soft)] px-2 py-0.5 text-xs font-medium text-[var(--wt-brand)]",
    APPROVED: "rounded-md bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-300",
    REJECTED: "rounded-md bg-rose-500/15 px-2 py-0.5 text-xs font-medium text-rose-300",
  };
  return map[status] ?? map.DRAFT;
}

function patchApprovedTotalsForEntry(
  totals: ProjectWeekEmployeeTotal[] | undefined,
  employeeEmail: string,
  entry: DayTimelogEntry,
  newStatus: "APPROVED" | "REJECTED"
): ProjectWeekEmployeeTotal[] | undefined {
  if (!totals) return totals;
  const previousStatus = entry.status.toUpperCase();
  const hours = Number(entry.hours);
  if (!Number.isFinite(hours) || hours <= 0) return totals;

  let delta = 0;
  if (newStatus === "APPROVED" && previousStatus !== "APPROVED") delta = hours;
  if (newStatus === "REJECTED" && previousStatus === "APPROVED") delta = -hours;
  if (delta === 0) return totals;

  const email = employeeEmail.trim().toLowerCase();
  return totals.map((row) =>
    row.email.trim().toLowerCase() === email
      ? { ...row, week_total: Math.max(0, row.week_total + delta) }
      : row
  );
}

function patchEntriesStatus(
  entries: DayTimelogEntry[],
  entryIds: number[],
  status: "APPROVED" | "REJECTED",
  remark: string
): DayTimelogEntry[] {
  const idSet = new Set(entryIds);
  return entries.map((entry) =>
    idSet.has(entry.id)
      ? {
          ...entry,
          status,
          manager_comment: remark || entry.manager_comment,
        }
      : entry
  );
}

function TimelogDateRangeFields({
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
}: {
  fromDate: string;
  toDate: string;
  onFromDateChange: (value: string) => void;
  onToDateChange: (value: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      <div className="space-y-1">
        <span className="whitespace-nowrap text-sm text-muted-foreground">From</span>
        <DatePicker value={fromDate} onChange={onFromDateChange} max={toDate || undefined} />
      </div>
      <div className="space-y-1">
        <span className="whitespace-nowrap text-sm text-muted-foreground">To</span>
        <DatePicker value={toDate} onChange={onToDateChange} min={fromDate || undefined} />
      </div>
    </div>
  );
}

export function ProjectTimelogPanel({ enabled }: ProjectTimelogPanelProps) {
  const queryClient = useQueryClient();
  const {
    projects,
    pendingApprovals,
    projectsLoading,
    projectsError,
    weekTotals,
    weekTotalsLoading,
    expandedProject,
    selectedEmployee,
    fromDate,
    toDate,
    employeeEntries,
    employeeWeekLoading,
    employeeWeekError,
    setFromDate,
    setToDate,
    toggleProject,
    selectEmployee,
    reload,
  } = useProjectTimelogs(enabled);

  const { actionLoading, runAction } = useDashboardAction();
  const [remarkAction, setRemarkAction] = useState<{
    entryId: number;
    action: "APPROVED" | "REJECTED";
  } | null>(null);

  const filteredAllEntries = useMemo(() => {
    if (!employeeEntries.length) return [];
    const projectCode = expandedProject?.trim().toUpperCase() ?? "";
    if (!projectCode) return employeeEntries;
    const filtered = employeeEntries.filter(
      (entry) => entry.project_code.trim().toUpperCase() === projectCode
    );
    return filtered.length ? filtered : employeeEntries;
  }, [employeeEntries, expandedProject]);

  const refreshAfterStatusChange = useCallback(async () => {
    if (selectedEmployee) {
      await queryClient.refetchQueries({
        queryKey: ["project-timelogs-employee-detail", selectedEmployee],
      });
    }
    await queryClient.refetchQueries({ queryKey: ["project-timelogs-approved-totals"] });
    await queryClient.refetchQueries({ queryKey: ["project-timelogs-projects"] });
  }, [queryClient, selectedEmployee]);

  const handleBackFromEmployee = useCallback(() => {
    selectEmployee(null);
    void queryClient.refetchQueries({ queryKey: ["project-timelogs-approved-totals"] });
  }, [selectEmployee, queryClient]);

  const handleEntryRemarkConfirm = async (remark: string) => {
    const action = remarkAction;
    if (!action) return;
    const entry = employeeEntries.find((item) => item.id === action.entryId);
    const ok = await runAction(
      action.action === "APPROVED" ? "Approve Time Log" : "Reject Time Log",
      async () => {
        await hrmsService.updateTimelogStatus({
          timelog_id: action.entryId,
          status: action.action,
          manager_comment: remark || undefined,
        });

        queryClient.setQueriesData<EmployeeDetailCache>(
          { queryKey: ["project-timelogs-employee-detail", selectedEmployee] },
          (old) => {
            if (!old) return old;
            return {
              ...old,
              entries: patchEntriesStatus(old.entries, [action.entryId], action.action, remark),
            };
          }
        );

        if (entry && expandedProject && selectedEmployee) {
          queryClient.setQueriesData<ProjectWeekEmployeeTotal[]>(
            { queryKey: ["project-timelogs-approved-totals", expandedProject] },
            (old) => {
              const base = old ?? weekTotals[expandedProject] ?? [];
              return (
                patchApprovedTotalsForEntry(base, selectedEmployee, entry, action.action) ?? base
              );
            }
          );
        }

        await refreshAfterStatusChange();
      }
    );
    if (ok) setRemarkAction(null);
  };

  if (selectedEmployee) {
    return (
      <>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" type="button" onClick={handleBackFromEmployee}>
                ← Back
              </Button>
              <CardTitle className="text-base">{selectedEmployee}</CardTitle>
            </div>
            <div className="flex items-end gap-2">
              <TimelogDateRangeFields
                fromDate={fromDate}
                toDate={toDate}
                onFromDateChange={setFromDate}
                onToDateChange={setToDate}
              />
              <RefreshIconButton onClick={() => void reload()} loading={employeeWeekLoading} />
            </div>
          </CardHeader>
          <CardContent className="relative space-y-3">
            {actionLoading ? (
              <div className="absolute inset-0 z-20 flex items-center justify-center rounded-lg bg-wt-surface-1/70">
                <WtLoaderCentered label="" />
              </div>
            ) : null}
            {employeeWeekLoading && !filteredAllEntries.length ? (
              <WtLoaderCentered label="" />
            ) : employeeWeekError ? (
              <p className="text-sm text-rose-400">{employeeWeekError}</p>
            ) : !filteredAllEntries.length ? (
              <p className="py-10 text-center text-sm text-wt-text-muted">No Time Log Entries</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-wt-border">
                <table className="w-full border-collapse text-sm">
                  <thead className="bg-wt-surface-2 text-wt-text-muted">
                    <tr>
                      <th className="px-2 py-2 text-left font-medium whitespace-nowrap">Date</th>
                      <th className="px-2 py-2 text-left font-medium">Project</th>
                      <th className="px-2 py-2 text-left font-medium">Task Category</th>
                      <th className="px-2 py-2 text-center font-medium">Hours</th>
                      <th className="px-2 py-2 text-center font-medium">Status</th>
                      <th className="px-2 py-2 text-center font-medium">Approve / Reject</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAllEntries.map((entry: DayTimelogEntry) => {
                      const isActionable =
                        entry.status === "SUBMITTED" || entry.status === "REJECTED";
                      return (
                        <tr
                          key={`${entry.id}-${toIsoDateKey(entry.log_date)}`}
                          className="border-t border-wt-border hover:bg-wt-surface-2/50"
                        >
                          <td className="px-2 py-2 whitespace-nowrap tabular-nums">
                            {entry.log_date}
                          </td>
                          <td className="px-2 py-2 whitespace-nowrap">{entry.project_code}</td>
                          <td className="px-2 py-2 whitespace-nowrap">
                            {TASK_CATEGORY_LABELS[entry.task_category] ?? entry.task_category}
                          </td>
                          <td className="px-2 py-2 text-center tabular-nums">{entry.hours}h</td>
                          <td className="px-2 py-2 text-center">
                            <span className={entryStatusClass(entry.status)}>
                              {formatUiStatusLabel(entry.status)}
                            </span>
                          </td>
                          <td className="px-2 py-2 text-center whitespace-nowrap">
                            {isActionable && entry.id > 0 ? (
                              <div className="flex justify-center gap-1">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="xs"
                                  disabled={actionLoading}
                                  className="border-emerald-300 px-1.5 py-0.5 text-[10px] text-emerald-700 hover:bg-emerald-50"
                                  onClick={() =>
                                    setRemarkAction({ entryId: entry.id, action: "APPROVED" })
                                  }
                                >
                                  Approve
                                </Button>
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="xs"
                                  disabled={actionLoading}
                                  className="px-1.5 py-0.5 text-[10px]"
                                  onClick={() =>
                                    setRemarkAction({ entryId: entry.id, action: "REJECTED" })
                                  }
                                >
                                  Reject
                                </Button>
                              </div>
                            ) : (
                              <span className="text-xs text-wt-text-muted">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
        <ApprovalRemarkModal
          open={remarkAction !== null}
          title={
            remarkAction?.action === "APPROVED" ? "Approve Time Log Entry" : "Reject Time Log Entry"
          }
          actionLabel={remarkAction?.action === "APPROVED" ? "Approve" : "Reject"}
          actionVariant={remarkAction?.action === "REJECTED" ? "destructive" : "brand"}
          loading={actionLoading}
          onConfirm={handleEntryRemarkConfirm}
          onCancel={() => {
            if (!actionLoading) setRemarkAction(null);
          }}
        />
      </>
    );
  }

  if (projectsLoading && !projects.length) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-4">
          <WtLoaderCentered label="" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle>Team Time Logs</CardTitle>
        <div className="flex items-end gap-2">
          <TimelogDateRangeFields
            fromDate={fromDate}
            toDate={toDate}
            onFromDateChange={setFromDate}
            onToDateChange={setToDate}
          />
          <RefreshIconButton
            onClick={() => void reload()}
            loading={projectsLoading || weekTotalsLoading}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {projectsError ? (
          <p className="text-sm text-rose-400">{projectsError}</p>
        ) : null}
        {pendingApprovals.length ? (
          <div className="space-y-2 rounded-lg border border-[var(--wt-brand)]/30 bg-[var(--wt-brand-soft)]/40 p-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-wt-text">
                Pending Approvals ({pendingApprovals.length})
              </h3>
              <span className="text-xs text-wt-text-muted">
                Submitted time logs waiting for your review
              </span>
            </div>
            <div className="overflow-x-auto rounded-md border border-wt-border bg-wt-surface-1">
              <table className="w-full border-collapse text-sm">
                <thead className="bg-wt-surface-2 text-wt-text-muted">
                  <tr>
                    <th className="px-2 py-2 text-left font-medium">Employee</th>
                    <th className="px-2 py-2 text-left font-medium">Project</th>
                    <th className="px-2 py-2 text-left font-medium whitespace-nowrap">Date</th>
                    <th className="px-2 py-2 text-center font-medium">Hours</th>
                    <th className="px-2 py-2 text-center font-medium">Status</th>
                    <th className="px-2 py-2 text-center font-medium">Approve / Reject</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingApprovals.map((item) => (
                    <tr
                      key={item.timelog_id}
                      className="border-t border-wt-border hover:bg-wt-surface-2/50"
                    >
                      <td className="px-2 py-2">
                        <div className="font-medium text-wt-text">{item.employee_name}</div>
                        <div className="text-xs text-wt-text-muted">{item.employee_email}</div>
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap">
                        <div>{item.project_name}</div>
                        <div className="text-xs text-wt-text-muted">{item.project_code}</div>
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap tabular-nums">{item.log_date}</td>
                      <td className="px-2 py-2 text-center tabular-nums">{item.hours}h</td>
                      <td className="px-2 py-2 text-center">
                        <span className={entryStatusClass(item.status)}>
                          {formatUiStatusLabel(item.status)}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-center whitespace-nowrap">
                        <div className="flex justify-center gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="xs"
                            disabled={actionLoading}
                            className="border-emerald-300 px-1.5 py-0.5 text-[10px] text-emerald-700 hover:bg-emerald-50"
                            onClick={() =>
                              setRemarkAction({ entryId: item.timelog_id, action: "APPROVED" })
                            }
                          >
                            Approve
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="xs"
                            disabled={actionLoading}
                            className="px-1.5 py-0.5 text-[10px]"
                            onClick={() =>
                              setRemarkAction({ entryId: item.timelog_id, action: "REJECTED" })
                            }
                          >
                            Reject
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
        <ProjectTimelogCardList
          projects={projects}
          weekTotals={weekTotals}
          weekTotalsLoading={weekTotalsLoading}
          expandedProject={expandedProject}
          selectedEmployee={selectedEmployee}
          onToggleProject={toggleProject}
          onSelectEmployee={selectEmployee}
        />
      </CardContent>
    </Card>
  );
}
