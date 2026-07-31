"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { ContentCard } from "@/components/dashboard/ui/ContentCard";
import { EmptyState } from "@/components/dashboard/ui/EmptyState";
import { RefreshIconButton } from "@/components/dashboard/ui/RefreshIconButton";
import { ScrollableTable } from "@/components/dashboard/ui/ScrollableTable";
import { SectionLoading } from "@/components/dashboard/ui/SectionLoading";
import { PageTabs, PAGE_TAB_BODY_CLASS } from "@/components/dashboard/ui/PageTabs";
import { FormSection } from "@/components/dashboard/ui/FormSection";
import { useAuth } from "@/context/AuthContext";
import { OnboardingGate } from "@/components/dashboard/shared/OnboardingGate";
import { useDashboardAccess } from "@/components/dashboard/shared/useDashboardAccess";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  WT_STICKY_TABLE_HEAD_CLASS,
  WtTable,
} from "@/components/dashboard/ui/wtTable";
import { ColleagueProfileLink } from "@/components/dashboard/my-allocations/ColleagueProfilePageClient";
import {
  useMyAllocationsDetail,
  type MyAllocationProject,
  type MyAllocationRow,
} from "@/hooks/allocation/useMyAllocationsDetail";
import { formatApiDateDisplay } from "@/utils/apiDate";
import { formatRoleDisplayValue, shouldHideAllocationOperationalDetails } from "@/utils/roles";
import { cn } from "@/lib/utils";

function formatDateLabel(value: string): string {
  if (!value || value === "—") return "—";
  return formatApiDateDisplay(value);
}

function HistoryTable({
  rows,
  emptyTitle,
  emptyDescription,
  hideOperationalDetails = false,
}: {
  rows: MyAllocationRow[];
  emptyTitle: string;
  emptyDescription: string;
  hideOperationalDetails?: boolean;
}) {
  if (!rows.length) {
    return <EmptyState title={emptyTitle} description={emptyDescription} className="py-10" />;
  }

  return (
    <ScrollableTable maxHeightClass="max-h-[min(70vh,560px)]">
      <WtTable>
        <TableHeader className={WT_STICKY_TABLE_HEAD_CLASS}>
          <TableRow className="hover:bg-transparent">
            <TableHead>Project</TableHead>
            <TableHead>Role</TableHead>
            {!hideOperationalDetails ? <TableHead>Allocation %</TableHead> : null}
            {!hideOperationalDetails ? <TableHead>Start Date</TableHead> : null}
            {!hideOperationalDetails ? <TableHead>End Date</TableHead> : null}
            {!hideOperationalDetails ? <TableHead>Billing Status</TableHead> : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="whitespace-nowrap">
                <div className="min-w-0">
                  <p className="font-medium text-wt-text">{row.projectName || "—"}</p>
                </div>
              </TableCell>
              <TableCell className="whitespace-nowrap">{formatRoleDisplayValue(row.role)}</TableCell>
              {!hideOperationalDetails ? (
                <TableCell className="whitespace-nowrap tabular-nums">{row.allocatedPercent}</TableCell>
              ) : null}
              {!hideOperationalDetails ? (
                <TableCell className="whitespace-nowrap">{formatDateLabel(row.startDate)}</TableCell>
              ) : null}
              {!hideOperationalDetails ? (
                <TableCell className="whitespace-nowrap">{formatDateLabel(row.endDate)}</TableCell>
              ) : null}
              {!hideOperationalDetails ? (
                <TableCell className="whitespace-nowrap">{row.billingStatus}</TableCell>
              ) : null}
            </TableRow>
          ))}
        </TableBody>
      </WtTable>
    </ScrollableTable>
  );
}

function capacityLabel(capacity: MyAllocationProject["capacity"]): string {
  if (capacity === "both") return "Team Member & Project Manager";
  if (capacity === "project_manager") return "Project Manager";
  return "Team Member";
}

