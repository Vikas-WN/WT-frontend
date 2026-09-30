"use client";

import { useEffect, useState } from "react";
import { ChevronRight, Lock, Users } from "lucide-react";

import { SectionLoading } from "@/components/dashboard/ui/SectionLoading";
import { EmptyState } from "@/components/dashboard/ui/EmptyState";
import { Badge } from "@/components/ui/badge";
import { ManagerReviewModal } from "@/components/dashboard/pulse/manager/ManagerReviewModal";
import { PULSE_COPY } from "@/constants/pulseCopy";
import { hrmsService } from "@/services/hrms.service";
import { notifyError } from "@/lib/notify";
import type { MonthlySubmissionItem } from "@/types/kpi";
import { useSubmissionLink } from "@/components/dashboard/pulse/useSubmissionLink";

type Load<T> = { status: "loading" | "done" | "error"; data: T | null };

/** Local copy of the small async-fetch hook used across dashboard pages —
 *  kept file-local rather than shared (see HomePageClient's own copy). */
function useLoad<T>(fn: () => Promise<T>, deps: unknown[] = []): Load<T> {
  const [state, setState] = useState<Load<T>>({ status: "loading", data: null });
  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const data = await fn();
        if (alive) setState({ status: "done", data });
      } catch {
        if (alive) setState({ status: "error", data: null });
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return state;
}

export function ManagerTeamReviewPanel() {
  const windowStatus = useLoad(
    () => hrmsService.getSubmissionWindowStatus({ scope: "MANAGER" }).then((r) => r.data),
    []
  );
  const isWindowOpen = windowStatus.data?.open ?? false;
  const [reloadTick, setReloadTick] = useState(0);
  const submissions = useLoad<MonthlySubmissionItem[]>(
    () => hrmsService.getManagerTeamSubmissions(),
    [reloadTick]
  );
  const [reviewing, setReviewing] = useState<MonthlySubmissionItem | null>(null);

  const rows = submissions.data ?? [];

  // Arrived from a "submitted for your review" notification: that submission
  // opens until the review is closed (closing drops the link).
  const { linkedId, clear: clearLink } = useSubmissionLink();
  const linkedRow = linkedId != null ? (rows.find((row) => row.id === linkedId) ?? null) : null;
  const open = reviewing ?? linkedRow;
  const closeReview = () => {
    setReviewing(null);
    if (linkedId != null) clearLink();
  };
  useEffect(() => {
    if (linkedId == null || submissions.status !== "done" || linkedRow) return;
    notifyError("That review isn't waiting on you anymore — it may already have been reviewed.");
    clearLink();
  }, [linkedId, submissions.status, linkedRow, clearLink]);

  if (windowStatus.status === "loading") return <SectionLoading label="" />;

  if (!isWindowOpen) {
    return (
      <div className="rounded-2xl border border-wt-border bg-wt-surface-1 p-8 text-center">
        <Lock className="mx-auto size-8 text-wt-text-faint" />
        <h3 className="mt-3 text-base font-semibold text-wt-text">Review window is closed</h3>
        <p className="mx-auto mt-1.5 max-w-md text-sm text-wt-text-muted">
          HR opens the manager review window on a schedule. Check back once it&apos;s open — team
          reviews can only be submitted while it is.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-wt-text">Team reviews awaiting you</h3>
        <p className="mt-0.5 text-xs text-wt-text-muted">{PULSE_COPY.managerQueueIntro}</p>
      </div>

      {submissions.status === "loading" ? (
        <SectionLoading label="" />
      ) : rows.length === 0 ? (
        <EmptyState title="Nothing Pending" description="No team submissions are waiting on your review." />
      ) : (
        <div className="space-y-2">
          {rows.map((row) => (
            <button
              key={row.id}
              type="button"
              onClick={() => setReviewing(row)}
              className="flex w-full items-center justify-between gap-3 rounded-xl border border-wt-border bg-wt-surface-1 px-4 py-3 text-left transition-colors hover:border-wt-brand/40"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-wt-text">{row.employee.name}</p>
                <p className="text-xs text-wt-text-muted">
                  {row.cycle_label} · {row.employee.emp_id ?? row.employee.email}
                </p>
                {row.managers.length > 1 ? (
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-wt-text-faint">
                    <Users className="size-3" />
                    {row.managers.map((m) => m.name).join(", ")}
                  </p>
                ) : null}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {row.manager_draft?.updated_by ? (
                  <Badge variant="outline">{row.manager_draft.updated_by.name} started reviewing</Badge>
                ) : null}
                {row.review_status === "NEEDS_MANAGER_REVIEW" ? (
                  <Badge variant="outline" className="border-amber-400 text-amber-700 dark:text-amber-400">
                    Sent back by HR
                  </Badge>
                ) : null}
                <Badge variant="outline">{row.kpi_ratings.length} KPIs rated</Badge>
                <ChevronRight className="size-4 text-wt-text-faint" />
              </div>
            </button>
          ))}
        </div>
      )}

      {open ? (
        <ManagerReviewModal
          key={open.id}
          submission={open}
          onClose={closeReview}
          onDone={() => {
            closeReview();
            setReloadTick((t) => t + 1);
          }}
        />
      ) : null}
    </div>
  );
}
