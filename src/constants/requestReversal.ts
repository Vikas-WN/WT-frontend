export const REQUEST_REVERSAL_COPY = {
  undo: "Undo",
  undoLeft: (hours: number, minutes: number) =>
    hours > 0 ? `${hours}h ${minutes}m left to undo` : `${Math.max(1, minutes)}m left to undo`,
  undoTitle: "Undo this decision?",
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
  askHr: "Started — ask HR to cancel",
} as const;
