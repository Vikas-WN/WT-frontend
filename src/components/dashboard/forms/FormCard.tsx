"use client";

import { CalendarClock, ClipboardList } from "lucide-react";

import { filledBadgeClass } from "@/components/dashboard/ui/badgeTones";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FORM_CATEGORY_OPTIONS, categoryLabel } from "@/constants/contentCategories";
import { FORM_COPY } from "@/constants/forms";
import { cn } from "@/lib/utils";
import type { FormSummary } from "@/types/form";

/** A form in a list. `mine` shows my state (due / overdue / answered); otherwise how many people have answered. */
export function FormCard({
  form,
  mode,
  highlighted,
  onOpen,
}: {
  form: FormSummary;
  mode: "mine" | "sent";
  highlighted?: boolean;
  onOpen: (form: FormSummary) => void;
}) {
  const answered = form.submitted_count ?? 0;
  const total = form.recipient_count ?? 0;
  const percent = total > 0 ? Math.round((answered / total) * 100) : 0;

  return (
    <article
      id={`form-${form.id}`}
      className={cn(
        "flex flex-col gap-3 rounded-2xl border bg-wt-surface-1 p-4 shadow-[var(--wt-shadow-sm)] sm:flex-row sm:items-center sm:p-5",
        highlighted ? "border-[var(--wt-brand)] ring-2 ring-[color-mix(in_srgb,var(--wt-brand)_25%,transparent)]" : "border-wt-border",
        mode === "mine" && (form.submitted || form.is_closed) && "opacity-80"
      )}
    >
      <span className="hidden size-11 shrink-0 items-center justify-center rounded-xl bg-wt-brand-soft text-[var(--wt-brand)] sm:flex" aria-hidden>
        <ClipboardList className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-[0.9375rem] font-semibold text-wt-text">{form.title}</h3>
          {form.category !== "OTHER" ? (
            <Badge variant="secondary" className={filledBadgeClass(FORM_CATEGORY_OPTIONS.find((o) => o.value === form.category)?.tone ?? "neutral")}>
              {categoryLabel(FORM_CATEGORY_OPTIONS, form.category)}
            </Badge>
          ) : null}
          {form.is_closed ? <Badge variant="secondary" className={filledBadgeClass("neutral")}>{FORM_COPY.closed}</Badge> : null}
          {mode === "mine" && form.submitted ? <Badge variant="secondary" className={filledBadgeClass("success")}>{FORM_COPY.done}</Badge> : null}
          {form.overdue ? <Badge variant="secondary" className={filledBadgeClass("danger")}>{FORM_COPY.overdue}</Badge> : null}
        </div>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-wt-text-muted">
          <span>{mode === "mine" ? `From ${form.created_by.name}` : `${form.question_count} questions`}</span>
          {form.due_date ? (
            <span className="inline-flex items-center gap-1">
              <CalendarClock className="size-3.5" aria-hidden /> {FORM_COPY.due} {form.due_date}
            </span>
          ) : null}
        </p>
        {mode === "sent" ? (
          <div className="mt-2 max-w-xs">
            <div className="mb-1 flex justify-between text-xs text-wt-text-muted">
              <span><span className="font-semibold text-wt-text">{answered}</span> of {total} answered</span>
              <span className="tabular-nums">{percent}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-wt-surface-3" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full rounded-full bg-[var(--wt-brand)] transition-all" style={{ width: `${percent}%` }} />
            </div>
          </div>
        ) : null}
      </div>
      <Button
        type="button"
        size="sm"
        variant={mode === "mine" && !form.submitted && !form.is_closed ? "brand" : "outline"}
        onClick={() => onOpen(form)}
      >
        {mode === "sent" ? FORM_COPY.results : form.is_closed ? "View" : form.submitted ? FORM_COPY.edit : FORM_COPY.fill}
      </Button>
    </article>
  );
}
