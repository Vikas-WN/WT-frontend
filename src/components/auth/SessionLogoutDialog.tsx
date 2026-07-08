"use client";

import { Button } from "@/components/ui/button";
import {
  sessionLogoutMessages,
  sessionLogoutTitles,
  type SessionLogoutReason,
} from "@/constants/sessionPolicy";

export function SessionLogoutDialog({
  open,
  reason,
  onConfirm,
}: {
  open: boolean;
  reason: SessionLogoutReason;
  onConfirm: () => void;
}) {
  if (!open) return null;

  const title = sessionLogoutTitles[reason];
  const message = sessionLogoutMessages[reason];

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]"
      role="presentation"
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="session-logout-title"
        aria-describedby="session-logout-description"
        className="w-full max-w-md rounded-2xl border border-wt-border bg-wt-surface-1 p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-amber-500/15 text-amber-600">
          <SessionEndedIcon />
        </div>
        <h2
          id="session-logout-title"
          className="mt-4 text-center text-lg font-semibold text-wt-text"
        >
          {title}
        </h2>
        <p
          id="session-logout-description"
          className="mt-2 text-center text-sm leading-relaxed text-wt-text-muted"
        >
          {message}
        </p>
        <div className="mt-6 flex justify-center">
          <Button type="button" variant="brand" className="min-w-[10rem] px-5" onClick={onConfirm}>
            Sign In Again
          </Button>
        </div>
      </div>
    </div>
  );
}

function SessionEndedIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
