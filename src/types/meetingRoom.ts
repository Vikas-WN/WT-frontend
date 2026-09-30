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
  booked_by: MeetingRoomBookedBy;
  cancelled_at: string | null;
  cancelled_by_email: string | null;
  created_at: string;
}

export interface MeetingRoomBookingCreatePayload {
  room_id: number;
  title: string;
  /** dd/mm/yyyy HH:MM:SS */
  start_time: string;
  end_time: string;
  attendees?: string | null;
  notes?: string | null;
}

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
