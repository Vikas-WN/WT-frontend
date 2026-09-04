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

export const sessionLogoutMessages: Record<SessionLogoutReason, string> = {
  idle: "You were logged out after 4 hours of inactivity.",
  expired: "Your session has expired after 8 hours. Please sign in again.",
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
