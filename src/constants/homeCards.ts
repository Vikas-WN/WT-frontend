export const HOME_APPROVALS_QUERY_KEY = ["home", "pending-approvals"] as const;

/** How far around today the pending-approval search looks (days back / forward), and how many rows it asks for per list. */
export const HOME_APPROVALS_WINDOW = { daysBack: 45, daysForward: 60, pageSize: 200, staleMs: 60_000 } as const;
export const HOME_APPROVALS_MAX_ROWS = 3;

export const HOME_APPROVALS_TABS = [
  { id: "all", label: "All" },
  { id: "comp_off", label: "Comp-off" },
  { id: "wfh", label: "WFH" },
  { id: "leave", label: "Leave" },
] as const;
export type HomeApprovalsTab = (typeof HOME_APPROVALS_TABS)[number]["id"];

export const HOME_APPROVALS_COPY = {
  title: "Pending approvals",
  cta: "Review",
  approve: "Approve",
  approved: "Approved.",
  approveFailed: "Couldn't approve that request.",
  decline: "Decline…",
  declineHint: "Declining needs a reason, so this opens the full review",
  review: "Review",
  reviewAll: "Review all",
  nothingOfKind: "Nothing of this kind is waiting.",
  moreInQueue: (n: number) => `${n} more ${n === 1 ? "request" : "requests"} in your queue`,
  awaiting: (n: number) => (n === 1 ? "request awaiting your review" : "requests awaiting your review"),
  moreRequests: (n: number) => `+${n} more waiting`,
  allCaughtUp: "All caught up",
  allCaughtUpHint: "Nothing is waiting for your decision.",
  unavailable: "Open your team requests to review.",
  halfDay: "Half day",
} as const;

export const HOME_ATTENDANCE_COPY = {
  title: "Who's where today",
  cta: "Team calendar",
  outToday: "Out today",
  total: (n: number) => `${n} ${n === 1 ? "person" : "people"} accounted for`,
  unavailable: "Unavailable",
  none: "Nobody",
  more: (n: number) => `+${n}`,
  open: (label: string) => `See who is ${label.toLowerCase()}`,
} as const;

export const HOME_EMPTY_COPY = {
  learning: { title: "No trainings yet", hint: "Trainings you are enrolled in will show up here." },
  whosOut: { title: "Everyone's in today", hint: "Nobody is on leave or working from home." },
  projects: { title: "No active allocation", hint: "Projects you are allocated to will show up here." },
  holidays: { title: "No holidays coming up", hint: "The next holiday will appear here." },
} as const;
