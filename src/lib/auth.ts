/**
 * Auth API client — wraps all /api/v1/auth endpoints.
 * Cookies are HttpOnly and managed server-side; all requests use credentials: 'include'.
 */
import { endpoints } from "@/api/endpoints";
import { ApiError } from "@/api/error";
import { apiClient } from "@/api/httpClient";
import type { SessionLogoutReason } from "@/constants/sessionPolicy";
import {
  dispatchSessionLogout,
  sessionLogoutReasonFromApiDetail,
} from "@/lib/sessionLogoutBridge";

function sessionLogoutReasonFromApiError(error: ApiError): SessionLogoutReason {
  const payload = error.payload;
  const detail =
    typeof payload === "object" && payload && "detail" in payload
      ? String((payload as { detail?: unknown }).detail ?? "")
      : typeof payload === "string"
        ? payload
        : "";
  return sessionLogoutReasonFromApiDetail(detail) ?? "server";
}

function apiErrorDetail(error: ApiError): string {
  const payload = error.payload;
  if (typeof payload === "object" && payload && "detail" in payload) {
    return String((payload as { detail?: unknown }).detail ?? "");
  }
  if (typeof payload === "string") return payload;
  return error.message ?? "";
}

export interface AuthUser {
  message: string;
  email: string;
  name: string;
  roles: string[];
  status: string;
  user_type: string;
  doj?: string;
  requiresSelfOnboarding?: boolean;
  session_started_at?: string;
  session_max_hours?: number;
  session_inactivity_minutes?: number;
}

export interface ApiResponse<T> {
  message: string;
  data: T;
}

/**
 * Initiates the Google OAuth flow on the frontend host (Next.js BFF).
 * Always same-origin so redirect_uri and auth cookies stay on localhost / Vercel.
 */
export function getGoogleSignInUrl(): string {
  return endpoints.auth.googleSignIn;
}

/**
 * Read-only session check against GET /api/v1/auth/me.
 *
 * Returns the current user when the cookie session is valid, or null on 401.
 * Unlike refreshSession(), this does NOT rotate tokens, so it's safe to call on
 * every mount without triggering the refresh -> 401 -> logout loop.
 *
 * Uses skipAuth so a 401 does not fire the global session-logout bridge — the
 * caller decides what to do with a null result.
 */
export async function fetchMe(): Promise<AuthUser | null> {
  try {
    const body = await apiClient.get<ApiResponse<AuthUser>>(endpoints.auth.me, {
      skipAuth: true,
    });
    return body.data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return null;
    }
    if (
      error instanceof ApiError &&
      (error.status === 0 || error.status >= 500)
    ) {
      return null;
    }
    throw error;
  }
}

/**
 * Single-flight rotating refresh. Concurrent callers (HTTP 401 retry + AuthContext.refresh)
 * share one POST /auth/refresh so a rotated token is never spent twice.
 */
let refreshInFlight: Promise<AuthUser | null> | null = null;
let lastRefreshFailReason: SessionLogoutReason | null = null;

async function rotateRefreshSession(): Promise<AuthUser | null> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    lastRefreshFailReason = null;
    try {
      const body = await apiClient.post<ApiResponse<AuthUser>>(endpoints.auth.refresh, {
        skipAuth: true,
      });
      return body.data ?? null;
    } catch (error) {
      if (error instanceof ApiError && error.status === 403) {
        const detail = apiErrorDetail(error);
        if (sessionLogoutReasonFromApiDetail(detail) === "inactive") {
          lastRefreshFailReason = "inactive";
          return null;
        }
      }
      if (!(error instanceof ApiError) || error.status !== 401) {
        throw error;
      }

      const detail = apiErrorDetail(error);
      const hardReason = sessionLogoutReasonFromApiDetail(detail);
      // Hard idle/max-age ends — do not try to recover.
      if (hardReason === "idle" || hardReason === "expired") {
        lastRefreshFailReason = hardReason;
        return null;
      }

      // Refresh-token rotation race (or stale loser): another request may already
      // have set valid cookies. Prefer /auth/me over forcing a global logout.
      try {
        const me = await fetchMe();
        if (me) return me;
      } catch {
        /* fall through */
      }
      lastRefreshFailReason = "server";
      return null;
    }
  })().finally(() => {
    refreshInFlight = null;
  });

  return refreshInFlight;
}

