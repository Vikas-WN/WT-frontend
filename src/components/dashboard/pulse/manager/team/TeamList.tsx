"use client";

import { useState } from "react";
import { Search } from "lucide-react";

import { cn } from "@/lib/utils";
import type { MonthlySubmissionItem } from "@/types/kpi";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "?") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

/** The month's team submissions waiting on me, searchable, one tap to open. */
export function TeamList({
  rows,
  selectedId,
  onSelect,
}: {
  rows: MonthlySubmissionItem[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const shown = q
    ? rows.filter((r) => `${r.employee.name} ${r.employee.emp_id ?? ""} ${r.employee.email}`.toLowerCase().includes(q))
    : rows;

  return (
    <aside className="flex min-h-0 flex-col gap-3 rounded-2xl border border-wt-border bg-wt-surface-1 p-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-wt-text-faint" aria-hidden />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search your team"
          aria-label="Search your team"
          className="h-9 w-full rounded-lg border border-wt-border bg-wt-surface-2/50 pl-9 pr-3 text-sm text-wt-text placeholder:text-wt-text-faint focus:outline-none focus:ring-2 focus:ring-[var(--wt-brand)]/40"
        />
      </div>
      <ul className="max-h-[60vh] space-y-1.5 overflow-y-auto pr-0.5">
        {shown.length === 0 ? <li className="px-2 py-6 text-center text-sm text-wt-text-muted">No one matches.</li> : null}
        {shown.map((row) => {
          const active = row.id === selectedId;
          return (
            <li key={row.id}>
              <button
                type="button"
                onClick={() => onSelect(row.id)}
                aria-current={active ? "true" : undefined}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors",
                  active ? "border-[var(--wt-brand)] bg-[var(--wt-brand-soft)]" : "border-transparent hover:bg-wt-surface-2"
                )}
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-wt-surface-3 text-xs font-semibold text-wt-text-muted" aria-hidden>
                  {initials(row.employee.name)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-wt-text">{row.employee.name}</span>
                  <span className="block truncate text-xs text-wt-text-muted">{row.employee.emp_id ?? row.employee.email}</span>
                </span>
                {row.review_status === "NEEDS_MANAGER_REVIEW" ? (
                  <span className="shrink-0 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400">Rejected by HR</span>
                ) : row.manager_draft?.updated_by ? (
                  <span className="shrink-0 rounded-full bg-[var(--wt-brand-soft)] px-2 py-0.5 text-[10px] font-semibold text-[var(--wt-brand)]">In progress</span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
