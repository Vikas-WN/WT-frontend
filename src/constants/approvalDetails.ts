/** Copy for the hover details on leave / WFH / comp-off status tags. */
export const APPROVAL_DETAILS_COPY = {
  triggerHint: "Hover or tap for approval details",
  waitingOn: "Waiting on",
  noDetails: "No approval details recorded yet.",
  noDetailsDecided: "No approval details were recorded for this request.",
  noName: "Unknown user",
  autoApprovedTitle: "Auto-approved",
  autoApprovedNote: "No manager acted before the deadline, so the default policy approved it.",
  autoApprovedOnBehalf: "Approver of record",
  comment: "Comment",
  verbByAction: {
    APPROVED: "Approved by",
    REJECTED: "Rejected by",
    APPROVED_BY_DEFAULT: "Auto-approved",
    UNDONE: "Decision undone by",
    CANCELLED: "Cancelled by",
  },
} as const;

export const APPROVAL_DETAILS_HOVER_DELAY_MS = 150;
export const APPROVAL_DETAILS_CLOSE_DELAY_MS = 100;

/** Backend action values that count as an approval, for tone and wording. */
export const APPROVAL_ACTION = {
  approved: "APPROVED",
  rejected: "REJECTED",
  auto: "APPROVED_BY_DEFAULT",
} as const;
