"use client";

import { useState } from "react";
import { CheckCircle2, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  MODAL_BODY_CLASS,
  MODAL_FOOTER_CLASS,
  MODAL_HEADER_CLASS,
  MODAL_OVERLAY_CLASS,
  MODAL_PANEL_CLASS,
} from "@/components/dashboard/ui/uiLayout";
import { ModalPortal } from "@/components/dashboard/ui/ModalPortal";
import { SideBySideHeader, SideBySideRow } from "@/components/dashboard/pulse/manager/SideBySideRow";
import { useManagerReviewDraft } from "@/components/dashboard/pulse/manager/useManagerReviewDraft";
import { PULSE_COPY } from "@/constants/pulseCopy";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { hrmsService } from "@/services/hrms.service";
import { notifyError, notifySuccess } from "@/lib/notify";
import { toUserFriendlyApiErrorMessage } from "@/utils/userFriendlyApiError";
import { ApiError } from "@/api/error";
import type { MonthlySubmissionItem } from "@/types/kpi";
import { formatWeight, groupKpisByParameter, hasKpiParameters } from "@/utils/kpiParameters";

const SAVE_STATE_LABEL = {
  idle: "",
  saving: "Saving…",
  saved: "Saved",
  error: "Couldn't save — will retry on your next change",
} as const;

/** Who else the review was routed to, for the header line. */
function coManagerNames(submission: MonthlySubmissionItem, myEmail: string | undefined): string[] {
  return submission.managers
    .filter((m) => m.email.toLowerCase() !== (myEmail ?? "").toLowerCase())
    .map((m) => m.name);
}

