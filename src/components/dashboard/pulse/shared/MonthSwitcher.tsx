"use client";

import { useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverPortal, PopoverPositioner, PopoverTrigger } from "@/components/ui/popover";
import { PULSE_MONTHS_BACK } from "@/constants/pulse";
import { cn } from "@/lib/utils";
import { compareMonths, currentMonthKey, formatMonthLabel, recentMonths, shiftMonth } from "@/utils/pulseMonth";

/** Pulse is month-wise — this is its one month picker: step ‹ ›, jump to
 *  this month, or pick any of the last year. `marks` puts a dot on months
 *  that have something in them. */
export function MonthSwitcher({
  value,
  onChange,
  marks,
  maxMonth = shiftMonth(currentMonthKey(), 1),
}: {
  value: string;
  onChange: (month: string) => void;
  /** Months worth a dot (e.g. have a submission, or a pending review). */
  marks?: ReadonlySet<string>;
  /** Latest month that can be picked (default: next month, for scheduling). */
  maxMonth?: string;
}) {
  const [open, setOpen] = useState(false);
  const thisMonth = currentMonthKey();
  const months = recentMonths(PULSE_MONTHS_BACK + 1, maxMonth);
  const oldest = months[months.length - 1];
  const canPrev = compareMonths(value, oldest) > 0;
  const canNext = compareMonths(value, maxMonth) < 0;

  return (
    <div className="flex items-center gap-2">
      <div className="inline-flex items-center rounded-xl border border-wt-border bg-wt-surface-1 p-1 shadow-[var(--wt-shadow-sm)]">
        <button
          type="button"
          aria-label="Previous month"
          disabled={!canPrev}
          onClick={() => onChange(shiftMonth(value, -1))}
          className="flex size-8 items-center justify-center rounded-lg text-wt-text-muted transition-colors hover:bg-wt-surface-2 hover:text-wt-text disabled:pointer-events-none disabled:opacity-35"
        >
          <ChevronLeft className="size-4" />
        </button>

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            aria-label="Choose month"
            className="inline-flex h-8 min-w-44 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold text-wt-text transition-colors hover:bg-wt-surface-2"
          >
            <CalendarDays className="size-4 text-[var(--wt-brand)]" aria-hidden />
            {formatMonthLabel(value)}
          </PopoverTrigger>
          <PopoverPortal>
            <PopoverPositioner sideOffset={8}>
              <PopoverContent className="w-72 p-3">
                <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-wt-text-faint">Jump to a month</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {months.map((month) => (
                    <button
                      key={month}
                      type="button"
                      onClick={() => {
                        onChange(month);
                        setOpen(false);
                      }}
                      className={cn(
                        "relative rounded-xl px-2 py-2.5 text-center text-xs font-medium transition-colors",
                        month === value ? "bg-[var(--wt-brand)] text-[var(--wt-brand-text)]" : "text-wt-text hover:bg-wt-surface-2"
                      )}
                    >
                      {formatMonthLabel(month, "short")}
                      {month === thisMonth ? <span className="block text-[9px] opacity-70">this month</span> : null}
                      {marks?.has(month) ? (
                        <span aria-hidden className={cn("absolute right-1.5 top-1.5 size-1.5 rounded-full", month === value ? "bg-white" : "bg-[var(--wt-brand)]")} />
                      ) : null}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </PopoverPositioner>
          </PopoverPortal>
        </Popover>

        <button
          type="button"
          aria-label="Next month"
          disabled={!canNext}
          onClick={() => onChange(shiftMonth(value, 1))}
          className="flex size-8 items-center justify-center rounded-lg text-wt-text-muted transition-colors hover:bg-wt-surface-2 hover:text-wt-text disabled:pointer-events-none disabled:opacity-35"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
      {value !== thisMonth ? (
        <Button type="button" variant="ghost" size="sm" onClick={() => onChange(thisMonth)}>
          This month
        </Button>
      ) : null}
    </div>
  );
}
