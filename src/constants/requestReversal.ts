export const REQUEST_REVERSAL_COPY = {
  // Switching your own decision on leave / WFH / comp-off usage: the button names the decision it changes to.
  switchLabel: { APPROVED: "Approve", REJECTED: "Reject" },
  switchHint: {
    APPROVED: "Change your decision to Approved",
    REJECTED: "Change your decision to Rejected",
  },
  switchToApprovedTitle: "Approve this request instead?",
  switchToApprovedDescription:
    "Your rejection is replaced by an approval, any leave balance is deducted, and the employee is told. You can change it back until the end of the day the request starts.",
  switchToApprovedConfirm: "Approve",
  switchToRejectedTitle: "Reject this request instead?",
  switchToRejectedDescription:
    "Your approval is replaced by a rejection, any leave balance is restored, and the employee is told. You can change it back until the end of the day the request starts.",
  switchToRejectedConfirm: "Reject",
  switchToRejectedConfirming: "Rejecting…",
  switchDone: { APPROVED: "Decision changed — the request is now approved.", REJECTED: "Decision changed — the request is now rejected." },
  switchFailed: "Couldn't change that decision.",
  // Undo puts a request back to Pending (comp-off credits, and HR taking back someone else's approval).
  undoLabel: { APPROVED: "Undo approval", REJECTED: "Undo rejection" },
  undo: "Undo",
  undoLeft: (hours: number, minutes: number) => {
    if (hours >= 48) return `${Math.floor(hours / 24)} days left to undo`;
    return hours > 0 ? `${hours}h ${minutes}m left to undo` : `${Math.max(1, minutes)}m left to undo`;
  },
  undoTitle: { APPROVED: "Undo this approval?", REJECTED: "Undo this rejection?" },
  undoTitleFallback: "Undo this decision?",
  undoDescription:
    "The request goes back to Pending, any leave balance is restored, and it can be approved or rejected again. The employee and other approvers are told.",
  undoConfirm: "Undo decision",
  undoDone: "Decision undone — the request is pending again.",
  undoFailed: "Couldn't undo that decision.",
  cancel: "Cancel request",
  cancelTitle: "Cancel this approved request?",
  cancelDescriptionEmployee: "Your leave balance is restored and your manager is told. This can't be undone.",
  cancelDescriptionHr: "The leave balance is restored and the employee and their manager are told. This can't be undone.",
  cancelConfirm: "Cancel request",
  cancelDone: "Request cancelled.",
  cancelFailed: "Couldn't cancel that request.",
  contactHr: "Contact HR to cancel this request",
} as const;
