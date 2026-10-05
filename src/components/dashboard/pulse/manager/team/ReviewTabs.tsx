"use client";

import { explainedRowDomId } from "@/components/dashboard/pulse/ExplainedRatingRow";
import { SideBySideHeader, SideBySideRow } from "@/components/dashboard/pulse/manager/SideBySideRow";
import type { ManagerReviewDraftApi } from "@/components/dashboard/pulse/manager/useManagerReviewDraft";
import { formatWeight, groupKpisByParameter, hasKpiParameters } from "@/utils/kpiParameters";
import type { MonthlySubmissionItem } from "@/types/kpi";

export type ReviewTab = "kpis" | "values" | "notes";

export function KpiTab({ submission, draft, readOnly }: { submission: MonthlySubmissionItem; draft: ManagerReviewDraftApi; readOnly: boolean }) {
  const selfKpi = new Map(submission.kpi_ratings.map((r) => [r.kpi_id, r]));
  const showParameters = hasKpiParameters(submission.kpi_details);
  return (
    <div className="space-y-2.5">
      <SideBySideHeader />
      {groupKpisByParameter(submission.kpi_details).map((group) => (
        <div key={group.parameter ?? "_none"} className="space-y-2">
          {showParameters ? (
            <p className="flex justify-between px-1 pt-1 text-xs font-semibold uppercase tracking-wide text-wt-text-muted">
              <span>{group.parameter ?? "Other"}</span>
              <span className="font-normal normal-case">{formatWeight(group.weight)}</span>
            </p>
          ) : null}
          {group.items.map((kpi) => (
            <SideBySideRow
              key={kpi.id}
              domId={explainedRowDomId("kpi", kpi.id)}
              title={kpi.kpi_name}
              meta={showParameters ? null : `Weight ${formatWeight(kpi.weightage)}`}
              detail={kpi.evaluation_criteria}
              selfRating={selfKpi.get(kpi.id)?.rating ?? null}
              selfComment={selfKpi.get(kpi.id)?.comment}
              managerRating={draft.fields.kpi[kpi.id] ?? null}
              managerComment={draft.fields.kpiComments[kpi.id] ?? ""}
              onRate={(v) => draft.rateKpi(kpi.id, v)}
              onComment={(c) => draft.commentKpi(kpi.id, c)}
              disabled={readOnly}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function ValuesTab({ submission, draft, readOnly }: { submission: MonthlySubmissionItem; draft: ManagerReviewDraftApi; readOnly: boolean }) {
  const valueName = (id: number) => submission.value_details.find((v) => v.id === id)?.name ?? `Value #${id}`;
  if (submission.value_ratings.length === 0) return <p className="text-sm text-wt-text-muted">The employee rated no values.</p>;
  return (
    <div className="space-y-2.5">
      <SideBySideHeader />
      {submission.value_ratings.map((v) => (
        <SideBySideRow
          key={v.value_id}
          domId={explainedRowDomId("value", v.value_id)}
          title={valueName(v.value_id)}
          selfRating={v.rating}
          selfComment={v.comment}
          managerRating={draft.fields.values[v.value_id] ?? null}
          managerComment={draft.fields.valueComments[v.value_id] ?? ""}
          onRate={(r) => draft.rateValue(v.value_id, r)}
          onComment={(c) => draft.commentValue(v.value_id, c)}
          disabled={readOnly}
        />
      ))}
    </div>
  );
}

export function NotesTab({ submission }: { submission: MonthlySubmissionItem }) {
  const certName = (id: number) => submission.certification_details.find((c) => c.id === id)?.name ?? `Certification #${id}`;
  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-wt-border bg-wt-surface-1 p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-wt-text-faint">Employee&apos;s self review</h3>
        <p className="mt-1.5 whitespace-pre-wrap text-sm text-wt-text">{submission.self_review_text || "—"}</p>
      </section>
      {submission.certifications.length > 0 || submission.recognitions_count > 0 ? (
        <section className="rounded-xl border border-wt-border bg-wt-surface-1 p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-wt-text-faint">Certifications &amp; recognition</h3>
          <ul className="mt-2 space-y-1 text-sm text-wt-text-muted">
            {submission.certifications.map((c) => (
              <li key={c.certification_id}>{certName(c.certification_id)}{c.proof ? ` — ${c.proof}` : ""}</li>
            ))}
            {submission.recognitions_count > 0 ? <li>{submission.recognitions_count} recognition(s) this month</li> : null}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
