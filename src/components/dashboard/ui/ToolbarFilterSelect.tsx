"use client";

import { DropdownSelect } from "@/components/dashboard/ui/DropdownSelect";
import { cn } from "@/lib/utils";

export type ToolbarFilterSelectOption = {
  value: string;
  label: string;
};

const DIGITS_ONLY = (next: string) => next.replace(/\D/g, "").slice(0, 4);

type ToolbarFilterSelectProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: ToolbarFilterSelectOption[];
  placeholder?: string;
  /** Visible label shown beside the control (also used as aria-label fallback). */
  label?: string;
  "aria-label"?: string;
  className?: string;
  contentClassName?: string;
  disabled?: boolean;
  loading?: boolean;
  compact?: boolean;
  /** Restrict typed input to digits (e.g. year pickers). */
  digitsOnly?: boolean;
};

export function ToolbarFilterSelect({
  id,
  value,
  onChange,
  options,
  placeholder,
  label,
  "aria-label": ariaLabel,
  className,
  contentClassName,
  disabled = false,
  loading = false,
  compact = false,
  digitsOnly = false,
}: ToolbarFilterSelectProps) {
  const accessibleName = ariaLabel ?? label;
  const select = (
    <DropdownSelect
      id={id}
      value={value}
      onChange={onChange}
      options={options}
      placeholder={placeholder}
      disabled={disabled}
      loading={loading}
      aria-label={accessibleName}
      variant={compact ? "compact" : "toolbar"}
      className={cn("min-w-[11rem]", className)}
      contentClassName={contentClassName}
      sanitizeInput={digitsOnly ? DIGITS_ONLY : undefined}
      inputMode={digitsOnly ? "numeric" : undefined}
      clearSelectionOnEmptyInput={!digitsOnly}
    />
  );

  if (!label) return select;

  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor={id}
        className="whitespace-nowrap text-sm font-medium text-wt-text-muted"
      >
        {label}
      </label>
      {select}
    </div>
  );
}
