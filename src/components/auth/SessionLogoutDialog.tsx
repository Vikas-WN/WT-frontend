"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
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
  // Lock the page behind the cover so it cannot be scrolled or interacted with.
  useEffect(() => {
    if (!open || typeof document === "undefined") return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  const title = sessionLogoutTitles[reason];
  const message = sessionLogoutMessages[reason];

  // Render at the document root so a transformed ancestor (the dashboard's
  // animated <main>) can never turn this fixed cover into a partial overlay.
  return createPortal(
    <div
      // Opaque, top-most cover: once the session has ended the app content behind
      // must be fully hidden and non-interactive until the user signs in again.
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-wt-bg p-4"
      role="presentation"
      onClick={(event) => event.stopPropagation()}
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
    </div>,
    document.body
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
