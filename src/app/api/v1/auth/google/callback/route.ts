import { NextRequest, NextResponse } from "next/server";
import {
  backendMisconfiguredResponse,
  getAppBaseUrl,
  getBackendBaseUrl,
  isBackendMisconfigured,
  setAuthCookies,
  type SessionTokens,
} from "@/lib/serverApi";

export const dynamic = "force-dynamic";

/** "lakshmi@webknot.in" -> "la•••@webknot.in": enough to recognise the Google account, not enough to leak it. */
function maskEmail(email: string): string {
  const at = email.lastIndexOf("@");
  if (at < 1) return "";
  const local = email.slice(0, at);
  const shown = local.slice(0, local.length > 3 ? 2 : 1);
  return `${shown}•••${email.slice(at)}`;
}

/** Codes where naming the refused Google account helps the person fix it. */
const CODES_THAT_NAME_THE_ACCOUNT = new Set(["unregistered_user", "account_inactive", "unauthorized_email_domain"]);

function loginRedirect(request: NextRequest, error?: string, refusedEmail?: string | null) {
  const url = new URL("/login", getAppBaseUrl(request));
  if (error) url.searchParams.set("error", error);
  // Masked, and only for sign-in refusals: the login page shows "Google signed you in as la•••@…".
  const masked = refusedEmail && error && CODES_THAT_NAME_THE_ACCOUNT.has(error) ? maskEmail(refusedEmail) : "";
  if (masked) url.searchParams.set("email", masked);
  return NextResponse.redirect(url);
}

/** Same-origin absolute app path only — blocks open-redirect / protocol-relative tricks. */
function safeInternalPath(value: string | undefined | null): string | null {
  if (!value) return null;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return null;
  }
  return /^\/(dashboard|onboarding)(\/|$|\?)/.test(value) ? value : null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const oauthError = searchParams.get("error");
  if (oauthError) {
    return loginRedirect(request, "oauth_failed");
  }

  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const expectedState = request.cookies.get("oauthState")?.value;

  if (!code) {
    return loginRedirect(request, "missing_oauth_code");
  }
  if (!state || !expectedState || state !== expectedState) {
    return loginRedirect(request, "invalid_oauth_state");
  }

  if (isBackendMisconfigured()) {
    return loginRedirect(request, "backend_unavailable");
  }

  const appBaseUrl = getAppBaseUrl(request);
  const redirectUri = `${appBaseUrl}/api/v1/auth/google/callback`;
  let exchangeResponse: Response;
  try {
    exchangeResponse = await fetch(`${getBackendBaseUrl()}/api/v1/auth/google/exchange`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Frontend owns oauthState; forward it so the backend can validate CSRF state.
        Cookie: `oauthState=${expectedState}`,
      },
      body: JSON.stringify({ code, redirect_uri: redirectUri, state }),
    });
  } catch {
    return loginRedirect(request, "backend_unavailable");
  }

  if (!exchangeResponse.ok) {
    const knownErrors = new Set([
      "unregistered_user",
      "account_inactive",
      "unauthorized_email_domain",
      "invalid_redirect_uri",
      "google_token_exchange_failed",
      "google_code_expired_or_used",
      "google_client_misconfigured",
      "invalid_oauth_state",
      "backend_unavailable",
    ]);
    let errorCode = "oauth_login_failed";
    try {
      const payload = (await exchangeResponse.json()) as { detail?: string };
      const detail = payload.detail?.trim();
      if (detail && knownErrors.has(detail)) {
        errorCode = detail;
      }
    } catch {
      /* ignore parse errors */
    }
    return loginRedirect(request, errorCode, exchangeResponse.headers.get("x-login-email"));
  }

  const payload = (await exchangeResponse.json()) as {
    data: SessionTokens & { message?: string };
  };
  const data = payload.data;

  const destination =
    safeInternalPath(request.cookies.get("postLoginRedirect")?.value) ?? "/dashboard";
  const response = NextResponse.redirect(new URL(destination, appBaseUrl));
  setAuthCookies(response, data);
  response.cookies.set("oauthState", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  response.cookies.set("postLoginRedirect", "", { path: "/", maxAge: 0, sameSite: "lax" });
  return response;
}
