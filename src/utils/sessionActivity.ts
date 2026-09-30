/**
 * Pure rules behind the inactivity timer. A session ends only after the idle
 * limit with no keystroke or mouse activity — in *any* open tab. No React, no app
 * imports, so the decisions can be unit-tested on their own.
 */

/** Parses a stored epoch-ms timestamp; null when absent or not a sane number. */
export function parseStoredActivity(raw: string | null | undefined): number | null {
  if (raw == null || raw === "") return null;
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : null;
}

/**
 * Where this tab's idle clock starts. The stored value is shared by every tab,
 * so it survives a browser restart: anything older than the limit is leftover
 * from a previous visit, and the session was only just validated by the server —
 * so the user is here now. Without this a fresh login could sign itself out.
 */
export function resolveInitialActivity(stored: number | null, now: number, idleLimitMs: number): number {
  if (stored == null || stored > now) return now;
  return now - stored >= idleLimitMs ? now : stored;
}

/** The most recent activity across this tab's own clock and what other tabs recorded. */
export function latestActivity(...times: Array<number | null | undefined>): number {
  let latest = 0;
  for (const time of times) {
    if (time != null && Number.isFinite(time) && time > latest) latest = time;
  }
  return latest;
}

export function idleForMs(now: number, lastActivity: number): number {
  return Math.max(0, now - lastActivity);
}

export function isIdleExpired(now: number, lastActivity: number, idleLimitMs: number): boolean {
  return idleForMs(now, lastActivity) >= idleLimitMs;
}

/** True once idle time has reached the warning threshold but not yet the limit. */
export function isInWarningWindow(now: number, lastActivity: number, idleLimitMs: number, warningMs: number): boolean {
  const idle = idleForMs(now, lastActivity);
  return idle >= idleLimitMs - warningMs && idle < idleLimitMs;
}

/**
 * Whether to tell the server the user is active. Only when something actually
 * happened since the last ping — an idle tab must not keep the server-side
 * session alive by pinging on a timer.
 */
export function shouldPingActivity(now: number, lastActivity: number, lastPing: number, minIntervalMs: number): boolean {
  return lastActivity > lastPing && now - lastPing >= minIntervalMs;
}
