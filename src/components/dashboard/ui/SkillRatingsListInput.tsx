"use client";

import React, { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
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
  className?: string;
};

const RATING_OPTIONS = ["1", "2", "3", "4", "5"];

export function SkillRatingsListInput({
  label,
  value,
  onChange,
  showWebknotRating = false,
  disabled = false,
  className,
}: SkillRatingsListInputProps) {
  const handleAdd = () => {
    onChange([...value, { skill: "", self_rating: 3, webknot_rating: null }]);
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
      row.self_rating = Number(newVal);
    } else if (field === "webknot_rating") {
      row.webknot_rating = newVal ? Number(newVal) : null;
    }
    
    copy[index] = row;
    onChange(copy);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-wt-text-dark">
          {label}
        </label>
        <Button
          variant="ghost"
          size="sm"
          type="button"
          onClick={handleAdd}
          disabled={disabled}
          className="h-7 text-xs px-2 gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Skill
        </Button>
      </div>

      {value.length === 0 ? (
        <p className="text-sm text-wt-text-muted italic">No skills added.</p>
      ) : (
        <div className="space-y-3">
          {value.map((item, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2 bg-wt-surface-2 p-2 rounded-lg border border-wt-border"
            >
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <InputField
                  label="Skill Name"
                  placeholder="e.g. React, Python"
                  value={item.skill}
                  onChange={(v) => handleChange(idx, "skill", v)}
                  disabled={disabled}
                  required
                />
                <div className="flex gap-2">
                  <div className="flex-1">
                    <SelectField
                      label="Self Rating"
                      options={RATING_OPTIONS}
                      value={String(item.self_rating || 3)}
                      onChange={(v) => handleChange(idx, "self_rating", v)}
                      disabled={disabled}
                      required
                    />
                  </div>
                  {showWebknotRating && (
                    <div className="flex-1">
                      <SelectField
                        label="WK Rating"
                        options={[{ label: "None", value: "" }, ...RATING_OPTIONS.map(r => ({ label: r, value: r }))]}
                        value={item.webknot_rating ? String(item.webknot_rating) : ""}
                        onChange={(v) => handleChange(idx, "webknot_rating", v)}
                        disabled={disabled}
                      />
                    </div>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                type="button"
                className="mt-[26px] h-[38px] w-[38px] p-0 text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                onClick={() => handleRemove(idx)}
                disabled={disabled}
                title="Remove skill"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
