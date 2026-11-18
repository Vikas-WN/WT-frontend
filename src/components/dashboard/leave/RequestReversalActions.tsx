"use client";

import { giveFeedback } from "@/lib/feedback";
import { useState } from "react";
import { Ban, Undo2 } from "lucide-react";

import { UserRequestRejectDialog } from "@/components/dashboard/leave/UserRequestRejectDialog";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { REQUEST_REVERSAL_COPY as COPY } from "@/constants/requestReversal";
import { notifyError, notifySuccess } from "@/lib/notify";
import { toUserFriendlyApiErrorMessage } from "@/utils/userFriendlyApiError";
import {
  cancelUserRequest,
  canHrCancelApproved,
  requestFinalStatus,
  requestSwitchTarget,
  requestUndoByEmail,
  requestUndoSecondsLeft,
  resolveUserRequestId,
  switchUserRequestDecision,
  undoUserRequestDecision,
} from "@/utils/userRequest";

type Pending = "switch" | "undo" | "cancel" | null;
type Decision = "APPROVED" | "REJECTED";

const SWITCH_BUTTON_CLASS: Record<Decision, string> = {
  APPROVED: "border-emerald-600/30 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-300",
  REJECTED: "border-rose-600/30 text-rose-700 hover:bg-rose-500/10 dark:text-rose-300",
};

function timeLeftLabel(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return COPY.undoLeft(Math.floor(minutes / 60), minutes % 60);
}

/**
 * What a reviewer can still do to a request they've already dealt with:
 *  - switch their own decision on leave / WFH / comp-off usage to the opposite one — the button is named after the
 *    decision it changes to ("Reject" on an approved row, "Approve" on a rejected one);
 *  - undo a decision back to Pending where switching doesn't apply (a comp-off credit, or HR taking back someone
 *    else's approval);
 *  - for HR/Admin, cancel an approved request at any time.
 * The server says how long the decision stays changeable; once that runs out the buttons are gone. Renders
 * `fallback` (usually a dash) when nothing applies, so it drops straight into an actions cell.
 */
export function RequestReversalActions({
  row,
  actorEmail,
  isHrOrAdmin,
  onChanged,
  fallback = null,
}: {
  row: Record<string, unknown>;
  actorEmail: string;
  isHrOrAdmin: boolean;
  /** Called after a successful switch/undo/cancel so the list can refresh. */
  onChanged: () => void | Promise<void>;
  fallback?: React.ReactNode;
}) {
  // UI-only: which confirmation is open, the rejection reason being typed, and whether the request is in flight.
  const [pending, setPending] = useState<Pending>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const requestId = Number(resolveUserRequestId(row));
  const secondsLeft = requestUndoSecondsLeft(row);
  const status = requestFinalStatus(row);
  const decidedByMe = requestUndoByEmail(row) === actorEmail.trim().toLowerCase();
  const switchTo: Decision | null = decidedByMe && secondsLeft > 0 ? requestSwitchTarget(row) : null;
  // HR can take back an approval but not reopen a manager's rejection (they could then approve it themselves).
  const hrMayUndo = isHrOrAdmin && status !== "REJECTED";
  const canUndo = !switchTo && secondsLeft > 0 && (decidedByMe || hrMayUndo);
  const canCancel = isHrOrAdmin && canHrCancelApproved(row);
  if (!Number.isFinite(requestId) || requestId <= 0 || (!switchTo && !canUndo && !canCancel)) return <>{fallback}</>;

  const decided: Decision | null = status === "APPROVED" || status === "REJECTED" ? status : null;

  const reset = () => {
    setPending(null);
    setReason("");
  };

  const confirm = async () => {
    const action = pending;
    if (!action) return;
    setBusy(true);
    try {
      if (action === "switch" && switchTo) {
        await switchUserRequestDecision(requestId, reason);
        giveFeedback(switchTo === "APPROVED" ? "approve" : "reject");
        notifySuccess(COPY.switchDone[switchTo]);
      } else if (action === "undo") {
        await undoUserRequestDecision(requestId);
        giveFeedback("undo");
        notifySuccess(COPY.undoDone);
      } else {
        await cancelUserRequest(requestId);
        giveFeedback("success");
        notifySuccess(COPY.cancelDone);
      }
      reset();
      await onChanged();
    } catch (error) {
      const fallbackMessage = { switch: COPY.switchFailed, undo: COPY.undoFailed, cancel: COPY.cancelFailed }[action];
      notifyError(toUserFriendlyApiErrorMessage(error, fallbackMessage));
      // A failed switch can leave the request pending again (the server says so); show its real state.
      if (action === "switch") {
        reset();
        await onChanged();
      }
    } finally {
      setBusy(false);
    }
  };

  const confirmCopy: { title: string; description: string; confirmLabel: string } = {
    switch: {
      title: COPY.switchToApprovedTitle,
      description: COPY.switchToApprovedDescription,
      confirmLabel: COPY.switchToApprovedConfirm,
    },
    undo: {
      title: decided ? COPY.undoTitle[decided] : COPY.undoTitleFallback,
      description: `${COPY.undoDescription} ${timeLeftLabel(secondsLeft)}.`,
      confirmLabel: COPY.undoConfirm,
    },
    cancel: { title: COPY.cancelTitle, description: COPY.cancelDescriptionHr, confirmLabel: COPY.cancelConfirm },
  }[pending ?? "undo"];
  const rejecting = pending === "switch" && switchTo === "REJECTED";
  const close = () => (busy ? undefined : reset());

  return (
    <>
      <div className="inline-flex items-center justify-end gap-1">
        {switchTo ? (
          <Button
            type="button"
            variant="outline"
            size="xs"
            className={SWITCH_BUTTON_CLASS[switchTo]}
            title={COPY.switchHint[switchTo]}
            onClick={() => setPending("switch")}
          >
            {COPY.switchLabel[switchTo]}
          </Button>
        ) : null}
        {canUndo ? (
          <Button type="button" variant="outline" size="xs" title={timeLeftLabel(secondsLeft)} onClick={() => setPending("undo")}>
            <Undo2 className="size-3" aria-hidden /> {decided ? COPY.undoLabel[decided] : COPY.undo}
          </Button>
        ) : null}
        {canCancel ? (
          <Button
            type="button"
            variant="outline"
            size="xs"
            className="border-rose-600/30 text-rose-700 hover:bg-rose-500/10 dark:text-rose-300"
            onClick={() => setPending("cancel")}
          >
            <Ban className="size-3" aria-hidden /> {COPY.cancel}
          </Button>
        ) : null}
      </div>
      <UserRequestRejectDialog
        open={rejecting}
        title={COPY.switchToRejectedTitle}
        description={COPY.switchToRejectedDescription}
        confirmLabel={COPY.switchToRejectedConfirm}
        confirmingLabel={COPY.switchToRejectedConfirming}
        reason={reason}
        onReasonChange={setReason}
        onCancel={close}
        onConfirm={() => void confirm()}
        loading={busy}
      />
      <ConfirmDialog
        open={pending !== null && !rejecting}
        title={confirmCopy.title}
        description={confirmCopy.description}
        confirmLabel={confirmCopy.confirmLabel}
        tone={pending === "cancel" ? "danger" : "default"}
        loading={busy}
        onConfirm={() => void confirm()}
        onCancel={close}
      />
    </>
  );
}
