"use client";

import { DayPicker, useDayPicker, type DayPickerProps } from "react-day-picker";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type CalendarProps = DayPickerProps & {
  /** Tighter cell / padding sizing — for popovers where vertical space is scarce. */
  compact?: boolean;
};

const BTN =
  "h-8 w-8 rounded-md flex items-center justify-center transition-colors hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed";
const BTN_COMPACT =
  "h-7 w-7 rounded-md flex items-center justify-center transition-colors hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed";

function CalendarNav({
  onPreviousClick,
  onNextClick,
  previousMonth,
  nextMonth,
  className,
  compact = false,
  ...rest
}: React.HTMLAttributes<HTMLElement> & {
  onPreviousClick?: React.MouseEventHandler<HTMLButtonElement>;
  onNextClick?: React.MouseEventHandler<HTMLButtonElement>;
  previousMonth?: Date;
  nextMonth?: Date;
  compact?: boolean;
}) {
  const { months, formatters } = useDayPicker();
  const firstMonth = months?.[0];

  const title = firstMonth?.date
    ? formatters.formatCaption(firstMonth.date)
    : "";
  const btn = compact ? BTN_COMPACT : BTN;

  return (
    <nav
      className={cn(
        "flex items-center justify-between w-full",
        compact ? "py-1 mb-1" : "py-2.5 mb-2",
        className
      )}
      {...rest}
    >
      <button
        type="button"
        className={btn}
        disabled={!previousMonth}
        onClick={onPreviousClick}
        aria-label="Previous month"
      >
        <ChevronLeft size={16} />
      </button>
      <span className="text-sm font-semibold tracking-tight text-foreground select-none">
        {title}
      </span>
      <button
        type="button"
        className={btn}
        disabled={!nextMonth}
        onClick={onNextClick}
        aria-label="Next month"
      >
        <ChevronRight size={16} />
      </button>
    </nav>
  );
}

function CalendarMonthCaption({
  children,
  calendarMonth: _calendarMonth,
  displayIndex: _displayIndex,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & {
  calendarMonth?: unknown;
  displayIndex?: number;
}) {
  return (
    <div {...rest} className="sr-only" aria-hidden>
      {children}
    </div>
  );
}

const DAY_CELL = "h-8 w-8 p-0 text-center text-sm relative";
const DAY_CELL_COMPACT = "h-7 w-8 p-0 text-center text-sm relative";
const DAY_BUTTON =
  "rdp-day_button mx-auto h-8 w-8 p-0 font-normal rounded-md bg-transparent text-inherit hover:bg-muted/80 hover:text-foreground transition-colors cursor-pointer disabled:cursor-not-allowed aria-[disabled=true]:cursor-not-allowed flex items-center justify-center";
const DAY_BUTTON_COMPACT =
  "rdp-day_button mx-auto h-7 w-8 p-0 font-normal rounded-md bg-transparent text-inherit hover:bg-muted/80 hover:text-foreground transition-colors cursor-pointer disabled:cursor-not-allowed aria-[disabled=true]:cursor-not-allowed flex items-center justify-center";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  fixedWeeks = true,
  components,
  compact = false,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      fixedWeeks={fixedWeeks}
      components={{
        Nav: (navProps) => <CalendarNav {...navProps} compact={compact} />,
        MonthCaption: CalendarMonthCaption,
        ...components,
      }}
      classNames={{
        root: cn(
          "w-full max-w-[340px] mx-auto bg-transparent",
          compact ? "p-2" : "p-3",
          className
        ),
        months: cn("flex flex-col items-stretch", compact ? "gap-1" : "gap-1.5"),
        month: cn("flex flex-col", compact ? "gap-1" : "gap-1.5"),
        month_caption:
          "flex justify-center relative items-center h-7",
        caption_label: "text-sm font-semibold tracking-tight text-foreground",
        nav: "flex items-center gap-1",
        button_previous: compact ? BTN_COMPACT : BTN,
        button_next: compact ? BTN_COMPACT : BTN,
        chevron: "size-4",
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: cn(
          "w-8 text-[10px] font-medium uppercase tracking-widest text-muted-foreground/60 text-center",
          compact ? "h-5" : "h-6"
        ),
        week: cn("flex", compact ? "mt-0" : "mt-0.5"),
        day: compact ? DAY_CELL_COMPACT : DAY_CELL,
        day_button: compact ? DAY_BUTTON_COMPACT : DAY_BUTTON,
        outside:
          "text-muted-foreground/30 opacity-50 pointer-events-none [&_.rdp-day_button]:pointer-events-none",
        disabled:
          "text-muted-foreground/40 [&_.rdp-day_button]:text-muted-foreground/40",
        hidden: "invisible",
        today:
          "border border-border text-foreground font-medium rounded-md",
        selected:
          "bg-black dark:bg-white text-white dark:text-black font-medium rounded-md [&_.rdp-day_button]:bg-transparent",
        range_start:
          "bg-black dark:bg-white text-white dark:text-black rounded-l-md font-medium [&_.rdp-day_button]:bg-transparent",
        range_end:
          "bg-black dark:bg-white text-white dark:text-black rounded-r-md font-medium [&_.rdp-day_button]:bg-transparent",
        range_middle:
          "bg-muted/60 text-foreground rounded-none [&_.rdp-day_button]:bg-transparent",
        ...classNames,
      }}
      {...props}
    />
  );
}

export { Calendar };
