"use client";

import { SearchInput } from "@/components/dashboard/ui/SearchInput";
import { LIST_FILTER_COPY } from "@/constants/contentCategories";
import { cn } from "@/lib/utils";

export interface FilterChip {
  value: string;
  label: string;
}

/** A search box plus a row of one-tap category chips ("All" first). Used by the announcements, events and forms lists. */
export function ListFilters({
  idPrefix,
  search,
  onSearch,
  placeholder,
  chips,
  chipValue,
  onChip,
}: {
  idPrefix: string;
  search: string;
  onSearch: (value: string) => void;
  placeholder: string;
  chips: ReadonlyArray<FilterChip>;
  chipValue: string;
  onChip: (value: string) => void;
}) {
  const all: FilterChip[] = [{ value: "", label: LIST_FILTER_COPY.all }, ...chips];
  return (
    <div className="space-y-3">
      <SearchInput
        id={`${idPrefix}-search`}
        value={search}
        onChange={onSearch}
        placeholder={placeholder}
        aria-label={placeholder}
        className="max-w-md"
      />
      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="group" aria-label="Category">
        {all.map((chip) => (
          <button
            key={chip.value || "all"}
            type="button"
            aria-pressed={chipValue === chip.value}
            onClick={() => onChip(chip.value)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              chipValue === chip.value
                ? "border-[var(--wt-brand)] bg-[var(--wt-brand)] text-[var(--wt-brand-text)]"
                : "border-wt-border bg-wt-surface-1 text-wt-text-muted hover:text-wt-text"
            )}
          >
            {chip.label}
          </button>
        ))}
      </div>
    </div>
  );
}
