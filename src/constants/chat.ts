export const CHAT_QUERY_KEYS = {
  conversations: ["chat", "conversations"] as const,
  unread: ["chat", "unread"] as const,
  messages: (id: number) => ["chat", "messages", id] as const,
  people: (q: string) => ["chat", "people", q] as const,
  browse: ["chat", "browse"] as const,
  reports: ["chat", "reports"] as const,
};

/** How often each view asks for news while the tab is visible (milliseconds). Messages arrive by polling. */
export const CHAT_POLL = {
  conversations: 8_000,
  messages: 3_000,
  unread: 30_000,
  /** Every so often the latest page is re-read in full, so edits and deletions by others show up too. */
  fullRefreshMs: 30_000,
} as const;

export const CHAT_LIMITS = {
  maxMessage: 4000,
  pageSize: 50,
  nearLimit: 3500,
  /** Messages from the same person this close together share one name and avatar. */
  groupWithinMs: 5 * 60 * 1000,
} as const;

/** The reactions people can leave on a message (the server accepts exactly these). */
export const CHAT_REACTIONS = ["👍", "❤️", "😂", "🎉", "👀", "🙏", "🔥", "😮"] as const;
export const CHAT_CONFETTI_EMOJI = "🎉";

/** A small, friendly set for the composer's emoji button. */
export const CHAT_EMOJI_PICKER = [
  "😀", "😁", "😂", "🤣", "😊", "😍", "😎", "🤔", "😅", "😉", "🙃", "😴",
  "👍", "👎", "👏", "🙌", "🙏", "💪", "🤝", "👀", "🔥", "✨", "🎉", "🥳",
  "❤️", "💯", "✅", "❌", "⚡", "☕", "🍕", "🚀", "🐛", "💡", "📌", "📎",
] as const;

export const CHAT_COPY = {
  title: "Chat",
  messages: "Messages",
  channels: "Channels",
  directMessages: "Direct messages",
  newMessage: "New message",
  newChannel: "New channel",
  browse: "Browse channels",
  search: "Search conversations",
  emptyList: "No conversations yet. Start one with the pencil, or browse channels.",
  emptyThread: "No messages yet. Say hello 👋",
  pickOne: "Pick a conversation, or start a new one.",
  composerPlaceholder: (to: string) => `Message ${to}`,
  send: "Send",
  sending: "Sending…",
  today: "Today",
  yesterday: "Yesterday",
  newMessagesDivider: "New messages",
  loadEarlier: "Load earlier messages",
  loading: "Loading…",
  loadError: "Couldn't load chat. Try again.",
  retry: "Try again",
  sendError: "Couldn't send that message.",
  deletedMessage: "This message was deleted",
  edited: "edited",
  edit: "Edit",
  delete: "Delete",
  report: "Report to HR",
  reportTitle: "Report this message",
  reportHint: "Chats are private. HR/Admin can only read a message that someone reports, and that access is logged.",
  reportPlaceholder: "What's wrong with it?",
  reportSent: "Thanks — HR has been told.",
  members: (n: number) => `${n} ${n === 1 ? "member" : "members"}`,
  leave: "Leave channel",
  findPerson: "Find a person…",
  noPeople: "No one found.",
  channelName: "Channel name",
  channelNameHint: "Lowercase letters, numbers and hyphens, like project-alpha.",
  channelTopic: "What is it for? (optional)",
  makePrivate: "Make private",
  makePrivateHint: "Only people you add can find or read it.",
  addPeople: "Add people",
  create: "Create",
  join: "Join",
  open: "Open",
  joined: "Joined",
  noChannels: "No public channels yet.",
  reportedMessages: "Reported messages",
  noReports: "Nothing reported.",
  closeReport: "Close report",
  outcomePlaceholder: "What was done?",
  you: "You",
  attach: "Attach a file",
  emoji: "Emoji",
  react: "Add reaction",
  removeFile: "Remove file",
  captionPlaceholder: "Add a caption (optional)",
  uploading: "Uploading…",
  fileSendError: "Couldn't send that file. Check your connection and try again.",
  download: "Download",
  unavailableFile: "This file is no longer available.",
  dropHere: "Drop a file to send it",
  pastedImage: "Pasted image",
} as const;
