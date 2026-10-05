"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { WtFormDialog } from "@/components/allocation/WtFormDialog";
import { AudiencePicker, isAudienceComplete } from "@/components/audience/AudiencePicker";
import { QuestionEditor } from "@/components/dashboard/forms/QuestionEditor";
import { DatePickerField, InputField, TextAreaField } from "@/components/dashboard/ui/forms";
import { Button } from "@/components/ui/button";
import { AUDIENCE_COPY } from "@/constants/audience";
import { FORM_COPY, FORM_MAX_QUESTIONS, FORM_MIN_CHOICES } from "@/constants/forms";
import { useAudienceOptions } from "@/hooks/announcements/useAnnouncements";
import { useCreateForm } from "@/hooks/forms/useForms";
import { EMPTY_AUDIENCE, type AudienceSpec } from "@/types/audience";
import type { FormQuestion } from "@/types/form";
import { formatApiDate } from "@/utils/apiDate";
import { builderProblem, newQuestionId } from "@/utils/formAnswers";

const blankQuestion = (): FormQuestion => ({ id: newQuestionId(), type: "SHORT_TEXT", label: "", required: false, options: [] });

/** Build a form (questions, due date) and choose who gets it. */
export function FormBuilderDialog({ onClose }: { onClose: () => void }) {
  const options = useAudienceOptions(true);
  const create = useCreateForm();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [due, setDue] = useState("");
  const [questions, setQuestions] = useState<FormQuestion[]>(() => [blankQuestion()]);
  const [audience, setAudience] = useState<AudienceSpec | null>(null);

  const effective = audience ?? { ...EMPTY_AUDIENCE, scope: options.data?.scopes[0] ?? "ALL" };
  const problem = builderProblem(title, questions, FORM_MIN_CHOICES);
  const canSend = !problem && isAudienceComplete(effective);

  const update = (index: number, next: FormQuestion) => setQuestions((list) => list.map((q, i) => (i === index ? next : q)));
  const move = (index: number, direction: -1 | 1) =>
    setQuestions((list) => {
      const target = index + direction;
      if (target < 0 || target >= list.length) return list;
      const copy = [...list];
      [copy[index], copy[target]] = [copy[target], copy[index]];
      return copy;
    });

  const send = () =>
    create.mutate(
      {
        title: title.trim(),
        description: description.trim() || null,
        due_date: due || null,
        audience: effective,
        notify_by_email: false,
        questions: questions.map((q) => ({ ...q, label: q.label.trim(), options: q.options.map((o) => o.trim()).filter(Boolean) })),
      },
      { onSuccess: onClose }
    );

  return (
    <WtFormDialog
      open
      title={FORM_COPY.composerTitle}
      description={FORM_COPY.composerDescription}
      onClose={onClose}
      onSubmit={send}
      submitLabel={FORM_COPY.send}
      submittingLabel={FORM_COPY.sending}
      submitDisabled={!canSend}
      loading={create.isPending}
      maxWidthClass="max-w-3xl"
    >
      <div className="space-y-6">
        <InputField label={FORM_COPY.titleLabel} value={title} onChange={setTitle} required placeholder={FORM_COPY.titlePlaceholder} />
        <div className="grid gap-4 sm:grid-cols-[1fr_14rem]">
          <TextAreaField label={FORM_COPY.descriptionLabel} value={description} onChange={setDescription} rows={2} />
          <DatePickerField label={FORM_COPY.dueLabel} value={due} onChange={setDue} min={formatApiDate(new Date())} />
        </div>

        <section className="space-y-3">
          {questions.map((question, index) => (
            <QuestionEditor
              key={question.id}
              index={index}
              question={question}
              total={questions.length}
              onChange={(next) => update(index, next)}
              onMove={(direction) => move(index, direction)}
              onRemove={() => setQuestions((list) => (list.length > 1 ? list.filter((_, i) => i !== index) : list))}
            />
          ))}
          <Button type="button" variant="outline" disabled={questions.length >= FORM_MAX_QUESTIONS} onClick={() => setQuestions((list) => [...list, blankQuestion()])}>
            <Plus className="size-4" /> {FORM_COPY.addQuestion}
          </Button>
          {problem && title ? <p className="text-sm text-amber-700 dark:text-amber-400">{problem}</p> : null}
        </section>

        {options.isLoading ? (
          <p className="text-sm text-wt-text-muted">{AUDIENCE_COPY.loading}</p>
        ) : options.data ? (
          <AudiencePicker options={options.data} value={effective} onChange={setAudience} />
        ) : (
          <p className="text-sm text-rose-600 dark:text-rose-400">{AUDIENCE_COPY.error}</p>
        )}
      </div>
    </WtFormDialog>
  );
}
