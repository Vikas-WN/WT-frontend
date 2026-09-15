"use client";

import { useMemo, useState } from "react";
import { TrendingUp } from "lucide-react";

import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { ComingSoonPanel } from "@/components/dashboard/ComingSoonPanel";
import { ContentCard } from "@/components/dashboard/ui/ContentCard";
import { PageTabs, PAGE_TAB_BODY_CLASS } from "@/components/dashboard/ui/PageTabs";
import { KpiDefinitionsPanel } from "@/components/dashboard/pulse/KpiDefinitionsPanel";
import { WebknotValuesPanel } from "@/components/dashboard/pulse/WebknotValuesPanel";
import { CertificationsPanel } from "@/components/dashboard/pulse/CertificationsPanel";
import { KpiReportsPanel } from "@/components/dashboard/pulse/KpiReportsPanel";
import { SubmissionPortalPanel } from "@/components/dashboard/pulse/SubmissionPortalPanel";
import { SubmissionsReviewPanel } from "@/components/dashboard/pulse/SubmissionsReviewPanel";
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

/** Employee and manager Pulse are shown as "coming soon" for now — the real
 *  implementation (EmployeeMonthlyReviewPanel, ManagerTeamReviewPanel,
 *  MyKpiSummaryPanel) is untouched and importable for a one-line restore,
 *  same pattern as referral/page.tsx and background-verification/page.tsx.
 *  Admin's Pulse (KPI Definitions / Submissions / Submission Portal) stays live. */
function PulseEmployeePageClient() {
  return (
    <ComingSoonPanel
      title="Pulse"
      description="Your monthly KPI self-review is on its way. Everything behind the scenes stays wired — you'll get access as soon as it launches."
      icon={<TrendingUp className="size-6" />}
    />
  );
}

function PulseManagerPageClient() {
  return (
    <ComingSoonPanel
      title="Pulse"
      description="Your team's monthly KPI reviews are on their way. Everything behind the scenes stays wired — you'll get access as soon as it launches."
      icon={<TrendingUp className="size-6" />}
    />
  );
}

type AdminTab = "submissions" | "kpis" | "values" | "certifications" | "reports" | "portal";

function PulseAdminPageClient() {
  const [tab, setTab] = useState<AdminTab>("submissions");

  return (
    <DashboardPageShell className="wt-detail-page">
      <ContentCard>
        <div className="border-b border-wt-border px-5 py-4 sm:px-8">
          <h2 className="text-lg font-semibold text-wt-text">Pulse</h2>
          <p className="mt-1 text-sm text-wt-text-muted">
            Define KPIs and WebKnot values per band and designation, open or close the submission
            window, give final approval, and review KPI reports.
          </p>
        </div>

        <PageTabs
          embedded
          aria-label="Pulse admin tabs"
          value={tab}
          onValueChange={(value) => setTab(value as AdminTab)}
          items={[
            { value: "submissions", label: "Submissions" },
            { value: "kpis", label: "KPI Definitions" },
            { value: "values", label: "WebKnot Values" },
            { value: "certifications", label: "Certifications" },
            { value: "reports", label: "KPI Reports" },
            { value: "portal", label: "Submission Portal" },
          ]}
        />

        <div className={PAGE_TAB_BODY_CLASS}>
          {tab === "submissions" ? (
            <SubmissionsReviewPanel />
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
          )}
        </div>
      </ContentCard>
    </DashboardPageShell>
  );
}
