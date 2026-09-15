"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, ChevronRight } from "lucide-react";

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
import { RatingButtons } from "@/components/dashboard/pulse/employee/RatingButtons";
import { hrmsService } from "@/services/hrms.service";
import { notifyError, notifySuccess } from "@/lib/notify";
import { toUserFriendlyApiErrorMessage } from "@/utils/userFriendlyApiError";
import { ApiError } from "@/api/error";
import type { KpiRating, MonthlySubmissionItem, ValueRating } from "@/types/kpi";

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
  const [reloadTick, setReloadTick] = useState(0);
  const submissions = useLoad<MonthlySubmissionItem[]>(
    () => hrmsService.getManagerTeamSubmissions(),
    [reloadTick]
  );
  const [reviewing, setReviewing] = useState<MonthlySubmissionItem | null>(null);

  const rows = submissions.data ?? [];

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-wt-text">Team reviews awaiting you</h3>
        <p className="mt-0.5 text-xs text-wt-text-muted">
          Your direct reports&apos; submitted self-reviews. Rate the same KPIs and values, then submit or
          send back for changes.
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
                <Badge variant="outline">{row.kpi_ratings.length} KPIs rated</Badge>
                <ChevronRight className="size-4 text-wt-text-faint" />
              </div>
            </button>
          ))}
        </div>
      )}

      {reviewing ? (
        <ManagerReviewModal
          submission={reviewing}
          onClose={() => setReviewing(null)}
          onDone={() => {
            setReviewing(null);
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
  const [kpiRatings, setKpiRatings] = useState<KpiRating[]>(submission.kpi_ratings);
  const [valueRatings, setValueRatings] = useState<ValueRating[]>(submission.value_ratings);
  const [comments, setComments] = useState("");
  const [busy, setBusy] = useState<"submit" | "reject" | null>(null);

  const setKpiRating = (kpiId: number, rating: number) => {
    setKpiRatings((prev) => [...prev.filter((r) => r.kpi_id !== kpiId), { kpi_id: kpiId, rating }]);
  };
  const setValueRatingValue = (valueId: number, rating: number) => {
    setValueRatings((prev) => {
      const existing = prev.find((r) => r.value_id === valueId);
      return [
        ...prev.filter((r) => r.value_id !== valueId),
        { value_id: valueId, rating, comment: existing?.comment ?? "" },
      ];
    });
  };

  const submit = async (action: "SUBMIT" | "REJECT") => {
    if (action === "REJECT" && comments.trim().length < 10) {
      notifyError("Add at least 10 characters of feedback before sending this back.");
      return;
    }
    setBusy(action === "SUBMIT" ? "submit" : "reject");
    try {
      await hrmsService.submitManagerReview(submission.id, {
        action,
        kpi_ratings: action === "SUBMIT" ? kpiRatings : [],
        value_ratings: action === "SUBMIT" ? valueRatings : [],
        comments,
      });
      notifySuccess(action === "SUBMIT" ? "Review submitted." : "Sent back for changes.");
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
    <div className={MODAL_OVERLAY_CLASS} role="presentation" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" className={MODAL_PANEL_CLASS}>
        <div className={MODAL_HEADER_CLASS}>
          <h2 className="text-base font-semibold text-wt-text">{submission.employee.name}</h2>
          <p className="mt-1 text-xs text-wt-text-muted">{submission.cycle_label}</p>
        </div>
        <div className={MODAL_BODY_CLASS}>
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-wt-text">Employee self review</h3>
              <p className="mt-1.5 whitespace-pre-wrap rounded-lg border border-wt-border bg-wt-surface-2/40 p-3 text-sm text-wt-text">
                {submission.self_review_text || "—"}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-wt-text">KPIs</h3>
              <div className="mt-2 space-y-2">
                {kpiRatings.map((r) => (
                  <div
                    key={r.kpi_id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-wt-border bg-wt-surface-2/40 px-3 py-2"
                  >
                    <span className="text-sm text-wt-text">
                      KPI #{r.kpi_id} · self-rated{" "}
                      <span className="font-semibold">
                        {submission.kpi_ratings.find((k) => k.kpi_id === r.kpi_id)?.rating ?? "—"}
                      </span>
                    </span>
                    <RatingButtons value={r.rating} onChange={(v) => setKpiRating(r.kpi_id, v)} />
                  </div>
                ))}
              </div>
            </div>

            {submission.value_ratings.length > 0 ? (
              <div>
                <h3 className="text-sm font-semibold text-wt-text">Company Values</h3>
                <div className="mt-2 space-y-2">
                  {submission.value_ratings.map((v) => {
                    const managerRating = valueRatings.find((r) => r.value_id === v.value_id)?.rating ?? v.rating;
                    return (
                      <div
                        key={v.value_id}
                        className="rounded-lg border border-wt-border bg-wt-surface-2/40 px-3 py-2"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm text-wt-text">
                            Value #{v.value_id} · self-rated <span className="font-semibold">{v.rating}</span>
                          </span>
                          <RatingButtons
                            value={managerRating}
                            onChange={(rv) => setValueRatingValue(v.value_id, rv)}
                          />
                        </div>
                        {v.comment ? <p className="mt-1 text-xs text-wt-text-muted">{v.comment}</p> : null}
                      </div>
                    );
                  })}
                </div>
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
                placeholder="Required to send back for changes (min. 10 characters)."
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
            {busy === "reject" ? "Sending…" : "Send Back"}
          </Button>
          <Button type="button" onClick={() => void submit("SUBMIT")} disabled={busy !== null}>
            <CheckCircle2 className="mr-1.5 size-4" />
            {busy === "submit" ? "Submitting…" : "Submit Review"}
          </Button>
        </div>
      </div>
    </div>
  );
}
