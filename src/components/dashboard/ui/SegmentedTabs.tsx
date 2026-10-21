"use client";

import { cn } from "@/lib/utils";

type SegmentedOption = { value: string; label: string };

/** Pill-style filter: a few mutually exclusive choices sitting in a gray track, the selected one raised. */
export function SegmentedTabs({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  options: readonly SegmentedOption[];
  label: string;
  className?: string;
}) {
  return (
    <div role="tablist" aria-label={label} className={cn("inline-flex shrink-0 rounded-xl bg-wt-surface-3 p-1", className)}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wt-brand)]",
            value === option.value ? "bg-wt-surface-1 text-wt-text shadow-[var(--wt-shadow-sm)]" : "text-wt-text-muted hover:text-wt-text"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
