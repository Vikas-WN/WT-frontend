import { normalizeApiBaseUrl } from "@/api/httpClient";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const LOCAL_BACKEND_FALLBACK = "http://localhost:8080";

function readConfiguredBackendUrl(): string {
  const candidates = [
    process.env.API_BASE_URL,
    process.env.BACKEND_URL,
    process.env.RENDER_EXTERNAL_URL,
    process.env.NEXT_PUBLIC_API_BASE_URL,
  ];
  for (const value of candidates) {
    const trimmed = value?.trim();
    if (trimmed) return normalizeApiBaseUrl(trimmed);
  }
  return "";
}

/** Upstream FastAPI base URL (server-side only). */
export function getBackendBaseUrl(): string {
  const configured = readConfiguredBackendUrl();
  if (configured) return configured;
  return LOCAL_BACKEND_FALLBACK;
}

/** True when production BFF would proxy to localhost (misconfigured deployment). */
export function isBackendMisconfigured(): boolean {
  if (process.env.NODE_ENV !== "production") return false;
  const url = readConfiguredBackendUrl();
  if (!url) return true;
  return /localhost|127\.0\.0\.1/i.test(url);
}

export function backendUnavailableResponse(): NextResponse {
  return NextResponse.json({ detail: "backend_unavailable" }, { status: 503 });
}

export function backendMisconfiguredResponse(): NextResponse {
  return NextResponse.json(
    {
      detail: "backend_unconfigured",
      message: "API_BASE_URL is not configured for this deployment.",
    },
    { status: 503 }
  );
}

/** Public frontend origin used for OAuth redirects and absolute app redirects. */
export function getAppBaseUrl(request: NextRequest): string {
  const configured = process.env.APP_URL?.trim();
  if (configured) return normalizeApiBaseUrl(configured);

  const forwardedHost = request.headers.get("x-forwarded-host")?.trim();
  const host = forwardedHost || request.headers.get("host")?.trim();
  if (host) {
    const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
    const protocol = forwardedProto || request.nextUrl.protocol.replace(":", "") || "https";
    return `${protocol}://${host}`;
  }

  return request.nextUrl.origin;
}

export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
  tokenId: string;
  email: string;
  name: string;
  roles: string[];
  status: string;
  user_type: string;
  session_started_at?: string;
  /** Retained for older backends; sessions no longer have an age cap, so this is ignored. */
  session_max_hours?: number;
}

const ACCESS_TOKEN_MINUTES = Number(process.env.ACCESS_TOKEN_MINUTES ?? 30);
// Session cookies outlive the 4-hour inactivity window on purpose. Inactivity is
// enforced by the backend (and the idle timer in the browser); the cookie lifetime
// must never be what ends a session. Every refresh and activity re-issues them, so
// this only matters for a browser left closed — and matches the backend's sliding
// refresh-token period. It was an env-driven 8 hours, which cut off active users.
const SESSION_COOKIE_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

function cookieBaseOptions() {
  const secure = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure,
    sameSite: "lax" as const,
    path: "/",
  };
}

export function setAuthCookies(response: NextResponse, session: SessionTokens): void {
  const base = cookieBaseOptions();
  const sessionMaxAge = SESSION_COOKIE_MAX_AGE_SECONDS;

  response.cookies.set("accessToken", session.accessToken, {
    ...base,
    maxAge: ACCESS_TOKEN_MINUTES * 60,
  });
  response.cookies.set("refreshToken", session.refreshToken, {
    ...base,
    maxAge: sessionMaxAge,
  });
  response.cookies.set("tokenId", session.tokenId, {
    ...base,
    maxAge: sessionMaxAge,
  });
  response.cookies.set("email", session.email, { ...base, maxAge: sessionMaxAge });
  response.cookies.set("employeeName", session.name, { ...base, maxAge: sessionMaxAge });
  response.cookies.set("roles", session.roles.join(","), { ...base, maxAge: sessionMaxAge });
  response.cookies.set("status", session.status, { ...base, maxAge: sessionMaxAge });
  response.cookies.set("type", session.user_type, { ...base, maxAge: sessionMaxAge });
  if (session.session_started_at) {
    response.cookies.set("sessionStartedAt", session.session_started_at, {
      ...base,
      maxAge: sessionMaxAge,
    });
  }
}

export function clearAuthCookies(response: NextResponse): void {
  const base = cookieBaseOptions();
  for (const key of [
    "accessToken",
    "refreshToken",
    "tokenId",
    "email",
    "employeeName",
    "roles",
    "status",
    "type",
    "sessionStartedAt",
  ]) {
    response.cookies.set(key, "", { ...base, maxAge: 0 });
  }
}

/** Headers for server-side proxy calls to FastAPI (forwards session cookies + Bearer). */
export function buildUpstreamAuthHeaders(
  request: NextRequest,
  initHeaders?: Headers
): Headers {
  const headers = new Headers(initHeaders);

  const hopByHop = new Set([
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailers",
    "transfer-encoding",
    "upgrade",
    "host",
    "content-length",
    "cookie",
    "authorization",
  ]);

  request.headers.forEach((value, key) => {
    if (hopByHop.has(key.toLowerCase())) return;
    headers.set(key, value);
  });

  const cookies = request.cookies.getAll();
  if (cookies.length) {
    headers.set(
      "cookie",
      cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ")
    );
  }

  const accessToken = request.cookies.get("accessToken")?.value?.trim();
  if (accessToken) {
    headers.set("authorization", `Bearer ${accessToken}`);
  } else if (!headers.has("authorization")) {
    const incomingAuth = request.headers.get("authorization")?.trim();
    if (incomingAuth) headers.set("authorization", incomingAuth);
  }

  return headers;
}

