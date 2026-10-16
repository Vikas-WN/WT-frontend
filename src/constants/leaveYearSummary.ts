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
  balanceNote:
    "This is your balance today. 1.5 days are credited on the 1st of every month — to Primary until its 11 days are credited, then to Secondary. Leave is taken from Primary first, and from Secondary only once Primary is used up.",
} as const;
