"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Activity, AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Lock } from "lucide-react";

import { SectionLoading } from "@/components/dashboard/ui/SectionLoading";
import { EmptyState } from "@/components/dashboard/ui/EmptyState";
import { TextAreaField } from "@/components/dashboard/ui/forms";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { RatingButtons } from "@/components/dashboard/pulse/employee/RatingButtons";
import { hrmsService } from "@/services/hrms.service";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { notifyError, notifySuccess } from "@/lib/notify";
import { toUserFriendlyApiErrorMessage } from "@/utils/userFriendlyApiError";
import { ApiError } from "@/api/error";
import type {
  CertificationItem,
  KpiDefinitionItem,
  MonthlySubmissionDraftPayload,
  MonthlySubmissionItem,
  WebknotValueItem,
} from "@/types/kpi";
import { cn } from "@/lib/utils";

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

function currentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

type ProjectOption = { code: string; name: string };

function normalizeProjectOptions(raw: unknown): ProjectOption[] {
  const rows = Array.isArray(raw) ? raw : [];
  return rows
    .map((row) => {
      const r = row as Record<string, unknown>;
      const code = String(r.project_code ?? r.projectCode ?? r.code ?? "").trim();
      const name = String(r.project_name ?? r.projectName ?? r.name ?? "").trim();
      return code ? { code, name: name || code } : null;
    })
    .filter((x): x is ProjectOption => x !== null);
}

const STEPS = ["Projects", "KPIs", "Company Values", "Certifications", "Review & Submit"] as const;

function draftFromSubmission(row: MonthlySubmissionItem): MonthlySubmissionDraftPayload {
  return {
    month: row.month,
    submission_type: "EMPLOYEE_MONTHLY_SUBMISSION",
    self_review_text: row.self_review_text,
    kpi_ratings: row.kpi_ratings,
    value_ratings: row.value_ratings,
    certifications: row.certifications,
    project_codes: row.project_codes,
    recognitions_count: row.recognitions_count,
  };
}

