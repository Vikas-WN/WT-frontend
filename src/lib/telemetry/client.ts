"use client";

import { recordError } from "@/lib/diagnostics/recorder";

/**
 * Browser telemetry: what the real users' browsers saw — page views, Core Web Vitals, errors and failed API calls — batched and sent
 * to the backend (POST /api/v1/telemetry/events), where it becomes metrics, log lines and usage counts.
 *
 * Rules it keeps: no personal data (routes are sent without ids or query strings — the server strips them again), no request or response
 * bodies, no console output, bounded memory, and a failure to report is silent: telemetry must never be the thing that breaks the page.
 */

const ENDPOINT = "/api/v1/telemetry/events";
const FLUSH_EVERY_MS = 10_000;
const MAX_BATCH = 30;
const MAX_QUEUE = 120;
const MESSAGE_MAX = 500;
const STACK_MAX = 2500;

export type TelemetryEvent =
  | { type: "page_view"; route: string }
  | { type: "web_vital"; route: string; name: string; value: number; rating?: string }
  | { type: "client_error"; route: string; kind: "js" | "promise" | "react" | "api"; message: string; stack?: string }
  | { type: "api_failure"; route: string; status?: number; kind?: "network" | "timeout" }
  | { type: "feature"; name: string; route?: string };

export const RELEASE = process.env.NEXT_PUBLIC_APP_RELEASE?.trim() || "dev";

let queue: TelemetryEvent[] = [];
let timer: number | null = null;
let installed = false;
let lastErrorKey = "";
let lastErrorAt = 0;

/** The page the person is on, without ids or query strings. */
export function currentRoute(): string {
  if (typeof window === "undefined") return "/unknown";
  return window.location.pathname || "/unknown";
}

function enqueue(event: TelemetryEvent): void {
  if (typeof window === "undefined") return;
  if (queue.length >= MAX_QUEUE) queue = queue.slice(-Math.floor(MAX_QUEUE / 2)); // drop the oldest rather than grow without limit
  queue.push(event);
  if (queue.length >= MAX_BATCH) {
    flush();
  } else if (timer === null) {
    timer = window.setTimeout(flush, FLUSH_EVERY_MS);
  }
}

/** Send what is queued. Uses `sendBeacon` so it survives the page closing; falls back to a keep-alive fetch. */
export function flush(): void {
  if (typeof window === "undefined") return;
  if (timer !== null) {
    window.clearTimeout(timer);
    timer = null;
  }
  if (queue.length === 0) return;
  const events = queue.slice(0, MAX_BATCH);
  queue = queue.slice(MAX_BATCH);
  const body = JSON.stringify({ release: RELEASE, events });
  try {
    const sent = typeof navigator.sendBeacon === "function" && navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "application/json" }));
    if (!sent) {
      void fetch(ENDPOINT, { method: "POST", headers: { "content-type": "application/json" }, body, keepalive: true, credentials: "include" }).catch(() => undefined);
    }
  } catch {
    /* never let reporting break anything */
  }
  if (queue.length > 0) timer = window.setTimeout(flush, 1_000);
}

export function trackPageView(route: string = currentRoute()): void {
  enqueue({ type: "page_view", route });
}

export function trackWebVital(name: string, value: number, rating?: string): void {
  enqueue({ type: "web_vital", route: currentRoute(), name, value, rating });
}

/** A named product action, e.g. "approval_approve". Names are lowercase letters, digits, `_ . -`. */
export function trackFeature(name: string): void {
  enqueue({ type: "feature", name, route: currentRoute() });
}

export function reportApiFailure(status: number | undefined, kind?: "network" | "timeout"): void {
  enqueue({ type: "api_failure", route: currentRoute(), status, kind });
}

/** Report an error from the browser. The same error repeating in a burst (a render loop) is reported once. */
export function reportClientError(kind: "js" | "promise" | "react" | "api", error: unknown): void {
  const err = error instanceof Error ? error : new Error(typeof error === "string" ? error : "Unknown error");
  const message = (err.message || err.name || "Error").slice(0, MESSAGE_MAX);
  const key = `${kind}|${message}`;
  const now = Date.now();
  if (key === lastErrorKey && now - lastErrorAt < 5_000) return;
  lastErrorKey = key;
  lastErrorAt = now;
  recordError(kind, message);
  enqueue({ type: "client_error", route: currentRoute(), kind, message, stack: err.stack?.slice(0, STACK_MAX) });
}

/** Hook up the global error handlers and the "send before the page goes away" flush. Safe to call more than once. */
export function installGlobalHandlers(): () => void {
  if (typeof window === "undefined" || installed) return () => undefined;
  installed = true;
  const onError = (event: ErrorEvent) => {
    // Cross-origin script noise ("Script error.") has no information and cannot be acted on.
    if (event.message === "Script error." && !event.filename) return;
    reportClientError("js", event.error ?? new Error(event.message));
  };
  const onRejection = (event: PromiseRejectionEvent) => reportClientError("promise", event.reason);
  const onHide = () => {
    if (document.visibilityState === "hidden") flush();
  };
  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onRejection);
  document.addEventListener("visibilitychange", onHide);
  window.addEventListener("pagehide", flush);
  return () => {
    installed = false;
    window.removeEventListener("error", onError);
    window.removeEventListener("unhandledrejection", onRejection);
    document.removeEventListener("visibilitychange", onHide);
    window.removeEventListener("pagehide", flush);
  };
}
