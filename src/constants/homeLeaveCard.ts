export const HOME_LEAVE_CARD = {
  title: "My leave balance",
  cta: "Details",
  unavailable: "Unavailable",
  ringCaption: "days available",
  ringLabel: (balance: string, entitlement: string) => `${balance} of ${entitlement} days available`,
  carriedForwardLabel: "Carried forward",
  carriedForwardShort: "C/F",
  carriedForwardHint: "Your opening balance from last year",
  accruedLabel: "Accrued this year",
  accruedShort: "Accrued",
  accruedHint: "1.5 days for every month so far",
  takenLabel: "Taken this year",
  takenShort: "Taken",
  takenHint: "Leave you have already taken",
  primaryLabel: "Primary",
  secondaryLabel: "Secondary",
  secondaryHint: "Includes carried-forward leave",
  compOffLabel: "Comp-off",
  compOffHint: "Tracked separately from the ring",
  requestsHeading: "My leave requests",
  requestsEmpty: "No upcoming or pending leave.",
  requestsEmptyCta: "Apply for leave",
  requestsError: "Could not load your requests.",
  moreRequests: (n: number) => `+${n} more`,
} as const;

/** The yearly entitlement the ring is drawn against: primary (11) + secondary (7), see the accrual caps on the backend. */
export const HOME_LEAVE_ENTITLEMENT = 18;

/** How many requests the card lists, and how far around today it looks for them. */
export const HOME_LEAVE_MAX_ROWS = 3;
export const HOME_LEAVE_MONTHS_BACK = 1;
export const HOME_LEAVE_MONTHS_FORWARD = 12;

/** Request types that spend or ask for leave (work-from-home and comp-off credits are not leave). */
export const HOME_LEAVE_REQUEST_TYPES: readonly string[] = ["LEAVE", "OPTIONAL", "OPTIONAL_LEAVE", "COMP_OFF"];

/** Statuses worth showing on the card: waiting for a decision, or approved and coming up. */
export const HOME_LEAVE_OPEN_STATUSES: readonly string[] = ["PENDING", "SUBMITTED", "APPROVED"];

/** Colours shared by the ring, its legend and the bar, so the three always agree. */
export const LEAVE_COLORS = {
  primary: { stroke: "var(--wt-brand)", dot: "bg-[var(--wt-brand)]" },
  secondary: { stroke: "#10b981", dot: "bg-emerald-500" },
  compOff: { stroke: "#f59e0b", dot: "bg-amber-500" },
} as const;
