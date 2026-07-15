"use client";

import {
  SearchableSelectCombobox,
  type SearchableSelectOption,
} from "@/components/dashboard/ui/SearchableSelectCombobox";
import {
  TABLE_INLINE_SELECT_TRIGGER_CLASS,
  TOOLBAR_SELECT_TRIGGER_CLASS,
  TOOLBAR_SELECT_TRIGGER_COMPACT_CLASS,
} from "@/components/dashboard/ui/uiLayout";
import { cn } from "@/lib/utils";

export function ChevronDownIcon() {
  return null;
}

type DropdownSelectVariant = "default" | "toolbar" | "compact" | "table-inline";

function triggerClassForVariant(variant: DropdownSelectVariant): string {
  switch (variant) {
    case "toolbar":
      return TOOLBAR_SELECT_TRIGGER_CLASS;
    case "compact":
      return TOOLBAR_SELECT_TRIGGER_COMPACT_CLASS;
    case "table-inline":
      return TABLE_INLINE_SELECT_TRIGGER_CLASS;
    default:
      return "";
  }
}

export function DropdownSelect({
  value,
  onChange,
  options,
  disabled = false,
  loading = false,
  loadingLabel = "Loading…",
  placeholder = "Select",
  required = false,
  className = "",
  selectClassName,
  variant = "default",
  id,
  "aria-label": ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  options: SearchableSelectOption[];
  disabled?: boolean;
  loading?: boolean;
  loadingLabel?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
  selectClassName?: string;
  variant?: DropdownSelectVariant;
  id?: string;
  "aria-label"?: string;
}) {
  return (
    <SearchableSelectCombobox
      value={value}
      onChange={onChange}
      options={options}
      disabled={disabled}
      loading={loading}
      loadingLabel={loadingLabel}
      placeholder={placeholder}
      required={required}
      id={id}
      aria-label={ariaLabel}
      showChevron
      className={className}
      inputClassName={cn(
        triggerClassForVariant(variant),
        selectClassName,
        loading ? "text-wt-text-muted" : undefined
      )}
    />
  );
}
