import type { HttpClient } from "@/api/httpClient";

/** Track in-flight HTTP requests (telemetry only — no global UI overlay). */
export function attachApiLoadingTelemetry(_client: HttpClient) {
  // Intentionally no-op: page UI must not block on background API calls.
}
