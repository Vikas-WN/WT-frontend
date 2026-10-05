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
}

export interface AnnouncementCreatePayload {
  title: string;
  body: string;
  is_pinned: boolean;
  expires_on?: string | null;
  audience: AudienceSpec;
  notify_by_email: boolean;
}

export interface AnnouncementUpdatePayload {
  title?: string;
  body?: string;
  is_pinned?: boolean;
  is_archived?: boolean;
  expires_on?: string | null;
}
