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
    id: "2026-10-08-01",
    releasedOn: "2026-10-08",
    title: "A clearer leave card, and calendars for Who's Out and holidays",
    highlights: [
      {
        area: "Home",
        title: "Your leave year at a glance",
        description:
          "The leave card now shows what you carried forward, what you have accrued this year, the leave you have taken and your balance, with your primary, secondary and comp-off split underneath.",
      },
      {
        area: "Home",
        title: "Your leave requests at a glance",
        description:
          "Right under the balance you can see your pending requests and your approved leave that is coming up, with the dates and status of each.",
      },
      {
        area: "Home",
        title: "A tidier, roomier Home screen",
        description:
          "Home cards now fit their content instead of stretching to fill the screen. Approvers see the actual requests waiting for them, and attendance shows where everyone is at a glance.",
      },
      {
        area: "App",
        title: "Back, forward and refresh buttons in the installed app",
        description:
          "When you use WebTrak as an installed app there is no browser toolbar, so it now has its own back, forward and refresh buttons next to the page title.",
      },
      {
        area: "Leave",
        title: "A fresh leave year every 1 January",
        description:
          "On 1 January primary and secondary leave start again from zero, and up to 4 of your unused days carry forward into secondary. The month-by-month plan on the Leave page now shows this.",
      },
      {
        area: "Holiday Calendar",
        title: "The holiday calendar, month by month",
        description:
          "The holiday calendar now opens as a month calendar with every holiday named on its day, a quick strip to jump between months, and the month's holidays listed beside it — for employees and HR alike. The table is one click away if you prefer it.",
      },
      {
        area: "Who's Out",
        title: "A proper team calendar",
        description:
          "Who's Out now opens as a month calendar: leave, work-from-home and holidays are colour-coded on each day, and tapping a day lists exactly who is out.",
      },
    ],
  },
  {
    id: "2026-10-07-08",
    releasedOn: "2026-10-07",
    title: "Knot dresses up and plays for the festivals",
    highlights: [
      {
        area: "Look & feel",
        title: "Cricket, Diwali, Christmas and Holi games",
        description:
          "During a festive look Knot gets a costume and plays: it hits sixes in cricket season, lights a diya and sets off crackers at Diwali, throws colour at Holi, and as Santa it laughs when shaken and cries when dropped from a height.",
      },
    ],
  },
  {
    id: "2026-10-07-07",
    releasedOn: "2026-10-07",
    title: "Optional holidays show up again",
    highlights: [
      {
        area: "Holidays",
        title: "Optional holidays are marked optional",
        description:
          "Holidays that the company sheet marks as optional, such as \"Optional with Muharram\", now appear as optional in the calendar, with their note, instead of as mandatory. HR needs to re-upload the sheet once to fix the existing year.",
      },
    ],
  },
  {
    id: "2026-10-07-06",
    releasedOn: "2026-10-07",
    title: "Meet Knot, your desk pet",
    highlights: [
      {
        area: "Look & feel",
        title: "A little companion that plays along",
        description:
          "Knot wanders the bottom of your screen and follows your cursor. Drag and throw it, click it, double-click for a party, hold it to pet it, right-click for options. It cheers when you approve something and naps when you are away. Hide it in Settings.",
      },
      {
        area: "Pulse",
        title: "Review fixes for phones",
        description:
          "The rating scale now shows readable labels on phones and in two columns, and the review header and steps no longer push the page sideways.",
      },
    ],
  },
  {
    id: "2026-10-07-05",
    releasedOn: "2026-10-07",
    title: "Skills matrix, a mascot and some festive touches",
    highlights: [
      {
        area: "Skills",
        title: "Ask who knows what, and who is free",
        description:
          "Managers and HR can now type a question like \"who knows React and is free next month\" in the new Skills Matrix and see matching people, their ratings and how much time they have free, as cards or a grid.",
      },
      {
        area: "Celebrations",
        title: "A proper welcome, and big anniversary moments",
        description:
          "New joiners get a welcome message and the company sees a welcome announcement on their joining day. Work-anniversary milestones now get a full celebration on your Home, with confetti.",
      },
      {
        area: "Look & feel",
        title: "Meet Knot, plus optional festive looks and sounds",
        description:
          "Knot, our new mascot, keeps you company while pages load and when something goes wrong. HR can switch on a subtle festive look for Diwali, Holi, Christmas and the cricket season. Approval sounds and vibration are in Settings, off by default.",
      },
    ],
  },
  {
    id: "2026-10-07-04",
    releasedOn: "2026-10-07",
    title: "Pulse insights and a tighter cancel window",
    highlights: [
      {
        area: "Pulse",
        title: "Six-month results, bell curve and a year at a glance",
        description:
          "HR has a new Insights tab: pick a six-month cycle to see the bell curve, self vs manager vs final ratings, departments and a 12-month trend, and export everyone's result. Employees see their own six-month results and trend too.",
      },
      {
        area: "Leave",
        title: "Cancel an approved request within 24 hours",
        description:
          "You can cancel an approved leave or WFH request yourself for 24 hours after you submit it, as long as it has not started. After that, ask HR to cancel it.",
      },
    ],
  },
  {
    id: "2026-10-07-03",
    releasedOn: "2026-10-07",
    title: "A fresh look for Pulse",
    highlights: [
      {
        area: "Pulse",
        title: "Your monthly review is clearer and easier to finish",
        description:
          "A progress ring shows how far along you are and what is left, ratings are one connected scale you can click or type 1 to 5, and each KPI or value shows when it is complete. Your answers still save as you go.",
      },
      {
        area: "Pulse",
        title: "HR sees submissions month by month",
        description:
          "Pick a month to see how many reviews are finalised, who is with which manager, what was sent back and the average score. Filter by status, search by name, and follow each review from submitted to final.",
      },
    ],
  },
  {
    id: "2026-10-07-02",
    releasedOn: "2026-10-07",
    title: "Your documents are now kept safely",
    highlights: [
      {
        area: "Documents",
        title: "Uploaded files can be opened again",
        description:
          "Policies, signed copies, training material and assessment files, onboarding documents and referral resumes are now stored in secure file storage, so they stay available after updates and open with one click. Only the people who should see a file can open it.",
      },
    ],
  },
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
