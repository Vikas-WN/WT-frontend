"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import {
  clearActionSplash,
  subscribeActionSplash,
  type ActionSplashPayload,
} from "@/lib/actionSplash";
import { cn } from "@/lib/utils";

/** Mount once (root layout). Listens to the actionSplash store and renders the
 *  centre-screen tick / cross confirmation. */
export function ActionSplashHost() {
  const [payload, setPayload] = useState<ActionSplashPayload | null>(null);
  const [visible, setVisible] = useState(false);
  const hideTimer = useRef<number | null>(null);
  const clearTimer = useRef<number | null>(null);

  useEffect(() => {
    const clearTimers = () => {
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
      if (clearTimer.current) window.clearTimeout(clearTimer.current);
      hideTimer.current = null;
      clearTimer.current = null;
    };

    const unsubscribe = subscribeActionSplash((next) => {
      clearTimers();
      if (!next) {
        setVisible(false);
        return;
      }
      setPayload(next);
      setVisible(true);
      hideTimer.current = window.setTimeout(() => setVisible(false), next.durationMs);
      clearTimer.current = window.setTimeout(() => clearActionSplash(), next.durationMs + 280);
    });

    return () => {
      unsubscribe();
      clearTimers();
    };
  }, []);

  if (!payload || typeof document === "undefined") return null;

  const isError = payload.variant === "error";

  return createPortal(
    <div
      className={cn(
        "pointer-events-none fixed inset-0 z-[300] flex items-center justify-center p-6",
        "transition-opacity duration-200 ease-out",
        visible ? "opacity-100" : "opacity-0"
      )}
      role="status"
      aria-live="polite"
    >
      <div
        key={payload.id}
        className={cn(
          "flex min-w-[10rem] max-w-[min(20rem,calc(100vw-3rem))] flex-col items-center gap-3",
          "rounded-3xl border border-wt-border bg-wt-surface-1/95 px-8 py-7 text-center shadow-2xl backdrop-blur-xl",
          "dark:border-wt-border-md dark:bg-wt-surface-2/95",
          visible ? "wt-action-splash--in" : "wt-action-splash--out"
        )}
      >
        <span
          className={cn(
            "flex size-16 items-center justify-center rounded-full",
            isError
              ? "bg-rose-500/12 text-rose-600 dark:text-rose-400"
              : "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400"
          )}
        >
          {isError ? (
            <X className="size-9" strokeWidth={2.75} aria-hidden />
          ) : (
            <svg
              className="wt-action-splash__check size-9"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.75}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          )}
        </span>
        <p className="text-sm font-medium text-wt-text [overflow-wrap:anywhere]">
          {payload.message}
        </p>
      </div>
    </div>,
    document.body
  );
}
