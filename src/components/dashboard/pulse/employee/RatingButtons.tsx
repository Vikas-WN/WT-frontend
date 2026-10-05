"use client";

import type { KeyboardEvent } from "react";

import { PULSE_RATING_LEVELS } from "@/constants/pulseRatings";
import { cn } from "@/lib/utils";

const FIRST = PULSE_RATING_LEVELS[0].value;
const LAST = PULSE_RATING_LEVELS[PULSE_RATING_LEVELS.length - 1].value;

/** Colour climbs with the level so a row reads at a glance. */
const SELECTED_CLASS: Record<number, string> = {
  1: "border-rose-500 bg-rose-500 text-white",
  2: "border-orange-500 bg-orange-500 text-white",
  3: "border-amber-500 bg-amber-500 text-white",
  4: "border-lime-600 bg-lime-600 text-white",
  5: "border-emerald-600 bg-emerald-600 text-white",
};

/** The five rating levels, named rather than numbered. Click one, or focus the
 *  group and press 1–5 / the arrow keys. */
export function RatingButtons({
  value,
  onChange,
  disabled = false,
  label,
}: {
  value: number | null;
  onChange: (rating: number) => void;
  disabled?: boolean;
  /** Accessible name of the group, e.g. the KPI being rated. */
  label?: string;
}) {
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    const digit = Number(event.key);
    if (digit >= FIRST && digit <= LAST) {
      event.preventDefault();
      onChange(digit);
      return;
    }
    const step = event.key === "ArrowRight" || event.key === "ArrowUp" ? 1 : event.key === "ArrowLeft" || event.key === "ArrowDown" ? -1 : 0;
    if (step === 0) return;
    event.preventDefault();
    onChange(Math.min(LAST, Math.max(FIRST, (value ?? (step > 0 ? FIRST - 1 : LAST + 1)) + step)));
  };

  return (
    <div
      className="flex flex-wrap gap-1.5"
      role="radiogroup"
      aria-label={label ?? "Rating"}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={onKeyDown}
    >
      {PULSE_RATING_LEVELS.map((level) => (
        <button
          key={level.value}
          type="button"
          role="radio"
          tabIndex={-1}
          aria-checked={value === level.value}
          disabled={disabled}
          onClick={() => onChange(level.value)}
          className={cn(
            "rounded-lg border px-2.5 py-1.5 text-xs font-medium leading-tight transition-colors",
            value === level.value
              ? cn(SELECTED_CLASS[level.value], "shadow-sm")
              : "border-wt-border bg-wt-surface-1 text-wt-text-muted hover:border-[var(--wt-brand)]/50 hover:bg-wt-surface-2 hover:text-wt-text",
            disabled && "cursor-not-allowed opacity-60"
          )}
        >
          {level.label}
        </button>
      ))}
    </div>
  );
}
