"use client";

import { Button } from "@/components/ui/button";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { EmptyState } from "@/components/dashboard/ui/EmptyState";
import { ContentCard } from "@/components/dashboard/ui/ContentCard";
import { PageSectionHeader } from "@/components/dashboard/ui/PageSectionHeader";
import { INNER_PANEL_CLASS } from "@/components/dashboard/ui/uiLayout";
import { OnboardingGate } from "@/components/dashboard/shared/OnboardingGate";
import { useDashboardAction } from "@/components/dashboard/shared/useDashboardAction";
import { SelectField } from "@/components/dashboard/ui/forms";
import { ApprovalRemarkModal } from "@/components/dashboard/timelog/ApprovalRemarkModal/ApprovalRemarkModal";
import { HrEmployeeTimelogWeekModal } from "@/components/dashboard/timelog/HrEmployeeTimelogWeekModal";
import { HrMonthlyTimelogSummary } from "@/components/dashboard/timelog/HrMonthlyTimelogSummary";
import { MyWeeklyTimesheet } from "@/components/dashboard/timelog/MyWeeklyTimesheet";
import { ProjectTimelogPanel } from "@/components/dashboard/timelog/ProjectTimelogPanel/ProjectTimelogPanel";
import { DatePicker } from "@/components/ui/date-picker";
import { formatUiStatusLabel } from "@/utils/statusLabel";
import {
  currentMonthRef,
  type MonthRef,
} from "@/utils/timelog/monthWeeks";
import {
  useHrMonthlyTimelogSummary,
  type HrTimelogEmployee,
  type HrMonthlyTimelogRow,
} from "@/hooks/timelog/useHrMonthlyTimelogSummary";
import { WtLoaderCentered } from "@/components/dashboard/ui/WtLoader";
import { HrReviewNoticeBanner } from "@/components/hr-review/HrReviewNoticeBanner";
import { hrmsService } from "@/services/hrms.service";
import { toPagedRows } from "@/utils/apiRows";
import { isOffboardedUserStatus, shouldRequireSelfOnboarding } from "@/utils/userStatus";
import { TASK_CATEGORY_LABELS } from "@/utils/timelog/categories";
import { formatApiDate } from "@/utils/apiDate";
import type { DayTimelogEntry } from "@/hooks/timelog/useDayTimelog.types";
import { timelogViewerRoles } from "@/utils/timelog/viewerRoles";
import { normalizeProjectTimelogsData } from "@/utils/timelog/normalizeProjectTimelogs";
import { normalizeDayTimelogEntries } from "@/utils/timelog/normalizeWeekSnapshot";
import { RefreshIconButton } from "@/components/dashboard/ui/RefreshIconButton";
import { SectionLoading } from "@/components/dashboard/ui/SectionLoading";
import { useTeamTimelogAccess } from "@/hooks/timelog/useTeamTimelogAccess";

function unwrapPayload<T>(response: unknown): T {
  return ((response as { data?: T }).data ?? response) as T;
}

function entryStatusClass(status: string): string {
  const map: Record<string, string> = {
    DRAFT: "rounded-md bg-wt-surface-3 px-2 py-0.5 text-xs font-medium text-wt-text-muted",
    SUBMITTED: "rounded-md bg-[var(--wt-brand-soft)] px-2 py-0.5 text-xs font-medium text-[var(--wt-brand)]",
    APPROVED: "rounded-md bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-300",
    REJECTED: "rounded-md bg-rose-500/15 px-2 py-0.5 text-xs font-medium text-rose-300",
  };
  return map[status] ?? map.DRAFT;
}

