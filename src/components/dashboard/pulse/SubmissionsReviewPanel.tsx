"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, ChevronRight, Trash2, Upload, XCircle } from "lucide-react";

import { SectionLoading } from "@/components/dashboard/ui/SectionLoading";
import { EmptyState } from "@/components/dashboard/ui/EmptyState";
import { MetricCard } from "@/components/dashboard/ui/MetricCard";
import { ToolbarFilterSelect } from "@/components/dashboard/ui/ToolbarFilterSelect";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  MODAL_BODY_CLASS,
  MODAL_FOOTER_CLASS,
  MODAL_HEADER_CLASS,
  MODAL_OVERLAY_CLASS,
  MODAL_PANEL_CLASS,
} from "@/components/dashboard/ui/uiLayout";
import { hrmsService } from "@/services/hrms.service";
import { notifyError, notifySuccess } from "@/lib/notify";
import { toUserFriendlyApiErrorMessage } from "@/utils/userFriendlyApiError";
import { ApiError } from "@/api/error";
import type {
  AdminMonthlyOverview,
  MonthlySubmissionItem,
  MonthlySubmissionReviewStatus,
  ScoreBreakdown,
} from "@/types/kpi";

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

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "MANAGER_SUBMITTED", label: "Awaiting HR approval" },
  { value: "NEEDS_REVIEW", label: "Back with employee" },
  { value: "NEEDS_MANAGER_REVIEW", label: "Back with manager" },
  { value: "APPROVED", label: "Approved" },
  { value: "SUBMITTED", label: "Awaiting manager" },
];

function statusLabel(status: MonthlySubmissionReviewStatus | null): string {
  return STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status ?? "—";
}

