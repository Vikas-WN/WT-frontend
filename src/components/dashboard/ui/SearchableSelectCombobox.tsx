"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type InputHTMLAttributes,
  type KeyboardEvent,
} from "react";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { useModalPanel } from "@/components/dashboard/ui/ModalPanelContext";
import { cn } from "@/lib/utils";

export type SearchableSelectOption = { value: string; label: string; title?: string };

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
  /** Prefer end alignment for right-edge fields so the panel stays on-screen. */
  align = "start",
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
  align?: "start" | "center" | "end";
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
  const modalPanel = useModalPanel();

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

  // While typing a search, if the filter narrows to exactly one option, Enter
  // commits it — no need to arrow-down first.
  const handleInputKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key !== "Enter" || event.defaultPrevented) return;
      const query = filterText.trim().toLowerCase();
      if (!isFiltering || !query) return;
      const matches = items.filter((opt) => opt.label.toLowerCase().includes(query));
      if (matches.length === 1) {
        event.preventDefault();
        event.stopPropagation();
        handleValueChange(matches[0]);
      }
    },
    [filterText, isFiltering, items, handleValueChange]
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
        onKeyDown={handleInputKeyDown}
        showTrigger={showChevron}
        showClear={clearSelectionOnEmptyInput && Boolean(selected) && !isDisabled}
        className={cn("w-full", inputClassName)}
      />
      <ComboboxContent
        side="bottom"
        sideOffset={4}
        align={align}
        collisionPadding={8}
        collisionAvoidance={{
          // Anchored, scrollable listbox — behave like a dropdown: flip top/bottom
          // and shift into view, but never fall back to a left/right side of the
          // field (that pushes right-column dropdowns past the viewport edge). When
          // vertical space is tight the list scrolls internally instead.
          side: "flip",
          align: "shift",
          fallbackAxisSide: "none",
        }}
        // Inside modals: portal into the body host and use absolute positioning so
        // clipping-ancestors bound height above Cancel/Next. Outside: fixed to body.
        container={modalPanel}
        positionMethod={modalPanel ? "absolute" : "fixed"}
        className={contentClassName}
      >
        <ComboboxEmpty>{loading ? loadingLabel : "No matches"}</ComboboxEmpty>
        <ComboboxList>
          {(item) => (
            <ComboboxItem key={item.value || `opt-${item.label}`} value={item} className="max-w-full">
              <span className="min-w-0 flex-1 truncate" title={item.title ?? item.label}>
                {item.label}
              </span>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
      </Combobox>
    </div>
  );
}
