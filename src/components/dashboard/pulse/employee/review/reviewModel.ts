import type { PulseProjectOption } from "@/hooks/pulse/usePulse";
import { buildChecklist, summarizeChecklist, summarizeGroup, type ChecklistGroup } from "@/utils/pulseChecklist";
import type {
  CertificationItem,
  EmployeeSummary,
  KpiDefinitionItem,
  MonthlySubmissionDraftPayload,
  MonthlySubmissionItem,
  WebknotValueItem,
} from "@/types/kpi";

export const MAX_PROJECTS = 3;

export type ReviewStepId = "work" | "kpis" | "values" | "submit";

export const REVIEW_STEPS: readonly { id: ReviewStepId; title: string; hint: string }[] = [
  { id: "work", title: "Work & wins", hint: "Projects, certifications" },
  { id: "kpis", title: "KPIs", hint: "Rate each KPI" },
  { id: "values", title: "Company values", hint: "Rate + an example" },
  { id: "submit", title: "Review & submit", hint: "Self review, send" },
];

/** Everything the form validates against — fetched once, read-only here. */
export interface ReviewContext {
  kpiRows: KpiDefinitionItem[];
  valueRows: WebknotValueItem[];
  certRows: CertificationItem[];
  projectRows: PulseProjectOption[];
  /** Admins to choose from — non-null only for HR team members, who must pick one. */
  reviewerOptions: EmployeeSummary[] | null;
}

export type StepProgress = { done: number; total: number };

export type ReviewProgress = Record<ReviewStepId, StepProgress> & {
  overall: StepProgress;
  canSubmit: boolean;
  /** Everything still to do, item by item — the shared "What's left" checklist. */
  checklist: ChecklistGroup[];
  /** What's still missing, in plain words — shown beside Submit. */
  missing: string[];
};

export function draftFromSubmission(row: MonthlySubmissionItem): MonthlySubmissionDraftPayload {
  return {
    month: row.month,
    submission_type: "EMPLOYEE_MONTHLY_SUBMISSION",
    self_review_text: row.self_review_text,
    kpi_ratings: row.kpi_ratings,
    value_ratings: row.value_ratings,
    certifications: row.certifications,
    project_codes: row.project_codes,
    recognitions_count: row.recognitions_count,
    reviewer_id: row.reviewer_id ?? null,
  };
}

/** The API rejects a rating below 1 — a KPI or value only gets a rating once its
 *  buttons are clicked, but typing its reason first creates a rating-0 entry
 *  locally. Drop those until rated, so autosave/submit don't 422. */
export function toApiPayload(form: MonthlySubmissionDraftPayload): MonthlySubmissionDraftPayload {
  return {
    ...form,
    kpi_ratings: form.kpi_ratings.filter((r) => r.rating >= 1),
    value_ratings: form.value_ratings.filter((r) => r.rating >= 1),
  };
}

/** Mirrors the backend: the employee can only edit while the submission is
 *  with them — a fresh draft, or one sent back for changes. */
export function isEditable(row: MonthlySubmissionItem): boolean {
  const status = row.review_status;
  return !row.locked && (!status || status === "DRAFT" || status === "NEEDS_REVIEW");
}

/** Each wizard step's checklist groups, by index into REVIEW_STEPS. */
const CHECKLIST_STEPS = { projects: 0, kpis: 1, values: 2, selfReview: 3, reviewer: 3 } as const;

function stepProgress(groups: ChecklistGroup[], keys: string[]): StepProgress {
  return groups
    .filter((g) => keys.includes(g.key))
    .reduce<StepProgress>(
      (acc, g) => {
        const { done, total } = summarizeGroup(g);
        return { done: acc.done + done, total: acc.total + total };
      },
      { done: 0, total: 0 }
    );
}

/** Matches the backend's rules, worked out live so the employee sees what is
 *  left instead of learning it from an error: 1–3 of the current projects
 *  (none when not on any), every KPI and value rated with a reason, a self
 *  review, and — DM / PM / AM / HR / Admin — a chosen HR or Admin reviewer. */
export function computeProgress(form: MonthlySubmissionDraftPayload, ctx: ReviewContext): ReviewProgress {
  // A draft can still hold a project the employee has since left — it isn't
  // listed, so it can't be unticked; only current projects count and are sent.
  const selectedProjects = form.project_codes.filter((c) => ctx.projectRows.some((p) => p.code === c));
  const checklist = buildChecklist(
    {
      kpis: ctx.kpiRows.map((k) => ({ id: k.id, name: k.kpi_name })),
      kpiRatings: Object.fromEntries(form.kpi_ratings.map((r) => [r.kpi_id, r.rating])),
      kpiComments: Object.fromEntries(form.kpi_ratings.map((r) => [r.kpi_id, r.comment])),
      values: ctx.valueRows.map((v) => ({ id: v.id, name: v.title })),
      valueRatings: Object.fromEntries(form.value_ratings.map((r) => [r.value_id, r.rating])),
      valueComments: Object.fromEntries(form.value_ratings.map((r) => [r.value_id, r.comment])),
      projects: { required: ctx.projectRows.length > 0, selected: selectedProjects.length, max: MAX_PROJECTS },
      selfReviewWritten: form.self_review_text.trim().length > 0,
      reviewer: {
        required: ctx.reviewerOptions !== null,
        chosen: ctx.reviewerOptions?.some((r) => r.id === form.reviewer_id) ?? false,
      },
    },
    CHECKLIST_STEPS
  );
  const summary = summarizeChecklist(checklist);
  const work = ctx.projectRows.length > 0 ? stepProgress(checklist, ["projects"]) : { done: 1, total: 1 };
  return {
    work,
    kpis: stepProgress(checklist, ["kpis"]),
    values: stepProgress(checklist, ["values"]),
    submit: stepProgress(checklist, ["self-review", "reviewer"]),
    overall: { done: summary.done, total: summary.total },
    canSubmit: summary.complete,
    checklist,
    missing: checklist.flatMap((g) => g.items.filter((i) => !i.done).map((i) => `${i.label} (${i.missing})`)),
  };
}
