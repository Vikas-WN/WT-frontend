/**
 * What's new — announced once per release, to every user, by the dialog in
 * components/dashboard/whats-new.
 *
 * TO ANNOUNCE A DEPLOYMENT: add an entry at the TOP of RELEASE_NOTES with a new `id`, then deploy.
 * Nothing else is needed: each user sees the dialog once, on their next visit, and never again
 * for that release. A deployment with no new entry shows nothing (an empty "what's new" is noise).
 *
 * Rules (enforced by scripts/tests/releaseNotes.test.mjs, which fails the test run if broken):
 *  - `id` is `YYYY-MM-DD-NN` (release date + a two-digit counter for several in a day). Ids sort
 *    chronologically as plain strings — that ordering is how "newer than what you've seen" works,
 *    so it must always increase. Never reuse or renumber an id: users who saw it would see it again.
 *  - Newest first.
 *  - Write for the people using the app: what they can now do or what stopped going wrong, in one
 *    or two plain sentences. Not commit messages, not file names.
 *
 * Keep this file free of imports so it can be unit-tested directly.
 */

export interface ReleaseHighlight {
  /** The part of the app this is about, shown as a small label. */
  area: string;
  title: string;
  description: string;
}

export interface ReleaseNote {
  id: string;
  /** ISO date (YYYY-MM-DD) the release went out. */
  releasedOn: string;
  title: string;
  highlights: readonly ReleaseHighlight[];
}

export const RELEASE_NOTES: readonly ReleaseNote[] = [
  {
    id: "2026-10-07-01",
    releasedOn: "2026-10-07",
    title: "Changed your mind? Undo and cancel for leave and requests",
    highlights: [
      {
        area: "Approvals",
        title: "Managers can undo an approval or rejection for 24 hours",
        description:
          "If you approve or reject a request by mistake, use Undo next to it within 24 hours. It goes back to Pending and the employee is told. After 24 hours the decision is final.",
      },
      {
        area: "My requests",
        title: "Cancel an approved leave or WFH before it starts",
        description:
          "Pending requests can still be edited or deleted. Once approved you can cancel until the start date, and your balance is restored. After it has started, ask HR to cancel it; HR cancelling notifies you and your manager.",
      },
    ],
  },
  {
    id: "2026-10-06-04",
    releasedOn: "2026-10-06",
    title: "Use WebTrak on several devices at once",
    highlights: [
      {
        area: "Signing in",
        title: "Signing in on another device no longer signs you out here",
        description:
          "Your laptop, phone, browser and the desktop app each keep their own session. Signing out on one, or leaving one idle, leaves the others signed in. You are still signed out after 4 hours with no activity on that device.",
      },
    ],
  },
  {
    id: "2026-10-06-03",
    releasedOn: "2026-10-06",
    title: "Fewer unexpected sign-outs",
    highlights: [
      {
        area: "Signing in",
        title: "A brief connection drop no longer signs you out",
        description:
          "If your Wi-Fi blinks or your laptop is just waking up, WebTrak now waits and reconnects quietly instead of ending your session. You are still signed out after 4 hours of no activity.",
      },
    ],
  },
  {
    id: "2026-10-06-02",
    releasedOn: "2026-10-06",
    title: "Approve from your email, and install WebTrak",
    highlights: [
      {
        area: "Look and feel",
        title: "Smoother motion everywhere",
        description:
          "Tabs glide between sections, pages and dialogs ease in, numbers count up, loading placeholders shimmer, and a thin bar shows when a page is loading.",
      },
      {
        area: "Approvals",
        title: "Review and decide from the email",
        description:
          "Leave request emails now have a Review & decide button. It opens a small page where managers can approve, or reject with a reason, without searching through WebTrak. Approving also works straight from the notification list.",
      },
      {
        area: "App",
        title: "Install WebTrak on your phone or computer",
        description:
          "Add WebTrak to your home screen or dock to open it like an app, with shortcuts for leave, time, rooms and news. If you lose your connection, a friendly offline page and banner tell you what's happening.",
      },
    ],
  },
  {
    id: "2026-10-06-01",
    releasedOn: "2026-10-06",
    title: "Calendar sync and a roomier look",
    highlights: [
      {
        area: "Look and feel",
        title: "A cleaner dark mode",
        description:
          "Dark mode now uses soft graphite instead of pure black, so cards and borders stand out and text is easier on the eyes. Light mode got crisper edges and softer shadows.",
      },
      {
        area: "Calendar",
        title: "See WebTrak in Google or Apple Calendar",
        description:
          "On the Events page, choose Sync calendar to add your events, room bookings and approved leave to your own calendar. Every event also has an Add to calendar option.",
      },
      {
        area: "Look and feel",
        title: "More room, less clutter",
        description:
          "Pages use the width of your screen better, spacing is tighter, and buttons and keyboard focus are clearer.",
      },
    ],
  },
  {
    id: "2026-10-05-01",
    releasedOn: "2026-10-05",
    title: "Polls, forms, search and a one-screen Home",
    highlights: [
      {
        area: "Search",
        title: "Find things faster",
        description:
          "Each list now has search, category filters and pages. Announcements and forms can be filed under a category, and Cmd/Ctrl+K search now finds them too.",
      },
      {
        area: "Home",
        title: "What's happening, right under your greeting",
        description:
          "Forms to fill, upcoming events and new announcements drift across the top of Home. Hover to pause, or scroll them yourself.",
      },
      {
        area: "Announcements",
        title: "Add a poll to an announcement",
        description:
          "Ask a question with up to 10 options. People vote right in the announcement and see live results; HR, Admin and the poster can see who voted for what, and download it as a PDF.",
      },
      {
        area: "Forms",
        title: "Send a form to the people you choose",
        description:
          "Build a short form, pick who should fill it, and track who has answered. Anyone can edit their answers until it closes.",
      },
      {
        area: "Home",
        title: "Everything on one screen",
        description:
          "Home now fits your window with no scrolling. If you have more widgets than fit, use the arrows at the top to flip to the next screen. The side menu also starts collapsed.",
      },
    ],
  },
  {
    id: "2026-09-30-01",
    releasedOn: "2026-09-30",
    title: "Leave planning, shared Pulse reviews and more",
    highlights: [
      {
        area: "Leave",
        title: "Your leave, month by month",
        description:
          "See the 1.5 leaves you earn on the 1st of every month and what each coming month looks like, including leave already approved for it.",
      },
      {
        area: "Leave",
        title: "Leave for later months is no longer wrongly marked Loss of Pay",
        description:
          "Leave you apply for next month or beyond is checked against what you will have earned by then, and you can preview the result before you apply.",
      },
      {
        area: "Pulse",
        title: "Reviews reach every project manager at once",
        description:
          "Your review goes to the managers of each project you pick. They work on one shared review, and the first to submit makes it final — no separate HR approval.",
      },
      {
        area: "Pulse",
        title: "Named ratings, a reason for each, and a checklist",
        description:
          "Choose Meets Expectations, Above Expectations and so on instead of numbers, say why, and use the checklist to see exactly what is left before you submit.",
      },
      {
        area: "Meeting rooms",
        title: "Edit a booking, and bookings just work",
        description:
          "Change the time of a room booking and everyone sees it within seconds. The time-zone errors that blocked some bookings are fixed.",
      },
      {
        area: "Signing in",
        title: "Stay signed in while you work",
        description:
          "You are only signed out after 4 hours with no mouse or keyboard activity, in any tab — not because a session got old.",
      },
    ],
  },
];