export function EmployeeMonthlyReviewPanel() {
  const month = useMemo(() => currentMonthKey(), []);

  const windowStatus = useLoad(
    () => hrmsService.getSubmissionWindowStatus({ scope: "EMPLOYEE" }).then((r) => r.data),
    []
  );
  const isWindowOpen = windowStatus.data?.open ?? false;

  const applicableKpis = useLoad<KpiDefinitionItem[]>(() => hrmsService.getApplicableKpis(), []);
  const values = useLoad<WebknotValueItem[]>(() => hrmsService.getActiveWebknotValues(), []);
  const certifications = useLoad<CertificationItem[]>(
    () => hrmsService.getCertifications({ activeOnly: true }),
    []
  );
  const projects = useLoad<ProjectOption[]>(
    () => hrmsService.getAssignedProjects().then((r) => normalizeProjectOptions(r.data ?? r)),
    []
  );

  const [reloadTick, setReloadTick] = useState(0);
  const draft = useLoad<MonthlySubmissionItem>(
    () => (isWindowOpen ? hrmsService.getMonthlySubmissionDraft({ month }) : Promise.reject()),
    [month, isWindowOpen, reloadTick]
  );

  if (windowStatus.status === "loading") return <SectionLoading label="" />;

  if (!isWindowOpen) {
    return (
      <div className="rounded-2xl border border-wt-border bg-wt-surface-1 p-8 text-center">
        <Lock className="mx-auto size-8 text-wt-text-faint" />
        <h3 className="mt-3 text-base font-semibold text-wt-text">Submission window is closed</h3>
        <p className="mx-auto mt-1.5 max-w-md text-sm text-wt-text-muted">
          HR opens the monthly self-review window on a schedule. Check back once it&apos;s open — your
          KPIs, ratings, and self review can only be entered while it is.
        </p>
      </div>
    );
  }

  if (draft.status === "loading" || applicableKpis.status === "loading") {
    return <SectionLoading label="" />;
  }

  if (!draft.data) {
    return (
      <EmptyState
        title="Couldn't Load Your Review"
        description="Please refresh the page and try again."
      />
    );
  }

  const isLocked = Boolean(draft.data.locked);
  const isSubmitted = draft.data.review_status === "SUBMITTED";
  const isApproved = draft.data.review_status === "APPROVED";
  const isAwaitingManager = draft.data.review_status === "MANAGER_SUBMITTED";
  const needsRevision = draft.data.review_status === "NEEDS_REVIEW";
  const readOnly = isLocked || isSubmitted || isAwaitingManager;

  if (readOnly || isApproved) {
    return (
      <div className="space-y-5">
        <div
          className={cn(
            "flex items-start gap-3 rounded-xl border p-4",
            isApproved ? "border-emerald-500/30 bg-emerald-500/10" : "border-wt-border bg-wt-surface-2/50"
          )}
        >
          {isApproved ? (
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-wt-brand" />
          )}
          <div>
            <p className="text-sm font-semibold text-wt-text">
              {isApproved
                ? "Your review for this cycle is approved."
                : isAwaitingManager
                  ? "Submitted — waiting on your manager's review."
                  : "Submitted."}
            </p>
            {draft.data.manager_review?.comments ? (
              <p className="mt-1 text-sm text-wt-text-muted">
                Manager: &ldquo;{draft.data.manager_review.comments}&rdquo;
              </p>
            ) : null}
            {isApproved && draft.data.final_score != null ? (
              <p className="mt-1 text-sm text-wt-text-muted">
                Final score: <span className="font-semibold text-wt-text">{draft.data.final_score}</span>
              </p>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <EmployeeReviewForm
      // Remounts (re-seeding local form state from fresh server data) only
      // when the underlying submission row actually changes — e.g. after a
      // resubmit bumps review_status — not on every render.
      key={`${draft.data.id}-${draft.data.updated_at}`}
      initial={draft.data}
      kpiRows={applicableKpis.data ?? []}
      valueRows={values.data ?? []}
      certRows={certifications.data ?? []}
      projectRows={projects.data ?? []}
      projectsLoading={projects.status === "loading"}
      needsRevision={needsRevision}
      onSubmitted={() => setReloadTick((t) => t + 1)}
    />
  );
}

function EmployeeReviewForm({
  initial,
  kpiRows,
  valueRows,
  certRows,
  projectRows,
  projectsLoading,
  needsRevision,
  onSubmitted,
}: {
  initial: MonthlySubmissionItem;
  kpiRows: KpiDefinitionItem[];
  valueRows: WebknotValueItem[];
  certRows: CertificationItem[];
  projectRows: ProjectOption[];
  projectsLoading: boolean;
  needsRevision: boolean;
  onSubmitted: () => void;
}) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<MonthlySubmissionDraftPayload>(() => draftFromSubmission(initial));
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Autosave: debounce local edits, PUT the draft whenever the payload
  // actually changes.
  const debouncedForm = useDebouncedValue(form, 900);
  const lastSavedRef = useRef<string>(JSON.stringify(draftFromSubmission(initial)));
  useEffect(() => {
    const serialized = JSON.stringify(debouncedForm);
    if (serialized === lastSavedRef.current) return;
    lastSavedRef.current = serialized;
    setSaving(true);
    hrmsService
      .saveMonthlySubmissionDraft(debouncedForm)
      .catch(() => {
        /* Silent — next edit will retry the save. */
      })
      .finally(() => setSaving(false));
  }, [debouncedForm]);

  const toggleProject = (code: string) => {
    setForm((f) => {
      const has = f.project_codes.includes(code);
      if (has) return { ...f, project_codes: f.project_codes.filter((c) => c !== code) };
      if (f.project_codes.length >= 3) return f;
      return { ...f, project_codes: [...f.project_codes, code] };
    });
  };

  const setKpiRating = (kpiId: number, rating: number) => {
    setForm((f) => ({
      ...f,
      kpi_ratings: [...f.kpi_ratings.filter((r) => r.kpi_id !== kpiId), { kpi_id: kpiId, rating }],
    }));
  };

  const setValueRating = (valueId: number, patch: { rating?: number; comment?: string }) => {
    setForm((f) => {
      const existing = f.value_ratings.find((r) => r.value_id === valueId);
      const next = {
        value_id: valueId,
        rating: patch.rating ?? existing?.rating ?? 0,
        comment: patch.comment ?? existing?.comment ?? "",
      };
      return { ...f, value_ratings: [...f.value_ratings.filter((r) => r.value_id !== valueId), next] };
    });
  };

  const toggleCertification = (certificationId: number) => {
    setForm((f) => {
      const has = f.certifications.some((c) => c.certification_id === certificationId);
      if (has) {
        return { ...f, certifications: f.certifications.filter((c) => c.certification_id !== certificationId) };
      }
      return { ...f, certifications: [...f.certifications, { certification_id: certificationId, proof: "" }] };
    });
  };

  const setCertificationProof = (certificationId: number, proof: string) => {
    setForm((f) => ({
      ...f,
      certifications: f.certifications.map((c) =>
        c.certification_id === certificationId ? { ...c, proof } : c
      ),
    }));
  };

  const allKpisRated = kpiRows.every((k) => form.kpi_ratings.some((r) => r.kpi_id === k.id));
  const projectsValid = form.project_codes.length >= 1 && form.project_codes.length <= 3;
  const selfReviewValid = form.self_review_text.trim().length > 0;
  const canSubmit = allKpisRated && projectsValid && selfReviewValid;

  const handleSubmit = async () => {
    if (!canSubmit) {
      notifyError("Rate every KPI, pick 1–3 projects, and add your self review before submitting.");
      return;
    }
    setSubmitting(true);
    try {
      await hrmsService.submitMonthlySubmission(form);
      notifySuccess("Self review submitted.");
      onSubmitted();
    } catch (error) {
      notifyError(
        toUserFriendlyApiErrorMessage(
          error,
          error instanceof ApiError ? error.message : "Couldn't submit your review."
        )
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {needsRevision ? (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="text-sm font-semibold text-wt-text">Sent back for changes</p>
            <p className="mt-1 text-sm text-wt-text-muted">
              {initial.manager_review?.comments || "Your manager asked for changes — update and resubmit."}
            </p>
          </div>
        </div>
      ) : null}

      {/* Step nav */}
      <div className="flex flex-wrap items-center gap-1.5">
        {STEPS.map((label, idx) => (
          <button
            key={label}
            type="button"
            onClick={() => setStep(idx)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              idx === step
                ? "border-wt-brand bg-wt-brand-soft text-wt-brand"
                : "border-wt-border text-wt-text-muted hover:border-wt-brand/40"
            )}
          >
            {idx + 1}. {label}
          </button>
        ))}
        <span className="ml-auto text-xs text-wt-text-faint">{saving ? "Saving…" : "Saved"}</span>
      </div>

      <div className="rounded-2xl border border-wt-border bg-wt-surface-1 p-5">
        {step === 0 ? (
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-wt-text">Projects you worked on</h3>
              <p className="mt-0.5 text-xs text-wt-text-muted">Pick 1 to 3 active projects.</p>
            </div>
            {projectsLoading ? (
              <SectionLoading label="" />
            ) : projectRows.length === 0 ? (
              <EmptyState title="No Active Projects" description="No project allocations found for you." />
            ) : (
              <div className="space-y-2">
                {projectRows.map((p) => (
                  <label
                    key={p.code}
                    className="flex items-center gap-2.5 rounded-xl border border-wt-border bg-wt-surface-2/40 px-3.5 py-2.5"
                  >
                    <Checkbox
                      checked={form.project_codes.includes(p.code)}
                      onCheckedChange={() => toggleProject(p.code)}
                      disabled={!form.project_codes.includes(p.code) && form.project_codes.length >= 3}
                    />
                    <span className="text-sm text-wt-text">{p.name}</span>
                    <span className="ml-auto text-xs text-wt-text-faint">{p.code}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        ) : null}

        {step === 1 ? (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-wt-text">Rate your KPIs</h3>
              <p className="mt-0.5 text-xs text-wt-text-muted">
                Applicable to your band and department. 1 = needs improvement, 5 = exceptional.
              </p>
            </div>
            {kpiRows.length === 0 ? (
              <EmptyState
                title="No KPIs Defined Yet"
                description="HR hasn't defined KPIs for your band and department yet."
              />
            ) : (
              <div className="space-y-3">
                {kpiRows.map((kpi) => {
                  const rating = form.kpi_ratings.find((r) => r.kpi_id === kpi.id)?.rating ?? null;
                  return (
                    <div
                      key={kpi.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-wt-border bg-wt-surface-2/40 px-3.5 py-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-wt-text">{kpi.kpi_name}</p>
                        <p className="text-xs text-wt-text-muted">Weight · {Number(kpi.weightage)}%</p>
                      </div>
                      <RatingButtons value={rating} onChange={(r) => setKpiRating(kpi.id, r)} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-wt-text">Company Values</h3>
              <p className="mt-0.5 text-xs text-wt-text-muted">
                Rate yourself and add a short note for each value.
              </p>
            </div>
            <div className="space-y-3">
              {valueRows.map((v) => {
                const row = form.value_ratings.find((r) => r.value_id === v.id);
                return (
                  <div key={v.id} className="rounded-xl border border-wt-border bg-wt-surface-2/40 p-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-wt-text">{v.title}</p>
                        {v.evaluation_criteria ? (
                          <p className="text-xs text-wt-text-muted">{v.evaluation_criteria}</p>
                        ) : null}
                      </div>
                      <RatingButtons
                        value={row?.rating || null}
                        onChange={(r) => setValueRating(v.id, { rating: r })}
                      />
                    </div>
                    <input
                      type="text"
                      value={row?.comment ?? ""}
                      onChange={(e) => setValueRating(v.id, { comment: e.target.value })}
                      placeholder="A quick example (optional)"
                      className="mt-2.5 w-full rounded-lg border border-wt-border bg-wt-surface-1 px-3 py-2 text-sm text-wt-text placeholder:text-wt-text-faint focus:outline-none focus:ring-2 focus:ring-wt-brand/40"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-wt-text">Certifications</h3>
              <p className="mt-0.5 text-xs text-wt-text-muted">
                Check any you&apos;ve earned this cycle and add proof (a link or note).
              </p>
            </div>
            {certRows.length === 0 ? (
              <EmptyState title="No Certifications in the Catalog" description="Nothing to claim yet." />
            ) : (
              <div className="space-y-2">
                {certRows.map((c) => {
                  const claim = form.certifications.find((x) => x.certification_id === c.id);
                  return (
                    <div
                      key={c.id}
                      className="rounded-xl border border-wt-border bg-wt-surface-2/40 px-3.5 py-2.5"
                    >
                      <label className="flex items-center gap-2.5">
                        <Checkbox checked={Boolean(claim)} onCheckedChange={() => toggleCertification(c.id)} />
                        <span className="text-sm text-wt-text">{c.name}</span>
                      </label>
                      {claim ? (
                        <input
                          type="text"
                          value={claim.proof}
                          onChange={(e) => setCertificationProof(c.id, e.target.value)}
                          placeholder="Proof — a link or note (optional)"
                          className="mt-2 w-full rounded-lg border border-wt-border bg-wt-surface-1 px-3 py-1.5 text-sm text-wt-text placeholder:text-wt-text-faint focus:outline-none focus:ring-2 focus:ring-wt-brand/40"
                        />
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
            <div className="flex items-center gap-3 rounded-xl border border-wt-border bg-wt-surface-2/40 px-3.5 py-2.5">
              <label className="text-sm font-medium text-wt-text" htmlFor="recognitions-count">
                Recognitions received this cycle
              </label>
              <input
                id="recognitions-count"
                type="number"
                min={0}
                value={form.recognitions_count}
                onChange={(e) =>
                  setForm((f) => ({ ...f, recognitions_count: Math.max(0, Number(e.target.value) || 0) }))
                }
                className="ml-auto w-20 rounded-lg border border-wt-border bg-wt-surface-1 px-2 py-1 text-sm text-wt-text"
              />
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="space-y-4">
            <TextAreaField
              label="Self review"
              value={form.self_review_text}
              onChange={(v) => setForm((f) => ({ ...f, self_review_text: v }))}
              placeholder="Summarize your impact this cycle — what shipped, what you're proud of, what you'd do differently."
              rows={6}
              required
            />
            <div className="rounded-xl border border-wt-border bg-wt-surface-2/40 p-4 text-sm text-wt-text-muted">
              <p className="font-medium text-wt-text">Before you submit</p>
              <ul className="mt-2 space-y-1">
                <li className="flex items-center gap-2">
                  <Badge variant={projectsValid ? "default" : "outline"}>{form.project_codes.length}/3</Badge>
                  Projects selected
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant={allKpisRated ? "default" : "outline"}>
                    {form.kpi_ratings.length}/{kpiRows.length}
                  </Badge>
                  KPIs rated
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant={selfReviewValid ? "default" : "outline"}>{selfReviewValid ? "✓" : "—"}</Badge>
                  Self review written
                </li>
              </ul>
            </div>
            <p className="text-xs text-wt-text-faint">
              Once submitted, this locks until your manager reviews it. You can keep editing freely until
              then — changes autosave.
            </p>
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
        >
          <ChevronLeft className="mr-1 size-4" /> Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button type="button" onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}>
            Next <ChevronRight className="ml-1 size-4" />
          </Button>
        ) : (
          <Button type="button" onClick={() => void handleSubmit()} disabled={submitting || !canSubmit}>
            <Activity className="mr-1.5 size-4" />
            {submitting ? "Submitting…" : "Submit Self Review"}
          </Button>
        )}
      </div>
    </div>
  );
}
