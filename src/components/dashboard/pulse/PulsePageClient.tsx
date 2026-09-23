"use client";

import { useMemo, useState, type ReactNode } from "react";

import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { ContentCard } from "@/components/dashboard/ui/ContentCard";
import { PageTabs, PAGE_TAB_BODY_CLASS } from "@/components/dashboard/ui/PageTabs";
import { KpiDefinitionsPanel } from "@/components/dashboard/pulse/KpiDefinitionsPanel";
import { WebknotValuesPanel } from "@/components/dashboard/pulse/WebknotValuesPanel";
import { CertificationsPanel } from "@/components/dashboard/pulse/CertificationsPanel";
import { KpiReportsPanel } from "@/components/dashboard/pulse/KpiReportsPanel";
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

type TabItem<T extends string> = { value: T; label: string };

/** Shared shell for every role's Pulse view: header + tabs + active panel. */
function PulseTabsPage<T extends string>({
  description,
  items,
  initial,
  render,
}: {
  description: string;
  items: TabItem<T>[];
  initial: T;
  render: (tab: T) => ReactNode;
}) {
  const [tab, setTab] = useState<T>(initial);
  return (
    <DashboardPageShell className="wt-detail-page">
      <ContentCard>
        <div className="border-b border-wt-border px-5 py-4 sm:px-8">
          <h2 className="text-lg font-semibold text-wt-text">Pulse</h2>
          <p className="mt-1 text-sm text-wt-text-muted">{description}</p>
        </div>
        <PageTabs
          embedded
          aria-label="Pulse tabs"
          value={tab}
          onValueChange={(value) => setTab(value as T)}
          items={items}
        />
        <div className={PAGE_TAB_BODY_CLASS}>{render(tab)}</div>
      </ContentCard>
    </DashboardPageShell>
  );
}

type EmployeeTab = "review" | "history";

function PulseEmployeePageClient() {
  return (
    <PulseTabsPage<EmployeeTab>
      description="Fill in your monthly KPI self-review while the window is open, and track how past reviews were rated."
      initial="review"
      items={[
        { value: "review", label: "My Review" },
        { value: "history", label: "My KPI Summary" },
      ]}
      render={(tab) => (tab === "review" ? <EmployeeMonthlyReviewPanel /> : <MyKpiSummaryPanel />)}
    />
  );
}

type ManagerTab = "team" | "review" | "history";

function PulseManagerPageClient() {
  return (
    <PulseTabsPage<ManagerTab>
      description="Review your team's monthly self-reviews, and submit your own."
      initial="team"
      items={[
        { value: "team", label: "Team Reviews" },
        { value: "review", label: "My Review" },
        { value: "history", label: "My KPI Summary" },
      ]}
      render={(tab) =>
        tab === "team" ? (
          <ManagerTeamReviewPanel />
        ) : tab === "review" ? (
          <EmployeeMonthlyReviewPanel />
        ) : (
          <MyKpiSummaryPanel />
        )
      }
    />
  );
}

type AdminTab =
  | "submissions"
  | "manager-reviews"
  | "my-review"
  | "kpis"
  | "values"
  | "certifications"
  | "reports"
  | "portal";

function PulseAdminPageClient() {
  return (
    <PulseTabsPage<AdminTab>
      description="Define KPIs and WebKnot values per band and designation, open or close the submission window, give final approval, and review KPI reports."
      initial="submissions"
      items={[
        { value: "submissions", label: "Submissions" },
        // HR/Admin can act as reviewer for anyone — this is how submissions
        // from employees with no manager on record get their manager step.
        { value: "manager-reviews", label: "Manager Reviews" },
        { value: "my-review", label: "My Review" },
        { value: "kpis", label: "KPI Definitions" },
        { value: "values", label: "WebKnot Values" },
        { value: "certifications", label: "Certifications" },
        { value: "reports", label: "KPI Reports" },
        { value: "portal", label: "Submission Portal" },
      ]}
      render={(tab) =>
        tab === "submissions" ? (
          <SubmissionsReviewPanel />
        ) : tab === "manager-reviews" ? (
          <ManagerTeamReviewPanel />
        ) : tab === "my-review" ? (
          <EmployeeMonthlyReviewPanel />
        ) : tab === "kpis" ? (
          <KpiDefinitionsPanel />
        ) : tab === "values" ? (
          <WebknotValuesPanel />
        ) : tab === "certifications" ? (
          <CertificationsPanel />
        ) : tab === "reports" ? (
          <KpiReportsPanel />
        ) : (
          <SubmissionPortalPanel />
        )
      }
    />
  );
}
