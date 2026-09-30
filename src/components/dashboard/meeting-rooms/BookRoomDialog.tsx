"use client";

import { useMemo, useState } from "react";
import { WtFormDialog } from "@/components/allocation/WtFormDialog";
import { DatePickerField, InputField, TextAreaField } from "@/components/dashboard/ui/forms";
import { useCreateMeetingRoomBooking } from "@/hooks/meeting-rooms/useMeetingRooms";
import { formatApiDate, formatApiDateTime, fromApiDate } from "@/utils/apiDate";
import type { MeetingRoom } from "@/types/meetingRoom";

function combineDateAndTime(dateApiValue: string, time: string): Date | null {
  if (!dateApiValue || !time) return null;
  const base = fromApiDate(dateApiValue);
  const [hours, minutes] = time.split(":").map((part) => Number(part));
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  const combined = new Date(base);
  combined.setHours(hours, minutes, 0, 0);
  return combined;
}

export function BookRoomDialog({
  room,
  onClose,
  defaultDate,
}: {
  room: MeetingRoom;
  onClose: () => void;
  /** dd/mm/yyyy — the day the user was viewing when they hit "Book". */
  defaultDate?: string;
}) {
  const [date, setDate] = useState(defaultDate || formatApiDate(new Date()));
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [title, setTitle] = useState("");
  const [attendees, setAttendees] = useState("");
  const [notes, setNotes] = useState("");
  const createBooking = useCreateMeetingRoomBooking();

  const startDate = useMemo(() => combineDateAndTime(date, startTime), [date, startTime]);
  const endDate = useMemo(() => combineDateAndTime(date, endTime), [date, endTime]);

  const validationError = useMemo(() => {
    if (!title.trim()) return null; // required-field UI handles this; not a "wrong value" error
    if (startTime && endTime && startDate && endDate && endDate <= startDate) {
      return "End time must be after start time.";
    }
    return null;
  }, [title, startTime, endTime, startDate, endDate]);

  const canSubmit = Boolean(title.trim() && date && startTime && endTime && startDate && endDate && !validationError);

  const handleSubmit = () => {
    if (!canSubmit || !startDate || !endDate) return;
    createBooking.mutate(
      {
        room_id: room.id,
        title: title.trim(),
        start_time: formatApiDateTime(startDate),
        end_time: formatApiDateTime(endDate),
        attendees: attendees.trim() || undefined,
        notes: notes.trim() || undefined,
      },
      { onSuccess: onClose }
    );
  };

  return (
    <WtFormDialog
      open
      title={`Book ${room.name}`}
      description={room.location ?? undefined}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitLabel="Book room"
      submittingLabel="Booking…"
      submitDisabled={!canSubmit}
      loading={createBooking.isPending}
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
