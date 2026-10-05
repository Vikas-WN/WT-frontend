import type { AudienceSpec } from "@/types/audience";

export interface AnnouncementAuthor {
  name: string;
  email: string;
}

export interface Announcement {
  id: number;
  title: string;
  body: string;
  is_pinned: boolean;
  /** dd/mm/yyyy, or null when it never expires. */
  expires_on: string | null;
  created_by: AnnouncementAuthor;
  /** dd/mm/yyyy HH:MM:SS */
  created_at: string;
  /** My own read state (feed). */
  is_read: boolean;
  read_at: string | null;
  /** The remaining fields are filled in the "posted by me" view. */
  audience: AudienceSpec | null;
  is_archived: boolean;
  recipient_count: number | null;
  read_count: number | null;
  /** Present only when the announcement has a poll. */
  poll: Poll | null;
}

export interface AnnouncementCreatePayload {
  title: string;
  body: string;
  is_pinned: boolean;
  expires_on?: string | null;
  audience: AudienceSpec;
  notify_by_email: boolean;
  poll?: PollCreatePayload | null;
}

export interface AnnouncementUpdatePayload {
  title?: string;
  body?: string;
  is_pinned?: boolean;
  is_archived?: boolean;
  expires_on?: string | null;
}

export interface PollOption {
  id: string;
  label: string;
  votes: number;
}

/** A poll as the signed-in person sees it: live tallies plus what they picked. */
export interface Poll {
  question: string;
  multiple: boolean;
  options: PollOption[];
  total_voters: number;
  my_option_ids: string[];
  closed: boolean;
}

export interface PollCreatePayload {
  question: string;
  options: string[];
  multiple: boolean;
}

export interface PollPerson {
  name: string;
  email: string;
  /** dd/mm/yyyy HH:MM:SS (voters only). */
  voted_at: string | null;
}

export interface PollOptionResult {
  id: string;
  label: string;
  votes: number;
  voters: PollPerson[];
}

/** HR/Admin (or the poster): who voted for what, and who hasn't voted. */
export interface PollResults {
  announcement_id: number;
  title: string;
  question: string;
  multiple: boolean;
  recipient_count: number;
  total_voters: number;
  options: PollOptionResult[];
  not_voted: PollPerson[];
}
