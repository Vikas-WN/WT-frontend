export const ANNOUNCEMENT_QUERY_KEYS = {
  feed: ["announcements", "feed"] as const,
  unread: ["announcements", "unread"] as const,
  managed: ["announcements", "managed"] as const,
  audience: ["audience", "options"] as const,
  all: ["announcements"] as const,
};

/** Roles that can post (HR/Admin to anyone, managers to their team). Mirrors the backend. */
export const ANNOUNCEMENT_POSTER_ROLES = ["ROLE_HR", "ROLE_ADMIN", "ROLE_MANAGER", "ROLE_DM", "ROLE_AM"] as const;

export const ANNOUNCEMENT_REFRESH_MS = 60_000;
export const ANNOUNCEMENT_HOME_LIMIT = 3;
/** Bodies longer than this start collapsed, with "Read more". */
export const ANNOUNCEMENT_COLLAPSE_CHARS = 220;

export const ANNOUNCEMENT_COPY = {
  pageTitle: "Announcements",
  pageDescription: "News and notices from HR, Admin and your managers.",
  tabFeed: "For me",
  tabPosted: "Posted by me",
  compose: "New announcement",
  emptyFeedTitle: "You're all caught up",
  emptyFeedDescription: "New announcements will show up here.",
  emptyPostedTitle: "Nothing posted yet",
  emptyPostedDescription: "Post your first announcement to your team or the whole company.",
  pinned: "Pinned",
  unread: "New",
  readMore: "Read more",
  readLess: "Show less",
  markAllHint: "Opening an announcement marks it as read.",
  composerTitle: "New announcement",
  composerDescription: "Pick who should see it. They're notified straight away.",
  titleLabel: "Title",
  titlePlaceholder: "e.g. Office closed this Friday",
  bodyLabel: "Message",
  bodyPlaceholder: "What do people need to know?",
  expiresLabel: "Hide after (optional)",
  pinLabel: "Pin to the top",
  emailLabel: "Also send an email",
  post: "Post announcement",
  posting: "Posting…",
  archive: "Archive",
  unarchive: "Restore",
  pin: "Pin",
  unpin: "Unpin",
  homeTitle: "Announcements",
  homeEmpty: "No announcements right now.",
  homeCta: "See all",
} as const;
