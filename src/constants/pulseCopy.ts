/** User-facing copy for the Pulse review flow. */
export const PULSE_COPY = {
  managerQueueIntro:
    "Self-reviews routed to you. Every manager the employee chose sees the same review: ratings you enter appear for the others, and the first manager to submit makes it final.",
  managerFinalConfirmTitle: "Submit the final review?",
  managerFinalConfirmBody:
    "This becomes the final score and locks the review. The other managers are told it's done and can't change it.",
  managerFinalConfirmLabel: "Submit Final Review",
  managerSubmitLabel: "Submit Final Review",
  managerRejectLabel: "Reject & Send Back",
  managerSubmittedToast: "Final review submitted.",
  managerRejectedToast: "Sent back to the employee.",
  sharedDraftHint: "Ratings and comments are shared live with the other managers reviewing this.",
  decidedByPrefix: "Already decided",
  reviewerFieldLabel: "Reviewer (HR or Admin)",
  reviewerPlaceholder: "Select an HR or Admin reviewer",
  reviewerEmpty: "No HR or Admin reviewers available",
  reviewerSelected: "Reviewer selected",
  reviewerIntro: "As a manager, HR or Admin you choose who reviews your own submission.",
  noProjectManager: "No project manager on record",
} as const;

/** Roles whose own self-review goes to a chosen HR/Admin rather than to project managers. */
export const PULSE_REVIEWER_PICKER_ROLES = [
  "ROLE_MANAGER",
  "ROLE_DM",
  "ROLE_AM",
  "ROLE_HR",
  "ROLE_ADMIN",
] as const;
