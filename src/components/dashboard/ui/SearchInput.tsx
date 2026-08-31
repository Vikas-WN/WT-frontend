"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  placeholder?: string;
  className?: string;
  "aria-label"?: string;
};

/**
 * Deliberately has no `disabled` prop. Search is debounced into a query key, so disabling
 * while the list refetches blurs the focused input (browsers un-focus disabled elements)
 * and the user loses the field after every keystroke.
 */
export function SearchInput({
  value,
  onChange,
  id = "management-list-search",
  placeholder = "Search",
  className,
  "aria-label": ariaLabel = "Search",
}: SearchInputProps) {
  return (
    <Input
      id={id}
      type="search"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      aria-label={ariaLabel}
      className={cn("h-10 w-full", className)}
    />
  );
}
