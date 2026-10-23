/** Wording for the "this year" leave figures (leave page strip and the notes under the balance cards). */
export const LEAVE_YEAR_COPY = {
  heading: (year: number) => `Your leave in ${year}`,
  // Opening + accrued - taken = balance. Opening is only what carried forward from last year; it is never mixed into accrued.
  opening: "Opening balance",
  openingHint: "Leave carried forward from last year (it sits in Secondary)",
  openingSub: "Carried forward",
  accrued: "Accrued",
  accruedHint: "Leave credited so far this year, 1.5 days a month",
  accruedSub: "Credited this year",
  taken: "Taken",
  takenHint: "Approved leave that has come off your balance",
  approved: "approved",
  pending: "pending",
  pendingHint: "Waiting for approval — not yet taken off your balance",
  balance: "Balance",
  balanceHint: "Opening + accrued - taken: what is left to use today",
  balanceSub: "Opening + accrued - taken",
  unavailable: "Your yearly leave figures are not available right now.",
} as const;

export const LEAVE_HOW_COPY = {
  title: "How leave works",
  points: [
    "1.5 days are credited on the last day of every month.",
    "Credits go to Primary until it reaches 11 days, then to Secondary (up to 7).",
    "Leave is taken from Primary first, and from Secondary only once Primary is used up.",
    "Leave carried forward from last year is your opening balance and sits in Secondary.",
    "In the month you join, the credit depends on how many days you worked.",
    "Comp-off is credited separately, for a day you worked.",
  ],
  policyLink: "Read the leave policy",
} as const;
