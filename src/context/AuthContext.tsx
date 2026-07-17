"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { type AuthUser, fetchMe, refreshSession, logout as authLogout, recordSessionActivity } from "@/lib/auth";
import { normalizeRoles } from "@/utils/roles";
import {
  clearSessionTiming,
  persistSessionTiming,
  useSessionTimeout,
} from "@/hooks/useSessionTimeout";
import { type SessionLogoutReason } from "@/constants/sessionPolicy";
import { SessionLogoutDialog } from "@/components/auth/SessionLogoutDialog";
import { SessionIdleWarningDialog } from "@/components/auth/SessionIdleWarningDialog";
import {
  SESSION_LOGOUT_EVENT,
  type SessionLogoutEventDetail,
} from "@/lib/sessionLogoutBridge";

/* ------------------------------------------------------------------ */
/* Types                                                                 */
/* ------------------------------------------------------------------ */

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  user: AuthUser | null;
  status: AuthStatus;
  /** Re-validates the session with the server. Returns the user or null. */
  refresh: () => Promise<AuthUser | null>;
  /** Logs out and redirects to /login. */
  logout: () => Promise<void>;
}

/* ------------------------------------------------------------------ */
/* Context                                                               */
/* ------------------------------------------------------------------ */

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function applyAuthenticatedUser(freshUser: AuthUser): AuthUser {
  const normalized = { ...freshUser, roles: normalizeRoles(freshUser.roles ?? []) };
  persistSessionTiming(normalized.session_started_at);
  return normalized;
}

/* ------------------------------------------------------------------ */
/* Provider                                                              */
/* ------------------------------------------------------------------ */

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [sessionLogoutReason, setSessionLogoutReason] = useState<SessionLogoutReason | null>(null);
  const [idleWarningMinutes, setIdleWarningMinutes] = useState<number | null>(null);
  const didInitialRefresh = useRef(false);
  const timeoutHandled = useRef(false);
  const userRef = useRef<AuthUser | null>(null);
  const extendSessionRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const refresh = useCallback(async (): Promise<AuthUser | null> => {
    setStatus("loading");
    try {
      const freshUser = await refreshSession();
      if (freshUser) {
        const normalized = applyAuthenticatedUser(freshUser);
        setUser(normalized);
        setStatus("authenticated");
        return normalized;
      }
      clearSessionTiming();
      setUser(null);
      setStatus("unauthenticated");
      return null;
    } catch {
      const keptUser = userRef.current;
      if (keptUser) {
        setStatus("authenticated");
        return keptUser;
      }
      clearSessionTiming();
      setUser(null);
      setStatus("unauthenticated");
      return null;
    }
  }, []);

  /**
   * First-mount session bootstrap.
   *
   * Uses the cheap, read-only GET /auth/me to confirm the session WITHOUT
   * rotating tokens. Only when the access token is missing/expired (me -> null)
   * do we fall back to refresh(), which rotates the refresh token. This avoids
   * the refresh -> 401 -> logout storm that came from refreshing on every mount.
   */
  const bootstrap = useCallback(async (): Promise<AuthUser | null> => {
    setStatus("loading");
    try {
      const me = await fetchMe();
      if (me) {
        const normalized = applyAuthenticatedUser(me);
        setUser(normalized);
        setStatus("authenticated");
        return normalized;
      }
    } catch {
      /* fall through below */
    }
    // No valid access-token session. On /login there is nothing to recover, so
    // do NOT rotate tokens — that caused the refresh -> 401 -> logout loop.
    // On protected routes, try a single refresh to recover a still-valid refresh
    // session (sliding sessions after the short-lived access token expires).
    if (pathname?.startsWith("/login")) {
      clearSessionTiming();
      setUser(null);
      setStatus("unauthenticated");
      return null;
    }
    return refresh();
  }, [pathname, refresh]);

  const logout = useCallback(async () => {
    try {
      await authLogout();
    } finally {
      clearSessionTiming();
      setUser(null);
      setStatus("unauthenticated");
      setIdleWarningMinutes(null);
      router.push("/login");
    }
  }, [router]);

  const handleSessionTimeout = useCallback(
    async (reason: SessionLogoutReason) => {
      if (timeoutHandled.current) return;

      const wasSignedIn = userRef.current != null || status === "authenticated";
      timeoutHandled.current = true;
      setIdleWarningMinutes(null);
      try {
        await authLogout();
      } catch {
        /* best-effort */
      } finally {
        clearSessionTiming();
        setUser(null);
        setStatus("unauthenticated");
        if (wasSignedIn) {
          setSessionLogoutReason(reason);
        }
      }
    },
    [status]
  );

  const handleIdleWarning = useCallback((minutesRemaining: number) => {
    setIdleWarningMinutes(minutesRemaining);
  }, []);

  const dismissIdleWarning = useCallback(() => {
    setIdleWarningMinutes(null);
    extendSessionRef.current();
    timeoutHandled.current = false;
    void recordSessionActivity().catch(() => undefined);
  }, []);

  const confirmSessionLogout = useCallback(() => {
    setSessionLogoutReason(null);
    timeoutHandled.current = false;
    router.replace("/login");
  }, [router]);

  const { extendSession } = useSessionTimeout(
    status === "authenticated",
    handleSessionTimeout,
    handleIdleWarning
  );

  useEffect(() => {
    extendSessionRef.current = extendSession;
  }, [extendSession]);

  useEffect(() => {
    const onSessionLogout = (event: Event) => {
      const detail = (event as CustomEvent<SessionLogoutEventDetail>).detail;
      if (!detail?.reason) return;
      void handleSessionTimeout(detail.reason);
    };
    window.addEventListener(SESSION_LOGOUT_EVENT, onSessionLogout);
    return () => window.removeEventListener(SESSION_LOGOUT_EVENT, onSessionLogout);
  }, [handleSessionTimeout]);

  /* Validate session on first mount (read-only, refresh only if needed) */
  useEffect(() => {
    if (didInitialRefresh.current) return;
    didInitialRefresh.current = true;
    void bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    if (status === "authenticated") {
      timeoutHandled.current = false;
    }
  }, [status]);

  return (
    <AuthContext.Provider value={{ user, status, refresh, logout }}>
      {children}
      <SessionIdleWarningDialog
        open={idleWarningMinutes != null}
        minutesRemaining={idleWarningMinutes ?? 5}
        onStaySignedIn={dismissIdleWarning}
      />
      <SessionLogoutDialog
        open={sessionLogoutReason != null}
        reason={sessionLogoutReason ?? "server"}
        onConfirm={confirmSessionLogout}
      />
    </AuthContext.Provider>
  );
}

/* ------------------------------------------------------------------ */
/* Hook                                                                  */
/* ------------------------------------------------------------------ */

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}
