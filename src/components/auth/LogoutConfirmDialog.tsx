"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { UI_COPY } from "@/constants/uiCopy";

export function LogoutConfirmDialog({
  open,
  loading = false,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) {
        onCancel();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [loading, onCancel, open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[195] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]"
      role="presentation"
      onClick={loading ? undefined : onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="logout-confirm-title"
        aria-describedby="logout-confirm-description"
        className="w-full max-w-md rounded-2xl border border-wt-border bg-wt-surface-1 p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <LogoutIcon />
        </div>
        <h2
          id="logout-confirm-title"
          className="mt-4 text-center text-lg font-semibold text-wt-text"
        >
          Log Out?
        </h2>
        <p
          id="logout-confirm-description"
          className="mt-2 text-center text-sm leading-relaxed text-wt-text-muted"
        >
          You will need to sign in again to access WebTrak. Any unsaved changes may be lost.
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
          <Button
            type="button"
            variant="outline"
            className="min-w-[8rem]"
            onClick={onCancel}
            disabled={loading}
          >
            {UI_COPY.cancel}
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="min-w-[8rem]"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Logging Out…" : "Log Out"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function LogoutIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 17l5-5-5-5M21 12H9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
