"use client";

import { useMemo, useState } from "react";
import { WtFormDialog } from "@/components/allocation/WtFormDialog";
import { RepeatFields } from "@/components/dashboard/meeting-rooms/RepeatFields";
import { DatePickerField, InputField, TextAreaField } from "@/components/dashboard/ui/forms";
import { useCreateMeetingRoomBooking, useUpdateMeetingRoomBooking } from "@/hooks/meeting-rooms/useMeetingRooms";
import { useRepeatForm } from "@/hooks/meeting-rooms/useRepeatForm";
import { formatApiDate, formatApiDateTime, fromApiDate } from "@/utils/apiDate";
import type { MeetingRoom, MeetingRoomBooking } from "@/types/meetingRoom";

function combineDateAndTime(dateApiValue: string, time: string): Date | null {
  if (!dateApiValue || !time) return null;
  const base = fromApiDate(dateApiValue);
  const [hours, minutes] = time.split(":").map((part) => Number(part));
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  const combined = new Date(base);
  combined.setHours(hours, minutes, 0, 0);
  return combined;
}

/** "dd/mm/yyyy HH:MM:SS" -> the date and "HH:MM" the form fields hold. */
function splitApiDateTime(value: string): { date: string; time: string } {
  const [date = "", time = ""] = value.trim().split(/\s+/);
  return { date, time: time.slice(0, 5) };
}

/** Books a room — or, given `booking`, edits one: same form, pre-filled, saved in place. */
export function BookRoomDialog({
  room,
  onClose,
  defaultDate,
  defaultStartTime,
  defaultEndTime,
  booking,
}: {
  room: MeetingRoom;
  onClose: () => void;
  /** dd/mm/yyyy — the day the user was viewing when they hit "Book". */
  defaultDate?: string;
  /** "HH:MM" — a suggested slot (the room's next free half hour) so a booking is one tap away. */
  defaultStartTime?: string;
  defaultEndTime?: string;
  /** Edit this existing booking instead of making a new one. */
  booking?: MeetingRoomBooking;
}) {
  const editing = booking != null;
  const initialStart = booking ? splitApiDateTime(booking.start_time) : null;
  const [date, setDate] = useState(initialStart?.date || defaultDate || formatApiDate(new Date()));
  const [startTime, setStartTime] = useState(initialStart?.time ?? defaultStartTime ?? "");
  const [endTime, setEndTime] = useState(booking ? splitApiDateTime(booking.end_time).time : (defaultEndTime ?? ""));
  const [title, setTitle] = useState(booking?.title ?? "");
  const [attendees, setAttendees] = useState(booking?.attendees ?? "");
  const [notes, setNotes] = useState(booking?.notes ?? "");
  const repeat = useRepeatForm(date);
  const createBooking = useCreateMeetingRoomBooking();
  const updateBooking = useUpdateMeetingRoomBooking();
  const saving = createBooking.isPending || updateBooking.isPending;

  const startDate = useMemo(() => combineDateAndTime(date, startTime), [date, startTime]);
  const endDate = useMemo(() => combineDateAndTime(date, endTime), [date, endTime]);

  const validationError = useMemo(() => {
    if (!title.trim()) return null; // required-field UI handles this; not a "wrong value" error
    if (startTime && endTime && startDate && endDate && endDate <= startDate) {
      return "End time must be after start time.";
    }
    return null;
  }, [title, startTime, endTime, startDate, endDate]);

  // Editing changes one day; only a new booking can repeat.
  const repeatOk = editing || repeat.valid;
  const canSubmit = Boolean(
    title.trim() && date && startTime && endTime && startDate && endDate && !validationError && repeatOk
  );
  const repeatCount = repeat.preview?.ok ? repeat.preview.dates.length : 0;
  const submitLabel = editing ? "Save changes" : repeatCount > 1 ? `Book ${repeatCount} days` : "Book room";

  const handleSubmit = () => {
    if (!canSubmit || !startDate || !endDate) return;
    if (booking) {
      // Attendees/notes are sent as null when emptied so they are actually cleared.
      updateBooking.mutate(
        {
          id: booking.id,
          payload: {
            title: title.trim(),
            start_time: formatApiDateTime(startDate),
            end_time: formatApiDateTime(endDate),
            attendees: attendees.trim() || null,
            notes: notes.trim() || null,
          },
        },
        { onSuccess: onClose }
      );
      return;
    }
    createBooking.mutate(
      {
        room_id: room.id,
        title: title.trim(),
        start_time: formatApiDateTime(startDate),
        end_time: formatApiDateTime(endDate),
        attendees: attendees.trim() || undefined,
        notes: notes.trim() || undefined,
        recurrence: repeat.recurrence,
      },
      { onSuccess: onClose }
    );
  };

  return (
    <WtFormDialog
      open
      title={editing ? `Edit booking · ${room.name}` : `Book ${room.name}`}
      description={room.location ?? undefined}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitLabel={submitLabel}
      submittingLabel={editing ? "Saving…" : "Booking…"}
      submitDisabled={!canSubmit}
      loading={saving}
    >
      <div className="space-y-5">
        <InputField label="Meeting title" value={title} onChange={setTitle} required placeholder="Sprint planning" />
        <div className="grid gap-4 sm:grid-cols-3">
          <DatePickerField
            label="Date"
            value={date}
            onChange={setDate}
            min={formatApiDate(new Date())}
            required
          />
          <InputField label="Start time" value={startTime} onChange={setStartTime} type="time" required />
          <InputField label="End time" value={endTime} onChange={setEndTime} type="time" required />
        </div>
        {validationError ? <p className="text-sm text-rose-600 dark:text-rose-400">{validationError}</p> : null}
        {!editing ? <RepeatFields form={repeat} minDate={date} /> : null}
        <InputField
          label="Attendees"
          value={attendees}
          onChange={setAttendees}
          placeholder="Optional — names or emails"
        />
        <TextAreaField label="Notes" value={notes} onChange={setNotes} rows={3} placeholder="Optional" />
      </div>
    </WtFormDialog>
  );
}
