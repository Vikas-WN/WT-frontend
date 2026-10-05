"use client";

import { useState } from "react";
import { CheckCircle2, Undo2, Users } from "lucide-react";

import { KpiTab, NotesTab, ValuesTab, type ReviewTab } from "@/components/dashboard/pulse/manager/team/ReviewTabs";
import { useManagerReviewDraft } from "@/components/dashboard/pulse/manager/useManagerReviewDraft";
import { explainedRowDomId } from "@/components/dashboard/pulse/ExplainedRatingRow";
import { ProgressBar } from "@/components/dashboard/pulse/shared/ProgressBar";
import { SubmissionChecklist } from "@/components/dashboard/pulse/SubmissionChecklist";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PULSE_COPY } from "@/constants/pulseCopy";
import { useAuth } from "@/context/AuthContext";
import { useSubmitManagerReview } from "@/hooks/pulse/usePulse";
import { notifyError } from "@/lib/notify";
import { cn } from "@/lib/utils";
import { formatMonthLabel } from "@/utils/pulseMonth";
import { buildChecklist, summarizeChecklist, type ChecklistGroup, type ChecklistItem } from "@/utils/pulseChecklist";
import type { MonthlySubmissionItem } from "@/types/kpi";

const MIN_SEND_BACK_COMMENT = 10;
const SAVE_LABEL = { idle: "", saving: "Saving…", saved: "Saved", error: "Couldn't save — will retry on your next change" } as const;

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "?") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

/** Review one team member's submission in place — tabs for KPIs / values /
 *  their notes. The ratings are the draft every manager the review went to
 *  shares (the first to submit makes it final); the comment box and the
 *  Submit / Reject bar stay in view. */