export function ManagerReviewModal({
  submission,
  onClose,
  onDone,
}: {
  submission: MonthlySubmissionItem;
  onClose: () => void;
  onDone: () => void;
}) {
  const { user } = useAuth();
  const draft = useManagerReviewDraft(submission, user?.email);
  const { fields, decided } = draft;
  // Transient UI flags only: which request is running and whether the confirm is open.
  const [busy, setBusy] = useState<"submit" | "reject" | null>(null);
  const [confirmingFinal, setConfirmingFinal] = useState(false);

  const readOnly = decided !== null;
  const others = coManagerNames(submission, user?.email);
  const certName = (id: number) =>
    submission.certification_details.find((c) => c.id === id)?.name ?? `Certification #${id}`;
  const valueName = (id: number) => submission.value_details.find((v) => v.id === id)?.name ?? `Value #${id}`;
  const selfKpi = new Map(submission.kpi_ratings.map((r) => [r.kpi_id, r.rating]));
  const showParameters = hasKpiParameters(submission.kpi_details);

  // Mirrors the backend: every applicable KPI and every value the employee
  // rated needs a rating before the review can be submitted.
  const kpiRated = submission.kpi_details.filter((k) => fields.kpi[k.id] != null).length;
  const valueRated = submission.value_ratings.filter((v) => fields.values[v.value_id] != null).length;
  const allRated =
    kpiRated === submission.kpi_details.length && valueRated === submission.value_ratings.length;
  const hrSendBack =
    submission.review_status === "NEEDS_MANAGER_REVIEW" && submission.admin_review?.action === "REJECT_MANAGER"
      ? submission.admin_review.comments
      : null;

  const submit = async (action: "SUBMIT" | "REJECT") => {
    setConfirmingFinal(false);
    if (action === "REJECT" && fields.comments.trim().length < 10) {
      notifyError("Add at least 10 characters of feedback before sending this back.");
      return;
    }
    if (action === "SUBMIT" && !allRated) {
      notifyError("Rate every KPI and Company Value before submitting your review.");
      return;
    }
    setBusy(action === "SUBMIT" ? "submit" : "reject");
    try {
      await draft.flush(); // the shared draft is current before it becomes final
      await hrmsService.submitManagerReview(submission.id, {
        action,
        kpi_ratings:
          action === "SUBMIT"
            ? Object.entries(fields.kpi).map(([id, rating]) => ({ kpi_id: Number(id), rating }))
            : [],
        value_ratings:
          action === "SUBMIT"
            ? Object.entries(fields.values).map(([id, rating]) => ({ value_id: Number(id), rating, comment: "" }))
            : [],
        comments: fields.comments,
      });
      notifySuccess(action === "SUBMIT" ? PULSE_COPY.managerSubmittedToast : PULSE_COPY.managerRejectedToast);
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
        <div role="dialog" aria-modal="true" className={cn(MODAL_PANEL_CLASS, "max-w-5xl")}>
          <div className={MODAL_HEADER_CLASS}>
            <h2 className="text-base font-semibold text-wt-text">{submission.employee.name}</h2>
            <p className="mt-1 text-xs text-wt-text-muted">
              {submission.cycle_label} · {submission.employee.emp_id ?? submission.employee.email}
            </p>
            {others.length > 0 ? (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-wt-text-muted">
                <Users className="size-3.5" />
                Reviewing together with {others.join(", ")}
              </p>
            ) : null}
          </div>
          <div className={MODAL_BODY_CLASS}>
            <div className="space-y-6">
              {decided ? (
                <div role="status" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm">
                  <p className="font-semibold text-wt-text">
                    {decided.by ? `${decided.by.name} has already decided this review` : "This review has already been decided"}
                  </p>
                  <p className="mt-1 text-wt-text-muted">Nothing more is needed from you. Close this to refresh your list.</p>
                </div>
              ) : (
                <div role="status" className="flex flex-wrap items-center justify-between gap-2 text-xs text-wt-text-muted">
                  <span>
                    {draft.coEditor ? `${draft.coEditor.name} is editing — ` : ""}
                    {PULSE_COPY.sharedDraftHint}
                  </span>
                  <span aria-live="polite">{SAVE_STATE_LABEL[draft.saveState]}</span>
                </div>
              )}

              {hrSendBack ? (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
                  <p className="font-semibold text-wt-text">HR rejected the managers&apos; review</p>
                  <p className="mt-1 text-wt-text-muted">{hrSendBack}</p>
                  <p className="mt-1 text-xs text-wt-text-muted">
                    Your previous ratings are filled in. Change what needs changing, then submit again — the
                    employee&apos;s submission stays as it is.
                  </p>
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
                    {kpiRated}/{submission.kpi_details.length} rated
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
                          managerRating={fields.kpi[kpi.id] ?? null}
                          onRate={(v) => draft.rateKpi(kpi.id, v)}
                          disabled={readOnly}
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
                      {valueRated}/{submission.value_ratings.length} rated
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
                        managerRating={fields.values[v.value_id] ?? null}
                        onRate={(r) => draft.rateValue(v.value_id, r)}
                        disabled={readOnly}
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
                  Comments (shared with the other managers and the employee)
                </label>
                <textarea
                  id="manager-comments"
                  value={fields.comments}
                  onChange={(e) => draft.setComments(e.target.value)}
                  disabled={readOnly}
                  placeholder="Required to send back for changes (min. 10 characters)."
                  rows={3}
                  className="mt-1.5 w-full rounded-lg border border-wt-border bg-wt-surface-1 px-3 py-2 text-sm text-wt-text placeholder:text-wt-text-faint focus:outline-none focus:ring-2 focus:ring-wt-brand/40 disabled:opacity-60"
                />
              </div>
            </div>
          </div>
          <div className={MODAL_FOOTER_CLASS}>
            <Button type="button" variant="outline" onClick={onClose} disabled={busy !== null}>
              {readOnly ? "Close" : "Cancel"}
            </Button>
            {readOnly ? null : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="!border-rose-300 !text-rose-600 hover:!bg-rose-50"
                  onClick={() => void submit("REJECT")}
                  disabled={busy !== null}
                >
                  {busy === "reject" ? "Sending…" : PULSE_COPY.managerRejectLabel}
                </Button>
                <Button type="button" onClick={() => setConfirmingFinal(true)} disabled={busy !== null || !allRated}>
                  <CheckCircle2 className="mr-1.5 size-4" />
                  {busy === "submit" ? "Submitting…" : PULSE_COPY.managerSubmitLabel}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
      <ConfirmDialog
        open={confirmingFinal}
        title={PULSE_COPY.managerFinalConfirmTitle}
        description={PULSE_COPY.managerFinalConfirmBody}
        confirmLabel={PULSE_COPY.managerFinalConfirmLabel}
        loading={busy === "submit"}
        onConfirm={() => void submit("SUBMIT")}
        onCancel={() => setConfirmingFinal(false)}
      />
    </ModalPortal>
  );
}
