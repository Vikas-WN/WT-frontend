"use client";

import { useState } from "react";

import { WtFormDialog } from "@/components/allocation/WtFormDialog";
import { AudiencePicker, isAudienceComplete } from "@/components/audience/AudiencePicker";
import { DatePickerField, InputField, SelectField, TextAreaField } from "@/components/dashboard/ui/forms";
import { AUDIENCE_COPY } from "@/constants/audience";
import { EVENT_COPY, EVENT_TYPE_OPTIONS } from "@/constants/events";
import { useAudienceOptions } from "@/hooks/announcements/useAnnouncements";
import { useCreateEvent } from "@/hooks/events/useEvents";
import { formatApiDate, formatApiDateTime, fromApiDate } from "@/utils/apiDate";
import { EMPTY_AUDIENCE, type AudienceSpec } from "@/types/audience";
import type { EventType } from "@/types/event";

function combine(dateApi: string, time: string): Date | null {
  if (!dateApi || !time) return null;
  const [hours, minutes] = time.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  const value = fromApiDate(dateApi);
  value.setHours(hours, minutes, 0, 0);
  return value;
}

/** Create an event: details, an optional capacity and RSVP deadline, and who's invited. */
export function EventComposerDialog({ onClose }: { onClose: () => void }) {
  const options = useAudienceOptions(true);
  const create = useCreateEvent();

  const [title, setTitle] = useState("");
  const [type, setType] = useState<EventType>("OTHER");
  const [date, setDate] = useState(formatApiDate(new Date()));
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [capacity, setCapacity] = useState("");
  const [deadline, setDeadline] = useState("");
  const [audience, setAudience] = useState<AudienceSpec | null>(null);

  const effective = audience ?? { ...EMPTY_AUDIENCE, scope: options.data?.scopes[0] ?? "ALL" };
  const startAt = combine(date, start);
  const endAt = combine(date, end);
  const capacityNumber = capacity.trim() === "" ? null : Number(capacity);
  const capacityOk = capacityNumber === null || (Number.isInteger(capacityNumber) && capacityNumber >= 1);
  const timesOk = Boolean(startAt && endAt && endAt > startAt);
  const canSubmit = title.trim().length >= 3 && timesOk && capacityOk && isAudienceComplete(effective);

  const submit = () => {
    if (!startAt || !endAt) return;
    const deadlineAt = deadline ? combine(deadline, "23:59") : null;
    create.mutate(
      {
        title: title.trim(),
        event_type: type,
        description: description.trim() || null,
        location: location.trim() || null,
        start_time: formatApiDateTime(startAt),
        end_time: formatApiDateTime(endAt),
        rsvp_deadline: deadlineAt ? formatApiDateTime(deadlineAt) : null,
        capacity: capacityNumber,
        audience: effective,
        notify_by_email: false,
      },
      { onSuccess: onClose }
    );
  };

  return (
    <WtFormDialog
      open
      title={EVENT_COPY.composerTitle}
      description={EVENT_COPY.composerDescription}
      onClose={onClose}
      onSubmit={submit}
      submitLabel="Create event"
      submittingLabel="Creating…"
      submitDisabled={!canSubmit}
      loading={create.isPending}
      maxWidthClass="max-w-2xl"
    >
      <div className="space-y-5">
        <InputField label="Event name" value={title} onChange={setTitle} required placeholder="e.g. Quarterly town hall" />
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="Type"
            value={type}
            options={EVENT_TYPE_OPTIONS.map(({ value, label, emoji }) => ({ value, label: `${emoji} ${label}` }))}
            onChange={(value) => setType(value as EventType)}
            clearSelectionOnEmptyInput={false}
          />
          <InputField label="Location" value={location} onChange={setLocation} placeholder="Room, address or link" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <DatePickerField label="Date" value={date} onChange={setDate} min={formatApiDate(new Date())} required />
          <InputField label="Starts" value={start} onChange={setStart} type="time" required />
          <InputField label="Ends" value={end} onChange={setEnd} type="time" required />
        </div>
        {start && end && !timesOk ? <p className="text-sm text-rose-600 dark:text-rose-400">End time must be after start time.</p> : null}
        <TextAreaField label="Details" value={description} onChange={setDescription} rows={3} placeholder="Agenda, what to bring…" />
        <div className="grid gap-4 sm:grid-cols-2">
          <InputField label="Limit spots (optional)" value={capacity} onChange={setCapacity} type="number" placeholder="No limit" />
          <DatePickerField label="RSVP by (optional)" value={deadline} onChange={setDeadline} min={formatApiDate(new Date())} />
        </div>
        {!capacityOk ? <p className="text-sm text-rose-600 dark:text-rose-400">Spots must be a whole number of 1 or more.</p> : null}

        {options.isLoading ? (
          <p className="text-sm text-wt-text-muted">{AUDIENCE_COPY.loading}</p>
        ) : options.data ? (
          <AudiencePicker options={options.data} value={effective} onChange={setAudience} />
        ) : (
          <p className="text-sm text-rose-600 dark:text-rose-400">{AUDIENCE_COPY.error}</p>
        )}
      </div>
    </WtFormDialog>
  );
}
