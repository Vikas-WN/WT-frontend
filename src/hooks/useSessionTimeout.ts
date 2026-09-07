"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  SESSION_ACTIVITY_PING_MS,
  SESSION_IDLE_WARNING_MS,
  SESSION_INACTIVITY_MS,
  SESSION_MAX_MS,
  SESSION_REFRESH_INTERVAL_MS,
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
 * Logs the user out after 4 hours of inactivity or 8 hours absolute session age.
 * Activity: mouse, keyboard, scroll, touch, focus, and client-side navigation.
 */
export function useSessionTimeout(
  enabled: boolean,
  onTimeout: (reason: SessionLogoutReason) => void,
  onIdleWarning?: (minutesRemaining: number) => void,
  options?: {
    inactivityMs?: number;
    maxMs?: number;
    activityPingMs?: number;
    idleWarningMs?: number;
    refreshIntervalMs?: number;
  }
): { extendSession: () => void } {
  const pathname = usePathname();
  const onTimeoutRef = useRef(onTimeout);
  const onIdleWarningRef = useRef(onIdleWarning);
  const lastActivityRef = useRef(Date.now());
  const lastPingRef = useRef(Date.now());
  const lastRefreshRef = useRef(Date.now());
  const idleWarningShownRef = useRef(false);
  const inactivityMs = options?.inactivityMs ?? SESSION_INACTIVITY_MS;
  const maxMs = options?.maxMs ?? SESSION_MAX_MS;
  const activityPingMs = options?.activityPingMs ?? SESSION_ACTIVITY_PING_MS;
  const idleWarningMs = Math.min(options?.idleWarningMs ?? SESSION_IDLE_WARNING_MS, inactivityMs);
  const refreshIntervalMs = options?.refreshIntervalMs ?? SESSION_REFRESH_INTERVAL_MS;

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
    lastRefreshRef.current = now;

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

    const intervalId = window.setInterval(async () => {
      const now = Date.now();
      const sessionStart = readSessionStartMs();
      const idleFor = now - lastActivityRef.current;

      if (now - sessionStart >= maxMs) {
        idleWarningShownRef.current = false;
        onTimeoutRef.current("expired");
        return;
      }
      if (idleFor >= inactivityMs) {
        idleWarningShownRef.current = false;
        onTimeoutRef.current("idle");
        return;
      }

      const warningThreshold = inactivityMs - idleWarningMs;
      if (
        idleFor >= warningThreshold &&
        !idleWarningShownRef.current &&
        onIdleWarningRef.current
      ) {
        idleWarningShownRef.current = true;
        const minutesLeft = Math.max(1, Math.ceil((inactivityMs - idleFor) / 60_000));
        onIdleWarningRef.current(minutesLeft);
      }

      if (idleFor < inactivityMs && now - lastPingRef.current >= activityPingMs) {
        lastPingRef.current = now;
        void recordSessionActivity().catch(() => undefined);
      }

      // Proactively refresh access token before it expires (default 25 min vs 30 min expiry).
      // This avoids 401->refresh races when the access token expires during activity.
      if (idleFor < inactivityMs && now - lastRefreshRef.current >= refreshIntervalMs) {
        lastRefreshRef.current = now;
        const { attemptTokenRefresh } = await import("@/lib/auth");
        void attemptTokenRefresh().catch(() => undefined);
      }
    }, 30_000);

    return () => {
      for (const eventName of events) {
        window.removeEventListener(eventName, onActivity, { capture: true } as AddEventListenerOptions);
      }
      window.clearInterval(intervalId);
    };
  }, [activityPingMs, bumpActivity, enabled, idleWarningMs, inactivityMs, maxMs, refreshIntervalMs]);

  useEffect(() => {
    if (enabled) bumpActivity();
  }, [pathname, enabled, bumpActivity]);

  return { extendSession: bumpActivity };
}
