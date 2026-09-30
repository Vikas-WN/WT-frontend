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
