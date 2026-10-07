"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { installGlobalHandlers, trackPageView } from "@/lib/telemetry/client";
import { startWebVitals } from "@/lib/telemetry/webVitals";

/** Starts browser telemetry for the signed-in app: global error handlers and web vitals once, a page view on every navigation. Renders nothing. */
export function TelemetryHost() {
  const pathname = usePathname();

  // Side effect: browser-level listeners that live as long as the app does.
  useEffect(() => {
    const stopHandlers = installGlobalHandlers();
    const stopVitals = startWebVitals();
    return () => {
      stopHandlers();
      stopVitals();
    };
  }, []);

  // Side effect: one page view per navigation.
  useEffect(() => {
    trackPageView(pathname);
  }, [pathname]);

  return null;
}
