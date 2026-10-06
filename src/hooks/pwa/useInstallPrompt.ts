"use client";

import { useCallback, useEffect, useState } from "react";

import { PWA } from "@/constants/pwa";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export type InstallMode = "native" | "ios" | null;

function snoozed(): boolean {
  try {
    const until = Number(window.localStorage.getItem(PWA.installSnoozeKey));
    return Number.isFinite(until) && until > Date.now();
  } catch {
    return false;
  }
}

function isStandalone(): boolean {
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

function isIosSafari(): boolean {
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) && /WebKit/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
}

/**
 * When it's worth offering "install": Chrome/Edge/Android fire `beforeinstallprompt` (we keep it and show our own,
 * nicer prompt); iOS Safari has no such event, so we show how-to instructions instead. Never when already installed
 * or recently dismissed, and never straight away.
 */
export function useInstallPrompt() {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [ready, setReady] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Side effect: browser events + a delay timer; there is nothing to derive this from during render.
  useEffect(() => {
    if (isStandalone() || snoozed()) return;
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    const timer = window.setTimeout(() => setReady(true), PWA.installDelayMs);
    const onInstalled = () => setDismissed(true);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      window.clearTimeout(timer);
    };
  }, []);

  const snooze = useCallback(() => {
    setDismissed(true);
    try {
      window.localStorage.setItem(PWA.installSnoozeKey, String(Date.now() + PWA.installSnoozeMs));
    } catch {
      // Storage blocked: it will just ask again next visit.
    }
  }, []);

  const install = useCallback(async () => {
    if (!event) return;
    await event.prompt();
    const choice = await event.userChoice;
    setEvent(null);
    if (choice.outcome === "dismissed") snooze();
    else setDismissed(true);
  }, [event, snooze]);

  const mode: InstallMode = !ready || dismissed ? null : event ? "native" : isIosSafari() && !isStandalone() ? "ios" : null;
  return { mode, install, snooze };
}
