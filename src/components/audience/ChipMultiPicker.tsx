"use client";

import { useMemo, useState } from "react";
import { Check, Search, X } from "lucide-react";

import { AUDIENCE_COPY } from "@/constants/audience";
import { cn } from "@/lib/utils";

export interface ChipOption {
  value: string;
  label: string;
  /** Secondary text (an email, a department). Also searchable. */
  hint?: string;
}

/**
 * Pick several items from a long list: selected ones show as removable chips, the rest are a
 * searchable checklist. Built for audiences (hundreds of people), so the list scrolls and filters.
 */
export function ChipMultiPicker({
  label,
  options,
  selected,
  onChange,
  error,
}: {
  label: string;
  options: ChipOption[];
  selected: string[];
  onChange: (next: string[]) => void;
  error?: string;
}) {
  const [query, setQuery] = useState("");
  const chosen = useMemo(() => new Set(selected), [selected]);
  const byValue = useMemo(() => new Map(options.map((option) => [option.value, option])), [options]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return options;
    return options.filter((option) => `${option.label} ${option.hint ?? ""}`.toLowerCase().includes(needle));
  }, [options, query]);

  const toggle = (value: string) =>
    onChange(chosen.has(value) ? selected.filter((v) => v !== value) : [...selected, value]);

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm font-medium text-wt-text">{label}</p>
        <p className="text-xs text-wt-text-muted">
          {selected.length} {AUDIENCE_COPY.selected}
        </p>
      </div>

      {selected.length > 0 ? (
        <ul className="flex max-h-24 flex-wrap gap-1.5 overflow-y-auto" aria-label={`${label} ${AUDIENCE_COPY.selected}`}>
          {selected.map((value) => (
            <li key={value}>
              <button
                type="button"
                onClick={() => toggle(value)}
                className="inline-flex items-center gap-1 rounded-full bg-wt-brand-soft px-2.5 py-1 text-xs font-medium text-[var(--wt-brand)] transition-colors hover:bg-[color-mix(in_srgb,var(--wt-brand)_20%,transparent)]"
                aria-label={`Remove ${byValue.get(value)?.label ?? value}`}
              >
                {byValue.get(value)?.label ?? value}
                <X className="size-3" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-wt-border bg-wt-surface-1">
        <div className="flex items-center gap-2 border-b border-wt-border px-3">
          <Search className="size-4 shrink-0 text-wt-text-faint" aria-hidden />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={AUDIENCE_COPY.searchPlaceholder}
            aria-label={`Search ${label}`}
            className="h-10 w-full bg-transparent text-sm text-wt-text outline-none placeholder:text-wt-text-faint"
          />
        </div>
        <ul className="max-h-48 overflow-y-auto py-1" role="listbox" aria-multiselectable aria-label={label}>
          {visible.length === 0 ? (
            <li className="px-3 py-3 text-sm text-wt-text-muted">{AUDIENCE_COPY.nothingFound}</li>
          ) : (
            visible.map((option) => {
              const on = chosen.has(option.value);
              return (
                <li key={option.value} role="option" aria-selected={on}>
                  <button
                    type="button"
                    onClick={() => toggle(option.value)}
                    className={cn(
                      "flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-wt-surface-2",
                      on && "bg-wt-brand-soft/60"
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "flex size-4 shrink-0 items-center justify-center rounded border",
                        on ? "border-[var(--wt-brand)] bg-[var(--wt-brand)] text-[var(--wt-brand-text)]" : "border-wt-border-md"
                      )}
                    >
                      {on ? <Check className="size-3" /> : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-wt-text">{option.label}</span>
                      {option.hint ? <span className="block truncate text-xs text-wt-text-muted">{option.hint}</span> : null}
                    </span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </div>
      {error ? <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p> : null}
    </div>
  );
}
