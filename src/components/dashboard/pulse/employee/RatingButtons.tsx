"use client";

import type { KeyboardEvent } from "react";

import { PULSE_RATING_LEVELS, pulseRatingLabel } from "@/constants/pulseRatings";
import { cn } from "@/lib/utils";

const FIRST = PULSE_RATING_LEVELS[0].value;
const LAST = PULSE_RATING_LEVELS[PULSE_RATING_LEVELS.length - 1].value;

/** One colour per level, climbing from rose to emerald, so a column of ratings reads at a glance. */
const LEVEL_TONE: Record<number, { bar: string; selected: string; hover: string }> = {
  1: { bar: "bg-rose-500", selected: "border-rose-500 bg-rose-500/12 text-rose-800 dark:text-rose-200", hover: "hover:border-rose-500/50" },
  2: { bar: "bg-orange-500", selected: "border-orange-500 bg-orange-500/12 text-orange-800 dark:text-orange-200", hover: "hover:border-orange-500/50" },
  3: { bar: "bg-amber-500", selected: "border-amber-500 bg-amber-500/12 text-amber-800 dark:text-amber-200", hover: "hover:border-amber-500/50" },
  4: { bar: "bg-lime-500", selected: "border-lime-600 bg-lime-500/12 text-lime-800 dark:text-lime-200", hover: "hover:border-lime-500/50" },
  5: { bar: "bg-emerald-500", selected: "border-emerald-500 bg-emerald-500/12 text-emerald-800 dark:text-emerald-200", hover: "hover:border-emerald-500/50" },
};

/** The five rating levels as one connected scale, named rather than numbered. Click a segment, or focus the group
 *  and press 1–5 / the arrow keys. */
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
    <div className="w-full">
      <div
        className="grid grid-cols-5 gap-1.5 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-[var(--wt-brand)]/40"
        role="radiogroup"
        aria-label={label ?? "Rating"}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={onKeyDown}
      >
        {PULSE_RATING_LEVELS.map((level) => {
          const tone = LEVEL_TONE[level.value];
          const selected = value === level.value;
          return (
            <button
              key={level.value}
              type="button"
              role="radio"
              tabIndex={-1}
              aria-checked={selected}
              aria-label={level.label}
              title={level.label}
              disabled={disabled}
              onClick={() => onChange(level.value)}
              className={cn(
                "group/level flex min-h-[3.25rem] min-w-0 flex-col items-stretch justify-between gap-2 rounded-xl border bg-wt-surface-1 px-1 pb-2 pt-2.5 text-center transition-[border-color,background-color,transform,box-shadow] duration-150 active:scale-[0.97] motion-reduce:transition-none",
                selected
                  ? cn(tone.selected, "shadow-[var(--wt-shadow-sm)]")
                  : cn("border-wt-border text-wt-text-muted hover:bg-wt-surface-2", tone.hover),
                disabled && "cursor-not-allowed opacity-60"
              )}
            >
              <span
                aria-hidden
                className={cn("mx-auto h-1.5 w-full max-w-10 rounded-full transition-all", tone.bar, selected ? "opacity-100" : "opacity-35 group-hover/level:opacity-70")}
              />
              <span className="text-[11px] font-medium leading-tight">{level.short}</span>
            </button>
          );
        })}
      </div>
      <p className={cn("mt-1.5 text-xs font-medium", value ? "text-wt-text" : "text-wt-text-faint")} aria-hidden>
        {value ? pulseRatingLabel(value) : "Choose a level"}
      </p>
    </div>
  );
}
