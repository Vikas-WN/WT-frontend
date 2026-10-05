"use client";

import { DatePickerField, InputField, SelectField } from "@/components/dashboard/ui/forms";
import {
  MEETING_ROOM_REPEAT_COPY,
  MEETING_ROOM_REPEAT_OPTIONS,
  MEETING_ROOM_WEEKDAY_LABELS,
} from "@/constants/meetingRooms";
import type { RepeatChoice, RepeatForm } from "@/hooks/meeting-rooms/useRepeatForm";
import { cn } from "@/lib/utils";

const COPY = MEETING_ROOM_REPEAT_COPY;

const dayFormat = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short" });

function Summary({ form }: { form: RepeatForm }) {
  if (form.error) return <p className="text-sm text-rose-600 dark:text-rose-400">{form.error}</p>;
  if (!form.preview?.ok) return null;
  const { dates } = form.preview;
  const first = dayFormat.format(dates[0]);
  const last = dayFormat.format(dates[dates.length - 1]);
  return (
    <div className="rounded-lg bg-wt-surface-2 px-3 py-2 text-sm text-wt-text">
      <p className="font-medium">
        {dates.length} {dates.length === 1 ? "booking" : "bookings"}
        {dates.length > 1 ? ` · ${first} → ${last}` : ` · ${first}`}
      </p>
      <p className="mt-0.5 text-xs text-wt-text-muted">{COPY.clashNote}</p>
    </div>
  );
}

function WeekdayPicker({ form }: { form: RepeatForm }) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-wt-text">{COPY.weekdaysLabel}</p>
      <div className="flex flex-wrap gap-1.5">
        {MEETING_ROOM_WEEKDAY_LABELS.map((label, day) => {
          const on = form.weekdays.includes(day);
          return (
            <button
              key={label}
              type="button"
              aria-pressed={on}
              onClick={() => form.toggleWeekday(day)}
              className={cn(
                "h-9 min-w-11 rounded-lg border px-2.5 text-sm font-medium transition-colors",
                on
                  ? "border-[var(--wt-brand)] bg-[var(--wt-brand)] text-[var(--wt-brand-text)]"
                  : "border-wt-border bg-wt-surface-1 text-wt-text-muted hover:bg-wt-surface-2"
              )}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function EndsPicker({ form, minDate }: { form: RepeatForm; minDate: string }) {
  return (
    <div className="space-y-3">
      <div role="radiogroup" aria-label={COPY.endsLabel} className="flex flex-wrap gap-2">
        {([["count", COPY.endsAfterCount], ["date", COPY.endsOnDate]] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={form.ends === value}
            onClick={() => form.setEnds(value)}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-sm transition-colors",
              form.ends === value
                ? "border-[var(--wt-brand)] bg-wt-brand-soft font-medium text-wt-text"
                : "border-wt-border text-wt-text-muted hover:bg-wt-surface-2"
            )}
          >
            {label}
          </button>
        ))}
      </div>
      {form.ends === "count" ? (
        <InputField
          label={COPY.countLabel}
          value={form.count}
          onChange={form.setCount}
          type="number"
        />
      ) : (
        <DatePickerField label={COPY.untilLabel} value={form.until} onChange={form.setUntil} min={minDate} />
      )}
    </div>
  );
}

/** The "Repeat" section of the booking form: pattern, weekdays, when it ends, and a live summary. */
export function RepeatFields({ form, minDate }: { form: RepeatForm; minDate: string }) {
  return (
    <div className="space-y-4 rounded-xl border border-wt-border p-4">
      <SelectField
        label={COPY.repeatLabel}
        value={form.choice}
        options={[...MEETING_ROOM_REPEAT_OPTIONS]}
        onChange={(value) => form.changeChoice(value as RepeatChoice)}
        clearSelectionOnEmptyInput={false}
      />
      {form.repeating ? (
        <>
          {form.choice === "WEEKLY" ? <WeekdayPicker form={form} /> : null}
          <EndsPicker form={form} minDate={minDate} />
          <Summary form={form} />
        </>
      ) : null}
    </div>
  );
}
