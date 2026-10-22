/** Wording for the "this year" leave figures (leave page strip and the notes under the balance cards). */
export const LEAVE_YEAR_COPY = {
  heading: (year: number) => `Your leave in ${year}`,
  credited: "Credited",
  creditedHint: "What the year opened with plus the 1.5 days a month credited so far",
  creditedIncludes: (days: string) => `includes ${days} carried forward`,
  taken: "Taken",
  takenHint: "Approved leave that has come off your balance",
  approved: "approved",
  pending: "pending",
  pendingHint: "Waiting for approval — not yet taken off your balance",
  balance: "Balance",
  balanceHint: "What is left to use today",
  unavailable: "Your yearly leave figures are not available right now.",
} as const;

export const LEAVE_HOW_COPY = {
  title: "How leave works",
  points: [
    "Leave is credited on the last day of each month.",
    "In the month you join, the credit depends on how many days you worked.",
    "Comp-off is credited separately, for a day you worked.",
  ],
  policyLink: "Read the leave policy",
} as const;