export function ReviewWorkspace({ submission, canAct, onDone }: { submission: MonthlySubmissionItem; canAct: boolean; onDone: () => void }) {
  const { user } = useAuth();
  const draft = useManagerReviewDraft(submission, user?.email);
  const review = useSubmitManagerReview();
  const [tab, setTab] = useState<ReviewTab>("kpis");
  // Transient UI flag: whether the "make it final?" confirm is open.
  const [confirming, setConfirming] = useState(false);
  const { fields, decided } = draft;
  const readOnly = decided !== null || !canAct;
  const valueName = (id: number) => submission.value_details.find((v) => v.id === id)?.name ?? `Value #${id}`;

  // Mirrors the backend: every KPI and every value the employee rated needs a
  // level AND the reviewer's reason before the review can be submitted.
  const checklist = buildChecklist({
    kpis: submission.kpi_details.map((k) => ({ id: k.id, name: k.kpi_name })),
    kpiRatings: fields.kpi,
    kpiComments: fields.kpiComments,
    values: submission.value_ratings.map((v) => ({ id: v.value_id, name: valueName(v.value_id) })),
    valueRatings: fields.values,
    valueComments: fields.valueComments,
  });
  const summary = summarizeChecklist(checklist);
  const goToItem = (_group: ChecklistGroup, item: ChecklistItem) => {
    const [kind, id] = item.key.split(":");
    if (kind !== "kpi" && kind !== "value") return;
    setTab(kind === "kpi" ? "kpis" : "values");
    window.setTimeout(() => document.getElementById(explainedRowDomId(kind, Number(id)))?.scrollIntoView({ behavior: "smooth", block: "center" }), 60);
  };
  const hrSendBack =
    submission.review_status === "NEEDS_MANAGER_REVIEW" && submission.admin_review?.action === "REJECT_MANAGER" ? submission.admin_review.comments : null;
  const others = submission.managers.filter((m) => m.email.toLowerCase() !== (user?.email ?? "").toLowerCase()).map((m) => m.name);

  const send = async (action: "SUBMIT" | "REJECT") => {
    setConfirming(false);
    if (action === "REJECT" && fields.comments.trim().length < MIN_SEND_BACK_COMMENT) return notifyError("Add at least 10 characters of feedback before sending this back.");
    if (action === "SUBMIT" && !summary.complete) return notifyError(`${summary.remaining} item(s) still need a rating and a reason — see What's left.`);
    await draft.flush(); // the shared draft is current before it becomes final
    review.mutate(
      {
        id: submission.id,
        payload: {
          action,
          kpi_ratings: action === "SUBMIT" ? Object.entries(fields.kpi).map(([id, rating]) => ({ kpi_id: Number(id), rating, comment: fields.kpiComments[Number(id)] ?? "" })) : [],
          value_ratings: action === "SUBMIT" ? Object.entries(fields.values).map(([id, rating]) => ({ value_id: Number(id), rating, comment: fields.valueComments[Number(id)] ?? "" })) : [],
          comments: fields.comments,
        },
      },
      { onSuccess: onDone }
    );
  };
  const busy = review.isPending ? review.variables?.payload.action : null;
  const tabs: { id: ReviewTab; label: string; badge?: string }[] = [
    { id: "kpis", label: "KPIs", badge: `${checklist.find((g) => g.key === "kpis")?.items.filter((i) => i.done).length ?? 0}/${submission.kpi_details.length}` },
    { id: "values", label: "Values", badge: `${checklist.find((g) => g.key === "values")?.items.filter((i) => i.done).length ?? 0}/${submission.value_ratings.length}` },
    { id: "notes", label: "Employee notes" },
  ];

  return (
    <div className="flex min-h-0 flex-col gap-4">
      <header className="rounded-2xl border border-wt-border bg-wt-surface-1 p-4">
        <div className="flex items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[var(--wt-brand-soft)] text-sm font-semibold text-[var(--wt-brand)]" aria-hidden>{initials(submission.employee.name)}</span>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-base font-semibold text-wt-text">{submission.employee.name}</h2>
            <p className="truncate text-xs text-wt-text-muted">{formatMonthLabel(submission.month)} · {submission.employee.emp_id ?? submission.employee.email}</p>
            {others.length > 0 ? <p className="mt-0.5 flex items-center gap-1.5 text-xs text-wt-text-muted"><Users className="size-3.5" /> Reviewing together with {others.join(", ")}</p> : null}
          </div>
          <div className="w-32 shrink-0 text-right">
            <p className="text-xs font-semibold tabular-nums text-wt-text">{summary.done}/{summary.total} done</p>
            <ProgressBar done={summary.done} total={summary.total} className="mt-1.5" />
          </div>
        </div>
        {decided ? (
          <p role="status" className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-wt-text-muted">
            <span className="font-semibold text-wt-text">{decided.by ? `${decided.by.name} has already decided this review.` : "This review has already been decided."}</span> Nothing more is needed from you.
          </p>
        ) : (
          <p role="status" className="mt-3 flex flex-wrap justify-between gap-2 text-xs text-wt-text-muted">
            <span>{draft.coEditor ? `${draft.coEditor.name} is editing — ` : ""}{PULSE_COPY.sharedDraftHint}</span>
            <span aria-live="polite">{SAVE_LABEL[draft.saveState]}</span>
          </p>
        )}
        {hrSendBack ? (
          <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-wt-text-muted">
            <span className="font-semibold text-wt-text">HR rejected the managers&apos; review: </span>{hrSendBack} Your previous ratings are filled in — change what needs changing and submit again.
          </p>
        ) : null}
      </header>

      {readOnly ? null : (
        <details className="group rounded-xl border border-wt-border bg-wt-surface-1">
          <summary className="cursor-pointer list-none px-4 py-2.5 text-sm font-medium text-wt-text">
            {PULSE_COPY.checklistTitle} <span className="font-normal text-wt-text-muted">— {summary.complete ? PULSE_COPY.checklistDone : `${summary.remaining} to go (click to see)`}</span>
          </summary>
          <SubmissionChecklist groups={checklist} onSelect={goToItem} className="rounded-t-none border-0 border-t" />
        </details>
      )}

      <div className="flex gap-1.5 border-b border-wt-border" role="tablist">
        {tabs.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}
            className={cn("-mb-px flex items-center gap-2 border-b-2 px-3.5 py-2 text-sm font-medium transition-colors", tab === t.id ? "border-[var(--wt-brand)] text-[var(--wt-brand)]" : "border-transparent text-wt-text-muted hover:text-wt-text")}>
            {t.label}
            {t.badge ? <span className="rounded-full bg-wt-surface-3 px-1.5 text-[11px] tabular-nums text-wt-text-muted">{t.badge}</span> : null}
          </button>
        ))}
      </div>

      {tab === "kpis" ? <KpiTab submission={submission} draft={draft} readOnly={readOnly} /> : null}
      {tab === "values" ? <ValuesTab submission={submission} draft={draft} readOnly={readOnly} /> : null}
      {tab === "notes" ? <NotesTab submission={submission} /> : null}

      <div className="sticky bottom-3 z-10 space-y-2.5 rounded-2xl border border-wt-border bg-wt-surface-1/95 p-3 shadow-[var(--wt-shadow-lg)] backdrop-blur sm:p-4">
        <textarea
          value={fields.comments}
          onChange={(e) => draft.setComments(e.target.value)}
          placeholder="Comments — shared with the other managers and the employee. Required to send back (min. 10 characters)."
          rows={2}
          aria-label="Your comments"
          disabled={readOnly}
          className="w-full resize-none rounded-lg border border-wt-border bg-wt-surface-1 px-3 py-2 text-sm text-wt-text placeholder:text-wt-text-faint focus:outline-none focus:ring-2 focus:ring-[var(--wt-brand)]/40 disabled:opacity-60"
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-wt-text-muted">{!canAct ? "The manager window is closed — read only." : summary.complete ? "Everything is filled in — ready to submit." : `${summary.remaining} left.`}</span>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" className="!border-rose-300 !text-rose-600 hover:!bg-rose-50" disabled={readOnly || busy != null} onClick={() => void send("REJECT")}>
              <Undo2 className="size-4" /> {busy === "REJECT" ? "Sending…" : PULSE_COPY.managerRejectLabel}
            </Button>
            <Button type="button" variant="brand" size="sm" disabled={readOnly || busy != null || !summary.complete} onClick={() => setConfirming(true)}>
              <CheckCircle2 className="size-4" /> {busy === "SUBMIT" ? "Submitting…" : PULSE_COPY.managerSubmitLabel}
            </Button>
          </div>
        </div>
      </div>

      <ConfirmDialog open={confirming} title={PULSE_COPY.managerFinalConfirmTitle} description={PULSE_COPY.managerFinalConfirmBody} confirmLabel={PULSE_COPY.managerFinalConfirmLabel} loading={busy === "SUBMIT"} onConfirm={() => void send("SUBMIT")} onCancel={() => setConfirming(false)} />
    </div>
  );
}
