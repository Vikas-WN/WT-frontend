"use client";

import { Plus, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InputField, SelectField } from "@/components/dashboard/ui/forms";
import { SkillRating } from "@/types/onboard";
import { cn } from "@/lib/utils";

export type SkillRatingsListInputProps = {
  label: string;
  value: SkillRating[];
  onChange: (value: SkillRating[]) => void;
  showWebknotRating?: boolean;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  hint?: string;
};

const RATING_OPTIONS = ["1", "2", "3", "4", "5"];
const DEFAULT_SELF_RATING = 3;

function parseSelfRating(raw: string, fallback: number = DEFAULT_SELF_RATING): number {
  const parsed = Number(String(raw ?? "").trim());
  if (!Number.isFinite(parsed) || parsed < 1 || parsed > 5) return fallback;
  return parsed;
}

function displaySelfRating(value: unknown): string {
  const parsed = Number(value);
  if (Number.isFinite(parsed) && parsed >= 1 && parsed <= 5) return String(parsed);
  return String(DEFAULT_SELF_RATING);
}

export function SkillRatingsListInput({
  label,
  value,
  onChange,
  showWebknotRating = false,
  disabled = false,
  required = false,
  className,
  hint,
}: SkillRatingsListInputProps) {
  const handleAdd = () => {
    onChange([
      ...value,
      { skill: "", self_rating: DEFAULT_SELF_RATING, webknot_rating: null },
    ]);
  };

  const handleRemove = (index: number) => {
    const copy = [...value];
    copy.splice(index, 1);
    onChange(copy);
  };

  const handleChange = (
    index: number,
    field: keyof SkillRating,
    newVal: string
  ) => {
    const copy = [...value];
    const row = { ...copy[index] };

    if (field === "skill") {
      row.skill = newVal;
    } else if (field === "self_rating") {
      // Never store 0/NaN from an emptied combobox — that still displayed as "3"
      // via `|| 3` and then failed submit validation.
      row.self_rating = parseSelfRating(newVal, row.self_rating || DEFAULT_SELF_RATING);
    } else if (field === "webknot_rating") {
      row.webknot_rating = newVal ? Number(newVal) : null;
    }

    copy[index] = row;
    onChange(copy);
  };

  return (
    <div
      className={cn(
        "rounded-2xl border border-wt-border bg-wt-surface-1/80 p-3.5 shadow-sm transition-all duration-[var(--wt-duration)] ease-[var(--wt-ease)] dark:bg-wt-surface-2",
        className
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <label className="flex items-center gap-1.5 text-sm font-semibold text-wt-text">
            <Sparkles className="size-3.5 text-[var(--wt-brand)]" />
            {label}
            {required ? <span className="text-rose-500">*</span> : null}
          </label>
          {hint ? <p className="mt-0.5 text-[11px] text-wt-text-muted">{hint}</p> : null}
        </div>
        <Button
          variant="ghost"
          size="sm"
          type="button"
          onClick={handleAdd}
          disabled={disabled}
          className="h-8 gap-1 rounded-lg px-2.5 text-xs"
        >
          <Plus className="size-3.5" />
          Add
        </Button>
      </div>

      {value.length === 0 ? (
        <button
          type="button"
          onClick={handleAdd}
          disabled={disabled}
          className="flex w-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-wt-border bg-wt-surface-2/70 px-4 py-6 text-center transition-colors hover:border-[color-mix(in_srgb,var(--wt-brand)_35%,var(--wt-border))] hover:bg-wt-brand-soft/40 dark:bg-black/20"
        >
          <p className="text-sm font-medium text-wt-text">Add at least one skill</p>
          <p className="text-xs text-wt-text-muted">Include a self rating from 1–5</p>
        </button>
      ) : (
        <div className="space-y-2.5 overflow-x-clip">
          {value.map((item, idx) => (
            <div
              key={idx}
              className="flex min-w-0 items-start gap-2 rounded-xl border border-wt-border bg-wt-surface-2/80 p-2.5 transition-shadow hover:shadow-sm dark:bg-black/25"
            >
              <div className="min-w-0 flex-1 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <InputField
                  label="Skill Name"
                  placeholder="e.g. React, Python"
                  value={item.skill}
                  onChange={(v) => handleChange(idx, "skill", v)}
                  disabled={disabled}
                  required
                />
                <div className="flex min-w-0 gap-2">
                  <div className="min-w-0 flex-1">
                    <SelectField
                      label="Self Rating"
                      options={RATING_OPTIONS}
                      value={displaySelfRating(item.self_rating)}
                      onChange={(v) => handleChange(idx, "self_rating", v)}
                      disabled={disabled}
                      required
                      clearSelectionOnEmptyInput={false}
                      align="end"
                      contentClassName="max-w-[min(12rem,calc(100vw-1rem))]"
                    />
                  </div>
                  {showWebknotRating ? (
                    <div className="min-w-0 flex-1">
                      <SelectField
                        label="WK Rating"
                        options={[
                          { label: "None", value: "" },
                          ...RATING_OPTIONS.map((r) => ({ label: r, value: r })),
                        ]}
                        value={item.webknot_rating ? String(item.webknot_rating) : ""}
                        onChange={(v) => handleChange(idx, "webknot_rating", v)}
                        disabled={disabled}
                        align="end"
                        contentClassName="max-w-[min(12rem,calc(100vw-1rem))]"
                      />
                    </div>
                  ) : null}
                </div>
              </div>
              <Button
                variant="ghost"
                type="button"
                className="mt-[26px] h-[38px] w-[38px] shrink-0 p-0 text-rose-500 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-500/10"
                onClick={() => handleRemove(idx)}
                disabled={disabled}
                title="Remove skill"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
