import type { SessionLogoutReason } from "@/constants/sessionPolicy";

export const SESSION_LOGOUT_EVENT = "wt:session-logout";

export type SessionLogoutEventDetail = {
  reason: SessionLogoutReason;
};

export function dispatchSessionLogout(reason: SessionLogoutReason): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<SessionLogoutEventDetail>(SESSION_LOGOUT_EVENT, {
      detail: { reason },
    })
  );
}

/** Map FastAPI / BFF auth error codes to a session logout reason. */
export function sessionLogoutReasonFromApiDetail(detail: string): SessionLogoutReason | null {
  const key = detail.trim().toLowerCase();
  if (key === "session_idle_timeout") return "idle";
  if (key === "session_expired") return "expired";
  return null;
}
