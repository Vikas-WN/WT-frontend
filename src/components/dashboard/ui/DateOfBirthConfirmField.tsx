"use client";

import { useMemo } from "react";
import { Cake, Check, Lock, Pencil } from "lucide-react";
import { DatePickerField } from "@/components/dashboard/ui/forms";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatApiDate, fromApiDate, toApiDateParam } from "@/utils/apiDate";

function ageFromDob(isoDate: string, today = new Date()): number | null {
  const dob = fromApiDate(isoDate);
  if (!dob) return null;
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age -= 1;
  return age;
}

export type DateOfBirthConfirmFieldProps = {
  value: string;
  confirmed: boolean;
  locked?: boolean;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  onChange: (value: string) => void;
  onConfirmChange: (confirmed: boolean) => void;
};

export function DateOfBirthConfirmField({
  value,
  confirmed,
  locked = false,
  required = true,
  disabled = false,
  className,
  onChange,
  onConfirmChange,
}: DateOfBirthConfirmFieldProps) {
  const age = useMemo(() => (value ? ageFromDob(value) : null), [value]);
  const isLocked = locked || (confirmed && Boolean(value));
  const ageValid = age !== null && age >= 18;

  return (
    <div
      className={cn(
        "sm:col-span-2 rounded-2xl border border-wt-border bg-[linear-gradient(145deg,color-mix(in_srgb,var(--wt-brand)_8%,var(--wt-surface-1)),var(--wt-surface-1)_55%)] p-4 shadow-sm transition-all duration-[var(--wt-duration)] ease-[var(--wt-ease)] dark:bg-wt-surface-2",
        className
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-[var(--wt-brand)] text-white shadow-sm">
            <Cake className="size-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-wt-text">Date of Birth</p>
            <p className="text-xs text-wt-text-muted">
              {isLocked
                ? "Confirmed and locked for your profile"
                : "Enter your DOB, confirm the calculated age, then it locks"}
            </p>
          </div>
        </div>
        {isLocked ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
            <Lock className="size-3" />
            Locked
          </span>
        ) : null}
      </div>

      <DatePickerField
        label="Date of Birth"
        required={required}
        disabled={disabled || isLocked}
        max={formatApiDate(new Date())}
        value={value}
        onChange={(v) => {
          onChange(v);
          onConfirmChange(false);
        }}
      />

      {value && age !== null ? (
        <div
          className={cn(
            "mt-3 rounded-xl border px-3.5 py-3 transition-all duration-[var(--wt-duration)]",
            ageValid
              ? "border-[color-mix(in_srgb,var(--wt-brand)_28%,var(--wt-border))] bg-wt-surface-1/90 dark:bg-black/25"
              : "border-rose-200 bg-rose-50 dark:border-rose-500/30 dark:bg-rose-500/10"
          )}
        >
          {ageValid ? (
            <>
              <p className="text-sm text-wt-text">
                Based on this date, your age is{" "}
                <span className="font-semibold text-[var(--wt-brand)]">{age} years</span>.
              </p>
              {!isLocked ? (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => onConfirmChange(true)}
                    disabled={confirmed}
                  >
                    <Check className="size-3.5" />
                    Yes, lock this date
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="gap-1.5"
                    onClick={() => {
                      onConfirmChange(false);
                      onChange("");
                    }}
                  >
                    <Pencil className="size-3.5" />
                    No, edit date
                  </Button>
                  {confirmed ? (
                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      Age confirmed — ready to save
                    </span>
                  ) : null}
                </div>
              ) : null}
            </>
          ) : (
            <p className="text-sm text-rose-700 dark:text-rose-300">
              Employees must be at least 18 years old. Please check the date.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}

export function isDobReadyToSave(value: string, confirmed: boolean, locked: boolean): boolean {
  if (locked && value) return true;
  if (!value.trim()) return false;
  const age = ageFromDob(toApiDateParam(value) || value);
  return Boolean(confirmed && age !== null && age >= 18);
}
