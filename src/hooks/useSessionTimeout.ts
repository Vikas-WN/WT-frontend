"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  SESSION_ACTIVITY_PING_MS,
  SESSION_IDLE_WARNING_MS,
  SESSION_INACTIVITY_MS,
  SESSION_REFRESH_INTERVAL_MS,
  SESSION_STORAGE_LAST_ACTIVITY,
  type SessionLogoutReason,
} from "@/constants/sessionPolicy";
import { recordSessionActivity } from "@/lib/auth";
import {
  isIdleExpired,
  isInWarningWindow,
  latestActivity,
  parseStoredActivity,
  resolveInitialActivity,
  shouldPingActivity,
} from "@/utils/sessionActivity";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

/** Last activity recorded by ANY tab. Storage can be blocked, so never throw. */
function readSharedActivity(): number | null {
  if (!isBrowser()) return null;
  try {
    return parseStoredActivity(window.localStorage.getItem(SESSION_STORAGE_LAST_ACTIVITY));
  } catch {
    return null;
  }
}

function writeSharedActivity(at: number): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(SESSION_STORAGE_LAST_ACTIVITY, String(at));
  } catch {
    /* storage blocked — this tab still tracks its own activity */
  }
}

export function recordLocalSessionActivity(): number {
  const now = Date.now();
  writeSharedActivity(now);
  return now;
}

export function persistSessionTiming() {
  recordLocalSessionActivity();
}

export function clearSessionTiming() {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(SESSION_STORAGE_LAST_ACTIVITY);
  } catch {
    /* ignore */
  }
}

/**
 * Signs the user out after 4 hours of inactivity — no mouse movement and no
 * keystroke (scroll/touch count too, for touch devices) in any open tab — and
 * for nothing else. Session age never matters.
 *
 * Activity is shared between tabs through localStorage. Each tab used to keep
 * its own clock, so a background tab that had sat untouched for 4 hours signed
 * the user out (logout is session-wide) while they were working in another tab.
 */
