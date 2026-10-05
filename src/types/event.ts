import type { AudienceSpec } from "@/types/audience";

export type EventType = "TOWN_HALL" | "TRAINING" | "TEAM_OUTING" | "CELEBRATION" | "MEETING" | "OTHER";
export type RsvpChoice = "GOING" | "MAYBE" | "NOT_GOING";

export interface RsvpCounts {
  going: number;
  maybe: number;
  not_going: number;
  pending: number;
}

export interface EventPerson {
  name: string;
  email: string;
}

export interface AppEvent {
  id: number;
  title: string;
  description: string | null;
  event_type: EventType;
  location: string | null;
  /** dd/mm/yyyy HH:MM:SS (office time) */
  start_time: string;
  end_time: string;
  rsvp_deadline: string | null;
  capacity: number | null;
  spots_left: number | null;
  is_cancelled: boolean;
  created_by: EventPerson;
  /** My answer, or null if I haven't replied / wasn't invited. */
  my_response: RsvpChoice | null;
  invited: boolean;
  rsvp_open: boolean;
  counts: RsvpCounts;
  invited_count: number;
  can_manage: boolean;
  audience: AudienceSpec | null;
}

export interface EventAttendee {
  name: string;
  email: string;
  department: string | null;
  response: RsvpChoice | null;
  responded_at: string | null;
}

export interface EventAttendees {
  event_id: number;
  counts: RsvpCounts;
  attendees: EventAttendee[];
}

export interface EventCreatePayload {
  title: string;
  description?: string | null;
  event_type: EventType;
  location?: string | null;
  start_time: string;
  end_time: string;
  rsvp_deadline?: string | null;
  capacity?: number | null;
  audience: AudienceSpec;
  notify_by_email: boolean;
}

export interface EventUpdatePayload {
  title?: string;
  description?: string | null;
  location?: string | null;
  start_time?: string;
  end_time?: string;
  rsvp_deadline?: string | null;
  capacity?: number | null;
  is_cancelled?: boolean;
}
