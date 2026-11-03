import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Read an environment variable when the request is served, not when the image is built.
 *
 * Next.js inlines every literal `process.env.NEXT_PUBLIC_*` at build time — in server code too — so the values set on
 * the UAT/prod container were ignored and the ones present during `docker build` (often none) were baked in. Looking
 * the name up through a variable keeps it out of that inlining.
 */
function runtimeEnv(...names: string[]): string {
  const env = process.env;
  for (const name of names) {
    const value = env[name]?.trim();
    if (value) return value;
  }
  return "";
}

export function GET() {
  // Server-only names first (RELAY_*); the NEXT_PUBLIC_* names still work for existing setups.
  const gatewayUrl = runtimeEnv("RELAY_GATEWAY_URL", "NEXT_PUBLIC_RELAY_GATEWAY_URL", "NEXT_PUBLIC_GATEWAY_URL");
  const apiKey = runtimeEnv("RELAY_API_KEY", "NEXT_PUBLIC_RELAY_API_KEY");
  const agentId = runtimeEnv("RELAY_AGENT_ID", "NEXT_PUBLIC_RELAY_AGENT_ID", "NEXT_PUBLIC_AGENT_ID");
  const projectId = runtimeEnv("RELAY_PROJECT_ID", "NEXT_PUBLIC_RELAY_PROJECT_ID");

  return NextResponse.json(
    {
      gatewayUrl,
      apiKey,
      agentId,
      projectId,
      enabled: Boolean(gatewayUrl && agentId && (apiKey || projectId)),
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
