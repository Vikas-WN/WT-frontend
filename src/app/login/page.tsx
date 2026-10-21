"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  fetchMe,
  getGoogleSignInUrl,
  describeOAuthError,
} from "@/lib/auth";
import { useAuth } from "@/context/AuthContext";
import { Activity, CalendarDays, Clock, Lock } from "lucide-react";
import { WtLoaderCentered } from "@/components/dashboard/ui/WtLoader";
import { applyResolvedTheme } from "@/utils/dashboard/theme";
import { SessionLogoutDialog } from "@/components/auth/SessionLogoutDialog";
import {
  sessionLogoutReasonFromErrorCode,
  type SessionLogoutReason,
} from "@/constants/sessionPolicy";

const FEATURES = [
  { icon: CalendarDays, title: "Leave & WFH", hint: "Apply in seconds" },
  { icon: Clock, title: "Time logs", hint: "Track your week" },
  { icon: Activity, title: "Pulse", hint: "Reviews & KPIs" },
] as const;

/** The WebTrak logo on a white rounded square. */
function Mark({ className = "" }: { className?: string }) {
  return (
    <span className={`grid size-12 shrink-0 place-items-center rounded-xl bg-white ${className}`} aria-hidden>
      {/* eslint-disable-next-line @next/next/no-img-element -- a 28px static mark; next/image adds nothing */}
      <img src="/webtrak-logo.png" alt="" className="h-7 w-auto" />
    </span>
  );
}

function GoogleIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm leading-relaxed text-rose-800">
      {message}
    </div>
  );
}

function LoginShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-[#f4f5f8] text-[#0b1220] [padding-bottom:env(safe-area-inset-bottom)] [padding-top:env(safe-area-inset-top)]">
      <div className="grid min-h-dvh w-full grid-cols-1 lg:grid-cols-2">
        <section className="flex flex-col justify-between bg-[var(--wt-navy)] px-6 py-8 text-white sm:px-10 lg:px-[4.5rem] lg:py-14">
          <div className="flex items-center gap-3.5">
            <Mark className="size-12" />
            <span className="text-[1.4rem] font-bold tracking-[-0.02em]">WebTrak</span>
          </div>
          <div className="mt-12 max-w-xl space-y-6 lg:mt-0">
            <h1 className="text-[2.4rem] font-bold leading-[1.05] tracking-[-0.03em] sm:text-5xl xl:text-[4.25rem]">Everything about work at WebKnot, in one place.</h1>
            <p className="max-w-md text-lg leading-relaxed text-white/70">Leave, time logs, project allocation, people and reviews — for everyone from new joiners to HR.</p>
          </div>
          <div className="mt-10 hidden max-w-[46rem] grid-cols-3 gap-3 xl:gap-4 lg:grid">
            {FEATURES.map(({ icon: Icon, title, hint }) => (
              <div key={title} className="min-w-0 rounded-2xl border border-white/12 bg-white/[0.07] p-4 xl:p-5">
                <Icon className="size-5 text-white/80" aria-hidden />
                <p className="mt-6 text-base font-semibold">{title}</p>
                <p className="mt-0.5 text-sm text-white/65">{hint}</p>
              </div>
            ))}
          </div>
          <p className="mt-10 hidden text-sm text-white/55 lg:block">© {new Date().getFullYear()} WebKnot Technologies</p>
        </section>

        <section className="flex flex-col justify-center px-6 py-12 sm:px-10 lg:px-[4.5rem]">
          <div className="mx-auto w-full max-w-[26rem]">{children}</div>
          <p className="mx-auto mt-12 w-full max-w-[26rem] text-center text-sm text-[#7a8294] lg:hidden">© {new Date().getFullYear()} WebKnot Technologies</p>
        </section>
      </div>
    </div>
  );
}

/** Same-origin app path only — blocks open-redirect / protocol-relative values. */
function safeInternalPath(value: string | null | undefined): string | null {
  if (!value) return null;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return null;
  }
  return /^\/(dashboard|onboarding)(\/|$|\?)/.test(value) ? value : null;
}

function readPostLoginRedirectCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)postLoginRedirect=([^;]+)/);
  return match ? safeInternalPath(decodeURIComponent(match[1] ?? "")) : null;
}

/**
 * How long the "Checking session…" cover may stay up before the sign-in form is
 * shown regardless.
 *
 * The session check is bounded (the HTTP client aborts a stalled request), but
 * "bounded" is not the same as "never looks stuck": a slow or cold backend left
 * this page showing nothing but a spinner, with no way to sign in and no error
 * (BUG_ID_314). Past this point the form is rendered even while the check is
 * still running — if it later reports an authenticated session the redirect
 * effect below still fires, so nothing is lost by showing the button early.
 */
