"use client";

import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

/** Renders a hand-rolled dialog at document.body, over the whole screen.
 *
 *  A `fixed` overlay rendered inline is positioned against the nearest
 *  ancestor with a transform or animation (a `.wt-soft-in` tab body, a card
 *  mid-transition) rather than the viewport, so it came up boxed inside its
 *  panel. Also locks page scroll while open and closes on Escape. */
export function ModalPortal({ children, onEscape }: { children: ReactNode; onEscape?: () => void }) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    if (!onEscape) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onEscape();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onEscape]);

  if (typeof document === "undefined") return null;
  return createPortal(children, document.body);
}
