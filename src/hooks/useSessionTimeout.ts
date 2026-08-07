"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  SESSION_ACTIVITY_PING_MS,
  SESSION_IDLE_WARNING_MS,
  SESSION_INACTIVITY_MS,
  SESSION_MAX_MS,
  SESSION_STORAGE_LAST_ACTIVITY,
  SESSION_STORAGE_STARTED_AT,
  type SessionLogoutReason,
} from "@/constants/sessionPolicy";
import { recordSessionActivity } from "@/lib/auth";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function readSessionStartMs(): number {
  if (!isBrowser()) return Date.now();
  const raw = sessionStorage.getItem(SESSION_STORAGE_STARTED_AT);
  if (!raw) return Date.now();
  const parsed = Date.parse(raw);
  return Number.isFinite(parsed) ? parsed : Date.now();
}

function readLastActivityMs(): number {
  if (!isBrowser()) return Date.now();
  const raw = sessionStorage.getItem(SESSION_STORAGE_LAST_ACTIVITY);
  if (!raw) return Date.now();
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : Date.now();
}

function touchLocalActivity() {
  const now = Date.now();
  if (!isBrowser()) return now;
  sessionStorage.setItem(SESSION_STORAGE_LAST_ACTIVITY, String(now));
  return now;
}

export function recordLocalSessionActivity(): number {
  return touchLocalActivity();
}

export function persistSessionTiming(sessionStartedAt?: string | null) {
  if (!isBrowser()) return;
  const started = sessionStartedAt ? Date.parse(sessionStartedAt) : Date.now();
  sessionStorage.setItem(SESSION_STORAGE_STARTED_AT, new Date(started).toISOString());
  touchLocalActivity();
}

export function clearSessionTiming() {
  if (!isBrowser()) return;
  sessionStorage.removeItem(SESSION_STORAGE_STARTED_AT);
  sessionStorage.removeItem(SESSION_STORAGE_LAST_ACTIVITY);
}

/**
 * Logs the user out after 30 minutes of inactivity or 8 hours absolute session age.
 * Activity: mouse, keyboard, scroll, touch, focus, and client-side navigation.
 */
export function useSessionTimeout(
  enabled: boolean,
  onTimeout: (reason: SessionLogoutReason) => void,
  onIdleWarning?: (minutesRemaining: number) => void
): { extendSession: () => void } {
  const pathname = usePathname();
  const onTimeoutRef = useRef(onTimeout);
  const onIdleWarningRef = useRef(onIdleWarning);
  const lastActivityRef = useRef(Date.now());
  const lastPingRef = useRef(Date.now());
  const idleWarningShownRef = useRef(false);

  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  useEffect(() => {
    onIdleWarningRef.current = onIdleWarning;
  }, [onIdleWarning]);

  const bumpActivity = useCallback(() => {
    idleWarningShownRef.current = false;
    lastActivityRef.current = touchLocalActivity();
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const now = Date.now();
    lastActivityRef.current = readLastActivityMs();
    lastPingRef.current = now;

    const events: Array<keyof WindowEventMap> = [
      "mousedown",
      "mousemove",
      "keydown",
      "click",
      "scroll",
      "touchstart",
      "pointerdown",
      "focus",
      "input",
      "change",
    ];

    let moveThrottleUntil = 0;
    const onActivity = (event: Event) => {
      if (event.type === "mousemove") {
        const now = Date.now();
        if (now < moveThrottleUntil) return;
        moveThrottleUntil = now + 2_000;
      }
      bumpActivity();
    };
    for (const eventName of events) {
      // capture:true so nested dashboard scroll containers still count as activity
      window.addEventListener(eventName, onActivity, { passive: true, capture: true });
    }

    const intervalId = window.setInterval(() => {
      const now = Date.now();
      const sessionStart = readSessionStartMs();
      const idleFor = now - lastActivityRef.current;

      if (now - sessionStart >= SESSION_MAX_MS) {
        idleWarningShownRef.current = false;
        onTimeoutRef.current("expired");
        return;
      }
      if (idleFor >= SESSION_INACTIVITY_MS) {
        idleWarningShownRef.current = false;
        onTimeoutRef.current("idle");
        return;
      }

      const warningThreshold = SESSION_INACTIVITY_MS - SESSION_IDLE_WARNING_MS;
      if (
        idleFor >= warningThreshold &&
        !idleWarningShownRef.current &&
        onIdleWarningRef.current
      ) {
        idleWarningShownRef.current = true;
        const minutesLeft = Math.max(1, Math.ceil((SESSION_INACTIVITY_MS - idleFor) / 60_000));
        onIdleWarningRef.current(minutesLeft);
      }

      if (idleFor < SESSION_INACTIVITY_MS && now - lastPingRef.current >= SESSION_ACTIVITY_PING_MS) {
        lastPingRef.current = now;
        void recordSessionActivity().catch(() => undefined);
      }

      // Access-token refresh is handled reactively by the HTTP client on 401
      // (single-flight refresh + retry), so no proactive timer refresh here.
    }, 30_000);

    return () => {
      for (const eventName of events) {
        window.removeEventListener(eventName, onActivity, { capture: true } as AddEventListenerOptions);
      }
      window.clearInterval(intervalId);
    };
  }, [enabled, bumpActivity]);

  useEffect(() => {
    if (enabled) bumpActivity();
  }, [pathname, enabled, bumpActivity]);

  return { extendSession: bumpActivity };
}
