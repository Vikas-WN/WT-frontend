export interface MeetingRoom {
  id: number;
  name: string;
  location: string | null;
  capacity: number | null;
  amenities: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MeetingRoomCreatePayload {
  name: string;
  location?: string | null;
  capacity?: number | null;
  amenities?: string | null;
}

export interface MeetingRoomUpdatePayload {
  name?: string;
  location?: string | null;
  capacity?: number | null;
  amenities?: string | null;
  is_active?: boolean;
}

export interface MeetingRoomBookedBy {
  emp_id: string | null;
  name: string;
  email: string;
}

export type MeetingRoomBookingStatus = "CONFIRMED" | "CANCELLED";

export interface MeetingRoomBooking {
  id: number;
  room_id: number;
  room_name: string;
  title: string;
  /** dd/mm/yyyy HH:MM:SS — see src/utils/apiDate.ts. */
  start_time: string;
  end_time: string;
  attendees: string | null;
  notes: string | null;
  status: MeetingRoomBookingStatus;
  /** Shared by every booking made by one repeat rule; null for a single booking. */
  series_id: string | null;
  booked_by: MeetingRoomBookedBy;
  cancelled_at: string | null;
  cancelled_by_email: string | null;
  created_at: string;
}

export type MeetingRoomRepeatFrequency = "DAILY" | "WEEKDAYS" | "WEEKLY";

/** Repeat a booking on several days. Give `until` OR `count`, never both. */
export interface MeetingRoomRecurrence {
  frequency: MeetingRoomRepeatFrequency;
  /** WEEKLY only — 0 = Monday … 6 = Sunday. */
  weekdays?: number[];
  /** Last day, dd/mm/yyyy, inclusive. */
  until?: string;
  count?: number;
}

export interface MeetingRoomBookingCreatePayload {
  room_id: number;
  title: string;
  /** dd/mm/yyyy HH:MM:SS — with `recurrence`, the FIRST day's slot. */
  start_time: string;
  end_time: string;
  attendees?: string | null;
  notes?: string | null;
  recurrence?: MeetingRoomRecurrence;
}

/** A day of a repeating booking that couldn't be booked (someone else had the room). */
export interface MeetingRoomSkippedOccurrence {
  start_time: string;
  end_time: string;
  reason: string;
}

/** What booking a repeating series returned: the days booked and the days skipped. */
export interface MeetingRoomSeriesResult {
  series_id: string;
  room_name: string;
  title: string;
  requested: number;
  created: MeetingRoomBooking[];
  skipped: MeetingRoomSkippedOccurrence[];
}

export function isMeetingRoomSeriesResult(
  data: MeetingRoomBooking | MeetingRoomSeriesResult | null | undefined
): data is MeetingRoomSeriesResult {
  return data != null && Array.isArray((data as MeetingRoomSeriesResult).created);
}

/** Cancel just one booking, or this one and every later day of its series. */
export type MeetingRoomCancelScope = "this" | "upcoming";

/** Only the fields sent change. `attendees` / `notes` are cleared by sending null. */
export interface MeetingRoomBookingUpdatePayload {
  room_id?: number;
  title?: string;
  /** dd/mm/yyyy HH:MM:SS — read as office (business timezone) time. */
  start_time?: string;
  end_time?: string;
  attendees?: string | null;
  notes?: string | null;
}
