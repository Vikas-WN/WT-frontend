"use client";

import { pulseRatingLabel } from "@/constants/pulseRatings";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Pencil, Upload, XCircle } from "lucide-react";

import { SectionLoading } from "@/components/dashboard/ui/SectionLoading";
import { EmptyState } from "@/components/dashboard/ui/EmptyState";
import { SearchInput } from "@/components/dashboard/ui/SearchInput";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  FORM_CONTROL_CLASS,
  MODAL_BODY_CLASS,
  MODAL_FOOTER_CLASS,
  MODAL_HEADER_CLASS,
  MODAL_OVERLAY_CLASS,
  MODAL_PANEL_CLASS,
} from "@/components/dashboard/ui/uiLayout";
import { ModalPortal } from "@/components/dashboard/ui/ModalPortal";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  WtTable,
} from "@/components/dashboard/ui/wtTable";
import { AdminEditSubmissionForm } from "@/components/dashboard/pulse/AdminEditSubmissionForm";
import { useSubmissionLink } from "@/components/dashboard/pulse/useSubmissionLink";
import { MonthSwitcher } from "@/components/dashboard/pulse/shared/MonthSwitcher";
import { MonthOverview } from "@/components/dashboard/pulse/submissions/MonthOverview";
import { StatusChips } from "@/components/dashboard/pulse/submissions/StatusChips";
import { SubmissionList } from "@/components/dashboard/pulse/submissions/SubmissionList";
import { ALL, computeMonthStats, matchesQuery, type StatusFilter } from "@/components/dashboard/pulse/submissions/submissionsModel";
import { currentMonthKey, formatMonthLabel } from "@/utils/pulseMonth";
import { hrmsService } from "@/services/hrms.service";
import { notifyError, notifySuccess } from "@/lib/notify";
import { toUserFriendlyApiErrorMessage } from "@/utils/userFriendlyApiError";
import { ApiError } from "@/api/error";
import { cn } from "@/lib/utils";
import { formatWeight, groupKpisByParameter, hasKpiParameters } from "@/utils/kpiParameters";
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

const ALL_STATUSES = "ALL";

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: ALL_STATUSES, label: "All statuses" },
  { value: "SUBMITTED", label: "Awaiting managers" },
  { value: "NEEDS_REVIEW", label: "Rejected — with employee" },
  { value: "NEEDS_MANAGER_REVIEW", label: "Rejected — with managers" },
  { value: "APPROVED", label: "Final" },
  // Only rows from before managers' submissions became final; nothing new lands here.
  { value: "MANAGER_SUBMITTED", label: "Awaiting HR approval (older)" },
];

function statusLabel(status: MonthlySubmissionReviewStatus | null): string {
  return STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status ?? "—";
}

