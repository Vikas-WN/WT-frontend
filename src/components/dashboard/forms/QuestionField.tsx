"use client";

import { Check } from "lucide-react";

import { DatePickerField, InputField, TextAreaField } from "@/components/dashboard/ui/forms";
import { FORM_COPY, RATING_LABELS } from "@/constants/forms";
import { cn } from "@/lib/utils";
import type { AnswerValue, FormQuestion } from "@/types/form";

const choiceButton = (on: boolean) =>
  cn(
    "flex w-full items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left text-sm transition-colors",
    on ? "border-[var(--wt-brand)] bg-wt-brand-soft text-wt-text" : "border-wt-border text-wt-text hover:bg-wt-surface-2"
  );

function Mark({ on, round }: { on: boolean; round: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-4 shrink-0 items-center justify-center border",
        round ? "rounded-full" : "rounded",
        on ? "border-[var(--wt-brand)] bg-[var(--wt-brand)] text-white" : "border-wt-border-md"
      )}
    >
      {on ? <Check className="size-3" /> : null}
    </span>
  );
}

/** Renders one question with the right control and shows its error. The answer shape matches the server's. */
export function QuestionField({
  question,
  value,
  error,
  onChange,
}: {
  question: FormQuestion;
  value: AnswerValue | undefined;
  error?: string;
  onChange: (next: AnswerValue) => void;
}) {
  const label = question.label;
  let control: React.ReactNode;

  switch (question.type) {
    case "SHORT_TEXT":
      return (
        <Wrapper error={error}>
          <InputField label={label} value={typeof value === "string" ? value : ""} onChange={onChange} required={question.required} />
        </Wrapper>
      );
    case "LONG_TEXT":
      return (
        <Wrapper error={error}>
          <TextAreaField label={label} value={typeof value === "string" ? value : ""} onChange={onChange} rows={4} required={question.required} />
        </Wrapper>
      );
    case "DATE":
      return (
        <Wrapper error={error}>
          <DatePickerField label={label} value={typeof value === "string" ? value : ""} onChange={onChange} required={question.required} />
        </Wrapper>
      );
    case "SINGLE_CHOICE":
      control = (
        <div role="radiogroup" aria-label={label} className="space-y-2">
          {question.options.map((option) => (
            <button key={option} type="button" role="radio" aria-checked={value === option} onClick={() => onChange(option)} className={choiceButton(value === option)}>
              <Mark on={value === option} round />
              {option}
            </button>
          ))}
        </div>
      );
      break;
    case "MULTI_CHOICE": {
      const picked = Array.isArray(value) ? value : [];
      control = (
        <div role="group" aria-label={label} className="space-y-2">
          {question.options.map((option) => {
            const on = picked.includes(option);
            return (
              <button key={option} type="button" role="checkbox" aria-checked={on} onClick={() => onChange(on ? picked.filter((o) => o !== option) : [...picked, option])} className={choiceButton(on)}>
                <Mark on={on} round={false} />
                {option}
              </button>
            );
          })}
        </div>
      );
      break;
    }
    case "RATING":
      control = (
        <div role="radiogroup" aria-label={label} className="grid grid-cols-5 gap-1.5">
          {RATING_LABELS.map((name, index) => {
            const n = index + 1;
            const on = value === n;
            return (
              <button key={n} type="button" role="radio" aria-checked={on} onClick={() => onChange(n)} className={cn("flex flex-col items-center rounded-xl border px-1 py-2 text-xs transition-colors", on ? "border-[var(--wt-brand)] bg-[var(--wt-brand)] text-[var(--wt-brand-text)]" : "border-wt-border text-wt-text-muted hover:bg-wt-surface-2")}>
                <span className="text-base font-semibold tabular-nums">{n}</span>
                <span className="hidden sm:block">{name}</span>
              </button>
            );
          })}
        </div>
      );
      break;
    case "YES_NO":
      control = (
        <div role="radiogroup" aria-label={label} className="grid grid-cols-2 gap-2">
          {([[true, "Yes"], [false, "No"]] as const).map(([answer, text]) => (
            <button key={text} type="button" role="radio" aria-checked={value === answer} onClick={() => onChange(answer)} className={cn(choiceButton(value === answer), "justify-center")}>
              {text}
            </button>
          ))}
        </div>
      );
      break;
  }

  return (
    <Wrapper error={error}>
      <p className="mb-2 text-sm font-medium text-wt-text">
        {label}
        {question.required ? <span className="ml-1 text-rose-500" title={FORM_COPY.required}>*</span> : null}
      </p>
      {control}
    </Wrapper>
  );
}

function Wrapper({ children, error }: { children: React.ReactNode; error?: string }) {
  return (
    <div>
      {children}
      {error ? <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400">{error}</p> : null}
    </div>
  );
}
