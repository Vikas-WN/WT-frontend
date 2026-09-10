/**
 * Transient feedback for page-level loads and user actions.
 *
 * House rule (see memory `webtrak-feedback-pattern`):
 *   - Desktop / pointer devices  → corner toast.
 *   - Phones / touch devices      → centre-screen splash (the same "screen
 *     message" pattern used after submitting a leave request), never a toast.
 *
 * Do NOT sprinkle inline "Loading…/Refreshing…/Error" text lines on pages — use
 * a proper centred loader for loading, a centred empty state for "no data", and
 * these helpers for anything transient. (Contextual text *inside* a modal or a
 * search box is fine — that's not a page-level message.)
 */

import { showActionSplash } from "@/lib/actionSplash";
import { showErrorToast, showSuccessToast } from "@/lib/toast";

function isTouchViewport(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return (
      window.matchMedia("(max-width: 640px)").matches ||
      window.matchMedia("(pointer: coarse)").matches
    );
  } catch {
    return window.innerWidth <= 640;
  }
}

export function notifyError(message: string): void {
  if (isTouchViewport()) {
    showActionSplash(message, { variant: "error", durationMs: 2400 });
  } else {
    showErrorToast(message);
  }
}

export function notifySuccess(message: string): void {
  if (isTouchViewport()) {
    showActionSplash(message, { variant: "success" });
  } else {
    showSuccessToast(message);
  }
}
