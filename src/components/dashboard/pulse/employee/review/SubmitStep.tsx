"use client";

import { TextAreaField } from "@/components/dashboard/ui/forms";
import { DropdownSelect } from "@/components/dashboard/ui/DropdownSelect";
import { SubmissionChecklist } from "@/components/dashboard/pulse/SubmissionChecklist";
import { PULSE_COPY } from "@/constants/pulseCopy";
import type { ReviewContext } from "@/components/dashboard/pulse/employee/review/reviewModel";
import type { ReviewFormApi } from "@/components/dashboard/pulse/employee/review/useReviewForm";

/** Step 4 — the written self review, an Admin reviewer for HR-team members,
 *  and a last checklist before sending. */
export function SubmitStep({ api, ctx }: { api: ReviewFormApi; ctx: ReviewContext }) {
  const { form, progress, actions } = api;
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="space-y-4 rounded-2xl border border-wt-border bg-wt-surface-1 p-5 sm:p-6">
        <TextAreaField
          label="Self review"
          value={form.self_review_text}
          onChange={(v) => actions.patch({ self_review_text: v })}
          placeholder="Summarize your impact this month — what shipped, what you're proud of, what you'd do differently."
          rows={8}
          required
        />
        {ctx.reviewerOptions !== null ? (
          <div>
            <p className="mb-1.5 text-sm font-medium text-wt-text">
              {PULSE_COPY.reviewerFieldLabel} <span className="text-rose-600">*</span>
            </p>
            <DropdownSelect
              value={form.reviewer_id ? String(form.reviewer_id) : ""}
              onChange={(v) => actions.patch({ reviewer_id: v ? Number(v) : null })}
              options={ctx.reviewerOptions.map((r) => ({
                value: String(r.id),
                label: `${r.name}${r.emp_id ? ` (${r.emp_id})` : ""}`,
              }))}
              placeholder={ctx.reviewerOptions.length ? PULSE_COPY.reviewerPlaceholder : PULSE_COPY.reviewerEmpty}
              aria-label="Reviewer"
            />
            <p className="mt-1 text-xs text-wt-text-muted">
              Your review goes to the HR or Admin reviewer you choose, instead of project managers.
            </p>
          </div>
        ) : null}
      </div>

      <aside className="h-fit space-y-3">
        <SubmissionChecklist groups={progress.checklist} />
        <p className="px-1 text-xs text-wt-text-faint">
          Changes autosave. Once submitted the review is locked, unless it&apos;s sent back to you for changes.
        </p>
      </aside>
    </div>
  );
}
