export type LimitLevel = "ok" | "near" | "limit";

/** How close text is to its limit: fine, getting close (90% by default), or at the limit. */
export function limitLevel(used: number, max: number, warnFraction = 0.9): LimitLevel {
  if (used >= max) return "limit";
  return used >= max * warnFraction ? "near" : "ok";
}

/** Whether pasting `pasted` over the selection would push the text past `max` — the browser then silently cuts it. */
export function pasteWouldOverflow(current: string, selectionLength: number, pasted: string, max: number): boolean {
  return current.length - selectionLength + pasted.length > max;
}
