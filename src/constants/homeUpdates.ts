/** The "What's happening" strip under the Home greeting. */
export const HOME_UPDATES = {
  /** How many of each kind to pull in. */
  perKind: 6,
  /** Auto-scroll speed in pixels per second. */
  speedPxPerSecond: 32,
  /** Pause at the end of the strip before it loops back, in ms. */
  endPauseMs: 2200,
  refreshMs: 60_000,
} as const;

export const HOME_UPDATES_COPY = {
  label: "What's happening",
  announcement: "Announcement",
  event: "Event",
  form: "Form",
  newBadge: "New",
  overdue: "Overdue",
  due: "Due",
  fillIn: "Fill in",
  answerRsvp: "RSVP",
  going: "You're going",
  seeAll: "See all",
} as const;

export const HOME_UPDATES_QUERY_KEY = ["home", "updates"] as const;