export function SubmissionsReviewPanel() {
  const [month, setMonth] = useState(currentMonthKey);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(ALL);
  const [query, setQuery] = useState("");
  const [reloadTick, setReloadTick] = useState(0);
  const refresh = useCallback(() => setReloadTick((t) => t + 1), []);

  // Arrived from a notification (`?submission=`): look across every month while the link is active so the
  // submission is found wherever it now stands; it opens until the review is closed, which drops the link.
  const { linkedId, clear: clearLink } = useSubmissionLink();
  const lookupMonth = linkedId != null ? undefined : month;
  const submissions = useLoad<{ month: string | undefined; rows: MonthlySubmissionItem[] }>(
    () => hrmsService.listAllMonthlySubmissions({ month: lookupMonth }).then((rows) => ({ month: lookupMonth, rows })),
    [lookupMonth, reloadTick]
  );
  // Rows stay on screen until a refetch lands — only trust them for the link once they were loaded for it.
  const listFresh = submissions.status === "done" && submissions.data?.month === lookupMonth;
  const overview = useLoad<AdminMonthlyOverview>(() => hrmsService.getAdminMonthlyOverview({ month }), [month, reloadTick]);
  const [reviewing, setReviewing] = useState<MonthlySubmissionItem | null>(null);
  const linkedRow =
    linkedId != null && listFresh ? (submissions.data?.rows.find((row) => row.id === linkedId) ?? null) : null;
  const open = reviewing ?? linkedRow;
  const closeReview = () => {
    setReviewing(null);
    if (linkedId != null) clearLink();
  };
  useEffect(() => {
    if (linkedId == null || !listFresh || linkedRow) return;
    notifyError("That submission couldn't be found — it may have been deleted.");
    clearLink();
  }, [linkedId, listFresh, linkedRow, clearLink]);

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
        toUserFriendlyApiErrorMessage(error, error instanceof ApiError ? error.message : "Couldn't import the CSV.")
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
        toUserFriendlyApiErrorMessage(error, error instanceof ApiError ? error.message : "Couldn't delete the submission.")
      );
    } finally {
      setDeleting(false);
    }
  };

  const allRows = useMemo(() => submissions.data?.rows ?? [], [submissions.data]);
  const stats = useMemo(() => computeMonthStats(allRows), [allRows]);
  // A filter chip for a status that has no rows this month would show an empty list — fall back to All.
  const activeFilter: StatusFilter = statusFilter === ALL || (stats.byStatus[statusFilter] ?? 0) > 0 ? statusFilter : ALL;
  const rows = useMemo(
    () => allRows.filter((row) => (activeFilter === ALL || row.review_status === activeFilter) && matchesQuery(row, query)),
    [allRows, activeFilter, query]
  );
  const loading = submissions.status === "loading";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <MonthSwitcher value={month} onChange={setMonth} maxMonth={currentMonthKey()} />
          {overview.data?.six_month_review_month ? (
            <span className="rounded-full border border-[var(--wt-brand)]/25 bg-[var(--wt-brand-soft)] px-3 py-1 text-xs font-semibold text-[var(--wt-brand)]">
              Six-month review month
            </span>
          ) : null}
        </div>
        <div>
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
          <Button type="button" variant="outline" onClick={() => importInputRef.current?.click()} disabled={importing}>
            <Upload className="mr-1.5 size-4" /> {importing ? "Importing…" : "Import ratings CSV"}
          </Button>
        </div>
      </div>

      {linkedId != null ? (
        <p className="rounded-xl border border-[var(--wt-brand)]/25 bg-[var(--wt-brand-soft)] px-4 py-2.5 text-sm text-wt-text">
          Opening the submission you were linked to — searching every month.
        </p>
      ) : null}

      <MonthOverview month={month} stats={stats} loading={loading} />

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-wt-text">Submissions</h3>
            <p className="mt-0.5 text-xs text-wt-text-muted">
              Open one to see every rating side by side — send it back, correct anyone&apos;s part, or give final approval.
            </p>
          </div>
          <div className="w-full sm:w-72">
            <SearchInput
              id="pulse-submissions-search"
              value={query}
              onChange={setQuery}
              placeholder="Search name, ID or reviewer"
              aria-label="Search submissions"
            />
          </div>
        </div>

        {stats.total > 0 ? <StatusChips stats={stats} value={activeFilter} onChange={setStatusFilter} /> : null}

        {loading ? (
          <SectionLoading label="" />
        ) : allRows.length === 0 ? (
          <EmptyState
            title={`Nothing submitted for ${formatMonthLabel(month)}`}
            description="Once people submit their self-reviews for this month they will show up here. Try another month with the arrows above."
          />
        ) : rows.length === 0 ? (
          <EmptyState title="No matches" description="No submissions match this search and filter." />
        ) : (
          <SubmissionList rows={rows} onOpen={setReviewing} onDelete={setDeleteTarget} />
        )}
      </section>

      {open ? (
        <AdminReviewModal
          key={open.id}
          submission={open}
          onClose={closeReview}
          onDone={() => {
            closeReview();
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

// Mirrors the backend's _ADMIN_ACTION_STATUSES: HR can pull a review back to
// the employee from any reviewer stage (approved ones reopen), and back to the
// manager once the manager has rated it.
const SEND_TO_EMPLOYEE_STATUSES = ["SUBMITTED", "NEEDS_MANAGER_REVIEW", "MANAGER_SUBMITTED", "APPROVED"];
const SEND_TO_MANAGER_STATUSES = ["MANAGER_SUBMITTED", "APPROVED"];

const EDIT_FIELD_LABELS: Record<string, string> = {
  self_review: "self review",
  employee_kpi_ratings: "employee KPI ratings",
  employee_value_ratings: "employee value ratings",
  manager_kpi_ratings: "manager KPI ratings",
  manager_value_ratings: "manager value ratings",
  manager_comments: "manager comments",
  final_score: "final score",
};

/** Exported for KpiReportsPanel — HR opens the same review from an employee's report. */
export function AdminReviewModal({
  submission: initialSubmission,
  onClose,
  onDone,
}: {
  submission: MonthlySubmissionItem;
  onClose: () => void;
  onDone: () => void;
}) {
  // Edits return the updated row; keep showing it without closing the modal.
  const [submission, setSubmission] = useState(initialSubmission);
  const [editing, setEditing] = useState(false);
  const [edited, setEdited] = useState(false);
  const status = submission.review_status ?? "";
  const canScore = status === "MANAGER_SUBMITTED";
  const canSendToEmployee = SEND_TO_EMPLOYEE_STATUSES.includes(status);
  const canSendToManager = SEND_TO_MANAGER_STATUSES.includes(status);
  const canEdit = Boolean(status) && status !== "DRAFT";
  const canDecide = canScore || canSendToEmployee || canSendToManager;
  const close = edited ? onDone : onClose;
  const breakdown = useLoad<ScoreBreakdown>(
    () =>
      canScore
        ? hrmsService.getMonthlySubmissionScoreBreakdown(submission.id)
        : Promise.reject(new Error("not scoreable")),
    [submission.id, submission.updated_at, canScore]
  );

  const [comments, setComments] = useState("");
  const [techShowcase, setTechShowcase] = useState("");
  const [scoreOverride, setScoreOverride] = useState("");
  const [busy, setBusy] = useState<"approve" | "reject" | "reject-manager" | null>(null);

  const submit = useCallback(
    async (action: "APPROVE" | "REJECT" | "REJECT_MANAGER") => {
      if (action !== "APPROVE" && comments.trim().length < 10) {
        notifyError("Add at least 10 characters of feedback before rejecting.");
        return;
      }
      const override = scoreOverride.trim() ? Number(scoreOverride) : null;
      // The real ceiling depends on Settings → Pulse scoring; the server
      // rejects anything above it with the exact limit.
      if (action === "APPROVE" && override !== null && !(override >= 1 && override <= 10)) {
        notifyError("Final score override must be a number between 1 and 10.");
        return;
      }
      setBusy(action === "APPROVE" ? "approve" : action === "REJECT" ? "reject" : "reject-manager");
      try {
        await hrmsService.submitAdminReview(submission.id, {
          action,
          comments,
          tech_showcase: techShowcase || null,
          ...(action === "APPROVE" && override !== null ? { final_score: override } : {}),
        });
        notifySuccess(
          action === "APPROVE"
            ? "Approved."
            : action === "REJECT"
              ? "Rejected — the employee will redo their submission."
              : "Manager rejected — only the managers will revise their ratings."
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
    [comments, techShowcase, scoreOverride, submission.id, onDone]
  );

  return (
    <ModalPortal onEscape={busy ? undefined : close}>
      <div className={MODAL_OVERLAY_CLASS} role="presentation" onClick={(e) => e.target === e.currentTarget && close()}>
        <div role="dialog" aria-modal="true" className={cn(MODAL_PANEL_CLASS, "max-w-4xl")}>
          <div className={cn(MODAL_HEADER_CLASS, "flex items-start justify-between gap-3")}>
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-wt-text">{submission.employee.name}</h2>
              <p className="mt-1 text-xs text-wt-text-muted">
                {submission.cycle_label} · {statusLabel(submission.review_status)}
                {submission.manager_review?.reviewed_by ? ` · Manager: ${submission.manager_review.reviewed_by}` : ""}
              </p>
            </div>
            {canEdit && !editing ? (
              <Button type="button" variant="outline" size="sm" onClick={() => setEditing(true)}>
                <Pencil className="mr-1.5 size-3.5" /> Edit
              </Button>
            ) : null}
          </div>
          <div className={MODAL_BODY_CLASS}>
            {editing ? (
              <AdminEditSubmissionForm
                submission={submission}
                onCancel={() => setEditing(false)}
                onSaved={(updated) => {
                  setSubmission(updated);
                  setEdited(true);
                  setEditing(false);
                }}
              />
            ) : (
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

              <RatingsComparison submission={submission} />

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
                        {submission.certification_details.find((d) => d.id === c.certification_id)?.name ??
                          `Certification #${c.certification_id}`}
                        {c.proof ? ` — ${c.proof}` : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {submission.admin_edits?.length ? (
                <div>
                  <h3 className="text-sm font-semibold text-wt-text">HR edits</h3>
                  <ul className="mt-1.5 space-y-1.5 text-xs text-wt-text-muted">
                    {submission.admin_edits.map((e, i) => (
                      <li key={i} className="rounded-lg border border-wt-border bg-wt-surface-2/40 px-3 py-2">
                        <span className="font-medium text-wt-text">{e.edited_by}</span>
                        {e.edited_at ? ` · ${new Date(e.edited_at).toLocaleString()}` : ""} · changed{" "}
                        {e.fields.map((f) => EDIT_FIELD_LABELS[f] ?? f).join(", ")}
                        <p className="mt-0.5">“{e.reason}”</p>
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
                      className={cn(FORM_CONTROL_CLASS, "mt-1.5")}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-wt-text" htmlFor="score-override">
                      Final score override (optional)
                    </label>
                    <input
                      id="score-override"
                      type="number"
                      min={1}
                      max={10}
                      step={0.01}
                      value={scoreOverride}
                      onChange={(e) => setScoreOverride(e.target.value)}
                      placeholder={
                        breakdown.data ? `Leave blank to use ${breakdown.data.total_score.toFixed(2)}` : "Leave blank to use the computed score"
                      }
                      className={cn(FORM_CONTROL_CLASS, "mt-1.5")}
                    />
                  </div>
                </>
              ) : null}

              {canDecide ? (
                <div>
                  <label className="text-sm font-semibold text-wt-text" htmlFor="admin-comments">
                    Comments
                  </label>
                  <textarea
                    id="admin-comments"
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder={
                      status === "APPROVED"
                        ? "Required to reopen and send back (min. 10 characters)."
                        : "Required to send back (min. 10 characters)."
                    }
                    rows={3}
                    className={cn(FORM_CONTROL_CLASS, "mt-1.5 min-h-20 resize-y py-2.5")}
                  />
                  <ul className="mt-2 space-y-1 text-xs text-wt-text-muted">
                    <li>
                      <span className="font-medium text-wt-text">Reject Manager</span> — only the managers revise:
                      their ratings come back to them to change, and the employee&apos;s submission stays as it is.
                    </li>
                    <li>
                      <span className="font-medium text-wt-text">Reject (Employee Redoes)</span> — the employee
                      redoes the whole submission; it goes to the project managers again and they rate from
                      scratch.
                    </li>
                  </ul>
                </div>
              ) : null}
            </div>
            )}
          </div>
          <div className={MODAL_FOOTER_CLASS}>
            <Button type="button" variant="outline" onClick={close} disabled={busy !== null}>
              Close
            </Button>
            {!editing && canSendToManager ? (
              <Button
                type="button"
                variant="outline"
                className="!border-amber-300 !text-amber-700 hover:!bg-amber-50"
                onClick={() => void submit("REJECT_MANAGER")}
                disabled={busy !== null}
              >
                {busy === "reject-manager" ? "Sending…" : "Reject Manager"}
              </Button>
            ) : null}
            {!editing && canSendToEmployee ? (
              <Button
                type="button"
                variant="outline"
                className="!border-rose-300 !text-rose-600 hover:!bg-rose-50"
                onClick={() => void submit("REJECT")}
                disabled={busy !== null}
              >
                <XCircle className="mr-1.5 size-4" />
                {busy === "reject" ? "Sending…" : "Reject (Employee Redoes)"}
              </Button>
            ) : null}
            {!editing && canScore ? (
              <Button type="button" onClick={() => void submit("APPROVE")} disabled={busy !== null}>
                <CheckCircle2 className="mr-1.5 size-4" />
                {busy === "approve" ? "Approving…" : "Approve"}
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}

/** Employee self-rating vs manager rating, side by side, per KPI (grouped
 *  under its parameter, with the parameter's weight and averages) and value.
 *  Exported for KpiReportsPanel's per-submission breakdown. */
export function RatingsComparison({ submission }: { submission: MonthlySubmissionItem }) {
  const selfKpi = new Map(submission.kpi_ratings.map((r) => [r.kpi_id, r.rating]));
  const selfKpiWhy = new Map(submission.kpi_ratings.map((r) => [r.kpi_id, r.comment]));
  const mgrKpi = submission.manager_evaluation?.kpi_ratings ?? {};
  const mgrKpiWhy = submission.manager_evaluation?.kpi_comments ?? {};
  const selfValue = new Map(submission.value_ratings.map((r) => [r.value_id, r.rating]));
  const selfValueWhy = new Map(submission.value_ratings.map((r) => [r.value_id, r.comment]));
  const mgrValue = submission.manager_evaluation?.value_ratings ?? {};
  const mgrValueWhy = submission.manager_evaluation?.value_comments ?? {};
  const showParameters = hasKpiParameters(submission.kpi_details);

  type Row = {
    key: string;
    label: string;
    meta: string | null;
    self?: number;
    manager?: number;
    /** Why each side gave that rating. */
    selfWhy?: string;
    managerWhy?: string;
  };
  const sections: { key: string; title: string | null; weight: number | null; rows: Row[] }[] = [
    ...groupKpisByParameter(submission.kpi_details).map((group) => ({
      key: `p-${group.parameter ?? "none"}`,
      title: showParameters ? (group.parameter ?? "Other") : null,
      weight: showParameters ? group.weight : null,
      rows: group.items.map((k) => ({
        key: `k${k.id}`,
        label: k.kpi_name,
        meta: showParameters ? null : `KPI · ${formatWeight(k.weightage)}`,
        self: selfKpi.get(k.id),
        manager: mgrKpi[String(k.id)],
        selfWhy: selfKpiWhy.get(k.id),
        managerWhy: mgrKpiWhy[String(k.id)],
      })),
    })),
  ];
  if (submission.value_details.length > 0) {
    sections.push({
      key: "values",
      title: "Company Values",
      weight: null,
      rows: submission.value_details.map((v) => ({
        key: `v${v.id}`,
        label: v.name,
        meta: null,
        self: selfValue.get(v.id),
        manager: mgrValue[String(v.id)],
        selfWhy: selfValueWhy.get(v.id),
        managerWhy: mgrValueWhy[String(v.id)],
      })),
    });
  }
  if (sections.every((section) => section.rows.length === 0)) return null;

  return (
    <div>
      <h3 className="text-sm font-semibold text-wt-text">Ratings</h3>
      <div className="mt-2 overflow-x-auto rounded-xl border border-wt-border">
        <WtTable>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Item</TableHead>
              <TableHead className="text-center">Employee</TableHead>
              <TableHead className="text-center">Manager</TableHead>
            </TableRow>
          </TableHeader>
          {sections.map((section) => (
            <TableBody key={section.key}>
              {section.title ? (
                <TableRow className="bg-wt-surface-2/30 hover:bg-wt-surface-2/30">
                  <TableHead scope="rowgroup" className="text-left text-xs font-semibold text-wt-text">
                    {section.title}
                    {section.weight != null ? (
                      <span className="ml-1.5 font-normal text-wt-text-muted">{formatWeight(section.weight)}</span>
                    ) : null}
                  </TableHead>
                  <TableCell className="text-center text-xs text-wt-text-muted">
                    {averageLabel(section.rows.map((r) => r.self))}
                  </TableCell>
                  <TableCell className="text-center text-xs text-wt-text-muted">
                    {averageLabel(section.rows.map((r) => r.manager))}
                  </TableCell>
                </TableRow>
              ) : null}
              {section.rows.map((r) => (
                <TableRow key={r.key}>
                  <TableCell className="whitespace-normal">
                    <p className="text-wt-text">{r.label}</p>
                    {r.meta ? <p className="text-xs text-wt-text-faint">{r.meta}</p> : null}
                    {r.selfWhy?.trim() ? (
                      <p className="mt-1 text-xs text-wt-text-muted">
                        <span className="font-medium text-wt-text">Employee: </span>
                        {r.selfWhy}
                      </p>
                    ) : null}
                    {r.managerWhy?.trim() ? (
                      <p className="mt-0.5 text-xs text-wt-text-muted">
                        <span className="font-medium text-wt-text">Manager: </span>
                        {r.managerWhy}
                      </p>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-center text-wt-text">{pulseRatingLabel(r.self)}</TableCell>
                  <TableCell
                    className={cn(
                      "text-center font-semibold",
                      r.manager != null && r.self != null && r.manager !== r.self
                        ? "text-amber-700 dark:text-amber-400"
                        : "text-wt-text"
                    )}
                  >
                    {pulseRatingLabel(r.manager)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          ))}
        </WtTable>
      </div>
      {submission.recognitions_count > 0 ? (
        <p className="mt-1.5 text-xs text-wt-text-muted">
          {submission.recognitions_count} recognition(s) claimed this cycle.
        </p>
      ) : null}
    </div>
  );
}

/** The level the rated entries average out to, or "—" when none are rated yet. */
function averageLabel(ratings: (number | undefined)[]): string {
  const rated = ratings.filter((r): r is number => r != null);
  if (rated.length === 0) return "—";
  return pulseRatingLabel(Math.round(rated.reduce((a, b) => a + b, 0) / rated.length));
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
