"use client";

import { giveFeedback } from "@/lib/feedback";
import { useState } from "react";
import { Check, ExternalLink, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { notifyError, notifySuccess } from "@/lib/notify";
import { toUserFriendlyApiErrorMessage } from "@/utils/userFriendlyApiError";
import { parseLeaveNotificationDeepLink } from "@/utils/notificationNavigation";
import { updateUserRequestStatus } from "@/utils/userRequest";

const COPY = {
  approve: "Approve",
  approving: "Approving…",
  review: "Review",
  approved: "Approved.",
  failed: "Couldn't approve that request.",
} as const;

/**
 * Approve a leave request right from its notification. Rejecting needs a reason, so "Review" opens the request
 * instead. Clicks here never bubble to the notification row (which would navigate away).
 */
export function NotificationQuickActions({
  message,
  reviewHref,
  onDone,
}: {
  message: string;
  reviewHref: string | null;
  /** Called after a successful approval so the list can refresh. */
  onDone: () => void;
}) {
  const router = useRouter();
  // UI-only: whether the approve call is in flight.
  const [busy, setBusy] = useState(false);
  const requestId = Number(parseLeaveNotificationDeepLink(message).requestId);
  if (!Number.isFinite(requestId) || requestId <= 0) return null;

  const approve = async () => {
    setBusy(true);
    try {
      await updateUserRequestStatus(requestId, "APPROVED");
      giveFeedback("approve");
      notifySuccess(COPY.approved);
      onDone();
    } catch (error) {
      notifyError(toUserFriendlyApiErrorMessage(error, COPY.failed));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-2 flex gap-1.5" onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}>
      <button
        type="button"
        disabled={busy}
        onClick={approve}
        className="inline-flex items-center gap-1 rounded-lg bg-[var(--wt-brand)] px-2.5 py-1 text-xs font-semibold text-[var(--wt-brand-text)] transition-[filter,transform] hover:brightness-110 active:scale-95 disabled:opacity-60"
      >
        {busy ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
        {busy ? COPY.approving : COPY.approve}
      </button>
      {reviewHref ? (
        <button
          type="button"
          onClick={() => router.push(reviewHref)}
          className="inline-flex items-center gap-1 rounded-lg border border-wt-border px-2.5 py-1 text-xs font-medium text-wt-text-muted transition-colors hover:bg-wt-surface-2 hover:text-wt-text"
        >
          <ExternalLink className="size-3" /> {COPY.review}
        </button>
      ) : null}
    </div>
  );
}
