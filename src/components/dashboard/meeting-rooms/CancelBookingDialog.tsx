"use client";

import { useState } from "react";
import { Repeat } from "lucide-react";

import { WtFormDialog } from "@/components/allocation/WtFormDialog";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { MEETING_ROOM_REPEAT_COPY } from "@/constants/meetingRooms";
import { cn } from "@/lib/utils";
import type { MeetingRoomBooking, MeetingRoomCancelScope } from "@/types/meetingRoom";

const COPY = MEETING_ROOM_REPEAT_COPY;

const SCOPE_OPTIONS: ReadonlyArray<{ value: MeetingRoomCancelScope; label: string; hint?: string }> = [
  { value: "this", label: COPY.cancelThis },
  { value: "upcoming", label: COPY.cancelUpcoming, hint: COPY.cancelUpcomingHint },
];

function ScopeChoice({
  scope,
  onChange,
}: {
  scope: MeetingRoomCancelScope;
  onChange: (scope: MeetingRoomCancelScope) => void;
}) {
  return (
    <div role="radiogroup" aria-label={COPY.cancelTitle} className="space-y-2">
      {SCOPE_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={scope === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition-colors",
            scope === option.value
              ? "border-[var(--wt-brand)] bg-wt-brand-soft"
              : "border-wt-border hover:bg-wt-surface-2"
          )}
        >
          <span
            aria-hidden
            className={cn(
              "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border",
              scope === option.value ? "border-[var(--wt-brand)]" : "border-wt-border-md"
            )}
          >
            {scope === option.value ? <span className="size-2 rounded-full bg-[var(--wt-brand)]" /> : null}
          </span>
          <span>
            <span className="block text-sm font-medium text-wt-text">{option.label}</span>
            {option.hint ? <span className="block text-xs text-wt-text-muted">{option.hint}</span> : null}
          </span>
        </button>
      ))}
    </div>
  );
}

/**
 * Cancel a booking. A single booking gets the usual confirm; a day of a repeating series asks
 * whether to cancel just that day or it and every later day.
 */
export function CancelBookingDialog({
  booking,
  loading,
  onClose,
  onConfirm,
}: {
  booking: MeetingRoomBooking | null;
  loading: boolean;
  onClose: () => void;
  onConfirm: (scope: MeetingRoomCancelScope) => void;
}) {
  // Local choice inside the dialog; resets each time a different booking is opened.
  const [scope, setScope] = useState<MeetingRoomCancelScope>("this");
  if (!booking) return null;

  if (booking.series_id) {
    return (
      <WtFormDialog
        key={booking.id}
        open
        title={COPY.cancelTitle}
        description={`${booking.title} · ${booking.room_name}`}
        onClose={onClose}
        onSubmit={() => onConfirm(scope)}
        submitLabel="Cancel booking"
        submittingLabel="Cancelling…"
        loading={loading}
        maxWidthClass="max-w-md"
      >
        <p className="mb-3 flex items-center gap-1.5 text-xs text-wt-text-muted">
          <Repeat className="size-3.5" aria-hidden /> {COPY.repeatBadge}
        </p>
        <ScopeChoice scope={scope} onChange={setScope} />
      </WtFormDialog>
    );
  }

  return (
    <ConfirmDialog
      open
      title="Cancel this booking?"
      description={`${booking.title} · ${booking.room_name}`}
      confirmLabel="Cancel booking"
      cancelLabel={COPY.keepIt}
      tone="danger"
      loading={loading}
      onCancel={onClose}
      onConfirm={() => onConfirm("this")}
    />
  );
}
