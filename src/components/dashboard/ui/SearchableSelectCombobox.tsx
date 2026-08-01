"use client";

import { useCallback, useEffect, useMemo, useState, type InputHTMLAttributes } from "react";
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
  /** Transform typed input (e.g. strip non-digits for year fields). */
  sanitizeInput,
  inputMode,
  /** When false, emptying the input only resets the filter — selection stays. */
  clearSelectionOnEmptyInput = true,
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
  sanitizeInput?: (next: string) => string;
  inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"];
  clearSelectionOnEmptyInput?: boolean;
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
  const selectedLabel = selected?.label ?? "";
  const isDisabled = disabled || loading;

  const [isFiltering, setIsFiltering] = useState(false);
  const [filterText, setFilterText] = useState("");

  useEffect(() => {
    // When the controlled value becomes empty after a clear, keep showing a blank
    // input (filter mode) so the field can remain unset. Otherwise exit filter mode.
    if (!value) {
      setIsFiltering(true);
      setFilterText("");
      return;
    }
    setIsFiltering(false);
    setFilterText("");
  }, [value]);

  const inputValue = isFiltering ? filterText : selectedLabel;

  const handleInputValueChange = useCallback(
    (next: string, eventDetails?: { reason?: string }) => {
      const reason = eventDetails?.reason ?? "";
      const sanitized = sanitizeInput ? sanitizeInput(next) : next;

      // Clearing the input (Backspace/Delete to empty, or the clear button) must clear the
      // selection once. Stay in filter mode with an empty string until the parent `value`
      // updates — flipping isFiltering off here snaps inputValue back to selectedLabel
      // (still the old month on this render) and the combobox re-commits that selection.
      if (reason === "clear-press" || sanitized === "") {
        if (clearSelectionOnEmptyInput) {
          setIsFiltering(true);
          setFilterText("");
          if (value) onChange("");
          return;
        }
        // Keep selection; empty filter shows the full option list.
        setIsFiltering(true);
        setFilterText("");
        return;
      }

      setIsFiltering(true);
      setFilterText(sanitized);
    },
    [onChange, value, sanitizeInput, clearSelectionOnEmptyInput]
  );

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        // If the selection was cleared, keep the empty filter so blur does not
        // restore the previous label before the controlled value catches up.
        if (!value) {
          setIsFiltering(true);
          setFilterText("");
          return;
        }
        setIsFiltering(false);
        setFilterText("");
      }
    },
    [value]
  );

  const handleValueChange = useCallback(
    (item: SearchableSelectOption | null) => {
      onChange(item?.value ?? "");
      if (!item) {
        setIsFiltering(true);
        setFilterText("");
        return;
      }
      setIsFiltering(false);
      setFilterText("");
    },
    [onChange]
  );

  return (
    <div className={cn("w-full", className)}>
      <Combobox
        items={items}
        value={selected}
        onValueChange={handleValueChange}
        inputValue={inputValue}
        onInputValueChange={handleInputValueChange}
        onOpenChange={handleOpenChange}
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
        inputMode={inputMode}
        showTrigger={showChevron}
        showClear={clearSelectionOnEmptyInput && Boolean(selected) && !isDisabled}
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
