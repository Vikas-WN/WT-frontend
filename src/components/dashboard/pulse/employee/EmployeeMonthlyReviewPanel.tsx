"use client";

import { useMemo, useState } from "react";
import { Lock } from "lucide-react";

import { SubmissionSummary } from "@/components/dashboard/pulse/employee/SubmissionSummary";
import { ReviewForm } from "@/components/dashboard/pulse/employee/review/ReviewForm";
import { isEditable } from "@/components/dashboard/pulse/employee/review/reviewModel";
import { MonthSwitcher } from "@/components/dashboard/pulse/shared/MonthSwitcher";
import { WindowPill } from "@/components/dashboard/pulse/shared/WindowPill";
import { EmptyState } from "@/components/dashboard/ui/EmptyState";
import { SectionLoading } from "@/components/dashboard/ui/SectionLoading";
import { useAuth } from "@/context/AuthContext";
import {
  useActiveCertifications,
  useActiveValues,
  useAdminReviewers,
  useApplicableKpis,
  useMyPulseProjects,
  useMonthDraft,
  useMySubmissionMonths,
  useMyMonthSubmission,
  usePulseWindow,
} from "@/hooks/pulse/usePulse";
import { currentMonthKey, formatMonthLabel, shiftMonth } from "@/utils/pulseMonth";
import { PULSE_REVIEWER_PICKER_ROLES } from "@/constants/pulseCopy";
import { normalizeRoles } from "@/utils/roles";

/** Last month's window can still be the live one (a window opened at the end
 *  of a month runs into the next) — open on whichever month is accepting reviews. */
function useDefaultMonth(): string {
  const thisMonth = currentMonthKey();
  const lastMonth = shiftMonth(thisMonth, -1);
  const now = usePulseWindow(thisMonth, "self");
  const before = usePulseWindow(lastMonth, "self");
  if (now.data?.open) return thisMonth;
  return before.data?.open ? lastMonth : thisMonth;
}

function ClosedNotice({ month }: { month: string }) {
  return (
    <div className="rounded-2xl border border-wt-border bg-wt-surface-1 p-8 text-center">
      <Lock className="mx-auto size-8 text-wt-text-faint" aria-hidden />
      <h3 className="mt-3 text-base font-semibold text-wt-text">{formatMonthLabel(month)} is closed for submissions</h3>
      <p className="mx-auto mt-1.5 max-w-md text-sm text-wt-text-muted">
        HR opens the monthly self-review window on a schedule. Check back once it&apos;s open — KPIs, values and your self
        review can only be entered while it is.
      </p>
    </div>
  );
}

/** My monthly self-review, month by month: pick a month, fill it in while its
 *  window is open, and look back at past months read-only. */
export function EmployeeMonthlyReviewPanel() {
  const defaultMonth = useDefaultMonth();
  const [chosen, setChosen] = useState<string | null>(null);
  const month = chosen ?? defaultMonth;

  const { user } = useAuth();
  // DM / PM / AM / HR / Admin aren't reviewed by project managers — they pick an HR or Admin.
  const needsReviewer = useMemo(() => {
    const roles = normalizeRoles(user?.roles ?? []);
    return PULSE_REVIEWER_PICKER_ROLES.some((role) => roles.includes(role));
  }, [user?.roles]);

  const windowQ = usePulseWindow(month, "self");
  const existing = useMyMonthSubmission(month);
  const months = useMySubmissionMonths();
  const editable = existing.data ? isEditable(existing.data) : true;
  const draft = useMonthDraft(month, Boolean(windowQ.data?.open) && editable);

  const kpis = useApplicableKpis();
  const values = useActiveValues();
  const certs = useActiveCertifications();
  const projects = useMyPulseProjects();
  const reviewers = useAdminReviewers(needsReviewer);

  const loading = windowQ.isLoading || existing.isLoading || (draft.isLoading && draft.fetchStatus !== "idle");

  const body = () => {
    if (loading) return <SectionLoading label="" />;
    if (existing.data && !editable) return <SubmissionSummary submission={existing.data} />;
    if (!windowQ.data?.open) {
      return existing.data ? <SubmissionSummary submission={existing.data} /> : <ClosedNotice month={month} />;
    }
    if (kpis.isLoading || values.isLoading || certs.isLoading) return <SectionLoading label="" />;
    if (!draft.data || !isEditable(draft.data)) {
      return draft.data ? (
        <SubmissionSummary submission={draft.data} />
      ) : (
        <EmptyState title="Couldn't load your review" description="Please refresh the page and try again." />
      );
    }
    return (
      <ReviewForm
        // Remount (re-seeding the form from fresh server data) only when the
        // underlying row changes — e.g. after a resubmit — not on every render.
        key={`${draft.data.id}-${draft.data.updated_at}`}
        initial={draft.data}
        ctx={{
          kpiRows: kpis.data ?? [],
          valueRows: values.data ?? [],
          certRows: certs.data ?? [],
          projectRows: projects.data ?? [],
          reviewerOptions: needsReviewer ? (reviewers.data ?? []) : null,
        }}
        projectsLoading={projects.isLoading}
        needsRevision={draft.data.review_status === "NEEDS_REVIEW"}
        onSubmitted={() => void existing.refetch()}
      />
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <MonthSwitcher value={month} onChange={setChosen} marks={months.data} />
        <WindowPill status={windowQ.data} loading={windowQ.isLoading} openLabel="Accepting submissions" closedLabel="Window closed" />
      </div>
      {body()}
    </div>
  );
}
