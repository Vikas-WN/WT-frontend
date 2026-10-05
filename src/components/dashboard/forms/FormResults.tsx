import { FORM_COPY, FORM_TEXT_PREVIEW_LIMIT } from "@/constants/forms";
import type { FormQuestion, FormResponseRow, FormResultEntry } from "@/types/form";

function Bars({ counts, total }: { counts: Record<string, number>; total: number }) {
  return (
    <ul className="space-y-2">
      {Object.entries(counts).map(([label, count]) => {
        const percent = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
          <li key={label}>
            <div className="mb-0.5 flex justify-between text-xs">
              <span className="truncate text-wt-text">{label}</span>
              <span className="tabular-nums text-wt-text-muted">{count} · {percent}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-wt-surface-3">
              <div className="h-full rounded-full bg-[var(--wt-brand)] transition-all" style={{ width: `${percent}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** Per-question results: bars for choices / yes-no / ratings (with the average), and the latest typed answers for text. */
export function FormResults({
  results,
  questions,
  responses,
}: {
  results: FormResultEntry[];
  questions: FormQuestion[];
  responses: FormResponseRow[];
}) {
  return (
    <div className="space-y-5">
      {results.map((result, index) => {
        const typed = responses
          .map((response) => response.answers[result.question_id])
          .filter((value): value is string => typeof value === "string" && value !== "");
        const isText = result.type === "SHORT_TEXT" || result.type === "LONG_TEXT" || result.type === "DATE";
        return (
          <section key={result.question_id} className="rounded-xl border border-wt-border p-4">
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <h4 className="text-sm font-semibold text-wt-text">
                <span className="mr-1.5 font-normal text-wt-text-faint">{index + 1}.</span>
                {questions.find((q) => q.id === result.question_id)?.label ?? result.label}
              </h4>
              <span className="shrink-0 text-xs text-wt-text-muted">{result.answered} answered</span>
            </div>
            {result.type === "RATING" && result.average != null ? (
              <p className="mb-2 text-sm text-wt-text-muted">
                Average <span className="text-lg font-semibold text-wt-text tabular-nums">{result.average.toFixed(2)}</span> / 5
              </p>
            ) : null}
            {result.counts ? <Bars counts={result.counts} total={result.answered} /> : null}
            {isText ? (
              typed.length === 0 ? (
                <p className="text-sm text-wt-text-muted">{FORM_COPY.noAnswers}</p>
              ) : (
                <ul className="space-y-1.5">
                  {typed.slice(0, FORM_TEXT_PREVIEW_LIMIT).map((text, i) => (
                    <li key={i} className="whitespace-pre-wrap rounded-lg bg-wt-surface-2 px-3 py-2 text-sm text-wt-text">{text}</li>
                  ))}
                  {typed.length > FORM_TEXT_PREVIEW_LIMIT ? (
                    <li className="text-xs text-wt-text-faint">+{typed.length - FORM_TEXT_PREVIEW_LIMIT} more — export the CSV for everything</li>
                  ) : null}
                </ul>
              )
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
