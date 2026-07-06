"use client";

import { DropdownSelect } from "@/components/dashboard/ui/DropdownSelect";
import { cn } from "@/lib/utils";

export type ToolbarFilterSelectOption = {
  value: string;
  label: string;
};

type ToolbarFilterSelectProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: ToolbarFilterSelectOption[];
  "aria-label": string;
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  compact?: boolean;
};

export function ToolbarFilterSelect({
  id,
  value,
  onChange,
  options,
  "aria-label": ariaLabel,
  className,
  disabled = false,
  loading = false,
  compact = false,
}: ToolbarFilterSelectProps) {
  return (
    <DropdownSelect
      id={id}
      value={value}
      onChange={onChange}
      options={options}
      disabled={disabled}
      loading={loading}
      aria-label={ariaLabel}
      variant={compact ? "compact" : "toolbar"}
      className={cn("min-w-[11rem]", className)}
    />
  );
}
