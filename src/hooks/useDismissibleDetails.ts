"use client";

import { useCallback, useEffect, useRef, type MouseEvent } from "react";

/**
 * Makes a `<details>` popover behave like a menu: it closes when you click anywhere else, press Escape (focus goes back to
 * its trigger), or pick something inside it. A plain `<details>` only closes when its own summary is clicked again.
 *
 * Put `ref` on the `<details>` and `closeOnSelect` on the panel's `onClick`.
 */
export function useDismissibleDetails() {
  const ref = useRef<HTMLDetailsElement>(null);

  // Side effect: listens on the document so a click or key anywhere on the page can dismiss the menu.
  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const el = ref.current;
      if (el?.open && event.target instanceof Node && !el.contains(event.target)) el.open = false;
    };
    const onKeyDown = (event: KeyboardEvent) => {
      const el = ref.current;
      if (event.key === "Escape" && el?.open) {
        el.open = false;
        el.querySelector("summary")?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const closeOnSelect = useCallback((event: MouseEvent) => {
    if (event.target instanceof Element && event.target.closest("button, a") && ref.current) ref.current.open = false;
  }, []);

  return { ref, closeOnSelect };
}
