"use client";

import { useEffect, useState } from "react";
import { Download, RefreshCw, Share, WifiOff, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PWA_COPY as COPY } from "@/constants/pwa";
import { useInstallPrompt } from "@/hooks/pwa/useInstallPrompt";
import { useOnlineStatus } from "@/hooks/pwa/useOnlineStatus";
import { useServiceWorker } from "@/hooks/pwa/useServiceWorker";

const FLOAT = "fixed z-[300] wt-fade-up rounded-2xl border border-wt-border bg-wt-surface-1 shadow-[var(--wt-shadow-lg)]";

/** Slim bar at the very top while the connection is down; a brief "back online" confirmation afterwards. */
function ConnectionBar() {
  const online = useOnlineStatus();
  // UI-only: show the green "back online" line for a couple of seconds after reconnecting.
  const [justBack, setJustBack] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  // Side effect: timing the confirmation message.
  useEffect(() => {
    if (!online) {
      setWasOffline(true);
      return;
    }
    if (!wasOffline) return;
    setJustBack(true);
    const timer = window.setTimeout(() => {
      setJustBack(false);
      setWasOffline(false);
    }, 2400);
    return () => window.clearTimeout(timer);
  }, [online, wasOffline]);

  if (online && !justBack) return null;
  return (
    <div
      role="status"
      className={`fixed inset-x-0 top-0 z-[310] flex items-center justify-center gap-2 px-4 py-1.5 text-xs font-medium wt-fade-up ${
        online ? "bg-emerald-600 text-white" : "bg-amber-500 text-black"
      }`}
    >
      {online ? null : <WifiOff className="size-3.5" aria-hidden />}
      {online ? COPY.backOnline : COPY.offline}
    </div>
  );
}

/** Registers the service worker and hosts the install / update / offline UI. Mounted once in the root layout. */
export function PwaHost() {
  const { updateReady, applyUpdate, dismissUpdate } = useServiceWorker();
  const { mode, install, snooze } = useInstallPrompt();

  return (
    <>
      <ConnectionBar />

      {updateReady ? (
        <div role="status" className={`${FLOAT} bottom-4 left-1/2 flex w-[min(92vw,26rem)] -translate-x-1/2 items-center gap-3 p-3 pl-4`}>
          <RefreshCw className="size-4 shrink-0 text-[var(--wt-brand)]" aria-hidden />
          <p className="min-w-0 flex-1 text-sm font-medium text-wt-text">{COPY.updateTitle}</p>
          <Button size="sm" variant="ghost" onClick={dismissUpdate}>
            {COPY.later}
          </Button>
          <Button size="sm" variant="brand" onClick={applyUpdate}>
            {COPY.update}
          </Button>
        </div>
      ) : mode ? (
        <aside
          aria-label={COPY.installTitle}
          className={`${FLOAT} bottom-4 right-4 w-[min(92vw,22rem)] p-4 max-sm:left-1/2 max-sm:right-auto max-sm:-translate-x-1/2`}
        >
          <button
            type="button"
            onClick={snooze}
            aria-label={COPY.notNow}
            className="absolute right-2.5 top-2.5 grid size-7 place-items-center rounded-lg text-wt-text-faint hover:bg-wt-surface-2 hover:text-wt-text"
          >
            <X className="size-4" />
          </button>
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[var(--wt-brand-soft)] text-[var(--wt-brand)]">
              {mode === "ios" ? <Share className="size-5" /> : <Download className="size-5" />}
            </span>
            <div className="min-w-0 pr-5">
              <p className="text-sm font-semibold text-wt-text">{mode === "ios" ? COPY.iosTitle : COPY.installTitle}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-wt-text-muted">{mode === "ios" ? COPY.iosBody : COPY.installBody}</p>
            </div>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={snooze}>
              {mode === "ios" ? COPY.gotIt : COPY.notNow}
            </Button>
            {mode === "native" ? (
              <Button size="sm" variant="brand" onClick={() => void install()}>
                {COPY.install}
              </Button>
            ) : null}
          </div>
        </aside>
      ) : null}
    </>
  );
}
