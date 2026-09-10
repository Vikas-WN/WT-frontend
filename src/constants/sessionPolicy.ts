/** Session security policy — keep in sync with backend SESSION_* settings. */
export const SESSION_INACTIVITY_MS =
  Number(process.env.NEXT_PUBLIC_SESSION_INACTIVITY_MINUTES ?? 240) * 60 * 1000;

export const SESSION_MAX_MS =
  Number(process.env.NEXT_PUBLIC_SESSION_MAX_HOURS ?? 8) * 60 * 60 * 1000;

/** Ping server activity before idle cutoff (server also enforces inactivity). */
export const SESSION_ACTIVITY_PING_MS = 5 * 60 * 1000;

/** Refresh access token while user is active (access token default 30 min). */
export const SESSION_REFRESH_INTERVAL_MS = 25 * 60 * 1000;

export const SESSION_STORAGE_STARTED_AT = "wt.sessionStartedAt";
export const SESSION_STORAGE_LAST_ACTIVITY = "wt.lastActivityAt";

export const SESSION_IDLE_WARNING_MS = 5 * 60 * 1000;

export type SessionLogoutReason = "idle" | "expired" | "server" | "inactive";

/** localStorage keys — the real idle/max window the server reported for this
 *  user, so the sign-out dialog (which may render on /login after a redirect,
 *  with no auth context) can state the actual duration instead of a guess. */
export const SESSION_POLICY_STORAGE_INACTIVITY_MIN = "wt.sessionInactivityMinutes";
export const SESSION_POLICY_STORAGE_MAX_HOURS = "wt.sessionMaxHours";

export function persistSessionPolicy(policy: {
  inactivityMinutes?: number | null;
  maxHours?: number | null;
}): void {
  if (typeof window === "undefined") return;
  try {
    if (policy.inactivityMinutes && Number.isFinite(policy.inactivityMinutes)) {
      window.localStorage.setItem(
        SESSION_POLICY_STORAGE_INACTIVITY_MIN,
        String(Math.round(policy.inactivityMinutes))
      );
    }
    if (policy.maxHours && Number.isFinite(policy.maxHours)) {
      window.localStorage.setItem(
        SESSION_POLICY_STORAGE_MAX_HOURS,
        String(Math.round(policy.maxHours))
      );
    }
  } catch {
    /* storage unavailable — the dialog just falls back to generic wording */
  }
}

export function readPersistedSessionPolicy(): {
  inactivityMinutes: number | null;
  maxHours: number | null;
} {
  if (typeof window === "undefined") return { inactivityMinutes: null, maxHours: null };
  try {
    const mins = Number(window.localStorage.getItem(SESSION_POLICY_STORAGE_INACTIVITY_MIN));
    const hrs = Number(window.localStorage.getItem(SESSION_POLICY_STORAGE_MAX_HOURS));
    return {
      inactivityMinutes: Number.isFinite(mins) && mins > 0 ? mins : null,
      maxHours: Number.isFinite(hrs) && hrs > 0 ? hrs : null,
    };
  } catch {
    return { inactivityMinutes: null, maxHours: null };
  }
}

/** Human-readable "2 hours 30 minutes" / "45 minutes" / "4 hours". */
export function formatSessionDuration(totalMinutes: number): string {
  const m = Math.max(1, Math.round(totalMinutes));
  const hours = Math.floor(m / 60);
  const mins = m % 60;
  const hPart = hours ? `${hours} hour${hours > 1 ? "s" : ""}` : "";
  const mPart = mins ? `${mins} minute${mins > 1 ? "s" : ""}` : "";
  return [hPart, mPart].filter(Boolean).join(" ") || "1 minute";
}

/**
 * Sign-out dialog copy. The idle / expiry durations are read from the server's
 * per-user policy (passed in, or the last persisted values) rather than
 * hard-coded — a "4 hours of inactivity" message that fired after 30 minutes
 * was the actual complaint.
 */
export function sessionLogoutMessage(
  reason: SessionLogoutReason,
  opts?: { inactivityMinutes?: number | null; maxHours?: number | null }
): string {
  const fallback = readPersistedSessionPolicy();
  const inactivityMinutes = opts?.inactivityMinutes ?? fallback.inactivityMinutes;
  const maxHours = opts?.maxHours ?? fallback.maxHours;
  switch (reason) {
    case "idle":
      return inactivityMinutes && inactivityMinutes > 0
        ? `You were signed out after ${formatSessionDuration(inactivityMinutes)} of inactivity.`
        : "You were signed out after a period of inactivity.";
    case "expired":
      return maxHours && maxHours > 0
        ? `Your session reached its ${maxHours}-hour limit. Please sign in again.`
        : "Your session has expired. Please sign in again.";
    case "inactive":
      return "Your account is inactive. Please contact HR.";
    default:
      return "Your session has ended. Please sign in again.";
  }
}

/** @deprecated Use {@link sessionLogoutMessage} — this cannot show the real window. */
export const sessionLogoutMessages: Record<SessionLogoutReason, string> = {
  idle: "You were signed out after a period of inactivity.",
  expired: "Your session has expired. Please sign in again.",
  server: "Your session has ended. Please sign in again.",
  inactive: "Your account is inactive. Please contact HR.",
};

export const sessionLogoutTitles: Record<SessionLogoutReason, string> = {
  idle: "Logged Out Due to Inactivity",
  expired: "Session Expired",
  server: "Session Ended",
  inactive: "Account Inactive",
};

export function sessionLogoutReasonToErrorCode(reason: SessionLogoutReason): string {
  if (reason === "idle") return "session_idle_timeout";
  if (reason === "expired") return "session_expired";
  if (reason === "inactive") return "account_inactive";
  return "oauth_login_failed";
}

export function sessionLogoutReasonFromErrorCode(code: string): SessionLogoutReason | null {
  if (code === "session_idle_timeout") return "idle";
  if (code === "session_expired") return "expired";
  if (code === "account_inactive") return "inactive";
  return null;
}
