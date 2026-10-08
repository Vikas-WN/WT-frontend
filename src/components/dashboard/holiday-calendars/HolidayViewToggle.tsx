"use client";

import { CalendarDays, Table2 } from "lucide-react";

import { HOLIDAY_VIEW_COPY, type HolidayViewMode } from "@/constants/holidayCalendarView";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { mode: "table", Icon: Table2, label: HOLIDAY_VIEW_COPY.table },
  { mode: "calendar", Icon: CalendarDays, label: HOLIDAY_VIEW_COPY.calendar },
] as const;

/** Table / Calendar switch shared by the HR and employee holiday pages. */
export function HolidayViewToggle({ value, onChange }: { value: HolidayViewMode; onChange: (mode: HolidayViewMode) => void }) {
  return (
    <div className="inline-flex h-10 items-center rounded-xl border border-wt-border bg-wt-surface-1 p-0.5" role="group" aria-label={HOLIDAY_VIEW_COPY.viewLabel}>
      {OPTIONS.map(({ mode, Icon, label }) => (
        <button
          key={mode}
          type="button"
          aria-pressed={value === mode}
          onClick={() => onChange(mode)}
          className={cn(
            "inline-flex h-full items-center gap-1.5 rounded-[10px] px-3 text-sm font-medium transition-colors",
            value === mode ? "bg-[var(--wt-brand-soft)] text-[var(--wt-brand)]" : "text-wt-text-muted hover:text-wt-text"
          )}
        >
          <Icon className="size-4" aria-hidden />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}
