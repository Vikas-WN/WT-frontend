"use client";

import { useId, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export type CheckListItem = { value: string; label: string; hint?: string };

/**
 * A searchable list of checkboxes for picking several things. Nothing selected means "all" — the caller decides how
 * to word that, so the list stays honest about what an empty selection does.
 */
export function MultiCheckList({
  legend,
  items,
  selected,
  onChange,
  allLabel,
  searchLabel,
  emptyLabel,
  className,
}: {
  legend: string;
  items: CheckListItem[];
  selected: ReadonlySet<string>;
  onChange: (next: Set<string>) => void;
  allLabel: string;
  searchLabel: string;
  emptyLabel: string;
  className?: string;
}) {
  const [query, setQuery] = useState("");
  const searchId = useId();
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? items.filter((i) => `${i.label} ${i.hint ?? ""}`.toLowerCase().includes(q)) : items;
  }, [items, query]);

  const toggle = (value: string) => {
    const next = new Set(selected);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    onChange(next);
  };

  return (
    <fieldset className={cn("min-w-0 space-y-2", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <legend className="text-sm font-medium text-wt-text">{legend}</legend>
        <span className="text-xs text-wt-text-muted" aria-live="polite">
          {selected.size ? `${selected.size} selected` : allLabel}
          {selected.size ? (
            <button type="button" onClick={() => onChange(new Set())} className="ml-2 font-medium text-[var(--wt-brand)] hover:underline">
              Clear
            </button>
          ) : null}
        </span>
      </div>
      <div className="rounded-xl border border-wt-border bg-wt-surface-1">
        {items.length > 6 ? (
          <label className="relative block border-b border-wt-border" htmlFor={searchId}>
            <span className="sr-only">{searchLabel}</span>
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-wt-text-muted" aria-hidden />
            <input
              id={searchId}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchLabel}
              className="h-9 w-full bg-transparent pr-3 pl-9 text-sm outline-none"
            />
          </label>
        ) : null}
        <ul className="max-h-44 divide-y divide-wt-border overflow-y-auto">
          {shown.length === 0 ? (
            <li className="px-3 py-3 text-sm text-wt-text-muted">{emptyLabel}</li>
          ) : (
            shown.map((item) => (
              <li key={item.value}>
                <label className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-wt-surface-2">
                  <Checkbox checked={selected.has(item.value)} onCheckedChange={() => toggle(item.value)} />
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {item.hint ? <span className="shrink-0 text-xs text-wt-text-muted">{item.hint}</span> : null}
                </label>
              </li>
            ))
          )}
        </ul>
      </div>
    </fieldset>
  );
}
