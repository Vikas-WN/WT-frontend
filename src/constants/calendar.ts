export const CALENDAR_QUERY_KEYS = {
  feed: ["calendar", "feed"] as const,
};

/** Calendar apps show times in the person's own zone; WebTrak events are stored in office time. */
export const OFFICE_TIME_ZONE = "Asia/Kolkata";

export const CALENDAR_COPY = {
  syncButton: "Sync calendar",
  dialogTitle: "Sync with your calendar",
  dialogDescription: "Your events, room bookings and approved leave appear in your own calendar and stay up to date.",
  apple: "Add to Apple Calendar",
  google: "Add to Google Calendar",
  linkLabel: "Or paste this link into any calendar app (Outlook, Fastmail…)",
  copy: "Copy link",
  copied: "Link copied",
  privateNote: "This link is private. Anyone who has it can see your calendar, so don't share it.",
  regenerate: "Create a new link",
  regenerateHint: "If the link got shared by mistake, create a new one. The old link stops working straight away.",
  regenerated: "New link created. Add it to your calendar again.",
  googleNote: "Google refreshes subscribed calendars every few hours, so changes can take a while to show.",
  loadError: "Couldn't load your calendar link.",
  included: "Included: events you're invited to or organise, your room bookings, approved leave and work from home.",
  addToCalendar: "Add to calendar",
  addGoogle: "Google Calendar",
  downloadIcs: "Download .ics (Apple, Outlook)",
  icsError: "Couldn't download that event.",
} as const;
