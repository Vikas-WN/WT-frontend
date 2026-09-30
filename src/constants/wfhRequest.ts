export const WFH_COMMENT_MAX_LENGTH = 200;

export const WFH_COPY = {
  applyTab: "Apply for WFH",
  historyTab: "History",
  applyHeading: "Apply for WFH",
  exceptionLink: "Need more than 1 WFH day/week? Request a custom exception",
  fromDate: "From Date",
  toDate: "To Date",
  weeklyLimitHint:
    "Regular WFH is limited to 1 day per week. Use the custom exception link above for additional days.",
  halfDay: "Half-day (single day only)",
  clientApproval: "I confirm client approval for this request (required on active client/staffing projects).",
  talentPoolNotice:
    "You are in the talent pool (bench or no client allocation). This WFH request will go directly to HR for approval.",
  managersLabel: "Select Managers",
  commentsLabel: "Comments",
  submit: "Submit Request",
  submitting: "Submitting…",
  saveChanges: "Save Changes",
  saving: "Saving…",
  cancelEdit: "Cancel Edit",
  refreshLabel: "Refresh my requests",
} as const;

export const WFH_ERRORS = {
  invalidFromDate: "Please provide a valid From date (dd/mm/yyyy).",
  commentsRequired: "Comments are required.",
  commentsTooLong: `Comments must be ${WFH_COMMENT_MAX_LENGTH} characters or less.`,
  clientApprovalRequired: "Client approval is required for client users.",
  managerRequired: "Select at least one manager to notify.",
  onlyPendingEditable: "Only pending requests can be edited.",
  missingRequestId: "Could not resolve request id for editing.",
} as const;

export const WFH_REVOKE_CONFIRM = {
  title: "Delete this WFH request?",
  description: "The request will be withdrawn and your manager notified. This can't be undone.",
  confirmLabel: "Delete request",
} as const;
