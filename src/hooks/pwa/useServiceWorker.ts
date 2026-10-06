"use client";

import { useCallback, useEffect, useState } from "react";

import { PWA } from "@/constants/pwa";

/**
 * Registers the service worker (production only — in dev it would serve stale code) and reports when a new version
 * is waiting. `applyUpdate` activates it and reloads once the new worker has taken over.
 */
export function useServiceWorker() {
  // UI state: the worker that is installed and waiting for the person to say "refresh".
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);

  // Side effect: registering a service worker and listening for its lifecycle has no React-state equivalent.
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    let timer: number | undefined;
    let cancelled = false;

    const watch = (registration: ServiceWorkerRegistration) => {
      if (registration.waiting && navigator.serviceWorker.controller) setWaiting(registration.waiting);
      registration.addEventListener("updatefound", () => {
        const installing = registration.installing;
        installing?.addEventListener("statechange", () => {
          if (installing.state === "installed" && navigator.serviceWorker.controller) setWaiting(installing);
        });
      });
    };

    navigator.serviceWorker
      .register(PWA.swUrl)
      .then((registration) => {
        if (cancelled) return;
        watch(registration);
        timer = window.setInterval(() => void registration.update().catch(() => {}), PWA.updateCheckMs);
      })
      .catch(() => {
        // Registration can fail (private mode, blocked): the app works the same without it.
      });

    return () => {
      cancelled = true;
      if (timer) window.clearInterval(timer);
    };
  }, []);

  const applyUpdate = useCallback(() => {
    if (!waiting) return;
    navigator.serviceWorker.addEventListener("controllerchange", () => window.location.reload(), { once: true });
    waiting.postMessage("SKIP_WAITING");
  }, [waiting]);

  return { updateReady: waiting !== null, applyUpdate, dismissUpdate: () => setWaiting(null) };
}
