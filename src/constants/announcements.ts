export const ANNOUNCEMENT_QUERY_KEYS = {
  feed: ["announcements", "feed"] as const,
  feedPage: (params: object) => ["announcements", "feed", params] as const,
  unread: ["announcements", "unread"] as const,
  managed: ["announcements", "managed"] as const,
  managedPage: (params: object) => ["announcements", "managed", params] as const,
  audience: ["audience", "options"] as const,
  all: ["announcements"] as const,
  pollResults: (id: number) => ["announcements", "poll-results", id] as const,
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
  searchPlaceholder: "Search announcements",
  linkedNotice: "Showing the announcement you opened.",
  showAll: "Show all",
  categoryLabel: "Category",
  homeTitle: "Announcements",
  homeEmpty: "No announcements right now.",
  homeCta: "See all",
} as const;

export const POLL_LIMITS = { minOptions: 2, maxOptions: 10, optionMaxChars: 100 } as const;

export const POLL_COPY = {
  addPoll: "Add a poll",
  addPollHint: "Ask people to vote. You and HR can see who voted.",
  questionLabel: "Poll question",
  questionPlaceholder: "e.g. Which day works for the offsite?",
  optionPlaceholder: (n: number) => `Option ${n}`,
  addOption: "Add option",
  removeOption: "Remove option",
  multipleLabel: "Allow picking more than one",
  voteHint: "Pick one",
  voteHintMultiple: "Pick any that apply",
  submit: "Vote",
  change: "Change my vote",
  closed: "Poll closed",
  voters: (n: number) => `${n} ${n === 1 ? "person has" : "people have"} voted`,
  mine: "Your vote",
  whoVoted: "Who voted",
  resultsTitle: "Poll results",
  noVoters: "No votes yet.",
  notVoted: (n: number) => `Haven't voted (${n})`,
  everyoneVoted: "Everyone has voted.",
  exportPdf: "Export PDF",
  loadError: "Couldn't load the poll results.",
} as const;
