"use client";

import { Check } from "lucide-react";

import { RSVP_OPTIONS } from "@/constants/events";
import { cn } from "@/lib/utils";
import type { RsvpChoice } from "@/types/event";

/** Going / Maybe / Can't go as a segmented control. The chosen one is filled; all disable when RSVPs are closed. */
export function RsvpButtons({
  value,
  disabled,
  busy,
  onChange,
  compact,
}: {
  value: RsvpChoice | null;
  disabled?: boolean;
  busy?: boolean;
  onChange: (next: RsvpChoice) => void;
  compact?: boolean;
}) {
  return (
    <div role="radiogroup" aria-label="Your RSVP" className="grid grid-cols-3 gap-1.5">
      {RSVP_OPTIONS.map((option) => {
        const on = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={on}
            disabled={disabled || busy}
            onClick={() => onChange(option.value)}
            className={cn(
              "inline-flex items-center justify-center gap-1 rounded-lg border font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
              compact ? "h-8 text-xs" : "h-9 text-sm",
              on
                ? option.value === "NOT_GOING"
                  ? "border-transparent bg-wt-surface-3 text-wt-text"
                  : "border-transparent bg-[var(--wt-brand)] text-[var(--wt-brand-text)]"
                : "border-wt-border bg-wt-surface-1 text-wt-text-muted hover:bg-wt-surface-2 hover:text-wt-text"
            )}
          >
            {on ? <Check className="size-3.5" aria-hidden /> : null}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
