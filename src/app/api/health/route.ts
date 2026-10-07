import { NextResponse } from "next/server";

import { getBackendBaseUrl, isBackendMisconfigured } from "@/lib/serverApi";

export const dynamic = "force-dynamic";

const STARTED = Date.now();
const BACKEND_TIMEOUT_MS = 3_000;

/**
 * Health of the web tier, for uptime probes and load balancers.
 *   GET /api/health        -> 200 when this server is up (never depends on the backend)
 *   GET /api/health?deep=1 -> also checks the API behind it (/readyz); 503 if that is down
 */
export async function GET(request: Request) {
  const base = {
    status: "ok",
    service: "webtrak-frontend",
    release: process.env.NEXT_PUBLIC_APP_RELEASE ?? "dev",
    uptimeSeconds: Math.round((Date.now() - STARTED) / 1000),
  };
  if (new URL(request.url).searchParams.get("deep") !== "1") return NextResponse.json(base);

  if (isBackendMisconfigured()) return NextResponse.json({ ...base, status: "degraded", backend: "not_configured" }, { status: 503 });
  try {
    const response = await fetch(`${getBackendBaseUrl()}/readyz`, { signal: AbortSignal.timeout(BACKEND_TIMEOUT_MS), cache: "no-store" });
    return response.ok
      ? NextResponse.json({ ...base, backend: "ready" })
      : NextResponse.json({ ...base, status: "degraded", backend: `http_${response.status}` }, { status: 503 });
  } catch {
    return NextResponse.json({ ...base, status: "degraded", backend: "unreachable" }, { status: 503 });
  }
}
