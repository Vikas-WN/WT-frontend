import type { BADGE_TONE } from "@/components/dashboard/ui/badgeTones";
import type { EventType, RsvpChoice } from "@/types/event";

export const EVENT_QUERY_KEYS = {
  list: (includePast: boolean) => ["events", "list", includePast] as const,
  attendees: (id: number) => ["events", "attendees", id] as const,
  all: ["events"] as const,
};

export const EVENT_REFRESH_MS = 60_000;
export const EVENT_HOME_LIMIT = 3;

export const EVENT_TYPE_OPTIONS: ReadonlyArray<{ value: EventType; label: string; emoji: string; tone: keyof typeof BADGE_TONE }> = [
  { value: "TOWN_HALL", label: "Town hall", emoji: "🎤", tone: "info" },
  { value: "TRAINING", label: "Training", emoji: "🎓", tone: "violet" },
  { value: "TEAM_OUTING", label: "Team outing", emoji: "🌴", tone: "success" },
  { value: "CELEBRATION", label: "Celebration", emoji: "🎉", tone: "warning" },
  { value: "MEETING", label: "Meeting", emoji: "🗓️", tone: "slate" },
  { value: "OTHER", label: "Event", emoji: "✨", tone: "neutral" },
];

export const RSVP_OPTIONS: ReadonlyArray<{ value: RsvpChoice; label: string }> = [
  { value: "GOING", label: "Going" },
  { value: "MAYBE", label: "Maybe" },
  { value: "NOT_GOING", label: "Can't go" },
];

export const EVENT_COPY = {
  pageTitle: "Events",
  pageDescription: "What's coming up, and your RSVP — plus events you organise.",
  tabUpcoming: "Upcoming",
  tabOrganising: "Organising",
  create: "New event",
  emptyUpcomingTitle: "Nothing coming up",
  emptyUpcomingDescription: "Events you're invited to will show up here.",
  emptyOrganisingTitle: "No events yet",
  emptyOrganisingDescription: "Create an event, choose who's invited, and track the RSVPs.",
  cancelled: "Cancelled",
  rsvpClosed: "RSVP closed",
  full: "Full",
  spotsLeft: "spots left",
  organisedBy: "Organised by",
  whoIsComing: "Who's coming",
  cancelEvent: "Cancel event",
  restoreEvent: "Restore event",
  composerTitle: "New event",
  composerDescription: "Set the details and who's invited. They're notified straight away.",
  homeTitle: "Upcoming events",
  homeEmpty: "No upcoming events.",
  homeCta: "See all",
} as const;
