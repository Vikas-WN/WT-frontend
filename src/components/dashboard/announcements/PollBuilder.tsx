"use client";

import { Plus, X } from "lucide-react";

import { InputField } from "@/components/dashboard/ui/forms";
import { Button } from "@/components/ui/button";
import { POLL_COPY, POLL_LIMITS } from "@/constants/announcements";
import type { PollCreatePayload } from "@/types/announcement";

export const EMPTY_POLL: PollCreatePayload = { question: "", options: ["", ""], multiple: false };

/** A poll is usable once it has a question and at least two different, filled-in options. */
export function isPollComplete(poll: PollCreatePayload): boolean {
  const options = poll.options.map((option) => option.trim().toLowerCase());
  return (
    poll.question.trim().length >= 3 &&
    options.length >= POLL_LIMITS.minOptions &&
    options.every(Boolean) &&
    new Set(options).size === options.length
  );
}

/** The optional poll section of the announcement composer. */
export function PollBuilder({
  value,
  onChange,
}: {
  value: PollCreatePayload;
  onChange: (next: PollCreatePayload) => void;
}) {
  const setOption = (index: number, label: string) =>
    onChange({ ...value, options: value.options.map((option, i) => (i === index ? label : option)) });
  const removeOption = (index: number) =>
    onChange({ ...value, options: value.options.filter((_, i) => i !== index) });

  return (
    <div className="space-y-3 rounded-xl border border-wt-border bg-wt-surface-2/40 p-4">
      <InputField
        label={POLL_COPY.questionLabel}
        value={value.question}
        onChange={(question) => onChange({ ...value, question })}
        placeholder={POLL_COPY.questionPlaceholder}
        required
      />
      <div className="space-y-2">
        {value.options.map((option, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <InputField
                label={POLL_COPY.optionPlaceholder(index + 1)}
                value={option}
                onChange={(label) => setOption(index, label)}
                placeholder={POLL_COPY.optionPlaceholder(index + 1)}
              />
            </div>
            {value.options.length > POLL_LIMITS.minOptions ? (
              <button
                type="button"
                aria-label={POLL_COPY.removeOption}
                onClick={() => removeOption(index)}
                className="mt-6 rounded-md p-1.5 text-wt-text-muted hover:bg-wt-surface-3 hover:text-wt-text"
              >
                <X className="size-4" />
              </button>
            ) : null}
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={value.options.length >= POLL_LIMITS.maxOptions}
          onClick={() => onChange({ ...value, options: [...value.options, ""] })}
        >
          <Plus className="size-3.5" /> {POLL_COPY.addOption}
        </Button>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-wt-text">
          <input
            type="checkbox"
            checked={value.multiple}
            onChange={(event) => onChange({ ...value, multiple: event.target.checked })}
            className="size-4 rounded border-wt-border-md accent-[var(--wt-brand)]"
          />
          {POLL_COPY.multipleLabel}
        </label>
      </div>
    </div>
  );
}
