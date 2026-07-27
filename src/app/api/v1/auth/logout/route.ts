import { NextRequest, NextResponse } from "next/server";
import {
  backendMisconfiguredResponse,
  backendUnavailableResponse,
  buildCookieHeader,
  clearAuthCookies,
  getBackendBaseUrl,
  isBackendMisconfigured,
} from "@/lib/serverApi";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (isBackendMisconfigured()) {
    const response = backendMisconfiguredResponse();
    clearAuthCookies(response);
    return response;
  }

  const cookieHeader = buildCookieHeader(request, ["tokenId"]);
  let upstream: Response;
  try {
    upstream = await fetch(`${getBackendBaseUrl()}/api/v1/auth/logout`, {
      method: "POST",
      headers: cookieHeader ? { Cookie: cookieHeader } : undefined,
    });
  } catch {
    const response = backendUnavailableResponse();
    clearAuthCookies(response);
    return response;
  }

  const body = await upstream.text();
  const response = new NextResponse(body, {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "application/json",
    },
  });
  clearAuthCookies(response);
  return response;
}
