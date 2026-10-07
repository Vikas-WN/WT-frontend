import { ApiError, parseApiErrorMessage } from "@/api/error";
import { attachApiLoadingTelemetry } from "@/api/apiLoading";
import {
  dispatchSessionLogout,
  sessionLogoutReasonFromApiDetail,
} from "@/lib/sessionLogoutBridge";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
type ResponseType = "json" | "text" | "blob" | "raw";

export interface ApiEnvelope<T> {
  message: string;
  data: T;
}

export interface QueryParams {
  [key: string]: string | number | boolean | null | undefined;
}

export interface ApiRequestOptions {
  method?: HttpMethod;
  query?: QueryParams;
  body?: BodyInit | null;
  contentType?: string;
  headers?: HeadersInit;
  token?: string;
  withCredentials?: boolean;
  responseType?: ResponseType;
  skipAuth?: boolean;
  /**
   * Abort the request after this many ms and surface it as a timeout error
   * instead of hanging forever. Defaults to DEFAULT_REQUEST_TIMEOUT_MS.
   * Pass 0 to disable (e.g. a long-running upload/export).
   */
  timeoutMs?: number;
  /** Internal: set when a request is being retried after a silent token refresh. */
  __isRetry?: boolean;
}

/**
 * Browsers do not time out `fetch` on their own — a request that never gets a
 * response (server hung, connection stalled) leaves its promise pending
 * forever. Session bootstrap (`GET /auth/me`) awaiting a hung request left
 * the login page's status stuck at "loading" indefinitely (BUG_ID_314,
 * "Login page stuck loading"), since nothing ever settled the promise the
 * page was waiting on. This default timeout guarantees every request either
 * resolves or rejects within a bounded time.
 */
const DEFAULT_REQUEST_TIMEOUT_MS = 30_000;

type RequestInterceptor = (
  url: string,
  init: RequestInit
) => Promise<{ url: string; init: RequestInit }> | { url: string; init: RequestInit };

type ResponseInterceptor = (
  response: Response,
  request: { url: string; init: RequestInit }
) => Promise<Response> | Response;

type ErrorInterceptor = (error: unknown) => Promise<unknown> | unknown;

interface ApiClientConfig {
  baseUrl: string;
}

export function normalizeApiBaseUrl(url: string): string {
  return url.replace(/\/$/, "");
}

/**
 * Browser API base URL. In production always use same-origin /api/v1 (Vercel BFF)
 * so OAuth cookies stay on the frontend domain — never Render directly.
 */
export function resolveClientApiBaseUrl(): string {
  // Production always uses same-origin /api/v1 (Next.js BFF) so HttpOnly auth cookies work.
  if (process.env.NODE_ENV === "production") return "";

  const configured = normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL ?? "");
  // Local dev only: optional direct API access without the BFF proxy.
  if (configured) return configured;

  return "";
}

const DEFAULT_BASE_URL = resolveClientApiBaseUrl();

/** Outcome of a silent session refresh: renewed, refused by the server, or server unreachable. */
export type RefreshResult = boolean | "unavailable";

