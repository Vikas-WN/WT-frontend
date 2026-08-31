"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { type AuthUser, fetchMe, fetchRoles, refreshSession, logout as authLogout, recordSessionActivity, initAuthClient } from "@/lib/auth";
import { normalizeRoles, pickPrimaryPortalRole } from "@/utils/roles";
import { clearStoredPersona, getStoredPersona, setStoredPersona } from "@/utils/persona";
import {
  clearSessionTiming,
  persistSessionTiming,
  useSessionTimeout,
} from "@/hooks/useSessionTimeout";
import { SESSION_REFRESH_INTERVAL_MS, type SessionLogoutReason } from "@/constants/sessionPolicy";
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
  /** Reflects the active persona: roles is narrowed to [activePersona] when one is selected. */
  user: AuthUser | null;
  status: AuthStatus;
  /** Full set of roles assigned to the user, independent of the active persona. Powers the switcher's options. */
  allRoles: string[];
  /** Currently selected persona, or null unless the user holds ROLE_ADMIN (and >1 role) — switcher hidden otherwise. */
  activePersona: string | null;
  /** Switches the active persona; persists for the rest of the browser session. */
  setActivePersona: (role: string) => void;
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
  initAuthClient();

  const router = useRouter();
  const pathname = usePathname();
  const [rawUser, setRawUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [allRoles, setAllRoles] = useState<string[]>([]);
  const [activePersona, setActivePersonaState] = useState<string | null>(null);
  const [sessionLogoutReason, setSessionLogoutReason] = useState<SessionLogoutReason | null>(null);
  const [idleWarningMinutes, setIdleWarningMinutes] = useState<number | null>(null);
  const didInitialRefresh = useRef(false);
  const timeoutHandled = useRef(false);
  const userRef = useRef<AuthUser | null>(null);
  const extendSessionRef = useRef<() => void>(() => undefined);

  const user = useMemo<AuthUser | null>(() => {
    if (!rawUser) return null;
    if (activePersona && rawUser.roles.includes(activePersona)) {
      return { ...rawUser, roles: [activePersona] };
    }
    return rawUser;
  }, [rawUser, activePersona]);
  const sessionInactivityMs = useMemo(
    () => Math.max(1, Number(user?.session_inactivity_minutes ?? 30)) * 60 * 1000,
    [user?.session_inactivity_minutes]
  );
  const sessionMaxMs = useMemo(
    () => Math.max(1, Number(user?.session_max_hours ?? 8)) * 60 * 60 * 1000,
    [user?.session_max_hours]
  );

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const setActivePersona = useCallback(
    (role: string) => {
      if (!rawUser || !allRoles.includes(role)) return;
      setActivePersonaState(role);
      setStoredPersona(rawUser.email, role);
    },
    [rawUser, allRoles]
  );

  /**
   * Resolves the full role set and, for eligible users, the active persona:
   * the session's stored choice if still valid, else the highest-priority role
   * (same ranking already used elsewhere for a user's "primary" role).
   *
   * The persona switcher is scoped to users who hold ROLE_ADMIN in the database —
   * everyone else (including other multi-role combinations like Manager+DM) keeps
   * today's additive/union permissions and never sees the switcher.
   */
  const syncRolesAndPersona = useCallback(async (freshUser: AuthUser) => {
    const fetched = await fetchRoles();
    const roles = normalizeRoles(fetched.length ? fetched : freshUser.roles);
    setAllRoles(roles);
    const eligibleForSwitcher = roles.includes("ROLE_ADMIN") && roles.length > 1;
    if (!eligibleForSwitcher) {
      setActivePersonaState(null);
      return;
    }
    const stored = getStoredPersona(freshUser.email);
    const persona = stored && roles.includes(stored) ? stored : pickPrimaryPortalRole(roles);
    setActivePersonaState(persona);
    setStoredPersona(freshUser.email, persona);
  }, []);

  const refresh = useCallback(async (): Promise<AuthUser | null> => {
    setStatus("loading");
    try {
      const freshUser = await refreshSession();
      if (freshUser) {
        const normalized = applyAuthenticatedUser(freshUser);
        setRawUser(normalized);
        setStatus("authenticated");
        void syncRolesAndPersona(normalized);
        return normalized;
      }
      clearSessionTiming();
      setRawUser(null);
      setAllRoles([]);
      setActivePersonaState(null);
      setStatus("unauthenticated");
      return null;
    } catch {
      const keptUser = userRef.current;
      if (keptUser) {
        setStatus("authenticated");
        return keptUser;
      }
      clearSessionTiming();
      setRawUser(null);
      setAllRoles([]);
      setActivePersonaState(null);
      setStatus("unauthenticated");
      return null;
    }
  }, [syncRolesAndPersona]);

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
        setRawUser(normalized);
        setStatus("authenticated");
        void syncRolesAndPersona(normalized);
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
      setRawUser(null);
      setAllRoles([]);
      setActivePersonaState(null);
      setStatus("unauthenticated");
      return null;
    }
    return refresh();
  }, [pathname, refresh, syncRolesAndPersona]);

  const logout = useCallback(async () => {
    const email = rawUser?.email;
    try {
      await authLogout();
    } finally {
      clearSessionTiming();
      if (email) clearStoredPersona(email);
      setRawUser(null);
      setAllRoles([]);
      setActivePersonaState(null);
      setStatus("unauthenticated");
      setIdleWarningMinutes(null);
      router.push("/login");
    }
  }, [router, rawUser]);

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
        setRawUser(null);
        setAllRoles([]);
        setActivePersonaState(null);
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
    handleIdleWarning,
    {
      inactivityMs: sessionInactivityMs,
      maxMs: sessionMaxMs,
      refreshIntervalMs: SESSION_REFRESH_INTERVAL_MS,
    }
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
    <AuthContext.Provider value={{ user, status, allRoles, activePersona, setActivePersona, refresh, logout }}>
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
