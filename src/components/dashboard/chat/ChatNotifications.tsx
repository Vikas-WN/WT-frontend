"use client";

import { useState } from "react";
import { Bell, BellOff, BellRing, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PUSH_COPY } from "@/constants/pwa";
import { usePushNotifications, type PushState } from "@/hooks/push/usePushNotifications";
import { showErrorToast } from "@/lib/toast";

const REASON: Partial<Record<PushState, string>> = {
  unsupported: PUSH_COPY.unsupported,
  unavailable: PUSH_COPY.notReady,
  blocked: PUSH_COPY.blocked,
};

function snoozed(): boolean {
  try {
    const until = Number(window.localStorage.getItem(PUSH_COPY.bannerSnoozeKey));
    return Number.isFinite(until) && until > Date.now();
  } catch {
    return false;
  }
}

/** The bell in the Messages header: on / off, or the reason it cannot be turned on. */
export function ChatNotificationsButton() {
  const push = usePushNotifications();
  if (push.state === "loading") return null;
  const on = push.state === "on";
  const reason = REASON[push.state];
  const label = on ? PUSH_COPY.turnOff : reason ?? PUSH_COPY.turnOn;
  const Icon = on ? BellRing : reason ? BellOff : Bell;
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={on}
      disabled={push.busy}
      onClick={() => (reason ? showErrorToast(reason) : on ? push.disable() : push.enable())}
      className={`grid size-8 place-items-center rounded-lg hover:bg-wt-surface-2 disabled:opacity-60 ${on ? "text-[var(--wt-brand)]" : "text-wt-text-muted hover:text-wt-text"}`}
    >
      <Icon className="size-4" aria-hidden />
    </button>
  );
}

/** A one-time nudge above the conversation list while notifications are off. "Not now" keeps it quiet for a week. */
export function ChatNotificationsBanner() {
  const push = usePushNotifications();
  // UI state: dismissed for this visit (the week-long snooze is remembered in localStorage).
  const [dismissed, setDismissed] = useState(false);
  if (push.state !== "off" || dismissed || snoozed()) return null;
  const dismiss = () => {
    try {
      window.localStorage.setItem(PUSH_COPY.bannerSnoozeKey, String(Date.now() + PUSH_COPY.bannerSnoozeMs));
    } catch {
      /* private mode: it simply comes back next visit */
    }
    setDismissed(true);
  };
  return (
    <div className="mx-3 mb-2 rounded-xl border border-[color-mix(in_srgb,var(--wt-brand)_25%,transparent)] bg-[var(--wt-brand-soft)] p-3">
      <div className="flex items-start gap-2">
        <BellRing className="mt-0.5 size-4 shrink-0 text-[var(--wt-brand)]" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-wt-text">{PUSH_COPY.bannerTitle}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-wt-text-muted">{PUSH_COPY.bannerBody}</p>
          <div className="mt-2 flex gap-2">
            <Button type="button" size="sm" variant="brand" disabled={push.busy} onClick={push.enable}>
              {PUSH_COPY.bannerAction}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={dismiss}>
              {PUSH_COPY.bannerDismiss}
            </Button>
          </div>
        </div>
        <button type="button" onClick={dismiss} aria-label={PUSH_COPY.bannerDismiss} className="grid size-6 place-items-center rounded text-wt-text-muted hover:text-wt-text">
          <X className="size-3.5" aria-hidden />
        </button>
      </div>
    </div>
  );
}
