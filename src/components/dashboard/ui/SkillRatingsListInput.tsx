"use client";

import { Plus, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AdaptiveSelectField,
  InputField,
  SelectField,
  type SelectFieldOption,
} from "@/components/dashboard/ui/forms";
import { SkillRating } from "@/types/onboard";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";

export type SkillRatingsListInputProps = {
  label: string;
  value: SkillRating[];
  onChange: (value: SkillRating[]) => void;
  skillOptions?: SelectFieldOption[];
  allowCustomSkills?: boolean;
  showWebknotRating?: boolean;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  hint?: string;
  /** Hard cap on how many skill rows can be added. Defaults to 5. */
  maxItems?: number;
};

const RATING_OPTIONS = ["1", "2", "3", "4", "5"];
const DEFAULT_SELF_RATING = 3;
const DEFAULT_MAX_SKILLS = 5;

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
  skillOptions = [],
  allowCustomSkills = false,
  showWebknotRating = false,
  disabled = false,
  required = false,
  className,
  hint,
  maxItems = DEFAULT_MAX_SKILLS,
}: SkillRatingsListInputProps) {
  const atLimit = value.length >= maxItems;
  const [customSkillRows, setCustomSkillRows] = useState<Set<number>>(() => new Set());
  const normalizedSkillOptions = useMemo(
    () =>
      skillOptions.map((option) =>
        typeof option === "string"
          ? { value: option, label: option }
          : { value: option.value, label: option.label }
      ),
    [skillOptions]
  );
  const predefinedSkillKeys = useMemo(
    () => new Set(normalizedSkillOptions.map((option) => option.value.trim().toLowerCase())),
    [normalizedSkillOptions]
  );

  const handleAdd = () => {
    if (value.length >= maxItems) return;
    onChange([
      ...value,
      { skill: "", self_rating: DEFAULT_SELF_RATING, webknot_rating: null },
    ]);
  };

  const handleRemove = (index: number) => {
    const copy = [...value];
    copy.splice(index, 1);
    setCustomSkillRows((prev) => {
      const next = new Set<number>();
      prev.forEach((rowIndex) => {
        if (rowIndex < index) next.add(rowIndex);
        if (rowIndex > index) next.add(rowIndex - 1);
      });
      return next;
    });
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
      const isPredefined = predefinedSkillKeys.has(newVal.trim().toLowerCase());
      setCustomSkillRows((prev) => {
        const next = new Set(prev);
        if (isPredefined) next.delete(index);
        return next;
      });
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

  const enableCustomSkill = (index: number) => {
    setCustomSkillRows((prev) => new Set(prev).add(index));
  };

  const disableCustomSkill = (index: number) => {
    setCustomSkillRows((prev) => {
      const next = new Set(prev);
      next.delete(index);
      return next;
    });
    handleChange(index, "skill", "");
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
          {hint || Number.isFinite(maxItems) ? (
            <p className="mt-0.5 text-[11px] text-wt-text-muted">
              {hint}
              {hint && Number.isFinite(maxItems) ? " · " : ""}
              {Number.isFinite(maxItems) ? `Up to ${maxItems} skills` : ""}
            </p>
          ) : null}
        </div>
        <Button
          variant="ghost"
          size="sm"
          type="button"
          onClick={handleAdd}
          disabled={disabled || atLimit}
          className="h-8 gap-1 rounded-lg px-2.5 text-xs"
          title={atLimit ? `You can add up to ${maxItems} skills` : undefined}
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
              {(() => {
                const isCustomSkill =
                  customSkillRows.has(idx) ||
                  (Boolean(item.skill.trim()) &&
                    normalizedSkillOptions.length > 0 &&
                    !predefinedSkillKeys.has(item.skill.trim().toLowerCase()));

                return (
              <div className="min-w-0 flex-1 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  {normalizedSkillOptions.length > 0 && !isCustomSkill ? (
                    <AdaptiveSelectField
                      label="Skill Name"
                      value={item.skill}
                      options={normalizedSkillOptions}
                      onChange={(v) => handleChange(idx, "skill", v)}
                      disabled={disabled}
                      required
                      searchPlaceholder="Search available skills…"
                      placeholder="Select Skill"
                      // Skill names are long, so clamp to the viewport rather than the
                      // portal host: inside a modal the reported width is the panel's and
                      // the list still spills past the page edge.
                      contentClassName="max-w-[min(20rem,calc(100vw-1rem))]"
                    />
                  ) : (
                    <InputField
                      label="Skill Name"
                      placeholder="e.g. React, Python"
                      value={item.skill}
                      onChange={(v) => handleChange(idx, "skill", v)}
                      disabled={disabled}
                      required
                      description={
                        allowCustomSkills
                          ? "Custom skill entry enabled because the skill is not in the predefined list."
                          : undefined
                      }
                    />
                  )}
                  {allowCustomSkills && normalizedSkillOptions.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {isCustomSkill ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          type="button"
                          className="h-7 rounded-md px-2 text-xs"
                          onClick={() => disableCustomSkill(idx)}
                          disabled={disabled}
                        >
                          Choose From List
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          type="button"
                          className="h-7 rounded-md px-2 text-xs"
                          onClick={() => enableCustomSkill(idx)}
                          disabled={disabled}
                        >
                          Create New Skill
                        </Button>
                      )}
                    </div>
                  ) : null}
                </div>
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
                );
              })()}
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
