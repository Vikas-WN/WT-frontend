/**
 * Centre-screen confirmation splash — a big animated tick (or cross) that shows
 * for ~1.6s and fades out. Used for the "did it actually work?" moment after a
 * mutation, so users on phones / tablets get unmistakable feedback even when a
 * corner toast is easy to miss.
 *
 * Imperative, framework-free store. `showActionSplash()` works from anywhere;
 * <ActionSplashHost /> (mounted once in the root layout) renders it.
 */

export type ActionSplashVariant = "success" | "error";

export type ActionSplashPayload = {
  /** Monotonic id so repeat calls with the same message still re-trigger. */
  id: number;
  message: string;
  variant: ActionSplashVariant;
  durationMs: number;
};

type Listener = (payload: ActionSplashPayload | null) => void;

const listeners = new Set<Listener>();
let current: ActionSplashPayload | null = null;
let seq = 0;

function emit(payload: ActionSplashPayload | null): void {
  current = payload;
  for (const listener of listeners) listener(payload);
}

export function subscribeActionSplash(listener: Listener): () => void {
  listeners.add(listener);
  listener(current);
  return () => {
    listeners.delete(listener);
  };
}

export function showActionSplash(
  message = "Done",
  opts?: { variant?: ActionSplashVariant; durationMs?: number }
): void {
  if (typeof window === "undefined") return;
  emit({
    id: ++seq,
    message: message.trim() || "Done",
    variant: opts?.variant ?? "success",
    durationMs: Math.max(600, opts?.durationMs ?? 1600),
  });
}

export function clearActionSplash(): void {
  emit(null);
}
