"use client";

import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";

import { InputField, SelectField, TextAreaField } from "@/components/dashboard/ui/forms";
import { CHOICE_TYPES, QUESTION_TYPE_OPTIONS } from "@/constants/forms";
import type { FormQuestion, QuestionType } from "@/types/form";

/** One question in the builder: type, label, required, options (one per line), and move / delete. */
export function QuestionEditor({
  index,
  question,
  total,
  onChange,
  onMove,
  onRemove,
}: {
  index: number;
  question: FormQuestion;
  total: number;
  onChange: (next: FormQuestion) => void;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
}) {
  const isChoice = CHOICE_TYPES.includes(question.type);
  const iconButton = "inline-flex size-8 items-center justify-center rounded-lg text-wt-text-muted transition-colors hover:bg-wt-surface-2 hover:text-wt-text disabled:opacity-30 disabled:hover:bg-transparent";

  return (
    <fieldset className="space-y-3 rounded-xl border border-wt-border bg-wt-surface-1 p-4">
      <legend className="sr-only">Question {index + 1}</legend>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-wt-text-faint">Question {index + 1}</span>
        <div className="flex items-center">
          <button type="button" className={iconButton} disabled={index === 0} onClick={() => onMove(-1)} aria-label="Move up">
            <ArrowUp className="size-4" />
          </button>
          <button type="button" className={iconButton} disabled={index === total - 1} onClick={() => onMove(1)} aria-label="Move down">
            <ArrowDown className="size-4" />
          </button>
          <button type="button" className={iconButton} onClick={onRemove} aria-label="Delete question">
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

      <InputField label="Question" value={question.label} onChange={(label) => onChange({ ...question, label })} placeholder="What do you want to ask?" />
      <div className="grid gap-3 sm:grid-cols-2">
        <SelectField
          label="Answer type"
          value={question.type}
          options={QUESTION_TYPE_OPTIONS.map(({ value, label }) => ({ value, label }))}
          onChange={(value) => onChange({ ...question, type: value as QuestionType })}
          clearSelectionOnEmptyInput={false}
        />
        <label className="flex cursor-pointer items-center gap-2.5 self-end pb-2.5 text-sm text-wt-text">
          <input
            type="checkbox"
            checked={question.required}
            onChange={(event) => onChange({ ...question, required: event.target.checked })}
            className="size-4 rounded border-wt-border-md accent-[var(--wt-brand)]"
          />
          Required
        </label>
      </div>
      {isChoice ? (
        <TextAreaField
          label="Options (one per line)"
          value={question.options.join("\n")}
          onChange={(text) => onChange({ ...question, options: text.split("\n") })}
          rows={4}
          placeholder={"Small\nMedium\nLarge"}
        />
      ) : null}
    </fieldset>
  );
}
