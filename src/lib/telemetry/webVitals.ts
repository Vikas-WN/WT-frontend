"use client";

import { trackWebVital } from "@/lib/telemetry/client";
import { rate } from "@/lib/telemetry/rating";

/**
 * Core Web Vitals from the browser's own PerformanceObserver (no library): FCP, LCP, CLS, INP and TTFB, rated with Google's thresholds.
 * LCP, CLS and INP are final only when the page is hidden or left, so they are reported then; FCP and TTFB as soon as they are known.
 */

function observe(type: string, callback: (entries: PerformanceEntryList) => void, options: PerformanceObserverInit = {}): PerformanceObserver | null {
  try {
    if (!PerformanceObserver.supportedEntryTypes?.includes(type)) return null;
    const observer = new PerformanceObserver((list) => callback(list.getEntries()));
    observer.observe({ type, buffered: true, ...options });
    return observer;
  } catch {
    return null;
  }
}

export function startWebVitals(): () => void {
  if (typeof window === "undefined" || typeof PerformanceObserver === "undefined") return () => undefined;
  const observers: PerformanceObserver[] = [];
  const report = (name: string, value: number) => trackWebVital(name, Math.round(value * 1000) / 1000, rate(name, value));

  const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  if (nav && nav.responseStart > 0) report("TTFB", nav.responseStart);

  const fcp = observe("paint", (entries) => {
    const entry = entries.find((e) => e.name === "first-contentful-paint");
    if (entry) {
      report("FCP", entry.startTime);
      fcp?.disconnect();
    }
  });
  if (fcp) observers.push(fcp);

  let lcp = 0;
  const lcpObserver = observe("largest-contentful-paint", (entries) => {
    const last = entries[entries.length - 1];
    if (last) lcp = last.startTime;
  });
  if (lcpObserver) observers.push(lcpObserver);

  let cls = 0;
  const clsObserver = observe("layout-shift", (entries) => {
    for (const entry of entries as unknown as Array<{ value: number; hadRecentInput: boolean }>) {
      if (!entry.hadRecentInput) cls += entry.value;
    }
  });
  if (clsObserver) observers.push(clsObserver);

  let inp = 0;
  const inpObserver = observe(
    "event",
    (entries) => {
      for (const entry of entries as unknown as Array<{ duration: number; interactionId?: number }>) {
        if (entry.interactionId && entry.duration > inp) inp = entry.duration;
      }
    },
    { durationThreshold: 40 } as PerformanceObserverInit
  );
  if (inpObserver) observers.push(inpObserver);

  let reported = false;
  const finish = () => {
    if (reported || document.visibilityState !== "hidden") return;
    reported = true;
    if (lcp > 0) report("LCP", lcp);
    if (lcpObserver || clsObserver) report("CLS", cls);
    if (inp > 0) report("INP", inp);
  };
  document.addEventListener("visibilitychange", finish);
  window.addEventListener("pagehide", finish);

  return () => {
    observers.forEach((o) => o.disconnect());
    document.removeEventListener("visibilitychange", finish);
    window.removeEventListener("pagehide", finish);
  };
}
