"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { BugReportCard } from "@/components/dashboard/bug-reports/BugReportCard";
import { BugTriageDialog } from "@/components/dashboard/bug-reports/BugTriageDialog";
import { ReportBugDialog } from "@/components/dashboard/bug-reports/ReportBugDialog";
import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { SelectField } from "@/components/dashboard/ui/forms";
import { ManagementListContent } from "@/components/dashboard/ui/ManagementListCard";
import { PageHero } from "@/components/dashboard/ui/PageHero";
import { Button } from "@/components/ui/button";
import {
  BUG_REPORT_COPY,
  BUG_REPORT_PAGE_SIZE,
  BUG_REPORT_TRIAGE_ROLES,
  BUG_SEVERITY_OPTIONS,
  BUG_STATUS_OPTIONS,
} from "@/constants/bugReports";
import { useAuth } from "@/context/AuthContext";
import { useAllBugReports, useMyBugReports } from "@/hooks/bug-reports/useBugReports";
import type { BugReport, BugSeverity, BugStatus } from "@/types/bugReport";

const ANY = "ALL";

export function BugReportsPageClient() {
  const { user } = useAuth();
  const canTriage = BUG_REPORT_TRIAGE_ROLES.some((role) => (user?.roles ?? []).includes(role));
  const focusedId = Number(useSearchParams().get("bugId")) || null;

  const [status, setStatus] = useState<string>(ANY);
  const [severity, setSeverity] = useState<string>(ANY);
  const [page, setPage] = useState(0);
  const [reviewing, setReviewing] = useState<BugReport | null>(null);
  const [reporting, setReporting] = useState(false);

  const mine = useMyBugReports();
  const all = useAllBugReports(
    {
      status: status === ANY ? undefined : (status as BugStatus),
      severity: severity === ANY ? undefined : (severity as BugSeverity),
      page,
    },
    canTriage
  );

  const source = canTriage ? all : mine;
  const items = useMemo(() => (canTriage ? all.data?.items : mine.data) ?? [], [canTriage, all.data, mine.data]);
  const total = canTriage ? (all.data?.total ?? 0) : items.length;
  const pages = Math.max(1, Math.ceil(total / BUG_REPORT_PAGE_SIZE));

  const filterOptions = (all_: string, options: ReadonlyArray<{ value: string; label: string }>) => [
    { value: ANY, label: all_ },
    ...options.map(({ value, label }) => ({ value, label })),
  ];

  return (
    <DashboardPageShell>
      <PageHero
        title={BUG_REPORT_COPY.pageTitle}
        description={canTriage ? BUG_REPORT_COPY.pageDescriptionTriage : BUG_REPORT_COPY.pageDescriptionMine}
        action={
          <Button type="button" onClick={() => setReporting(true)}>
            {BUG_REPORT_COPY.buttonLabel}
          </Button>
        }
      />

      {canTriage ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:max-w-xl">
          <SelectField
            label="Status"
            value={status}
            options={filterOptions(BUG_REPORT_COPY.allStatuses, BUG_STATUS_OPTIONS)}
            onChange={(value) => { setStatus(value); setPage(0); }}
            clearSelectionOnEmptyInput={false}
          />
          <SelectField
            label="Severity"
            value={severity}
            options={filterOptions(BUG_REPORT_COPY.allSeverities, BUG_SEVERITY_OPTIONS)}
            onChange={(value) => { setSeverity(value); setPage(0); }}
            clearSelectionOnEmptyInput={false}
          />
        </div>
      ) : null}

      <ManagementListContent
        isLoading={source.isLoading}
        isEmpty={items.length === 0}
        emptyTitle={canTriage ? BUG_REPORT_COPY.emptyTriage : BUG_REPORT_COPY.emptyMine}
        emptyDescription=""
      >
        <div className="space-y-3">
          {items.map((bug) => (
            <BugReportCard
              key={bug.id}
              bug={bug}
              showReporter={canTriage}
              highlighted={bug.id === focusedId}
              onReview={canTriage ? setReviewing : undefined}
            />
          ))}
        </div>
        {canTriage && pages > 1 ? (
          <div className="mt-4 flex items-center justify-between text-sm text-wt-text-muted">
            <span>{total} reports · page {page + 1} of {pages}</span>
            <div className="flex gap-2">
              <Button type="button" size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</Button>
              <Button type="button" size="sm" variant="outline" disabled={page + 1 >= pages} onClick={() => setPage(page + 1)}>Next</Button>
            </div>
          </div>
        ) : null}
      </ManagementListContent>

      {reviewing ? <BugTriageDialog key={reviewing.id} bug={reviewing} onClose={() => setReviewing(null)} /> : null}
      {reporting ? <ReportBugDialog onClose={() => setReporting(false)} /> : null}
    </DashboardPageShell>
  );
}
