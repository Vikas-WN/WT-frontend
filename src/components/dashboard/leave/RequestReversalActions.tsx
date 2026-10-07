"use client";

import { giveFeedback } from "@/lib/feedback";
import { useState } from "react";
import { Ban, Undo2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { REQUEST_REVERSAL_COPY as COPY } from "@/constants/requestReversal";
import { notifyError, notifySuccess } from "@/lib/notify";
import { toUserFriendlyApiErrorMessage } from "@/utils/userFriendlyApiError";
import {
  cancelUserRequest,
  canHrCancelApproved,
  requestUndoByEmail,
  requestUndoSecondsLeft,
  resolveUserRequestId,
  undoUserRequestDecision,
} from "@/utils/userRequest";

type Pending = "undo" | "cancel" | null;

function timeLeftLabel(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return COPY.undoLeft(Math.floor(minutes / 60), minutes % 60);
}

/**
 * What a reviewer can still do to a request they've already dealt with: take back their own approve/reject for 24
 * hours (it returns to Pending), and — for HR/Admin — cancel an approved request at any time. Renders `fallback`
 * (usually a dash) when neither applies, so it drops straight into an actions cell.
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
  /** Called after a successful undo/cancel so the list can refresh. */
  onChanged: () => void | Promise<void>;
  fallback?: React.ReactNode;
}) {
  // UI-only: which confirmation is open, and whether the request is in flight.
  const [pending, setPending] = useState<Pending>(null);
  const [busy, setBusy] = useState(false);

  const requestId = Number(resolveUserRequestId(row));
  const secondsLeft = requestUndoSecondsLeft(row);
  const canUndo =
    secondsLeft > 0 && (requestUndoByEmail(row) === actorEmail.trim().toLowerCase() || isHrOrAdmin);
  const canCancel = isHrOrAdmin && canHrCancelApproved(row);
  if (!Number.isFinite(requestId) || requestId <= 0 || (!canUndo && !canCancel)) return <>{fallback}</>;

  const confirm = async () => {
    const action = pending;
    if (!action) return;
    setBusy(true);
    try {
      if (action === "undo") await undoUserRequestDecision(requestId);
      else await cancelUserRequest(requestId);
      giveFeedback(action === "undo" ? "undo" : "success");
      notifySuccess(action === "undo" ? COPY.undoDone : COPY.cancelDone);
      setPending(null);
      await onChanged();
    } catch (error) {
      notifyError(toUserFriendlyApiErrorMessage(error, action === "undo" ? COPY.undoFailed : COPY.cancelFailed));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="inline-flex items-center justify-end gap-1">
        {canUndo ? (
          <Button type="button" variant="outline" size="xs" title={timeLeftLabel(secondsLeft)} onClick={() => setPending("undo")}>
            <Undo2 className="size-3" aria-hidden /> {COPY.undo}
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
      <ConfirmDialog
        open={pending !== null}
        title={pending === "cancel" ? COPY.cancelTitle : COPY.undoTitle}
        description={pending === "cancel" ? COPY.cancelDescriptionHr : `${COPY.undoDescription} ${timeLeftLabel(secondsLeft)}.`}
        confirmLabel={pending === "cancel" ? COPY.cancelConfirm : COPY.undoConfirm}
        tone={pending === "cancel" ? "danger" : "default"}
        loading={busy}
        onConfirm={() => void confirm()}
        onCancel={() => (busy ? undefined : setPending(null))}
      />
    </>
  );
}
