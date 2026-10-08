export const HOME_LEAVE_CARD = {
  title: "My leave balance",
  cta: "Details",
  unavailable: "Unavailable",
  totalLabel: "Available to take",
  totalHint: "Primary + secondary (carried-forward leave is part of secondary). Comp-off is tracked separately.",
  primaryLabel: "Primary",
  secondaryLabel: "Secondary",
  secondaryHint: "Includes carried forward",
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
