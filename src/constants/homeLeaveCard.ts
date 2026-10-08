export const HOME_LEAVE_CARD = {
  title: "My leave balance",
  cta: "Details",
  unavailable: "Unavailable",
  carriedForwardLabel: "C/F",
  carriedForwardHint: "Carried forward from last year — your opening balance",
  accruedYearLabel: "Accrued",
  accruedYearHint: "1.5 days for every month so far this year",
  takenLabel: "Leaves taken",
  takenHint: "Leave taken so far this year",
  balanceLabel: "Balance",
  balanceHint: "C/F + accrued − leaves taken (comp-off is separate)",
  breakupNote: "Break-up of your balance. Carried-forward leave is added under secondary.",
  primaryLabel: "Primary",
  secondaryLabel: "Secondary",
  compOffLabel: "Comp-off",
  requestsHeading: "My leave requests",
  requestsEmpty: "No upcoming or pending leave requests.",
  requestsError: "Could not load your requests.",
  moreRequests: (n: number) => `+${n} more`,
} as const;

/** How many requests the card lists, and how far around today it looks for them. */
export const HOME_LEAVE_MAX_ROWS = 3;
export const HOME_LEAVE_MONTHS_BACK = 1;
export const HOME_LEAVE_MONTHS_FORWARD = 12;

/** Request types that spend or ask for leave (work-from-home and comp-off credits are not leave). */
export const HOME_LEAVE_REQUEST_TYPES: readonly string[] = ["LEAVE", "OPTIONAL", "OPTIONAL_LEAVE", "COMP_OFF"];

/** Statuses worth showing on the card: waiting for a decision, or approved and coming up. */
export const HOME_LEAVE_OPEN_STATUSES: readonly string[] = ["PENDING", "SUBMITTED", "APPROVED"];
