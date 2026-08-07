import { NextRequest, NextResponse } from "next/server";
import {
  backendMisconfiguredResponse,
  backendUnavailableResponse,
  getBackendBaseUrl,
  isBackendMisconfigured,
  setAuthCookies,
  type SessionTokens,
} from "@/lib/serverApi";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (isBackendMisconfigured()) {
    return backendMisconfiguredResponse();
  }
  const tokenId = request.cookies.get("tokenId")?.value ?? "";
  const refreshToken = request.cookies.get("refreshToken")?.value ?? "";
  const cookieHeader = [tokenId && `tokenId=${tokenId}`, refreshToken && `refreshToken=${refreshToken}`]
    .filter(Boolean)
    .join("; ");

  let upstream: Response;
  try {
    upstream = await fetch(`${getBackendBaseUrl()}/api/v1/auth/refresh`, {
      method: "POST",
      headers: cookieHeader ? { Cookie: cookieHeader } : undefined,
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    return backendUnavailableResponse();
  }

  const body = await upstream.text();
  const response = new NextResponse(body, {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "application/json",
    },
  });

  if (!upstream.ok) {
    // Do not clear auth cookies on refresh 401 here.
    // Concurrent refresh races (or a single expired access probe) used to wipe a
    // still-valid session that another in-flight refresh had just renewed.
    return response;
  }

  try {
    const payload = JSON.parse(body) as {
      data: SessionTokens & {
        accessToken?: string;
        refreshToken?: string;
        tokenId?: string;
      };
    };
    const data = payload.data;
    if (data?.accessToken && data.refreshToken && data.tokenId) {
      setAuthCookies(response, {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        tokenId: data.tokenId,
        email: data.email,
        name: data.name,
        roles: data.roles ?? [],
        status: data.status ?? "",
        user_type: data.user_type ?? "",
        session_started_at: (data as { session_started_at?: string }).session_started_at,
      });
    }
  } catch {
    /* keep upstream body as-is */
  }

  return response;
}