const SESSION_CHECK_COVER_MS = 2_500;

function LoginPage() {
  const router = useRouter();
  const { status } = useAuth();
  // Read the query string directly instead of via `useSearchParams()`. That
  // hook suspends the component during prerender/hydration, so the page's
  // Suspense fallback — a bare loader — was the whole login screen until the
  // client bundle hydrated. Any hydration hiccup (a stale HTML shell after a
  // deploy, a chunk that fails to load) then left the page permanently showing
  // "Loading" with no sign-in button and no error (BUG_ID_314). Reading
  // location.search in an effect keeps the form on screen from the first paint.
  const [params, setParams] = useState<URLSearchParams | null>(null);
  const [postLoginTarget, setPostLoginTarget] = useState("/dashboard");
  const [error, setError] = useState<string | null>(null);
  const [sessionLogoutReason, setSessionLogoutReason] = useState<SessionLogoutReason | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [sessionCheckCoverExpired, setSessionCheckCoverExpired] = useState(false);
  const didRedirect = useRef(false);
  const didPostLoginRefresh = useRef(false);

  useEffect(() => {
    applyResolvedTheme("light");
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setSessionCheckCoverExpired(true), SESSION_CHECK_COVER_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setParams(new URLSearchParams(window.location.search));
  }, []);

  useEffect(() => {
    if (!params) return;
    setPostLoginTarget(
      safeInternalPath(params.get("redirect")) ?? readPostLoginRedirectCookie() ?? "/dashboard"
    );
  }, [params]);

  useEffect(() => {
    if (!params) return;
    const rawError = params.get("error");
    if (!rawError) {
      setError(null);
      setSessionLogoutReason(null);
      return;
    }
    const sessionReason = sessionLogoutReasonFromErrorCode(rawError);
    if (sessionReason) {
      setSessionLogoutReason(sessionReason);
      setError(null);
      return;
    }
    setSessionLogoutReason(null);
    setError(describeOAuthError(rawError, params.get("email")));
  }, [params]);

  useEffect(() => {
    if (status === "authenticated" && !didRedirect.current) {
      didRedirect.current = true;
      window.location.replace(postLoginTarget);
    }
  }, [status, postLoginTarget]);

  useEffect(() => {
    if (status !== "unauthenticated" || didPostLoginRefresh.current) return;
    didPostLoginRefresh.current = true;
    void (async () => {
      try {
        const fresh = await fetchMe();
        if (fresh && !didRedirect.current) {
          didRedirect.current = true;
          window.location.replace(postLoginTarget);
        }
      } catch {
        /* Backend may be down; stay on login. */
      }
    })();
  }, [status, postLoginTarget]);

  function handleGoogleSignIn() {
    setGoogleLoading(true);
    setError(null);
    window.location.href = getGoogleSignInUrl();
  }

  function dismissSessionLogoutDialog() {
    setSessionLogoutReason(null);
    router.replace("/login");
  }

  if (status === "loading" && !sessionCheckCoverExpired) {
    return (
      <LoginShell>
        <WtLoaderCentered label="Checking session…" />
      </LoginShell>
    );
  }

  return (
    <LoginShell>
      <SessionLogoutDialog
        open={sessionLogoutReason != null}
        reason={sessionLogoutReason ?? "server"}
        onConfirm={dismissSessionLogoutDialog}
      />
      <div className="fade-up">
        <h2 id="login-heading" className="text-[2rem] font-bold tracking-[-0.025em]">
          Sign in
        </h2>
        <p className="mt-3 text-base leading-relaxed text-[#475569]">Use your WebKnot Google account. No separate password needed.</p>

        <div className="mt-8 space-y-5">
          {error ? <ErrorBanner message={error} /> : null}

          <Button
            id="google-signin-btn"
            type="button"
            variant="outline"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="h-14 w-full rounded-xl border-black/10 bg-white text-base font-semibold text-[#0b1220] shadow-sm hover:bg-white/80"
          >
            {googleLoading ? (
              <>
                <span className="spinner-dark-sm" />
                Redirecting to Google…
              </>
            ) : (
              <>
                <GoogleIcon size={22} />
                Continue with Google
              </>
            )}
          </Button>

          <div className="flex items-start gap-3.5 rounded-2xl bg-[#eceff8] px-5 py-4 text-[15px] leading-relaxed text-[#34406b]">
            <Lock className="mt-0.5 size-5 shrink-0" aria-hidden />
            <p>
              Only registered <strong className="font-semibold text-[var(--wt-navy)]">@webknot.in</strong> accounts can sign in. Can&apos;t get in? <span className="font-medium text-[var(--wt-brand)]">Contact HR</span>.
            </p>
          </div>
        </div>
      </div>
    </LoginShell>
  );
}

export default LoginPage;
