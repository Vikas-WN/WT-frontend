"use client";

import { useState } from "react";

import { WtFormDialog } from "@/components/allocation/WtFormDialog";
import { QuestionField } from "@/components/dashboard/forms/QuestionField";
import { FORM_COPY } from "@/constants/forms";
import { useFormDetail, useSubmitForm } from "@/hooks/forms/useForms";
import type { AnswerValue, FormAnswers, FormDetail } from "@/types/form";
import { missingRequired } from "@/utils/formAnswers";

function FillBody({ detail, onClose }: { detail: FormDetail; onClose: () => void }) {
  const submit = useSubmitForm();
  const [answers, setAnswers] = useState<FormAnswers>(detail.my_answers ?? {});
  const [showErrors, setShowErrors] = useState(false);
  const { form, questions } = detail;
  const errors = showErrors ? missingRequired(questions, answers) : {};
  const editing = form.submitted;

  const set = (id: string, value: AnswerValue) => setAnswers((current) => ({ ...current, [id]: value }));
  const onSubmit = () => {
    if (Object.keys(missingRequired(questions, answers)).length > 0) {
      setShowErrors(true);
      return;
    }
    submit.mutate({ id: form.id, answers }, { onSuccess: onClose });
  };

  return (
    <WtFormDialog
      open
      title={form.title}
      description={`From ${form.created_by.name}${form.due_date ? ` · due ${form.due_date}` : ""}`}
      onClose={onClose}
      onSubmit={form.is_closed ? undefined : onSubmit}
      submitLabel={editing ? FORM_COPY.update : FORM_COPY.submit}
      submittingLabel={FORM_COPY.submitting}
      loading={submit.isPending}
      maxWidthClass="max-w-xl"
    >
      <div className="space-y-6">
        {form.description ? <p className="whitespace-pre-wrap text-sm text-wt-text-muted">{form.description}</p> : null}
        {form.is_closed ? (
          <p className="rounded-lg bg-wt-surface-2 px-3 py-2 text-sm text-wt-text-muted">{FORM_COPY.closedNotice}</p>
        ) : null}
        {questions.map((question) => (
          <QuestionField key={question.id} question={question} value={answers[question.id]} error={errors[question.id]} onChange={(value) => set(question.id, value)} />
        ))}
      </div>
    </WtFormDialog>
  );
}

/** Fill in (or edit your answers to) a form sent to you. */
export function FormFillDialog({ formId, onClose }: { formId: number; onClose: () => void }) {
  const detail = useFormDetail(formId);
  if (detail.isLoading || !detail.data) {
    return (
      <WtFormDialog open title="Loading form…" onClose={onClose} maxWidthClass="max-w-xl">
        <p className="text-sm text-wt-text-muted">{detail.isError ? "Couldn't load this form." : "One moment…"}</p>
      </WtFormDialog>
    );
  }
  return <FillBody detail={detail.data} onClose={onClose} />;
}