export class HttpClient {
  private readonly baseUrl: string;
  private authTokenGetter?: () => string | null | undefined;
  private onUnauthorized?: () => void;
  private tokenRefresher?: () => Promise<RefreshResult>;
  private sessionVerifier?: () => Promise<"valid" | "invalid" | "unknown">;
  private refreshInFlight: Promise<RefreshResult> | null = null;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private errorInterceptors: ErrorInterceptor[] = [];

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl;
  }

  setAuthTokenGetter(getter: () => string | null | undefined) {
    this.authTokenGetter = getter;
  }

  setUnauthorizedHandler(handler: () => void) {
    this.onUnauthorized = handler;
  }

  /**
   * Registers the function used for reactive, silent token refresh on 401.
   * Resolves to true when the session was refreshed, false when the server refused it, and "unavailable" when the
   * server could not be reached (nothing is known about the session, so the caller must not sign out).
   */
  setTokenRefresher(refresher: () => Promise<RefreshResult>) {
    this.tokenRefresher = refresher;
  }

  /**
   * Registers a check of the session itself (not of one endpoint). A 401 that still comes back after a successful
   * refresh may just be that endpoint refusing; we only sign the person out when this check says the session is gone.
   */
  setSessionVerifier(verifier: () => Promise<"valid" | "invalid" | "unknown">) {
    this.sessionVerifier = verifier;
  }

  /**
   * Runs at most one refresh at a time. Concurrent 401s all await the same
   * refresh promise, so a rotating refresh token is only spent once.
   */
  private runSingleFlightRefresh(): Promise<RefreshResult> {
    if (!this.tokenRefresher) return Promise.resolve(false);
    if (!this.refreshInFlight) {
      this.refreshInFlight = this.tokenRefresher()
        .catch((): RefreshResult => "unavailable")
        .finally(() => {
          this.refreshInFlight = null;
        });
    }
    return this.refreshInFlight;
  }

  useRequest(interceptor: RequestInterceptor) {
    this.requestInterceptors.push(interceptor);
  }

  useResponse(interceptor: ResponseInterceptor) {
    this.responseInterceptors.push(interceptor);
  }

  useError(interceptor: ErrorInterceptor) {
    this.errorInterceptors.push(interceptor);
  }

  async request<T = unknown>(path: string, options: ApiRequestOptions = {}): Promise<T> {
    const {
      method = "GET",
      query,
      body = null,
      contentType,
      headers: rawHeaders,
      token,
      withCredentials = true,
      responseType = "json",
      skipAuth = false,
      timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
      __isRetry = false,
    } = options;

    const url = this.buildUrl(path, query);
    const headers = new Headers(rawHeaders);
    const derivedToken = skipAuth
      ? null
      : token?.trim() || this.authTokenGetter?.()?.trim() || null;

    if (contentType) headers.set("Content-Type", contentType);
    if (derivedToken) headers.set("Authorization", `Bearer ${derivedToken}`);

    let request = {
      url,
      init: {
        method,
        headers,
        body,
        credentials: withCredentials ? "include" : "same-origin",
      } as RequestInit,
    };

    for (const interceptor of this.requestInterceptors) {
      request = await interceptor(request.url, request.init);
    }

    const timeoutController = timeoutMs > 0 ? new AbortController() : null;
    let timedOut = false;
    const timeoutHandle = timeoutController
      ? setTimeout(() => {
          timedOut = true;
          timeoutController.abort();
        }, timeoutMs)
      : null;
    if (timeoutController && !request.init.signal) {
      request.init = { ...request.init, signal: timeoutController.signal };
    }

    try {
      let response = await fetch(request.url, request.init);
      for (const interceptor of this.responseInterceptors) {
        response = await interceptor(response, request);
      }

      // Reactive silent refresh: on a 401 for an authenticated request, refresh
      // the session once (single-flight) and retry the original request. Only if
      // refresh fails do we surface the 401 / dispatch logout below.
      if (response.status === 401 && !skipAuth && !__isRetry && this.tokenRefresher) {
        const refreshed = await this.runSingleFlightRefresh();
        if (refreshed === true) {
          return this.request<T>(path, { ...options, __isRetry: true });
        }
        if (refreshed === "unavailable") {
          // We could not reach the server to renew the session. That is not the server saying the session ended,
          // so fail this one request quietly (no sign-out) and let the next try renew it.
          throw new ApiError("We couldn't reach the server just now. Check your connection and try again.", 0);
        }
      }

      // Do NOT refresh on 403 Insufficient role. That raced with AuthContext refresh,
      // rotated the refresh token twice, and the losing request cleared session cookies.
      // Mid-session role grants are picked up via /auth/me + explicit refresh.

      if (!response.ok) {
        const payload = await this.tryReadBody(response);

        if (response.status === 403 && !skipAuth) {
          const detail =
            typeof payload === "object" && payload && "detail" in payload
              ? String((payload as { detail?: unknown }).detail ?? "")
              : typeof payload === "string"
                ? payload
                : "";
          if (sessionLogoutReasonFromApiDetail(detail) === "inactive") {
            dispatchSessionLogout("inactive");
          }
        }

        if (response.status === 401 && !skipAuth) {
          const detail =
            typeof payload === "object" && payload && "detail" in payload
              ? String((payload as { detail?: unknown }).detail ?? "")
              : typeof payload === "string"
                ? payload
                : "";
          const reason = sessionLogoutReasonFromApiDetail(detail);
          // The server explicitly said idle/expired: believe it. A bare 401 after we already refreshed successfully is
          // ambiguous (one endpoint can say 401 for its own reasons), so ask the session itself before signing out.
          if (reason === null && __isRetry && this.sessionVerifier) {
            const verdict = await this.sessionVerifier().catch((): "unknown" => "unknown");
            if (verdict === "invalid") dispatchSessionLogout("server");
          } else {
            // Prefer idle/expired messaging; otherwise the refresh was refused, so the session really is gone.
            dispatchSessionLogout(reason ?? "server");
          }
        }

        const serverUnavailable =
          response.status === 500 ||
          response.status === 502 ||
          response.status === 503 ||
          response.status === 504;
        throw new ApiError(
          parseApiErrorMessage(
            payload,
            serverUnavailable
              ? "Unable to reach the server. Please try again later."
              : `Request failed: ${response.status} ${response.statusText}`
          ),
          response.status,
          payload
        );
      }

      return (await this.readBody<T>(response, responseType)) as T;
    } catch (error) {
      let nextError: unknown = error;
      if (timedOut && error instanceof Error && error.name === "AbortError") {
        nextError = new ApiError(
          "The request timed out. Please check your connection and try again.",
          0
        );
      } else if (error instanceof TypeError) {
        const message = error.message.toLowerCase();
        if (message.includes("fetch") || message.includes("network")) {
          nextError = new ApiError(
            "No internet connection. Please check your network and try again.",
            0
          );
        }
      }
      for (const interceptor of this.errorInterceptors) {
        nextError = await interceptor(nextError);
      }
      throw nextError;
    } finally {
      if (timeoutHandle) clearTimeout(timeoutHandle);
    }
  }

  get<T = unknown>(path: string, options: Omit<ApiRequestOptions, "method"> = {}) {
    return this.request<T>(path, { ...options, method: "GET" });
  }

  post<T = unknown>(path: string, options: Omit<ApiRequestOptions, "method"> = {}) {
    return this.request<T>(path, { ...options, method: "POST" });
  }

  put<T = unknown>(path: string, options: Omit<ApiRequestOptions, "method"> = {}) {
    return this.request<T>(path, { ...options, method: "PUT" });
  }

  patch<T = unknown>(path: string, options: Omit<ApiRequestOptions, "method"> = {}) {
    return this.request<T>(path, { ...options, method: "PATCH" });
  }

  delete<T = unknown>(path: string, options: Omit<ApiRequestOptions, "method"> = {}) {
    return this.request<T>(path, { ...options, method: "DELETE" });
  }

  private buildUrl(path: string, query?: QueryParams) {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    const url = this.baseUrl
      ? new URL(`${this.baseUrl}${normalizedPath}`)
      : new URL(
          normalizedPath,
          typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"
        );
    if (!query) return url.toString();

    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      url.searchParams.set(key, String(value));
    });

    return url.toString();
  }

  private async readBody<T>(response: Response, responseType: ResponseType): Promise<T | null> {
    if (responseType === "raw") return response as T;
    if (responseType === "blob") return (await response.blob()) as T;
    if (responseType === "text") return (await response.text()) as T;

    const text = await response.text();
    if (!text.trim()) return null;

    if (!this.looksLikeJsonBody(response.headers.get("content-type"), text)) {
      return null;
    }

    return JSON.parse(text) as T;
  }

  private looksLikeJsonBody(contentType: string | null, text: string): boolean {
    const trimmed = text.trimStart();
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) return true;
    const type = (contentType ?? "").toLowerCase();
    return type.includes("application/json") || type.includes("+json");
  }

  private async tryReadBody(response: Response): Promise<unknown> {
    try {
      const text = await response.text();
      if (!text.trim()) return null;
      if (this.looksLikeJsonBody(response.headers.get("content-type"), text)) {
        try {
          return JSON.parse(text);
        } catch {
          return text;
        }
      }
      return text;
    } catch {
      return null;
    }
  }
}

export const apiClient = new HttpClient({ baseUrl: DEFAULT_BASE_URL });
if (typeof window !== "undefined") {
  attachApiLoadingTelemetry(apiClient);
}