export function buildCookieHeader(request: Request, keys: string[]): string {
  const cookies = request.headers.get("cookie") ?? "";
  if (!keys.length) return cookies;

  const wanted = new Set(keys);
  const parts = cookies
    .split(";")
    .map((part) => part.trim())
    .filter((part) => {
      const name = part.split("=")[0]?.trim();
      return name && wanted.has(name);
    });

  return parts.join("; ");
}

type RoutePathParams = { path?: string | string[] };

/** Supports Next.js route params whether provided as a Promise or plain object. */
export async function resolveRoutePathSegments(
  params: Promise<RoutePathParams> | RoutePathParams | undefined
): Promise<string[]> {
  const resolved =
    params && typeof (params as Promise<RoutePathParams>).then === "function"
      ? await (params as Promise<RoutePathParams>)
      : (params as RoutePathParams | undefined);
  const raw = resolved?.path;
  if (!raw) return [];
  return Array.isArray(raw) ? raw.map((segment) => String(segment)) : [String(raw)];
}

function buildSafeUpstreamResponseHeaders(upstream: Response): Headers {
  const headers = new Headers();
  const contentType = upstream.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);

  const contentDisposition = upstream.headers.get("content-disposition");
  if (contentDisposition) headers.set("content-disposition", contentDisposition);

  const getSetCookie = (upstream.headers as Headers & { getSetCookie?: () => string[] })
    .getSetCookie;
  const cookies = typeof getSetCookie === "function" ? getSetCookie.call(upstream.headers) : [];
  for (const cookie of cookies) {
    headers.append("set-cookie", cookie);
  }

  return headers;
}

/** Proxy /api/v1/* requests to FastAPI with auth cookies and safe response headers. */
export async function proxyUpstreamApiRequest(
  request: NextRequest,
  pathSegments: string[]
): Promise<NextResponse> {
  if (isBackendMisconfigured()) {
    return backendMisconfiguredResponse();
  }

  const segments = pathSegments.map((segment) => segment.trim()).filter(Boolean);
  if (!segments.length) {
    return NextResponse.json({ detail: "invalid_api_path" }, { status: 400 });
  }

  const backendUrl = `${getBackendBaseUrl()}/api/v1/${segments.join("/")}${request.nextUrl.search}`;
  const headers = buildUpstreamAuthHeaders(request);
  // One id from the browser to the database: reuse the caller's, else make one, pass it on and echo it back.
  const requestId = acceptRequestId(request.headers.get("x-request-id"));
  headers.set("x-request-id", requestId);
  const startedAt = Date.now();

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: "manual",
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    const body = await request.arrayBuffer();
    if (body.byteLength > 0) {
      init.body = body;
      headers.set("content-length", String(body.byteLength));
    }
  }

  let upstream: Response;
  try {
    upstream = await fetch(backendUrl, init);
  } catch (error) {
    logBff("error", "upstream_unreachable", { requestId, method: request.method, path: `/${segments.join("/")}`, ms: Date.now() - startedAt, error: String(error).slice(0, 300) });
    return backendUnavailableResponse();
  }

  const elapsed = Date.now() - startedAt;
  if (upstream.status >= 500 || elapsed > SLOW_UPSTREAM_MS) {
    logBff(upstream.status >= 500 ? "error" : "warn", upstream.status >= 500 ? "upstream_error" : "upstream_slow", {
      requestId,
      method: request.method,
      path: `/${segments.join("/")}`,
      status: upstream.status,
      ms: elapsed,
    });
  }

  try {
    const body = await upstream.arrayBuffer();
    const responseHeaders = buildSafeUpstreamResponseHeaders(upstream);
    responseHeaders.set("x-request-id", requestId);
    return new NextResponse(body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("BFF proxy response build failed:", backendUrl, error);
    return backendUnavailableResponse();
  }
}

const SLOW_UPSTREAM_MS = 2_000;
const REQUEST_ID_PATTERN = /^[A-Za-z0-9_-]{8,64}$/;

/** Keep a caller's request id if it looks like one, otherwise make a new one. */
export function acceptRequestId(inbound: string | null): string {
  const candidate = (inbound ?? "").trim();
  if (REQUEST_ID_PATTERN.test(candidate)) return candidate;
  return Array.from(crypto.getRandomValues(new Uint8Array(8)), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** One JSON line per notable event on the Next server, in the same shape the backend logs — so one log search covers both. */
export function logBff(level: "info" | "warn" | "error", event: string, fields: Record<string, unknown> = {}): void {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level: level.toUpperCase(),
    logger: "bff",
    service: "webtrak-frontend",
    env: process.env.APP_ENV ?? process.env.NODE_ENV,
    version: process.env.NEXT_PUBLIC_APP_RELEASE ?? "dev",
    event,
    msg: event,
    ...fields,
  });
  if (level === "error") console.error(line);
  else console.log(line);
}
