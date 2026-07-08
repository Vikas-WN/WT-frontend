"use client";

import { Button } from "@/components/ui/button";

export function SessionIdleWarningDialog({
  open,
  minutesRemaining,
  onStaySignedIn,
}: {
  open: boolean;
  minutesRemaining: number;
  onStaySignedIn: () => void;
}) {
  if (!open) return null;

  const minutesLabel = minutesRemaining === 1 ? "1 minute" : `${minutesRemaining} minutes`;

  return (
    <div
      className="fixed inset-0 z-[190] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[1px]"
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="session-idle-warning-title"
        aria-describedby="session-idle-warning-description"
        className="w-full max-w-md rounded-2xl border border-wt-border bg-wt-surface-1 p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-sky-500/15 text-sky-600">
          <IdleWarningIcon />
        </div>
        <h2
          id="session-idle-warning-title"
          className="mt-4 text-center text-lg font-semibold text-wt-text"
        >
          Still There?
        </h2>
        <p
          id="session-idle-warning-description"
          className="mt-2 text-center text-sm leading-relaxed text-wt-text-muted"
        >
          You will be logged out in {minutesLabel} due to inactivity. Select Stay Signed In to
          continue your session.
        </p>
        <div className="mt-6 flex justify-center">
          <Button type="button" variant="brand" className="min-w-[10rem] px-5" onClick={onStaySignedIn}>
            Stay Signed In
          </Button>
        </div>
      </div>
    </div>
  );
}

function IdleWarningIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 9v4M12 17h.01"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