export function TimelogPageClient() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const roles = user?.roles ?? [];
  const viewerRoles = useMemo(() => timelogViewerRoles(roles), [roles]);
  const hasManagerAccess = roles.includes("ROLE_MANAGER");
  const hasHrAccess = roles.includes("ROLE_HR");
  const hasAdminAccess = roles.includes("ROLE_ADMIN");
  const hasAmRole = roles.includes("ROLE_AM");
  const isOffboarded = isOffboardedUserStatus(user?.status);
  const requiresSelfOnboarding = shouldRequireSelfOnboarding(user?.status);

  const subTab = pathname.endsWith("/dashboard/timelog/team")
    ? "team"
    : pathname.endsWith("/dashboard/timelog/projects")
      ? "projects"
      : "my";
  const { canViewTeamTimelogs, isCheckingAccess } = useTeamTimelogAccess();
  const canSeeTeamTab = canViewTeamTimelogs;
  const isTeamView = subTab === "team";
  const isProjectView = subTab === "projects";
  const canManagerApprove = isTeamView || isProjectView;
  const isHrTeamView = isTeamView && hasHrAccess && !hasManagerAccess && !hasAdminAccess;

  // Default to last 6 months (same range used when filters were empty).
  const [teamFromDate, setTeamFromDate] = useState(() => {
    const end = new Date();
    end.setHours(0, 0, 0, 0);
    const start = new Date(end);
    start.setMonth(start.getMonth() - 6);
    return formatApiDate(start);
  });
  const [teamToDate, setTeamToDate] = useState(() => {
    const end = new Date();
    end.setHours(0, 0, 0, 0);
    return formatApiDate(end);
  });
  const [employeeEntries, setEmployeeEntries] = useState<DayTimelogEntry[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [teamEmployeeEmail, setTeamEmployeeEmail] = useState("");
  const [employeeOptions, setEmployeeOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [hrMonth, setHrMonth] = useState<MonthRef>(() => currentMonthRef());
  const [hrWeekDetail, setHrWeekDetail] = useState<{
    email: string;
    label: string;
    weekStart: string;
  } | null>(null);
  const [rejectAction, setRejectAction] = useState<{ entryId: number } | null>(null);

  const teamDateRange = useMemo(() => {
    if (teamFromDate.trim() && teamToDate.trim()) {
      return { from: teamFromDate.trim(), to: teamToDate.trim() };
    }
    const end = new Date();
    end.setHours(0, 0, 0, 0);
    const start = new Date(end);
    start.setMonth(start.getMonth() - 6);
    return { from: formatApiDate(start), to: formatApiDate(end) };
  }, [teamFromDate, teamToDate]);

  const hrEmployees = useMemo<HrTimelogEmployee[]>(
    () => employeeOptions.map((opt) => ({ email: opt.value, label: opt.label })),
    [employeeOptions]
  );

  const hrMonthlySummary = useHrMonthlyTimelogSummary(hrEmployees, hrMonth, isHrTeamView);
  const hrMonthlyRows = useMemo(
    () =>
      hrMonthlySummary.rows.filter((row) =>
        Object.values(row.hoursByWeek).some((hours) => Number(hours) > 0)
      ),
    [hrMonthlySummary.rows]
  );

  const { actionLoading, runAction } = useDashboardAction();

  const loadEmployeeEntries = useCallback(
    async (overrideEmail?: string) => {
      if (!isTeamView) return;
      const email = (overrideEmail ?? teamEmployeeEmail).trim().toLowerCase();
      if (!email) return;
      setEntriesLoading(true);
      try {
        const res = await hrmsService.getTimelogEmployeeEntries({
          employeeEmail: email,
          startDate: teamDateRange.from,
          endDate: teamDateRange.to,
          viewerRoles: viewerRoles.length ? viewerRoles : undefined,
        });
        setEmployeeEntries(normalizeDayTimelogEntries(unwrapPayload(res)));
      } catch {
        setEmployeeEntries([]);
      } finally {
        setEntriesLoading(false);
      }
    },
    [isTeamView, teamEmployeeEmail, teamDateRange.from, teamDateRange.to, viewerRoles]
  );

  useEffect(() => {
    if (!isTeamView || !teamEmployeeEmail.trim()) return;
    void loadEmployeeEntries();
  }, [isTeamView, teamEmployeeEmail, teamDateRange.from, teamDateRange.to, loadEmployeeEntries]);

  const loadTeamEmployees = useCallback(async () => {
    const sortItems = (items: Array<{ value: string; label: string }>) =>
      items.sort((a, b) => a.label.localeCompare(b.label));

    if (hasHrAccess || (hasAdminAccess && !hasManagerAccess)) {
      const res = await hrmsService.getOnboardList({ page: "0", size: "500" });
      const rows = toPagedRows((res as { data?: unknown }).data ?? res);
      setEmployeeOptions(
        sortItems(
          rows
            .map((r) => {
              const email = String(r.email ?? "").trim().toLowerCase();
              const name = String(r.name ?? email).trim();
              return email ? { value: email, label: name || email } : null;
            })
            .filter((item): item is { value: string; label: string } => Boolean(item))
        )
      );
      return;
    }

    // Source of truth for primary-manager inbox: GET /timelog/projects
    const res = await hrmsService.getTimelogProjects();
    const data = normalizeProjectTimelogsData(
      ((res as { data?: unknown }).data ?? res) as unknown
    );
    const emails = new Map<string, string>();
    for (const project of data.projects) {
      for (const emp of project.employees) {
        if (emp.email) emails.set(emp.email, emp.name || emp.email);
      }
    }
    setEmployeeOptions(
      sortItems(Array.from(emails.entries()).map(([value, label]) => ({ value, label })))
    );
  }, [hasHrAccess, hasAdminAccess, hasManagerAccess]);

  useEffect(() => {
    if (!isTeamView && !isProjectView) return;
    void loadTeamEmployees().catch(() => setEmployeeOptions([]));
  }, [loadTeamEmployees, isTeamView, isProjectView]);

  const applyTimelogStatus = useCallback(
    async (entryId: number, status: "APPROVED" | "REJECTED", remark = "") => {
      const ok = await runAction(
        status === "APPROVED" ? "Approve Time Log" : "Reject Time Log",
        async () => {
          await hrmsService.updateTimelogStatus({
            timelog_id: entryId,
            status,
            manager_comment: remark || undefined,
          });
          setEmployeeEntries((prev) =>
            prev.map((entry) =>
              entry.id === entryId
                ? {
                    ...entry,
                    status,
                    manager_comment: remark || entry.manager_comment,
                  }
                : entry
            )
          );
          await loadEmployeeEntries();
        }
      );
      return ok;
    },
    [runAction, loadEmployeeEntries]
  );

  const handleApproveEntry = useCallback(
    (entryId: number) => {
      void applyTimelogStatus(entryId, "APPROVED");
    },
    [applyTimelogStatus]
  );

  const handleRejectConfirm = async (remark: string) => {
    const action = rejectAction;
    if (!action) return;
    const ok = await applyTimelogStatus(action.entryId, "REJECTED", remark);
    if (ok) setRejectAction(null);
  };

  useEffect(() => {
    // /team is legacy; primary-manager inbox lives on /projects (GET /timelog/projects).
    if (isTeamView && !isHrTeamView) {
      router.replace("/dashboard/timelog/projects");
    }
  }, [isTeamView, isHrTeamView, router]);

  useEffect(() => {
    if (isCheckingAccess) return;
    if ((isTeamView || isProjectView) && !canSeeTeamTab) {
      router.replace("/dashboard/timelog");
    }
  }, [isTeamView, isProjectView, canSeeTeamTab, isCheckingAccess, router]);

  if (isOffboarded) {
    return (
      <DashboardPageShell>
        <p className="text-sm text-wt-text-muted">Time Log access is not available for offboarded users.</p>
      </DashboardPageShell>
    );
  }

  if ((isTeamView || isProjectView) && isCheckingAccess) {
    return (
      <DashboardPageShell>
        <SectionLoading label="Loading Time Logs…" />
      </DashboardPageShell>
    );
  }

  if ((isTeamView || isProjectView) && !canSeeTeamTab) {
    return (
      <DashboardPageShell>
        <p className="text-sm text-wt-text-muted">Redirecting\u2026</p>
      </DashboardPageShell>
    );
  }

  return (
    <OnboardingGate requiresSelfOnboarding={requiresSelfOnboarding}>
      <DashboardPageShell>
        <ContentCard>
          {/*
            Personal Time Logs (/dashboard/timelog) is My-only — no Team tab.
            Team Time Logs lives under Manage → /dashboard/timelog/projects for
            manager/HR/admin roles only.
          */}
          <div className="space-y-6 p-4 sm:p-6">
          {hasAmRole ? <HrReviewNoticeBanner /> : null}

          {!isTeamView && !isProjectView ? (
            <MyWeeklyTimesheet />
          ) : null}

          {isProjectView && canSeeTeamTab ? (
            <ProjectTimelogPanel enabled />
          ) : null}

          {isHrTeamView ? (
            <div className={INNER_PANEL_CLASS}>
                <HrMonthlyTimelogSummary
                  month={hrMonth}
                  onMonthChange={setHrMonth}
                  weekStarts={hrMonthlySummary.weekStarts}
                  rows={hrMonthlyRows}
                  loading={hrMonthlySummary.loading}
                  error={hrMonthlySummary.error}
                  onRefresh={() => void hrMonthlySummary.reload()}
                  onRowClick={(row: HrMonthlyTimelogRow, weekStart: string) => {
                    setHrWeekDetail({ email: row.email, label: row.label, weekStart });
                  }}
                />
            </div>
          ) : null}

          {isTeamView && !isHrTeamView ? (
            <div className={INNER_PANEL_CLASS}>
                <PageSectionHeader
                  title="Team Time Logs"
                  action={
                    <div className="flex flex-wrap items-end gap-2">
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:min-w-[20rem]">
                        <DatePicker
                          label="From Date"
                          value={teamFromDate}
                          onChange={setTeamFromDate}
                          max={teamToDate || undefined}
                        />
                        <DatePicker
                          label="To Date"
                          value={teamToDate}
                          onChange={setTeamToDate}
                          min={teamFromDate || undefined}
                        />
                      </div>
                      <RefreshIconButton
                        onClick={() => void loadEmployeeEntries()}
                        loading={entriesLoading}
                      />
                    </div>
                  }
                />

                <SelectField
                  label="Employee"
                  required
                  className="max-w-md"
                  value={teamEmployeeEmail}
                  onChange={(v) => {
                    setTeamEmployeeEmail(v);
                    setEmployeeEntries([]);
                  }}
                  placeholder="Select employee"
                  options={employeeOptions}
                />

                {entriesLoading ? (
                  <WtLoaderCentered label="" />
                ) : !teamEmployeeEmail.trim() ? (
                  <EmptyState
                    title="Select an Employee"
                    description="Choose a team member to review their time log entries."
                    className="py-10"
                  />
                ) : !employeeEntries.length ? (
                  <EmptyState
                    title="No Time Log Entries"
                    description={
                      teamFromDate.trim() && teamToDate.trim()
                        ? "There are no entries for this employee during the selected dates."
                        : "There are no entries for this employee."
                    }
                    className="py-10"
                  />
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-wt-border">
                    <table className="w-full text-sm border-collapse">
                      <thead className="bg-wt-surface-2 text-wt-text-muted">
                        <tr>
                          <th className="text-left px-2 py-2 font-medium whitespace-nowrap">Date</th>
                          <th className="text-left px-2 py-2 font-medium">Project</th>
                          <th className="text-left px-2 py-2 font-medium">Task Category</th>
                          <th className="text-left px-2 py-2 font-medium">Sub Category</th>
                          <th className="text-left px-2 py-2 font-medium">Description</th>
                          <th className="text-center px-2 py-2 font-medium">Hours</th>
                          <th className="text-center px-2 py-2 font-medium">Status</th>
                          {canManagerApprove ? (
                            <th className="text-center px-2 py-2 font-medium">Approve / Reject</th>
                          ) : null}
                        </tr>
                      </thead>
                      <tbody>
                        {employeeEntries.map((entry) => {
                          const taskLabel = TASK_CATEGORY_LABELS[entry.task_category] ?? entry.task_category;
                          const isActionable = entry.status === "SUBMITTED" || entry.status === "REJECTED";
                          return (
                            <tr key={entry.id} className="border-t border-wt-border hover:bg-wt-surface-2/50">
                              <td className="px-2 py-2 whitespace-nowrap tabular-nums">{entry.log_date}</td>
                              <td className="px-2 py-2 whitespace-nowrap">
                                {entry.project_name?.trim() || "—"}
                              </td>
                              <td className="px-2 py-2 whitespace-nowrap">{taskLabel}</td>
                              <td className="px-2 py-2 whitespace-nowrap">{entry.sub_category || "—"}</td>
                              <td className="px-2 py-2 max-w-[240px]">
                                <span className="line-clamp-3 whitespace-pre-wrap break-words" title={entry.description || undefined}>
                                  {entry.description || "—"}
                                </span>
                              </td>
                              <td className="px-2 py-2 text-center tabular-nums">{entry.hours}h</td>
                              <td className="px-2 py-2 text-center">
                                <span className={entryStatusClass(entry.status)}>
                                  {formatUiStatusLabel(entry.status)}
                                </span>
                                {entry.manager_comment ? (
                                  <div className="text-[10px] text-wt-text-muted mt-0.5 max-w-[120px] truncate" title={entry.manager_comment}>
                                    Remark: {entry.manager_comment}
                                  </div>
                                ) : null}
                              </td>
                              {canManagerApprove ? (
                                <td className="px-2 py-2 text-center whitespace-nowrap">
                                  {isActionable ? (
                                    <div className="flex gap-1 justify-center">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="xs"
                                        className="border-emerald-300 px-1.5 py-0.5 text-[10px] text-emerald-700 hover:bg-emerald-50"
                                        onClick={() => handleApproveEntry(entry.id)}
                                      >
                                        Approve
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="destructive"
                                        size="xs"
                                        className="px-1.5 py-0.5 text-[10px]"
                                        onClick={() => setRejectAction({ entryId: entry.id })}
                                      >
                                        Reject
                                      </Button>
                                    </div>
                                  ) : (
                                    <span className="text-xs text-wt-text-muted">—</span>
                                  )}
                                </td>
                              ) : null}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
            </div>
          ) : null}
          </div>
        </ContentCard>
        {isHrTeamView && hrWeekDetail ? (
          <HrEmployeeTimelogWeekModal
            open
            employeeEmail={hrWeekDetail.email}
            employeeLabel={hrWeekDetail.label}
            weekStart={hrWeekDetail.weekStart}
            weekStarts={hrMonthlySummary.weekStarts}
            onWeekStartChange={(weekStart) =>
              setHrWeekDetail((prev) => (prev ? { ...prev, weekStart } : prev))
            }
            onClose={() => setHrWeekDetail(null)}
          />
        ) : null}
        <ApprovalRemarkModal
          open={rejectAction !== null}
          title="Reject Time Log entry"
          actionLabel="Reject"
          actionVariant="destructive"
          loading={actionLoading}
          remarkPlaceholder="Optional remark…"
          onConfirm={handleRejectConfirm}
          onCancel={() => {
            if (!actionLoading) setRejectAction(null);
          }}
        />
      </DashboardPageShell>
    </OnboardingGate>
  );
}