export function useSessionTimeout(
  enabled: boolean,
  onTimeout: (reason: SessionLogoutReason) => void,
  onIdleWarning?: (minutesRemaining: number) => void,
  options?: {
    inactivityMs?: number;
    activityPingMs?: number;
    idleWarningMs?: number;
    refreshIntervalMs?: number;
    /** Activity (here or in another tab) made an open idle warning obsolete. */
    onIdleWarningCleared?: () => void;
  }
): { extendSession: () => void } {
  const pathname = usePathname();
  const onTimeoutRef = useRef(onTimeout);
  const onIdleWarningRef = useRef(onIdleWarning);
  const onIdleWarningClearedRef = useRef(options?.onIdleWarningCleared);
  // Read the clock once, lazily; the real starting values are set when tracking begins.
  const [mountedAt] = useState(() => Date.now());
  const lastActivityRef = useRef(mountedAt);
  const lastPingRef = useRef(mountedAt);
  const lastRefreshRef = useRef(mountedAt);
  const idleWarningShownRef = useRef(false);
  const inactivityMs = options?.inactivityMs ?? SESSION_INACTIVITY_MS;
  const activityPingMs = options?.activityPingMs ?? SESSION_ACTIVITY_PING_MS;
  const idleWarningMs = Math.min(options?.idleWarningMs ?? SESSION_IDLE_WARNING_MS, inactivityMs);
  const refreshIntervalMs = options?.refreshIntervalMs ?? SESSION_REFRESH_INTERVAL_MS;

  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  useEffect(() => {
    onIdleWarningRef.current = onIdleWarning;
  }, [onIdleWarning]);

  useEffect(() => {
    onIdleWarningClearedRef.current = options?.onIdleWarningCleared;
  }, [options?.onIdleWarningCleared]);

  const clearWarning = useCallback(() => {
    if (!idleWarningShownRef.current) return;
    idleWarningShownRef.current = false;
    onIdleWarningClearedRef.current?.();
  }, []);

  /** Latest activity from this tab or any other. */
  const currentLastActivity = useCallback(
    () => latestActivity(lastActivityRef.current, readSharedActivity()),
    []
  );

  const bumpActivity = useCallback(() => {
    clearWarning();
    const now = Date.now();
    lastActivityRef.current = now;
    writeSharedActivity(now);
  }, [clearWarning]);

  useEffect(() => {
    if (!enabled) return;

    const now = Date.now();
    lastActivityRef.current = resolveInitialActivity(readSharedActivity(), now, inactivityMs);
    writeSharedActivity(lastActivityRef.current);
    lastPingRef.current = now;
    lastRefreshRef.current = now;

    // Mouse movement and keystrokes are the activity; scroll/touch/click/pointer
    // cover touch devices and scroll-only use. "focus" is deliberately not one:
    // a window regaining focus says nothing about the user being here (see onReturn).
    const events: Array<keyof WindowEventMap> = [
      "mousedown",
      "mousemove",
      "keydown",
      "click",
      "scroll",
      "wheel",
      "touchstart",
      "pointerdown",
      "input",
      "change",
    ];

    // Input after the idle limit has already passed must not revive the session:
    // timers are throttled or frozen in a background tab / sleeping laptop, so the
    // interval below may not have fired yet. The server would refuse it anyway.
    const expireIfIdle = (): boolean => {
      if (!isIdleExpired(Date.now(), currentLastActivity(), inactivityMs)) return false;
      clearWarning();
      onTimeoutRef.current("idle");
      return true;
    };

    let moveThrottleUntil = 0;
    const onActivity = (event: Event) => {
      if (event.type === "mousemove") {
        const at = Date.now();
        if (at < moveThrottleUntil) return;
        moveThrottleUntil = at + 2_000;
      }
      if (expireIfIdle()) return;
      bumpActivity();
    };
    for (const eventName of events) {
      // capture:true so nested dashboard scroll containers still count as activity
      window.addEventListener(eventName, onActivity, { passive: true, capture: true });
    }

    // Another tab saw the user: adopt it, and close a warning that no longer applies.
    const onStorage = (event: StorageEvent) => {
      if (event.key !== SESSION_STORAGE_LAST_ACTIVITY) return;
      const at = parseStoredActivity(event.newValue);
      if (at != null && at > lastActivityRef.current) {
        lastActivityRef.current = at;
        clearWarning();
      }
    };
    window.addEventListener("storage", onStorage);

    // Coming back to the tab (or window). If 4 hours have passed, that is a
    // sign-out; otherwise the user is here, so renew the session promptly rather
    // than waiting for a (possibly still-throttled) timer.
    const onReturn = () => {
      if (document.visibilityState !== "visible") return;
      if (expireIfIdle()) return;
      bumpActivity();
      const at = Date.now();
      lastPingRef.current = at;
      void recordSessionActivity().catch(() => undefined);
      if (at - lastRefreshRef.current >= refreshIntervalMs) {
        lastRefreshRef.current = at;
        void import("@/lib/auth").then(({ attemptTokenRefresh }) =>
          attemptTokenRefresh().catch(() => undefined)
        );
      }
    };
    document.addEventListener("visibilitychange", onReturn);
    window.addEventListener("focus", onReturn);

    const intervalId = window.setInterval(async () => {
      const at = Date.now();
      const last = currentLastActivity();
      lastActivityRef.current = last;

      if (isIdleExpired(at, last, inactivityMs)) {
        clearWarning();
        onTimeoutRef.current("idle");
        return;
      }

      if (isInWarningWindow(at, last, inactivityMs, idleWarningMs)) {
        if (!idleWarningShownRef.current && onIdleWarningRef.current) {
          idleWarningShownRef.current = true;
          onIdleWarningRef.current(Math.max(1, Math.ceil((inactivityMs - (at - last)) / 60_000)));
        }
      } else {
        clearWarning();
      }

      // Tell the server only when the user actually did something since the last ping.
      if (shouldPingActivity(at, last, lastPingRef.current, activityPingMs)) {
        lastPingRef.current = at;
        void recordSessionActivity().catch(() => undefined);
      }

      // Keep the access token fresh (30 min expiry vs this 25 min cadence) so it
      // doesn't lapse mid-activity and force a 401 -> refresh round trip.
      if (at - lastRefreshRef.current >= refreshIntervalMs) {
        lastRefreshRef.current = at;
        const { attemptTokenRefresh } = await import("@/lib/auth");
        void attemptTokenRefresh().catch(() => undefined);
      }
    }, 30_000);

    return () => {
      for (const eventName of events) {
        window.removeEventListener(eventName, onActivity, { capture: true } as AddEventListenerOptions);
      }
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onReturn);
      window.removeEventListener("focus", onReturn);
      window.clearInterval(intervalId);
    };
  }, [activityPingMs, bumpActivity, clearWarning, currentLastActivity, enabled, idleWarningMs, inactivityMs, refreshIntervalMs]);

  useEffect(() => {
    if (enabled) bumpActivity();
  }, [pathname, enabled, bumpActivity]);

  return { extendSession: bumpActivity };
}
