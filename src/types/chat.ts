export type ChatKind = "DM" | "CHANNEL";

export interface ChatPerson {
  user_id: number;
  name: string;
  department: string | null;
  /** Whether a profile photo exists to show instead of initials. */
  has_photo?: boolean;
}

export interface ChatConversation {
  id: number;
  kind: ChatKind;
  /** What to show: the other person's name for a DM, "#name" for a channel. */
  title: string;
  name: string | null;
  topic: string | null;
  is_private: boolean;
  member_count: number;
  unread_count: number;
  last_message_preview: string | null;
  /** ISO 8601, UTC */
  last_message_at: string | null;
  partner: ChatPerson | null;
}

export type ChatAttachmentKind = "image" | "video" | "audio" | "file";

export interface ChatAttachment {
  /** 0 while the file is still being uploaded from this device. */
  id: number;
  file_name: string;
  content_type: string;
  kind: ChatAttachmentKind;
  size_bytes: number;
}

export interface ChatReaction {
  emoji: string;
  count: number;
  mine: boolean;
}

export interface ChatMessage {
  id: number;
  conversation_id: number;
  sender_id: number;
  sender_name: string;
  body: string;
  /** ISO 8601, UTC */
  created_at: string;
  edited: boolean;
  deleted: boolean;
  mine: boolean;
  sender_has_photo?: boolean;
  attachment?: ChatAttachment | null;
  reactions?: ChatReaction[];
  /** Set only on a message that is still being sent from this device. */
  pending?: boolean;
}

export interface ChatMessagePage {
  messages: ChatMessage[];
  has_more: boolean;
  first_unread_id: number | null;
}

export interface ChatChannelSummary {
  id: number;
  name: string;
  topic: string | null;
  member_count: number;
  joined: boolean;
}

export interface ChatReportMessage extends ChatMessage {
  reported: boolean;
}

export interface ChatReport {
  report_id: number;
  reason: string;
  reported_at: string;
  reporter: string;
  conversation: string;
  reviewed: boolean;
  outcome: string | null;
  messages: ChatReportMessage[];
}

export interface CreateChannelPayload {
  name: string;
  topic?: string;
  is_private: boolean;
  member_ids: number[];
}
