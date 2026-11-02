import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  const gatewayUrl = process.env.NEXT_PUBLIC_RELAY_GATEWAY_URL ?? process.env.NEXT_PUBLIC_GATEWAY_URL ?? "";
  const apiKey = process.env.NEXT_PUBLIC_RELAY_API_KEY ?? "";
  const agentId = process.env.NEXT_PUBLIC_RELAY_AGENT_ID ?? process.env.NEXT_PUBLIC_AGENT_ID ?? "";
  const projectId = process.env.NEXT_PUBLIC_RELAY_PROJECT_ID ?? "";

  return NextResponse.json({
    gatewayUrl,
    apiKey,
    agentId,
    projectId,
    enabled: Boolean(gatewayUrl && agentId && (apiKey || projectId)),
  });
}
