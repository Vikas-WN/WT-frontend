"use client";

/** Platform-aware keyboard helpers. */

export function isMacPlatform(): boolean {
  if (typeof navigator === "undefined") return false;
  const p =
    (navigator as unknown as { userAgentData?: { platform?: string } }).userAgentData
      ?.platform ||
    navigator.platform ||
    navigator.userAgent ||
    "";
  return /mac|iphone|ipad|ipod/i.test(p);
}

/** "⌘" on macOS, "Ctrl" everywhere else (Windows / Linux / ChromeOS). */
export function modKeyLabel(): string {
  return isMacPlatform() ? "⌘" : "Ctrl";
}

/** True when the event's platform "command" modifier is held (⌘ on mac, Ctrl elsewhere). */
export function isModKey(e: KeyboardEvent | React.KeyboardEvent): boolean {
  return isMacPlatform() ? e.metaKey : e.ctrlKey;
}

/** Don't fire app shortcuts while the user is typing. */
export function isEditableTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    el.isContentEditable ||
    el.getAttribute("role") === "textbox"
  );
}
