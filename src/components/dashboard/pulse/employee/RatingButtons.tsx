"use client";

import { cn } from "@/lib/utils";

export function RatingButtons({
  value,
  onChange,
  disabled = false,
}: {
  value: number | null;
  onChange: (rating: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex gap-1.5" role="radiogroup">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          disabled={disabled}
          onClick={() => onChange(n)}
          className={cn(
            "flex size-8 items-center justify-center rounded-lg border text-sm font-semibold transition-colors",
            value === n
              ? "border-wt-brand bg-wt-brand text-white"
              : "border-wt-border bg-wt-surface-1 text-wt-text-muted hover:border-wt-brand/50 hover:text-wt-text",
            disabled && "cursor-not-allowed opacity-60"
          )}
        >
          {n}
        </button>
      ))}
    </div>
  );
}
