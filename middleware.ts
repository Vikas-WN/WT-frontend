import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Files served from /public must stay public so next/image can read them server-side. */
const PUBLIC_STATIC_FILE = /\.(?:png|jpg|jpeg|gif|webp|svg|ico)$/i;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic =
    pathname.startsWith("/login") ||
    pathname.startsWith("/exit-survey") ||
    pathname.startsWith("/api-docs") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico" ||
    PUBLIC_STATIC_FILE.test(pathname);

  if (isPublic) {
    return NextResponse.next();
  }

  const hasAccessToken = request.cookies.has("accessToken");
  const hasRefreshSession =
    request.cookies.has("tokenId") && request.cookies.has("refreshToken");
  // Email is always set with the session; treat it as a fallback for post-OAuth navigation.
  const hasSessionEmail = request.cookies.has("email");
  const hasToken = hasAccessToken || hasRefreshSession || hasSessionEmail;

  if (!hasToken) {
    const loginUrl = new URL("/login", request.url);
    // Remember where the user was headed (e.g. a deep link from a notification
    // email) so they land there after signing in instead of the default dashboard.
    const intended = pathname + request.nextUrl.search;
    if (pathname.startsWith("/dashboard") || pathname.startsWith("/onboarding")) {
      loginUrl.searchParams.set("redirect", intended);
    }
    const response = NextResponse.redirect(loginUrl);
    if (loginUrl.searchParams.has("redirect")) {
      // Cookie survives the Google OAuth round-trip (the query param does not).
      response.cookies.set("postLoginRedirect", intended, {
        path: "/",
        maxAge: 600,
        sameSite: "lax",
      });
    }
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
