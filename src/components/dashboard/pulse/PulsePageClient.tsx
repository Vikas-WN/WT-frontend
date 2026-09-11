"use client";

import { useMemo, useState } from "react";
import { Activity } from "lucide-react";

import { ComingSoonPanel } from "@/components/dashboard/ComingSoonPanel";
import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { ContentCard } from "@/components/dashboard/ui/ContentCard";
import { PageTabs, PAGE_TAB_BODY_CLASS } from "@/components/dashboard/ui/PageTabs";
import { KpiDefinitionsPanel } from "@/components/dashboard/pulse/KpiDefinitionsPanel";
import { SubmissionPortalPanel } from "@/components/dashboard/pulse/SubmissionPortalPanel";
import { useAuth } from "@/context/AuthContext";
import { normalizeRoles } from "@/utils/roles";

/**
 * Pulse used to send everyone out to the external RT portal
 * (rtportal.webknot-dev.in). This is the native replacement: HR/Admin manage
 * KPI definitions and open/close the submission portal right here. Everyone
 * else still sees a coming-soon screen — the self-review *filling* flow
 * itself hasn't been built natively yet, only the HR-side controls.
 */
export function PulsePageClient() {
  const { user } = useAuth();
  const roles = useMemo(() => normalizeRoles(user?.roles ?? []), [user?.roles]);
  const isHrOrAdmin = roles.includes("ROLE_HR") || roles.includes("ROLE_ADMIN");

  if (!isHrOrAdmin) {
    return (
      <ComingSoonPanel
        title="Pulse"
        description="Your monthly KPI self-review will live here. HR is setting up KPIs and opening the submission window — check back once it's live."
        icon={<Activity className="size-6" />}
      />
    );
  }

  return <PulseAdminPageClient />;
}

function PulseAdminPageClient() {
  const [tab, setTab] = useState<"kpis" | "portal">("kpis");

  return (
    <DashboardPageShell className="wt-detail-page">
      <ContentCard>
        <div className="border-b border-wt-border px-5 py-4 sm:px-8">
          <h2 className="text-lg font-semibold text-wt-text">Pulse</h2>
          <p className="mt-1 text-sm text-wt-text-muted">
            Define KPIs per band and designation, and open or close the submission
            portal for employees and managers.
          </p>
        </div>

        <PageTabs
          embedded
          aria-label="Pulse admin tabs"
          value={tab}
          onValueChange={(value) => setTab(value as "kpis" | "portal")}
          items={[
            { value: "kpis", label: "KPI Definitions" },
            { value: "portal", label: "Submission Portal" },
          ]}
        />

        <div className={PAGE_TAB_BODY_CLASS}>
          {tab === "kpis" ? <KpiDefinitionsPanel /> : <SubmissionPortalPanel />}
        </div>
      </ContentCard>
    </DashboardPageShell>
  );
}
