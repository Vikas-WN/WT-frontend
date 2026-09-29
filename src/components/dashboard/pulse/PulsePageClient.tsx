"use client";

import { useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

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

/** `?tab=` targets used by links into Pulse (notifications). They're
 *  role-neutral — each role's page maps them onto its own tab, since the
 *  same step lives under a different tab per role. */
export type PulseTabLink = "team-reviews" | "my-review" | "submissions";

function resolveTab<T extends string>(
  raw: string | null,
  items: readonly TabItem<T>[],
  links: Partial<Record<PulseTabLink, T>>
): T | null {
  if (!raw) return null;
  const linked = links[raw as PulseTabLink];
  if (linked) return linked;
  return items.some((item) => item.value === raw) ? (raw as T) : null;
}

/** Shared shell for every role's Pulse view: header + tabs + active panel.
 *  The active tab is mirrored in `?tab=` so links can open a specific one. */
function PulseTabsPage<T extends string>({
  description,
  items,
  links,
  initial,
  render,
}: {
  description: string;
  items: readonly TabItem<T>[];
  links: Partial<Record<PulseTabLink, T>>;
  initial: T;
  render: (tab: T) => ReactNode;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  // The URL wins: following a notification link while already on Pulse only
  // changes the query string (no remount), and tab clicks write it too.
  const requested = resolveTab(searchParams.get("tab"), items, links);
  const [chosen, setChosen] = useState<T>(initial);
  const tab = requested ?? chosen;

  const changeTab = (value: T) => {
    setChosen(value);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };
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
          onValueChange={(value) => changeTab(value as T)}
          items={items}
        />
        <div className={PAGE_TAB_BODY_CLASS}>{render(tab)}</div>
      </ContentCard>
    </DashboardPageShell>
  );
}

type EmployeeTab = "review" | "history";

const EMPLOYEE_TABS: readonly TabItem<EmployeeTab>[] = [
  { value: "review", label: "My Review" },
  { value: "history", label: "My KPI Summary" },
];
const EMPLOYEE_LINKS: Partial<Record<PulseTabLink, EmployeeTab>> = { "my-review": "review" };

function PulseEmployeePageClient() {
  return (
    <PulseTabsPage<EmployeeTab>
      description="Fill in your monthly KPI self-review while the window is open, and track how past reviews were rated."
      initial="review"
      items={EMPLOYEE_TABS}
      links={EMPLOYEE_LINKS}
      render={(tab) => (tab === "review" ? <EmployeeMonthlyReviewPanel /> : <MyKpiSummaryPanel />)}
    />
  );
}

type ManagerTab = "team" | "review" | "history";

const MANAGER_TABS: readonly TabItem<ManagerTab>[] = [
  { value: "team", label: "Team Reviews" },
  { value: "review", label: "My Review" },
  { value: "history", label: "My KPI Summary" },
];
const MANAGER_LINKS: Partial<Record<PulseTabLink, ManagerTab>> = {
  "team-reviews": "team",
  "my-review": "review",
};

function PulseManagerPageClient() {
  return (
    <PulseTabsPage<ManagerTab>
      description="Review your team's monthly self-reviews, and submit your own."
      initial="team"
      items={MANAGER_TABS}
      links={MANAGER_LINKS}
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

const ADMIN_TABS: readonly TabItem<AdminTab>[] = [
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
];
const ADMIN_LINKS: Partial<Record<PulseTabLink, AdminTab>> = { "team-reviews": "manager-reviews" };

function PulseAdminPageClient() {
  return (
    <PulseTabsPage<AdminTab>
      description="Define KPIs and WebKnot values per band and designation, open or close the submission window, give final approval, and review KPI reports."
      initial="submissions"
      items={ADMIN_TABS}
      links={ADMIN_LINKS}
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
