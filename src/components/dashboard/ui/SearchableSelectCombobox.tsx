"use client";

import { useMemo } from "react";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { cn } from "@/lib/utils";

export type SearchableSelectOption = { value: string; label: string };

export function SearchableSelectCombobox({
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  loading = false,
  loadingLabel = "Loading…",
  required = false,
  className = "",
  inputClassName,
  contentClassName,
  id: idProp,
  "aria-label": ariaLabel,
  dropdownAttached = false,
  showChevron = false,
}: {
  value: string;
  onChange: (value: string) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  loadingLabel?: string;
  required?: boolean;
  className?: string;
  inputClassName?: string;
  contentClassName?: string;
  id?: string;
  "aria-label"?: string;
  dropdownAttached?: boolean;
  showChevron?: boolean;
}) {
  // Empty-value entries are legacy placeholder rows (e.g. { value: "", label: "Select…" }).
  // They must never render as selectable items: with an empty selection they would match
  // as the "selected" option, painting the placeholder into the input like a real value
  // and listing it (checked) in every dropdown. Use them only as a placeholder fallback.
  const items = useMemo(
    () => options.filter((opt) => opt.value !== ""),
    [options]
  );
  const placeholderText =
    placeholder ??
    options.find((opt) => opt.value === "")?.label ??
    "Search…";

  const selected = value ? items.find((opt) => opt.value === value) ?? null : null;
  const isDisabled = disabled || loading;

  return (
    <div className={cn("w-full", className)}>
      <Combobox
        items={items}
        value={selected}
        onValueChange={(item) => onChange(item?.value ?? "")}
        itemToStringValue={(item) => item.label}
        disabled={isDisabled}
      >
      <ComboboxInput
        id={idProp}
        placeholder={loading ? loadingLabel : placeholderText}
        disabled={isDisabled}
        required={required && !value}
        aria-required={required || undefined}
        aria-busy={loading || undefined}
        aria-label={ariaLabel}
        showTrigger={showChevron}
        showClear={Boolean(selected) && !isDisabled}
        className={cn("w-full", inputClassName)}
      />
      <ComboboxContent
        side="bottom"
        sideOffset={4}
        className={cn(
          "max-w-[min(calc(100vw-2rem),28rem)]",
          contentClassName
        )}
      >
        <ComboboxEmpty>{loading ? loadingLabel : "No matches"}</ComboboxEmpty>
        <ComboboxList>
          {(item) => (
            <ComboboxItem key={item.value || `opt-${item.label}`} value={item} className="max-w-full">
              <span className="block truncate">{item.label}</span>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
      </Combobox>
    </div>
  );
}
