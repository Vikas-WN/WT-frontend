"use client";

import { useMemo, useState } from "react";
import {
  BadgeCheck,
  Briefcase,
  ChevronDown,
  ChevronRight,
  Percent,
  UserCog,
} from "lucide-react";
import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { ContentCard } from "@/components/dashboard/ui/ContentCard";
import { EmptyState } from "@/components/dashboard/ui/EmptyState";
import { RefreshIconButton } from "@/components/dashboard/ui/RefreshIconButton";
import { ScrollableTable } from "@/components/dashboard/ui/ScrollableTable";
import { SectionLoading } from "@/components/dashboard/ui/SectionLoading";
import { PageTabs, PAGE_TAB_BODY_CLASS } from "@/components/dashboard/ui/PageTabs";
import { FormSection } from "@/components/dashboard/ui/FormSection";
import { useAuth } from "@/context/AuthContext";
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

function pctValue(raw: string | undefined | null): number {
  const n = parseFloat(String(raw ?? "").replace("%", ""));
  return Number.isFinite(n) ? n : 0;
}

/** Labelled key/value cell for the "your assignment" strip — clearer than a
 *  run of unlabelled pills once there's more than one or two facts to show. */
function AssignmentField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-medium uppercase tracking-wide text-wt-text-faint">
        {label}
      </p>
      <p className="mt-0.5 truncate text-sm font-medium text-wt-text">{value}</p>
    </div>
  );
}

function SummaryStrip({
  projects,
  hideOperationalDetails,
}: {
  projects: MyAllocationProject[];
  hideOperationalDetails: boolean;
}) {
  const totalPct = projects.reduce(
    (sum, p) => sum + pctValue(p.myAllocation?.allocatedPercent),
    0
  );
  const managing = projects.filter((p) => p.capacity !== "team_member").length;
  const billable = projects.filter((p) =>
    /billable/i.test(p.myAllocation?.billingStatus ?? "") &&
    !/non[-\s]?billable/i.test(p.myAllocation?.billingStatus ?? "")
  ).length;

  const tiles: { key: string; label: string; value: string; icon: React.ReactNode }[] = [
    {
      key: "projects",
      label: projects.length === 1 ? "Active project" : "Active projects",
      value: String(projects.length),
      icon: <Briefcase className="size-4" />,
    },
  ];
  if (!hideOperationalDetails) {
    tiles.push({
      key: "allocation",
      label: "Total allocation",
      value: `${Math.round(totalPct)}%`,
      icon: <Percent className="size-4" />,
    });
    tiles.push({
      key: "billable",
      label: "Billable",
      value: String(billable),
      icon: <BadgeCheck className="size-4" />,
    });
  }
  tiles.push({
    key: "managing",
    label: "As manager",
    value: String(managing),
    icon: <UserCog className="size-4" />,
  });

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
      {tiles.map((t) => (
        <div
          key={t.key}
          className="rounded-xl border border-wt-border bg-wt-surface-1 px-3.5 py-3"
        >
          <div className="flex items-center gap-1.5 text-wt-text-faint">
            {t.icon}
            <span className="text-[11px] font-medium uppercase tracking-wide">
              {t.label}
            </span>
          </div>
          <p className="mt-1.5 text-2xl font-semibold tabular-nums text-wt-text">
            {t.value}
          </p>
        </div>
      ))}
    </div>
  );
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
  defaultExpanded = false,
}: {
  project: MyAllocationProject;
  hideOperationalDetails?: boolean;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const { myAllocation, capacity } = project;
  const rosterCount = project.projectManagers.length + project.teamMembers.length;

  return (
    <section className="rounded-2xl border border-wt-border bg-wt-surface-1">
      <button
        type="button"
        className="flex w-full items-start justify-between gap-3 px-4 py-4 text-left sm:px-5"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-semibold text-wt-text">{project.projectName}</h3>
            <span className="rounded-md bg-wt-surface-2 px-2 py-0.5 text-[11px] font-medium text-wt-text-muted">
              {capacityLabel(capacity)}
            </span>
          </div>
          {project.clientName ? (
            <p className="mt-1 text-xs text-wt-text-muted">{project.clientName}</p>
          ) : null}

          {myAllocation ? (
            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 sm:flex sm:flex-wrap sm:gap-x-8">
              <AssignmentField label="Your role" value={formatRoleDisplayValue(myAllocation.role)} />
              {!hideOperationalDetails ? (
                <>
                  <AssignmentField
                    label="Allocation"
                    value={
                      <span className="flex items-center gap-2">
                        {myAllocation.allocatedPercent}
                        {pctValue(myAllocation.allocatedPercent) > 0 ? (
                          <span className="h-1.5 w-16 overflow-hidden rounded-full bg-wt-surface-2">
                            <span
                              className="block h-full rounded-full bg-[var(--wt-brand)]"
                              style={{
                                width: `${Math.min(100, pctValue(myAllocation.allocatedPercent))}%`,
                              }}
                            />
                          </span>
                        ) : null}
                      </span>
                    }
                  />
                  <AssignmentField
                    label="Duration"
                    value={`${formatDateLabel(myAllocation.startDate)} – ${formatDateLabel(myAllocation.endDate)}`}
                  />
                  {myAllocation.billingStatus && myAllocation.billingStatus !== "—" ? (
                    <AssignmentField label="Billing" value={myAllocation.billingStatus} />
                  ) : null}
                </>
              ) : null}
            </div>
          ) : (
            <p className="mt-3 text-sm text-wt-text-muted">
              You manage this project as Project Manager — no personal allocation.
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2 pt-0.5 text-xs text-wt-text-faint">
          {rosterCount > 0 ? (
            <span className="hidden sm:inline">
              {rosterCount} {rosterCount === 1 ? "person" : "people"}
            </span>
          ) : null}
          {expanded ? (
            <ChevronDown className="size-4 shrink-0 text-wt-text-muted" aria-hidden />
          ) : (
            <ChevronRight className="size-4 shrink-0 text-wt-text-muted" aria-hidden />
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
    <DashboardPageShell className="wt-detail-page">
      <ContentCard>
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-wt-border px-4 py-4 sm:px-6">
          <div>
            <h2 className="text-lg font-semibold text-wt-text">My Allocations</h2>
            <p className="mt-1 text-sm text-wt-text-muted">
              Your projects, teammates and allocation dates — including projects you
              manage without a personal allocation.
            </p>
          </div>
          <RefreshIconButton onClick={() => void refetch()} loading={isFetching} />
        </div>

        {isLoading ? (
          <div className="p-6">
            <SectionLoading label="" />
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
                  <>
                    <SummaryStrip
                      projects={currentProjects}
                      hideOperationalDetails={hideOperationalDetails}
                    />
                    {currentProjects.map((project) => (
                      <ProjectAllocationCard
                        key={project.projectCode}
                        project={project}
                        hideOperationalDetails={hideOperationalDetails}
                        defaultExpanded={currentProjects.length === 1}
                      />
                    ))}
                  </>
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
  );
}
