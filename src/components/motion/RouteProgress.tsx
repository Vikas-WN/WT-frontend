"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * A thin brand-coloured bar at the top that starts when you click an in-app link and finishes when the new page
 * has arrived — so navigation never feels like nothing happened.
 */
export function RouteProgress() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  // UI state: idle (hidden) | running (creeping forward) | done (snapping to the end and fading).
  const [state, setState] = useState<"idle" | "running" | "done">("idle");
  const first = useRef(true);

  // Side effect: a document-level click listener notices link clicks that will navigate within the app.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest?.("a");
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      setState("running");
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  // Side effect: the route changing means the new page is in — finish the bar, then hide it.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setState("done");
    const timer = window.setTimeout(() => setState("idle"), 420);
    return () => window.clearTimeout(timer);
  }, [pathname, search]);

  if (state === "idle") return null;
  return <div className="wt-route-progress" data-state={state} aria-hidden />;
}
