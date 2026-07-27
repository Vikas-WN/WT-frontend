import { NextRequest, NextResponse } from "next/server";
import {
  backendUnavailableResponse,
  proxyUpstreamApiRequest,
  resolveRoutePathSegments,
} from "@/lib/serverApi";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ path?: string | string[] }> | { path?: string | string[] };
};

async function handleProxy(request: NextRequest, context: RouteContext) {
  try {
    const pathSegments = await resolveRoutePathSegments(context.params);
    return await proxyUpstreamApiRequest(request, pathSegments);
  } catch (error) {
    console.error("BFF catch-all proxy failed:", error);
    return backendUnavailableResponse();
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  return handleProxy(request, context);
}

export async function POST(request: NextRequest, context: RouteContext) {
  return handleProxy(request, context);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return handleProxy(request, context);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return handleProxy(request, context);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return handleProxy(request, context);
}
