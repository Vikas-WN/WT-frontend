"use client";

import { PULSE_RATING_LEVELS } from "@/constants/pulseRatings";
import { cn } from "@/lib/utils";

/** The five rating levels, named rather than numbered. */
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
    <div className="flex flex-wrap gap-1.5" role="radiogroup">
      {PULSE_RATING_LEVELS.map((level) => (
        <button
          key={level.value}
          type="button"
          role="radio"
          aria-checked={value === level.value}
          disabled={disabled}
          onClick={() => onChange(level.value)}
          className={cn(
            "rounded-lg border px-2.5 py-1.5 text-xs font-medium leading-tight transition-colors",
            value === level.value
              ? "border-wt-brand bg-wt-brand text-white"
              : "border-wt-border bg-wt-surface-1 text-wt-text-muted hover:border-wt-brand/50 hover:text-wt-text",
            disabled && "cursor-not-allowed opacity-60"
          )}
        >
          {level.label}
        </button>
      ))}
    </div>
  );
}
