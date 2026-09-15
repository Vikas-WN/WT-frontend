"use client";

import { useMemo, useState } from "react";

import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { ContentCard } from "@/components/dashboard/ui/ContentCard";
import { PageTabs, PAGE_TAB_BODY_CLASS } from "@/components/dashboard/ui/PageTabs";
import { KpiDefinitionsPanel } from "@/components/dashboard/pulse/KpiDefinitionsPanel";
import { SubmissionPortalPanel } from "@/components/dashboard/pulse/SubmissionPortalPanel";
import { SubmissionsReviewPanel } from "@/components/dashboard/pulse/SubmissionsReviewPanel";
import { EmployeeMonthlyReviewPanel } from "@/components/dashboard/pulse/employee/EmployeeMonthlyReviewPanel";
import { MyKpiSummaryPanel } from "@/components/dashboard/pulse/employee/MyKpiSummaryPanel";
import { ManagerTeamReviewPanel } from "@/components/dashboard/pulse/manager/ManagerTeamReviewPanel";
import { useAuth } from "@/context/AuthContext";
import { normalizeRoles } from "@/utils/roles";

/** Pulse: everyone's monthly KPI self-review, in one place — employees and
 *  managers fill theirs in, managers review their team's, HR/Admin defines
 *  KPIs, runs the submission window, and gives final approval. */
export function PulsePageClient() {
  const { user } = useAuth();
  const roles = useMemo(() => normalizeRoles(user?.roles ?? []), [user?.roles]);
  const isHrOrAdmin = roles.includes("ROLE_HR") || roles.includes("ROLE_ADMIN");
  const isManager = roles.includes("ROLE_MANAGER") || roles.includes("ROLE_DM");

  if (isHrOrAdmin) return <PulseAdminPageClient />;
  if (isManager) return <PulseManagerPageClient />;
  return <PulseEmployeePageClient />;
}

function PulseEmployeePageClient() {
  const [tab, setTab] = useState<"review" | "summary">("review");

  return (
    <DashboardPageShell className="wt-detail-page">
      <ContentCard>
        <div className="border-b border-wt-border px-5 py-4 sm:px-8">
          <h2 className="text-lg font-semibold text-wt-text">Pulse</h2>
          <p className="mt-1 text-sm text-wt-text-muted">Your monthly KPI self-review.</p>
        </div>

        <PageTabs
          embedded
          aria-label="Pulse employee tabs"
          value={tab}
          onValueChange={(value) => setTab(value as "review" | "summary")}
          items={[
            { value: "review", label: "My Review" },
            { value: "summary", label: "My KPI Summary" },
          ]}
        />

        <div className={PAGE_TAB_BODY_CLASS}>
          {tab === "review" ? <EmployeeMonthlyReviewPanel /> : <MyKpiSummaryPanel />}
        </div>
      </ContentCard>
    </DashboardPageShell>
  );
}

function PulseManagerPageClient() {
  const [tab, setTab] = useState<"my-review" | "team" | "summary">("team");

  return (
    <DashboardPageShell className="wt-detail-page">
      <ContentCard>
        <div className="border-b border-wt-border px-5 py-4 sm:px-8">
          <h2 className="text-lg font-semibold text-wt-text">Pulse</h2>
          <p className="mt-1 text-sm text-wt-text-muted">
            Your monthly self-review, and your team&apos;s submissions awaiting review.
          </p>
        </div>

        <PageTabs
          embedded
          aria-label="Pulse manager tabs"
          value={tab}
          onValueChange={(value) => setTab(value as "my-review" | "team" | "summary")}
          items={[
            { value: "team", label: "Team Reviews" },
            { value: "my-review", label: "My Review" },
            { value: "summary", label: "My KPI Summary" },
          ]}
        />

        <div className={PAGE_TAB_BODY_CLASS}>
          {tab === "team" ? (
            <ManagerTeamReviewPanel />
          ) : tab === "my-review" ? (
            <EmployeeMonthlyReviewPanel />
          ) : (
            <MyKpiSummaryPanel />
          )}
        </div>
      </ContentCard>
    </DashboardPageShell>
  );
}

function PulseAdminPageClient() {
  const [tab, setTab] = useState<"kpis" | "portal" | "submissions">("submissions");

  return (
    <DashboardPageShell className="wt-detail-page">
      <ContentCard>
        <div className="border-b border-wt-border px-5 py-4 sm:px-8">
          <h2 className="text-lg font-semibold text-wt-text">Pulse</h2>
          <p className="mt-1 text-sm text-wt-text-muted">
            Define KPIs per band and designation, open or close the submission window, and give final
            approval on manager-reviewed submissions.
          </p>
        </div>

        <PageTabs
          embedded
          aria-label="Pulse admin tabs"
          value={tab}
          onValueChange={(value) => setTab(value as "kpis" | "portal" | "submissions")}
          items={[
            { value: "submissions", label: "Submissions" },
            { value: "kpis", label: "KPI Definitions" },
            { value: "portal", label: "Submission Portal" },
          ]}
        />

        <div className={PAGE_TAB_BODY_CLASS}>
          {tab === "submissions" ? (
            <SubmissionsReviewPanel />
          ) : tab === "kpis" ? (
            <KpiDefinitionsPanel />
          ) : (
            <SubmissionPortalPanel />
          )}
        </div>
      </ContentCard>
    </DashboardPageShell>
  );
}
