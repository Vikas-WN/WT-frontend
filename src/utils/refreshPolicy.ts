/**
 * Rules for the silent session refresh. A refresh that fails because the network or server hiccuped (a laptop
 * waking up, Wi-Fi reconnecting, a deploy, a busy database) says nothing about the session itself, so it must
 * never sign anyone out. Only the server saying "no" (401/403) does. No React, no app imports: unit-testable.
 */

/** Status 0 is how the HTTP client reports "no connection / timed out". */
export function isTransientStatus(status: number): boolean {
  return status === 0 || status === 408 || status === 425 || status === 429 || status >= 500;
}

/** Waits between refresh attempts, so a brief outage (typically a few seconds) is ridden out. */
export const REFRESH_RETRY_DELAYS_MS: readonly number[] = [500, 1500, 4000, 8000];

export type AttemptResult<T> = { kind: "ok"; value: T } | { kind: "transient" } | { kind: "rejected" };

/**
 * Runs `attempt` until it succeeds, is definitively rejected, or the delays run out. Returns the last result;
 * "transient" means "couldn't tell — don't sign out".
 */
export async function retryTransient<T>(
  attempt: () => Promise<AttemptResult<T>>,
  delaysMs: readonly number[] = REFRESH_RETRY_DELAYS_MS,
  sleep: (ms: number) => Promise<void> = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
): Promise<AttemptResult<T>> {
  let result = await attempt();
  for (const delay of delaysMs) {
    if (result.kind !== "transient") return result;
    await sleep(delay);
    result = await attempt();
  }
  return result;
}
