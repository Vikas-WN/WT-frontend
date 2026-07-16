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
  placeholder?: string;
  "aria-label": string;
  className?: string;
  contentClassName?: string;
  disabled?: boolean;
  loading?: boolean;
  compact?: boolean;
};

export function ToolbarFilterSelect({
  id,
  value,
  onChange,
  options,
  placeholder,
  "aria-label": ariaLabel,
  className,
  contentClassName,
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
      placeholder={placeholder}
      disabled={disabled}
      loading={loading}
      aria-label={ariaLabel}
      variant={compact ? "compact" : "toolbar"}
      className={cn("min-w-[11rem]", className)}
      contentClassName={contentClassName}
    />
  );
}
