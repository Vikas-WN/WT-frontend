"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, ChevronRight, Lock } from "lucide-react";

import { SectionLoading } from "@/components/dashboard/ui/SectionLoading";
import { EmptyState } from "@/components/dashboard/ui/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MODAL_BODY_CLASS,
  MODAL_FOOTER_CLASS,
  MODAL_HEADER_CLASS,
  MODAL_OVERLAY_CLASS,
  MODAL_PANEL_CLASS,
} from "@/components/dashboard/ui/uiLayout";
import { ModalPortal } from "@/components/dashboard/ui/ModalPortal";
import { RatingButtons } from "@/components/dashboard/pulse/employee/RatingButtons";
import { cn } from "@/lib/utils";
import { hrmsService } from "@/services/hrms.service";
import { notifyError, notifySuccess } from "@/lib/notify";
import { toUserFriendlyApiErrorMessage } from "@/utils/userFriendlyApiError";
import { ApiError } from "@/api/error";
import type { MonthlySubmissionItem } from "@/types/kpi";
import { useSubmissionLink } from "@/components/dashboard/pulse/useSubmissionLink";
import { formatWeight, groupKpisByParameter, hasKpiParameters } from "@/utils/kpiParameters";

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
        <p className="mt-0.5 text-xs text-wt-text-muted">
          Your direct reports&apos; submitted self-reviews. Rate each KPI and value yourself next to the
          employee&apos;s rating, then approve and submit to HR, or reject with comments to send it back.
        </p>
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
              </div>
              <div className="flex shrink-0 items-center gap-2">
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

