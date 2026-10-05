"use client";

import { useState } from "react";
import { Bell, Download, Lock, LockOpen } from "lucide-react";

import { WtFormDialog } from "@/components/allocation/WtFormDialog";
import { FormResults } from "@/components/dashboard/forms/FormResults";
import { PagedList } from "@/components/dashboard/ui/PagedList";
import { Button } from "@/components/ui/button";
import { FORM_COPY } from "@/constants/forms";
import { useExportFormCsv, useFormResponses, useRemindForm, useUpdateForm } from "@/hooks/forms/useForms";
import { cn } from "@/lib/utils";
import type { FormResponseRow } from "@/types/form";
import { formatApiDateTimeDisplay } from "@/utils/apiDate";

type View = "results" | "people" | "pending";

function answerText(value: unknown): string {
  if (Array.isArray(value)) return value.join(", ");
  if (value === true) return "Yes";
  if (value === false) return "No";
  return String(value ?? "—");
}

function PersonAnswers({ row, labels }: { row: FormResponseRow; labels: Map<string, string> }) {
  return (
    <details className="group rounded-xl border border-wt-border">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium text-wt-text">{row.name}</span>
          <span className="block truncate text-xs text-wt-text-muted">{[row.email, row.department].filter(Boolean).join(" · ")}</span>
        </span>
        <span className="shrink-0 text-xs text-wt-text-faint">{row.submitted_at ? formatApiDateTimeDisplay(row.submitted_at) : ""}</span>
      </summary>
      <dl className="space-y-2 border-t border-wt-border px-3 py-3">
        {Object.entries(row.answers).map(([id, value]) => (
          <div key={id}>
            <dt className="text-xs text-wt-text-muted">{labels.get(id) ?? id}</dt>
            <dd className="whitespace-pre-wrap text-sm text-wt-text">{answerText(value)}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}

/** The sender's view of a form: results, who answered, who hasn't — with export, reminders and close/reopen. */
export function FormResponsesDialog({ formId, onClose }: { formId: number; onClose: () => void }) {
  const query = useFormResponses(formId);
  const exportCsv = useExportFormCsv();
  const remind = useRemindForm();
  const update = useUpdateForm();
  const [view, setView] = useState<View>("results");
  const data = query.data;
  const form = data?.form;
  const labels = new Map((data?.questions ?? []).map((q) => [q.id, q.label]));

  const tab = (value: View, label: string) => (
    <button
      key={value}
      type="button"
      onClick={() => setView(value)}
      aria-pressed={view === value}
      className={cn("rounded-full px-3 py-1 text-xs font-medium transition-colors", view === value ? "bg-[var(--wt-brand)] text-white" : "bg-wt-surface-2 text-wt-text-muted hover:text-wt-text")}
    >
      {label}
    </button>
  );

  return (
    <WtFormDialog open title={form?.title ?? "Responses"} description={form ? `${form.submitted_count ?? 0} of ${form.recipient_count ?? 0} answered` : undefined} onClose={onClose} maxWidthClass="max-w-3xl">
      {query.isLoading || !data || !form ? (
        <p className="text-sm text-wt-text-muted">{query.isError ? "Couldn't load the responses." : "Loading…"}</p>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-1.5">
              {tab("results", FORM_COPY.results)}
              {tab("people", `Answered (${data.responses.length})`)}
              {tab("pending", `Not yet (${data.pending.length})`)}
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Button type="button" size="sm" variant="outline" disabled={exportCsv.isPending || data.responses.length === 0} onClick={() => exportCsv.mutate(formId)}>
                <Download className="size-3.5" /> {FORM_COPY.exportCsv}
              </Button>
              <Button type="button" size="sm" variant="outline" disabled={remind.isPending || form.is_closed || data.pending.length === 0} onClick={() => remind.mutate(formId)}>
                <Bell className="size-3.5" /> {FORM_COPY.remind}
              </Button>
              <Button type="button" size="sm" variant="outline" disabled={update.isPending} onClick={() => update.mutate({ id: formId, payload: { is_closed: !form.is_closed } })}>
                {form.is_closed ? <LockOpen className="size-3.5" /> : <Lock className="size-3.5" />}
                {form.is_closed ? FORM_COPY.reopenForm : FORM_COPY.closeForm}
              </Button>
            </div>
          </div>

          {view === "results" ? (
            data.responses.length === 0 ? <p className="text-sm text-wt-text-muted">{FORM_COPY.noAnswers}</p> : <FormResults results={data.results} questions={data.questions} responses={data.responses} />
          ) : null}
          {view === "people" ? (
            <PagedList
              items={data.responses}
              idPrefix="form-answered"
              empty={<p className="text-sm text-wt-text-muted">{FORM_COPY.noAnswers}</p>}
              matches={(row, needle) => row.name.toLowerCase().includes(needle) || row.email.toLowerCase().includes(needle)}
              wrap={(rows) => <div className="space-y-2">{rows}</div>}
              renderItem={(row) => <PersonAnswers key={row.email} row={row} labels={labels} />}
            />
          ) : null}
          {view === "pending" ? (
            <PagedList
              items={data.pending}
              idPrefix="form-pending"
              empty={<p className="rounded-xl border border-wt-border px-3 py-3 text-sm text-wt-text-muted">Everyone has answered.</p>}
              matches={(person, needle) => person.name.toLowerCase().includes(needle) || person.email.toLowerCase().includes(needle)}
              wrap={(rows) => <ul className="divide-y divide-wt-border rounded-xl border border-wt-border">{rows}</ul>}
              renderItem={(person) => (
                <li key={person.email} className="px-3 py-2">
                  <p className="text-sm font-medium text-wt-text">{person.name}</p>
                  <p className="text-xs text-wt-text-muted">{person.email}</p>
                </li>
              )}
            />
          ) : null}
        </div>
      )}
    </WtFormDialog>
  );
}
