"use client";

import { AlertCircle } from "lucide-react";
import type { FormField } from "@/types/exit-interview";
import { exitInterviewFieldAnchorId } from "@/components/exit-interview/ExitInterviewFormFields";

export type ExitInterviewMissingField = { key: string; label: string; message: string };

/**
 * Resolve validation errors to the questions they belong to, in form order, so the
 * summary reads top-to-bottom like the form. `other_field` errors roll up to their parent.
 */
export function collectExitInterviewMissingFields(
  fields: FormField[],
  errors: Record<string, string>
): ExitInterviewMissingField[] {
  const missing: ExitInterviewMissingField[] = [];
  for (const field of fields) {
    const message = errors[field.key] ?? (field.other_field ? errors[field.other_field] : undefined);
    if (!message) continue;
    missing.push({ key: field.key, label: field.label, message });
  }
  // Errors on keys with no matching field must still surface rather than be silently dropped.
  const known = new Set(fields.flatMap((f) => [f.key, f.other_field].filter(Boolean) as string[]));
  for (const [key, message] of Object.entries(errors)) {
    if (!known.has(key)) missing.push({ key, label: key, message });
  }
  return missing;
}

export function focusExitInterviewField(key: string): void {
  const el = document.getElementById(exitInterviewFieldAnchorId(key));
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  el.focus({ preventScroll: true });
}

export function ExitInterviewValidationSummary({
  missingFields,
}: {
  missingFields: ExitInterviewMissingField[];
}) {
  if (!missingFields.length) return null;

  return (
    <div
      role="alert"
      className="rounded-xl border border-destructive/40 bg-destructive/5 p-4"
    >
      <div className="flex items-start gap-2">
        <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
        <div className="min-w-0">
          <p className="text-sm font-medium text-destructive">
            {missingFields.length === 1
              ? "1 question needs your answer before you can submit"
              : `${missingFields.length} questions need your answer before you can submit`}
          </p>
          <ol className="mt-2 space-y-1.5">
            {missingFields.map((item, index) => (
              <li key={item.key} className="text-sm">
                <button
                  type="button"
                  onClick={() => focusExitInterviewField(item.key)}
                  className="text-left text-wt-text underline decoration-destructive/40 underline-offset-2 hover:decoration-destructive"
                >
                  <span className="tabular-nums text-wt-text-muted">{index + 1}. </span>
                  {item.label}
                </button>
              </li>
            ))}
          </ol>
          <p className="mt-2 text-xs text-wt-text-muted">
            Select a question to jump straight to it.
          </p>
        </div>
      </div>
    </div>
  );
}