function ManagerReviewModal({
  submission,
  onClose,
  onDone,
}: {
  submission: MonthlySubmissionItem;
  onClose: () => void;
  onDone: () => void;
}) {
  // The manager's ratings are their own assessment: they start blank rather
  // than copied from the employee's, so every score is a deliberate choice.
  const [kpiRatings, setKpiRatings] = useState<Record<number, number>>({});
  const [valueRatings, setValueRatings] = useState<Record<number, number>>({});
  const [comments, setComments] = useState("");
  const [busy, setBusy] = useState<"submit" | "reject" | null>(null);

  const certName = (id: number) =>
    submission.certification_details.find((c) => c.id === id)?.name ?? `Certification #${id}`;
  const valueName = (id: number) => submission.value_details.find((v) => v.id === id)?.name ?? `Value #${id}`;
  const selfKpi = new Map(submission.kpi_ratings.map((r) => [r.kpi_id, r.rating]));
  const showParameters = hasKpiParameters(submission.kpi_details);

  // Mirrors the backend: every applicable KPI and every value the employee
  // rated needs a manager rating before the review can be submitted.
  const kpiRated = submission.kpi_details.filter((k) => kpiRatings[k.id] != null).length;
  const valueRated = submission.value_ratings.filter((v) => valueRatings[v.value_id] != null).length;
  const allRated =
    kpiRated === submission.kpi_details.length && valueRated === submission.value_ratings.length;
  const hrSendBack =
    submission.review_status === "NEEDS_MANAGER_REVIEW" && submission.admin_review?.action === "REJECT_MANAGER"
      ? submission.admin_review.comments
      : null;

  const submit = async (action: "SUBMIT" | "REJECT") => {
    if (action === "REJECT" && comments.trim().length < 10) {
      notifyError("Add at least 10 characters of feedback before sending this back.");
      return;
    }
    if (action === "SUBMIT" && !allRated) {
      notifyError("Rate every KPI and Company Value before submitting your review.");
      return;
    }
    setBusy(action === "SUBMIT" ? "submit" : "reject");
    try {
      await hrmsService.submitManagerReview(submission.id, {
        action,
        kpi_ratings:
          action === "SUBMIT"
            ? Object.entries(kpiRatings).map(([id, rating]) => ({ kpi_id: Number(id), rating }))
            : [],
        value_ratings:
          action === "SUBMIT"
            ? Object.entries(valueRatings).map(([id, rating]) => ({ value_id: Number(id), rating, comment: "" }))
            : [],
        comments,
      });
      notifySuccess(action === "SUBMIT" ? "Review submitted to HR." : "Sent back to the employee.");
      onDone();
    } catch (error) {
      notifyError(
        toUserFriendlyApiErrorMessage(
          error,
          error instanceof ApiError ? error.message : "Couldn't submit your review."
        )
      );
    } finally {
      setBusy(null);
    }
  };

  return (
    <ModalPortal onEscape={busy ? undefined : onClose}>
      <div className={MODAL_OVERLAY_CLASS} role="presentation" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div role="dialog" aria-modal="true" className={cn(MODAL_PANEL_CLASS, "max-w-4xl")}>
          <div className={MODAL_HEADER_CLASS}>
            <h2 className="text-base font-semibold text-wt-text">{submission.employee.name}</h2>
            <p className="mt-1 text-xs text-wt-text-muted">
              {submission.cycle_label} · {submission.employee.emp_id ?? submission.employee.email}
              {submission.project_codes.length > 0 ? ` · Projects: ${submission.project_codes.join(", ")}` : ""}
            </p>
          </div>
          <div className={MODAL_BODY_CLASS}>
            <div className="space-y-6">
              {hrSendBack ? (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
                  <p className="font-semibold text-wt-text">HR sent this back to you</p>
                  <p className="mt-1 text-wt-text-muted">{hrSendBack}</p>
                </div>
              ) : null}

              <div>
                <h3 className="text-sm font-semibold text-wt-text">Employee self review</h3>
                <p className="mt-1.5 whitespace-pre-wrap rounded-lg border border-wt-border bg-wt-surface-2/40 p-3 text-sm text-wt-text">
                  {submission.self_review_text || "—"}
                </p>
              </div>

              <div>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-sm font-semibold text-wt-text">KPIs</h3>
                  <span className="text-xs text-wt-text-muted">
                    {kpiRated}/{submission.kpi_details.length} rated by you
                  </span>
                </div>
                <SideBySideHeader />
                <div className="space-y-4">
                  {groupKpisByParameter(submission.kpi_details).map((group) => (
                    <div key={group.parameter ?? "_none"} className="space-y-2">
                      {showParameters ? (
                        <div className="flex items-baseline justify-between gap-3 px-1">
                          <h4 className="text-xs font-semibold tracking-wide text-wt-text-muted uppercase">
                            {group.parameter ?? "Other"}
                          </h4>
                          <span className="text-xs text-wt-text-muted">{formatWeight(group.weight)}</span>
                        </div>
                      ) : null}
                      {group.items.map((kpi) => (
                        <SideBySideRow
                          key={kpi.id}
                          title={kpi.kpi_name}
                          meta={showParameters ? null : `Weight ${formatWeight(kpi.weightage)}`}
                          detail={kpi.evaluation_criteria}
                          selfRating={selfKpi.get(kpi.id) ?? null}
                          managerRating={kpiRatings[kpi.id] ?? null}
                          onRate={(v) => setKpiRatings((prev) => ({ ...prev, [kpi.id]: v }))}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {submission.value_ratings.length > 0 ? (
                <div>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="text-sm font-semibold text-wt-text">Company Values</h3>
                    <span className="text-xs text-wt-text-muted">
                      {valueRated}/{submission.value_ratings.length} rated by you
                    </span>
                  </div>
                  <SideBySideHeader />
                  <div className="space-y-2">
                    {submission.value_ratings.map((v) => (
                      <SideBySideRow
                        key={v.value_id}
                        title={valueName(v.value_id)}
                        detail={v.comment ? `Employee: “${v.comment}”` : null}
                        selfRating={v.rating}
                        managerRating={valueRatings[v.value_id] ?? null}
                        onRate={(r) => setValueRatings((prev) => ({ ...prev, [v.value_id]: r }))}
                      />
                    ))}
                  </div>
                </div>
              ) : null}

              {submission.certifications.length > 0 || submission.recognitions_count > 0 ? (
                <div>
                  <h3 className="text-sm font-semibold text-wt-text">Certifications &amp; recognitions</h3>
                  <ul className="mt-1.5 space-y-1 text-sm text-wt-text-muted">
                    {submission.certifications.map((c) => (
                      <li key={c.certification_id}>
                        {certName(c.certification_id)}
                        {c.proof ? ` — ${c.proof}` : ""}
                      </li>
                    ))}
                    {submission.recognitions_count > 0 ? (
                      <li>{submission.recognitions_count} recognition(s) this cycle</li>
                    ) : null}
                  </ul>
                </div>
              ) : null}

              <div>
                <label className="text-sm font-semibold text-wt-text" htmlFor="manager-comments">
                  Your comments
                </label>
                <textarea
                  id="manager-comments"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Required to send back for changes (min. 10 characters). Shared with the employee."
                  rows={3}
                  className="mt-1.5 w-full rounded-lg border border-wt-border bg-wt-surface-1 px-3 py-2 text-sm text-wt-text placeholder:text-wt-text-faint focus:outline-none focus:ring-2 focus:ring-wt-brand/40"
                />
              </div>
            </div>
          </div>
          <div className={MODAL_FOOTER_CLASS}>
            <Button type="button" variant="outline" onClick={onClose} disabled={busy !== null}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              className="!border-rose-300 !text-rose-600 hover:!bg-rose-50"
              onClick={() => void submit("REJECT")}
              disabled={busy !== null}
            >
              {busy === "reject" ? "Sending…" : "Reject & Send Back"}
            </Button>
            <Button type="button" onClick={() => void submit("SUBMIT")} disabled={busy !== null || !allRated}>
              <CheckCircle2 className="mr-1.5 size-4" />
              {busy === "submit" ? "Submitting…" : "Approve & Submit"}
            </Button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}

const SIDE_BY_SIDE_GRID = "grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_5.5rem_auto] sm:items-center sm:gap-4";

function SideBySideHeader() {
  return (
    <div
      className={cn(
        SIDE_BY_SIDE_GRID,
        "mt-2 mb-1.5 hidden px-3 text-[11px] font-medium uppercase tracking-wide text-wt-text-muted sm:grid"
      )}
    >
      <span>Item</span>
      <span className="text-center">Employee</span>
      <span>Your rating</span>
    </div>
  );
}

/** One KPI/value: the employee's self-rating (read-only) next to the
 *  manager's own rating, so both are visible at a glance. */
function SideBySideRow({
  title,
  meta,
  detail,
  selfRating,
  managerRating,
  onRate,
}: {
  title: string;
  meta?: string | null;
  detail?: string | null;
  selfRating: number | null;
  managerRating: number | null;
  onRate: (rating: number) => void;
}) {
  const differs = managerRating != null && selfRating != null && managerRating !== selfRating;
  return (
    <div
      className={cn(
        SIDE_BY_SIDE_GRID,
        "rounded-lg border bg-wt-surface-2/40 px-3 py-2.5",
        managerRating == null ? "border-wt-border" : "border-wt-brand/30"
      )}
    >
      <div className="min-w-0">
        <p className="text-sm font-medium text-wt-text">{title}</p>
        {meta ? <p className="text-xs text-wt-text-muted">{meta}</p> : null}
        {detail ? <p className="mt-0.5 text-xs text-wt-text-faint">{detail}</p> : null}
      </div>
      <div className="flex items-center gap-2 sm:justify-center">
        <span className="text-xs text-wt-text-muted sm:hidden">Employee</span>
        <span className="flex size-8 items-center justify-center rounded-lg border border-wt-border bg-wt-surface-1 text-sm font-semibold text-wt-text">
          {selfRating ?? "—"}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-wt-text-muted sm:hidden">You</span>
        <RatingButtons value={managerRating} onChange={onRate} />
        {differs ? (
          <span className="text-xs text-amber-700 dark:text-amber-400" title="Differs from the employee's rating">
            {managerRating! > selfRating! ? "+" : ""}
            {managerRating! - selfRating!}
          </span>
        ) : null}
      </div>
    </div>
  );
}