export function SubmissionsReviewPanel() {
  const [statusFilter, setStatusFilter] = useState("MANAGER_SUBMITTED");
  const [reloadTick, setReloadTick] = useState(0);
  const refresh = useCallback(() => setReloadTick((t) => t + 1), []);
  const submissions = useLoad<MonthlySubmissionItem[]>(
    () => hrmsService.listAllMonthlySubmissions({ reviewStatus: statusFilter || undefined }),
    [statusFilter, reloadTick]
  );
  const overview = useLoad<AdminMonthlyOverview>(() => hrmsService.getAdminMonthlyOverview(), [reloadTick]);
  const [reviewing, setReviewing] = useState<MonthlySubmissionItem | null>(null);

  const importInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const handleImport = async (file: File) => {
    setImporting(true);
    try {
      const res = await hrmsService.importMonthlySubmissionsRatingsCsv(file);
      notifySuccess(res.message ?? "Ratings history imported.");
      refresh();
    } catch (error) {
      notifyError(
        toUserFriendlyApiErrorMessage(
          error,
          error instanceof ApiError ? error.message : "Couldn't import the CSV."
        )
      );
    } finally {
      setImporting(false);
    }
  };

  const [deleteTarget, setDeleteTarget] = useState<MonthlySubmissionItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await hrmsService.deleteMonthlySubmission(deleteTarget.id);
      notifySuccess("Submission deleted.");
      setDeleteTarget(null);
      refresh();
    } catch (error) {
      notifyError(
        toUserFriendlyApiErrorMessage(
          error,
          error instanceof ApiError ? error.message : "Couldn't delete the submission."
        )
      );
    } finally {
      setDeleting(false);
    }
  };

  const rows = submissions.data ?? [];

  return (
    <div className="space-y-5">
      {overview.data ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MetricCard label="This cycle" value={overview.data.total_submissions} loading={false} />
          <MetricCard label="Manager reviewed" value={overview.data.manager_reviewed} loading={false} />
          <MetricCard label="Approved" value={overview.data.approved} loading={false} />
          <MetricCard
            label="Pending manager review"
            value={overview.data.pending_manager_review}
            loading={false}
          />
        </div>
      ) : null}
      {overview.data?.six_month_review_month ? (
        <p className="text-xs text-wt-text-muted">
          {overview.data.cycle_key} is a six-month review month.
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-wt-text">Submissions</h3>
          <p className="mt-0.5 text-xs text-wt-text-muted">
            Manager-reviewed submissions, weighted score, final approval.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={importInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (!file) return;
              void handleImport(file);
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => importInputRef.current?.click()}
            disabled={importing}
          >
            <Upload className="mr-1.5 size-4" /> {importing ? "Importing…" : "Import Ratings CSV"}
          </Button>
          <ToolbarFilterSelect
            value={statusFilter}
            onChange={setStatusFilter}
            options={STATUS_OPTIONS}
            placeholder="All statuses"
            aria-label="Filter by status"
          />
        </div>
      </div>

      {submissions.status === "loading" ? (
        <SectionLoading label="" />
      ) : rows.length === 0 ? (
        <EmptyState title="Nothing Here" description="No submissions match this filter." />
      ) : (
        <div className="space-y-2">
          {rows.map((row) => (
            <div
              key={row.id}
              className="flex w-full items-center justify-between gap-3 rounded-xl border border-wt-border bg-wt-surface-1 px-4 py-3 transition-colors hover:border-wt-brand/40"
            >
              <button
                type="button"
                onClick={() => setReviewing(row)}
                className="flex min-w-0 flex-1 items-center justify-between gap-3 text-left"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-wt-text">{row.employee.name}</p>
                  <p className="text-xs text-wt-text-muted">{row.cycle_label}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant="outline">{statusLabel(row.review_status)}</Badge>
                  {row.final_score != null ? <Badge>{row.final_score}</Badge> : null}
                  <ChevronRight className="size-4 text-wt-text-faint" />
                </div>
              </button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setDeleteTarget(row)}
                aria-label={`Delete ${row.employee.name}'s submission`}
              >
                <Trash2 className="size-3.5 text-rose-600" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {reviewing ? (
        <AdminReviewModal
          submission={reviewing}
          onClose={() => setReviewing(null)}
          onDone={() => {
            setReviewing(null);
            refresh();
          }}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete this submission?"
        description={
          deleteTarget
            ? `"${deleteTarget.employee.name}"'s ${deleteTarget.cycle_label} submission will be removed. This can't be undone.`
            : ""
        }
        confirmLabel="Delete"
        tone="danger"
        loading={deleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function AdminReviewModal({
  submission,
  onClose,
  onDone,
}: {
  submission: MonthlySubmissionItem;
  onClose: () => void;
  onDone: () => void;
}) {
  const canScore = submission.review_status === "MANAGER_SUBMITTED";
  const breakdown = useLoad<ScoreBreakdown>(
    () =>
      canScore
        ? hrmsService.getMonthlySubmissionScoreBreakdown(submission.id)
        : Promise.reject(new Error("not scoreable")),
    [submission.id, canScore]
  );

  const [comments, setComments] = useState("");
  const [techShowcase, setTechShowcase] = useState("");
  const [busy, setBusy] = useState<"approve" | "reject" | "reject-manager" | null>(null);

  const submit = useCallback(
    async (action: "APPROVE" | "REJECT" | "REJECT_MANAGER") => {
      if (action !== "APPROVE" && comments.trim().length < 10) {
        notifyError("Add at least 10 characters of feedback before rejecting.");
        return;
      }
      setBusy(action === "APPROVE" ? "approve" : action === "REJECT" ? "reject" : "reject-manager");
      try {
        await hrmsService.submitAdminReview(submission.id, {
          action,
          comments,
          tech_showcase: techShowcase || null,
        });
        notifySuccess(
          action === "APPROVE"
            ? "Approved."
            : action === "REJECT"
              ? "Sent back to the employee."
              : "Sent back to the manager."
        );
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
    },
    [comments, techShowcase, submission.id, onDone]
  );

  return (
    <div className={MODAL_OVERLAY_CLASS} role="presentation" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" className={MODAL_PANEL_CLASS}>
        <div className={MODAL_HEADER_CLASS}>
          <h2 className="text-base font-semibold text-wt-text">{submission.employee.name}</h2>
          <p className="mt-1 text-xs text-wt-text-muted">
            {submission.cycle_label} · {statusLabel(submission.review_status)}
          </p>
        </div>
        <div className={MODAL_BODY_CLASS}>
          <div className="space-y-5">
            {canScore ? (
              <div>
                <h3 className="text-sm font-semibold text-wt-text">RTP score</h3>
                {breakdown.status === "loading" ? (
                  <SectionLoading label="" />
                ) : breakdown.data ? (
                  <>
                    <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <ScoreTile
                        label={`KPI (${Math.round(breakdown.data.kpi_weight * 100)}%)`}
                        value={breakdown.data.weighted_kpi_component}
                      />
                      <ScoreTile
                        label={`Values (${Math.round(breakdown.data.values_weight * 100)}%)`}
                        value={breakdown.data.weighted_values_component}
                      />
                      <ScoreTile label="Brownie points" value={breakdown.data.brownie_points} />
                      <ScoreTile label="Final" value={breakdown.data.total_score} emphasize />
                    </div>
                    <p className="mt-2 text-xs text-wt-text-muted">
                      Normalized KPI {breakdown.data.normalized_kpi_score}/5 · Values{" "}
                      {breakdown.data.normalized_values_score}/5 · Certification points{" "}
                      {breakdown.data.certification_points} · Recognition points{" "}
                      {breakdown.data.recognition_points}
                      {breakdown.data.promotion_eligible ? " · Promotion eligible (≥ 4.0)" : ""}
                    </p>
                  </>
                ) : null}
              </div>
            ) : submission.final_score != null ? (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-wt-text">
                Final score: <span className="font-semibold">{submission.final_score}</span>
                {submission.promotion_eligible ? (
                  <span className="ml-2 text-xs text-emerald-600 dark:text-emerald-400">
                    Promotion eligible
                  </span>
                ) : null}
              </div>
            ) : null}

            <div>
              <h3 className="text-sm font-semibold text-wt-text">Self review</h3>
              <p className="mt-1.5 whitespace-pre-wrap rounded-lg border border-wt-border bg-wt-surface-2/40 p-3 text-sm text-wt-text">
                {submission.self_review_text || "—"}
              </p>
            </div>

            {submission.manager_evaluation ? (
              <div>
                <h3 className="text-sm font-semibold text-wt-text">Manager evaluation</h3>
                <p className="mt-1.5 whitespace-pre-wrap rounded-lg border border-wt-border bg-wt-surface-2/40 p-3 text-sm text-wt-text">
                  {submission.manager_evaluation.comments || "—"}
                </p>
              </div>
            ) : null}

            {submission.certifications.length > 0 ? (
              <div>
                <h3 className="text-sm font-semibold text-wt-text">Certifications claimed</h3>
                <ul className="mt-1.5 space-y-1 text-sm text-wt-text-muted">
                  {submission.certifications.map((c) => (
                    <li key={c.certification_id}>
                      #{c.certification_id} {c.proof ? `— ${c.proof}` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {canScore ? (
              <>
                <div>
                  <label className="text-sm font-semibold text-wt-text" htmlFor="tech-showcase">
                    Tech showcase (optional)
                  </label>
                  <input
                    id="tech-showcase"
                    type="text"
                    value={techShowcase}
                    onChange={(e) => setTechShowcase(e.target.value)}
                    placeholder="A notable technical contribution this cycle"
                    className="mt-1.5 w-full rounded-lg border border-wt-border bg-wt-surface-1 px-3 py-2 text-sm text-wt-text placeholder:text-wt-text-faint focus:outline-none focus:ring-2 focus:ring-wt-brand/40"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-wt-text" htmlFor="admin-comments">
                    Comments
                  </label>
                  <textarea
                    id="admin-comments"
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Required to reject (min. 10 characters)."
                    rows={3}
                    className="mt-1.5 w-full rounded-lg border border-wt-border bg-wt-surface-1 px-3 py-2 text-sm text-wt-text placeholder:text-wt-text-faint focus:outline-none focus:ring-2 focus:ring-wt-brand/40"
                  />
                </div>
              </>
            ) : null}
          </div>
        </div>
        <div className={MODAL_FOOTER_CLASS}>
          <Button type="button" variant="outline" onClick={onClose} disabled={busy !== null}>
            Close
          </Button>
          {canScore ? (
            <>
              <Button
                type="button"
                variant="outline"
                className="!border-amber-300 !text-amber-700 hover:!bg-amber-50"
                onClick={() => void submit("REJECT_MANAGER")}
                disabled={busy !== null}
              >
                {busy === "reject-manager" ? "Sending…" : "Back to Manager"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="!border-rose-300 !text-rose-600 hover:!bg-rose-50"
                onClick={() => void submit("REJECT")}
                disabled={busy !== null}
              >
                <XCircle className="mr-1.5 size-4" />
                {busy === "reject" ? "Sending…" : "Back to Employee"}
              </Button>
              <Button type="button" onClick={() => void submit("APPROVE")} disabled={busy !== null}>
                <CheckCircle2 className="mr-1.5 size-4" />
                {busy === "approve" ? "Approving…" : "Approve"}
              </Button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ScoreTile({ label, value, emphasize = false }: { label: string; value: number; emphasize?: boolean }) {
  return (
    <div
      className={`rounded-lg border px-3 py-2.5 ${
        emphasize ? "border-wt-brand bg-wt-brand-soft" : "border-wt-border bg-wt-surface-2/40"
      }`}
    >
      <p className="text-[11px] font-medium uppercase tracking-wide text-wt-text-muted">{label}</p>
      <p className={`mt-0.5 text-lg font-semibold ${emphasize ? "text-wt-brand" : "text-wt-text"}`}>
        {value.toFixed(2)}
      </p>
    </div>
  );
}