/**
 * Attempts to refresh the session using HttpOnly cookies.
 * Returns the user data on success, or null on 401.
 */
export async function refreshSession(): Promise<AuthUser | null> {
  try {
    const user = await rotateRefreshSession();
    if (user) return user;
    dispatchSessionLogout(lastRefreshFailReason ?? "server");
    return null;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      dispatchSessionLogout(sessionLogoutReasonFromApiError(error));
      return null;
    }
    throw error;
  }
}

/**
 * Single-flight token refresh used by the HTTP client's reactive 401 handler.
 *
 * Returns true when the session was refreshed, false otherwise. Unlike
 * refreshSession(), it does NOT dispatch a logout — the caller (httpClient)
 * decides what to do when refresh fails (surface the original 401 / logout).
 */
export async function attemptTokenRefresh(): Promise<boolean> {
  try {
    return Boolean(await rotateRefreshSession());
  } catch {
    return false;
  }
}

export function initAuthClient(): void {
  apiClient.setTokenRefresher(attemptTokenRefresh);
}

/**
 * Records user activity server-side to reset the inactivity timer.
 */
export async function recordSessionActivity(): Promise<void> {
  try {
    await apiClient.post<ApiResponse<null>>(endpoints.auth.activity, {
      skipAuth: true,
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      const reason = sessionLogoutReasonFromApiError(error);
      // Only idle/expired from the activity endpoint should force logout.
      // Generic 401 / invalid refresh after a rotation race must not wipe a live session.
      if (reason === "idle" || reason === "expired") {
        dispatchSessionLogout(reason);
      }
      return;
    }
    throw error;
  }
}

/**
 * Logs out the current session and clears auth cookies server-side.
 * Best-effort: network or server errors are ignored so the client can still log out locally.
 */
export async function logout(): Promise<void> {
  try {
    await apiClient.post<ApiResponse<null>>(endpoints.auth.logout, {
      skipAuth: true,
    });
  } catch {
    // Backend unreachable or logout endpoint failed — local session is cleared by logout.
  }
}

/**
 * Dev/staging only — bypasses Google OAuth.
 */
export async function devBypassLogin(email: string): Promise<AuthUser | null> {
  const body = await apiClient.get<ApiResponse<AuthUser>>(endpoints.auth.oauthBypass(email), {
    skipAuth: true,
  });
  return body.data;
}

/**
 * Roles assigned to the logged-in user (GET /api/v1/roles), used to decide whether
 * to show the header persona switcher. Falsy/empty on failure — callers should fall
 * back to the roles already present on the AuthUser from /auth/me.
 */
export async function fetchRoles(): Promise<string[]> {
  try {
    const body = await apiClient.get<ApiResponse<{ roles: string[] }>>(endpoints.auth.roles, {
      skipAuth: true,
    });
    return body.data?.roles ?? [];
  } catch {
    return [];
  }
}

/** Human-readable messages for OAuth error query params */
export const oauthErrorMessages: Record<string, string> = {
  oauth_failed: "Google sign-in was cancelled or returned an error.",
  invalid_oauth_state: "Security validation failed. Please try again.",
  missing_oauth_code: "No authorization code received from Google.",
  unregistered_user:
    "Your Google account is not registered. Please contact your administrator.",
  account_inactive: "Your account is inactive. Please contact HR.",
  unauthorized_email_domain:
    "Sign in with your company Google account",
  invalid_redirect_uri:
    "OAuth redirect is misconfigured. Ask your administrator to add this app URL to Google OAuth and Render.",
  google_token_exchange_failed:
    "Google could not complete sign-in. Try again or contact support if it persists.",
  backend_unavailable:
    "The backend service is unavailable. Try again shortly or contact your administrator.",
  oauth_login_failed: "Sign-in failed. Please try again.",
  session_idle_timeout: "You were logged out after 30 minutes of inactivity.",
  session_expired: "Your session has expired after 8 hours. Please sign in again.",
};
