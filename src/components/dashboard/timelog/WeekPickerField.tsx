"use client";

import { Button } from "@/components/ui/button";
import { useRef } from "react";
import { formatApiDate, normalizeWeekStart, weekRangeLabel } from "@/utils/timelog/weekDates";
import { X } from "lucide-react";

type WeekPickerFieldProps = {
  weekStart: Date | null;
  onWeekStartChange: (weekStart: Date | null) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
};

function CalendarIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 shrink-0"
      aria-hidden
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

export function WeekPickerField({
  weekStart,
  onWeekStartChange,
  disabled = false,
  className,
  placeholder = "Select Week",
}: WeekPickerFieldProps) {
  const pickerRef = useRef<HTMLInputElement>(null);
  const normalized = weekStart ? normalizeWeekStart(weekStart) : null;

  function openPicker() {
    if (disabled) return;
    try {
      pickerRef.current?.showPicker?.();
    } catch {
      pickerRef.current?.focus();
    }
  }

  function handleDateChange(isoValue: string) {
    if (!isoValue) {
      onWeekStartChange(null);
      return;
    }
    const [y, m, d] = isoValue.split("-").map(Number);
    onWeekStartChange(normalizeWeekStart(new Date(y, m - 1, d)));
  }

  return (
    <div className={`flex items-center gap-1.5 ${className ?? ""}`.trim()}>
      <Button
        variant="outline"
        size="sm"
        type="button"
        disabled={disabled}
        aria-label="Select week"
        className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-wt-border rounded-lg hover:bg-wt-surface-2 disabled:opacity-50"
        onClick={openPicker}
      >
        <CalendarIcon />
        <span className="whitespace-nowrap">
          {normalized ? weekRangeLabel(normalized) : placeholder}
        </span>
      </Button>
      {normalized ? (
        <Button
          variant="ghost"
          size="icon"
          type="button"
          disabled={disabled}
          aria-label="Clear week filter"
          className="h-8 w-8 text-wt-text-muted"
          onClick={() => onWeekStartChange(null)}
        >
          <X className="size-4" />
        </Button>
      ) : null}
      <input
        ref={pickerRef}
        type="date"
        tabIndex={-1}
        aria-hidden
        className="sr-only"
        disabled={disabled}
        value={normalized ? formatApiDate(normalized) : ""}
        onChange={(e) => handleDateChange(e.target.value)}
      />
    </div>
  );
}