function ProjectAllocationCard({
  project,
  hideOperationalDetails = false,
}: {
  project: MyAllocationProject;
  hideOperationalDetails?: boolean;
}) {
  const [expanded, setExpanded] = useState(true);
  const { myAllocation, capacity } = project;

  return (
    <section className="rounded-2xl border border-wt-border bg-wt-surface-1">
      <button
        type="button"
        className="flex w-full items-start justify-between gap-3 px-4 py-4 text-left sm:px-5"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {expanded ? (
              <ChevronDown className="size-4 shrink-0 text-wt-text-muted" aria-hidden />
            ) : (
              <ChevronRight className="size-4 shrink-0 text-wt-text-muted" aria-hidden />
            )}
            <h3 className="truncate text-base font-semibold text-wt-text">{project.projectName}</h3>
            <span className="rounded-md bg-wt-surface-2 px-2 py-0.5 text-[11px] font-medium text-wt-text-muted">
              {capacityLabel(capacity)}
            </span>
          </div>
          {project.clientName ? (
            <p className="mt-1 pl-6 text-xs text-wt-text-muted">{project.clientName}</p>
          ) : null}
          {myAllocation ? (
            <p className="mt-2 pl-6 text-sm text-wt-text-muted">
              Your Role: {formatRoleDisplayValue(myAllocation.role)}
              {!hideOperationalDetails ? (
                <>
                  {" "}
                  · {myAllocation.allocatedPercent} · {formatDateLabel(myAllocation.startDate)} –{" "}
                  {formatDateLabel(myAllocation.endDate)}
                </>
              ) : null}
            </p>
          ) : (
            <p className="mt-2 pl-6 text-sm text-wt-text-muted">
              You manage this project as Project Manager. Team allocation dates are listed below.
            </p>
          )}
        </div>
      </button>

      {expanded ? (
        <div className="space-y-5 border-t border-wt-border px-4 py-4 sm:px-5">
          <FormSection title="Project Managers" description="Click a project manager to view their profile.">
            {project.projectManagers.length ? (
              <ul className="space-y-2">
                {project.projectManagers.map((manager) => (
                  <li key={`${manager.userId}-${manager.employeeEmail}`} className="text-sm">
                    <ColleagueProfileLink
                      empId={manager.empId}
                      label={manager.employeeName}
                    />
                    <span className="text-wt-text-muted"> · {manager.employeeEmail}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-wt-text-muted">No project manager assigned.</p>
            )}
          </FormSection>

          <FormSection
            title="Team Members"
            description={
              hideOperationalDetails
                ? "Active employees on this project."
                : "Active employees on this project with their allocation dates."
            }
          >
            {project.teamMembers.length ? (
              <ScrollableTable maxHeightClass="max-h-[min(50vh,420px)]">
                <WtTable>
                  <TableHeader className={WT_STICKY_TABLE_HEAD_CLASS}>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Employee</TableHead>
                      <TableHead>Role</TableHead>
                      {!hideOperationalDetails ? <TableHead>Allocation %</TableHead> : null}
                      {!hideOperationalDetails ? <TableHead>Start Date</TableHead> : null}
                      {!hideOperationalDetails ? <TableHead>End Date</TableHead> : null}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {project.teamMembers.map((member) => (
                      <TableRow key={`${member.userId}-${member.employeeEmail}`}>
                        <TableCell className="whitespace-nowrap">
                          <ColleagueProfileLink empId={member.empId} label={member.employeeName} />
                          <p className="text-xs text-wt-text-muted">{member.employeeEmail}</p>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {formatRoleDisplayValue(member.role)}
                        </TableCell>
                        {!hideOperationalDetails ? (
                          <TableCell className="whitespace-nowrap tabular-nums">
                            {member.allocatedPercent}
                          </TableCell>
                        ) : null}
                        {!hideOperationalDetails ? (
                          <TableCell className="whitespace-nowrap">
                            {formatDateLabel(member.startDate)}
                          </TableCell>
                        ) : null}
                        {!hideOperationalDetails ? (
                          <TableCell className="whitespace-nowrap">
                            {formatDateLabel(member.endDate)}
                          </TableCell>
                        ) : null}
                      </TableRow>
                    ))}
                  </TableBody>
                </WtTable>
              </ScrollableTable>
            ) : (
              <p className="text-sm text-wt-text-muted">No active team members found on this project.</p>
            )}
          </FormSection>
        </div>
      ) : null}
    </section>
  );
}

export function MyAllocationsPageClient() {
  const { user } = useAuth();
  const { requiresSelfOnboarding } = useDashboardAccess();
  const hideOperationalDetails = shouldHideAllocationOperationalDetails(user?.roles ?? []);
  const { data, isLoading, isError, error, refetch, isFetching } = useMyAllocationsDetail();
  const [tab, setTab] = useState<"current" | "history">("current");

  const currentProjects = data?.currentProjects ?? [];
  const historyRows = data?.history ?? [];

  const tabItems = useMemo(
    () => [
      { value: "current", label: `Current (${currentProjects.length})` },
      { value: "history", label: `History (${historyRows.length})` },
    ],
    [currentProjects.length, historyRows.length]
  );

  return (
    <OnboardingGate requiresSelfOnboarding={requiresSelfOnboarding}>
    <DashboardPageShell className="wt-detail-page">
      <ContentCard>
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-wt-border px-4 py-4 sm:px-6">
          <div>
            <h2 className="text-lg font-semibold text-wt-text">My Allocations</h2>
            <p className="mt-1 text-sm text-wt-text-muted">
              View your project details, team members, project managers, and allocation dates. If you are
              a project manager, projects you manage appear here even without a personal allocation.
            </p>
          </div>
          <RefreshIconButton onClick={() => void refetch()} loading={isFetching} />
        </div>

        {isLoading ? (
          <div className="p-6">
            <SectionLoading label="Loading allocations…" />
          </div>
        ) : isError ? (
          <div className="p-6">
            <EmptyState
              title="Could Not Load Allocations"
              description={error instanceof Error ? error.message : "Please try again."}
              className="py-10"
            />
          </div>
        ) : (
          <>
            <PageTabs
              embedded
              aria-label="Allocation tabs"
              value={tab}
              onValueChange={(value) => setTab(value as "current" | "history")}
              items={tabItems}
            />
            <div className={cn(PAGE_TAB_BODY_CLASS, tab === "current" ? "space-y-4" : undefined)}>
              {tab === "current" ? (
                currentProjects.length ? (
                  currentProjects.map((project) => (
                    <ProjectAllocationCard
                      key={project.projectCode}
                      project={project}
                      hideOperationalDetails={hideOperationalDetails}
                    />
                  ))
                ) : (
                  <EmptyState
                    title="No Current Allocations"
                    description="You are not staffed on or managing any client projects right now."
                    className="py-10"
                  />
                )
              ) : (
                <HistoryTable
                  rows={historyRows}
                  emptyTitle="No Allocation History"
                  emptyDescription="Past project allocations will appear here after they end."
                  hideOperationalDetails={hideOperationalDetails}
                />
              )}
            </div>
          </>
        )}
      </ContentCard>
    </DashboardPageShell>
    </OnboardingGate>
  );
}
