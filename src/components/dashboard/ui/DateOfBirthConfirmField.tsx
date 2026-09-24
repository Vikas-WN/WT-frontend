"use client";

import { useEffect, useMemo, useRef } from "react";
import { Cake } from "lucide-react";
import { DatePickerField } from "@/components/dashboard/ui/forms";
import { cn } from "@/lib/utils";
import { showErrorToast } from "@/lib/toast";
import { formatApiDate, parseApiDate, toApiDateParam } from "@/utils/apiDate";

function ageFromDob(isoDate: string, today = new Date()): number | null {
  const normalized = toApiDateParam(isoDate);
  if (!normalized) return null;
  const dob = parseApiDate(normalized);
  if (!dob) return null;
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age -= 1;
  return age;
}

export type DateOfBirthConfirmFieldProps = {
  value: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  onChange: (value: string) => void;
};

/** Plain, always-editable Date of Birth field with an age readout. Used to
 *  lock once a value had ever been set (confirm-then-lock workflow) — that
 *  restriction was removed on both frontend and backend, so this is now an
 *  ordinary required field like any other. */
export function DateOfBirthConfirmField({
  value,
  required = true,
  disabled = false,
  className,
  onChange,
}: DateOfBirthConfirmFieldProps) {
  const age = useMemo(() => (value ? ageFromDob(value) : null), [value]);
  const ageValid = age !== null && age >= 18;
  const invalidToastShownRef = useRef(false);

  useEffect(() => {
    if (!value || age === null) {
      invalidToastShownRef.current = false;
      return;
    }
    if (ageValid) {
      invalidToastShownRef.current = false;
      return;
    }
    if (!invalidToastShownRef.current) {
      invalidToastShownRef.current = true;
      showErrorToast("Employees must be at least 18 years old. Please check the date.");
    }
  }, [age, ageValid, value]);

  return (
    <div
      className={cn(
        "sm:col-span-2 rounded-2xl border border-wt-border bg-[linear-gradient(145deg,color-mix(in_srgb,var(--wt-brand)_8%,var(--wt-surface-1)),var(--wt-surface-1)_55%)] p-4 shadow-sm transition-all duration-[var(--wt-duration)] ease-[var(--wt-ease)] dark:bg-wt-surface-2",
        className
      )}
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="flex size-9 items-center justify-center rounded-xl bg-[var(--wt-brand)] text-white shadow-sm">
          <Cake className="size-4" />
        </span>
        <div>
          <p className="text-sm font-semibold text-wt-text">Date of Birth</p>
          <p className="text-xs text-wt-text-muted">Enter your date of birth.</p>
        </div>
      </div>

      <DatePickerField
        label="Date of Birth"
        required={required}
        disabled={disabled}
        max={formatApiDate(new Date())}
        value={value}
        onChange={onChange}
      />

      {value && age !== null && ageValid ? (
        <div
          className={cn(
            "mt-3 rounded-xl border px-3.5 py-3 transition-all duration-[var(--wt-duration)]",
            "border-[color-mix(in_srgb,var(--wt-brand)_28%,var(--wt-border))] bg-wt-surface-1/90 dark:bg-black/25"
          )}
        >
          <p className="text-sm text-wt-text">
            Based on this date, your age is{" "}
            <span className="font-semibold text-[var(--wt-brand)]">{age} years</span>.
          </p>
        </div>
      ) : null}
    </div>
  );
}

export function isDobReadyToSave(value: string): boolean {
  if (!value.trim()) return false;
  const age = ageFromDob(value);
  return age !== null && age >= 18;
}
