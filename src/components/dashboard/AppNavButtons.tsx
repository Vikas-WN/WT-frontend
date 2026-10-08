"use client";

import { ArrowLeft, ArrowRight, RotateCw } from "lucide-react";
import type { ReactNode } from "react";

import { APP_NAV_COPY } from "@/constants/appNavigation";
import { useHistoryNavigation } from "@/hooks/navigation/useHistoryNavigation";
import { useInstalledApp } from "@/hooks/pwa/useInstalledApp";
import { cn } from "@/lib/utils";

function NavButton({ label, disabled, onClick, className, children }: { label: string; disabled?: boolean; onClick: () => void; className?: string; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "grid size-8 place-items-center rounded-[10px] text-wt-text-muted transition-colors duration-[var(--wt-duration)]",
        "hover:bg-wt-surface-2 hover:text-wt-text active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--wt-brand)]",
        "disabled:pointer-events-none disabled:opacity-35",
        className
      )}
    >
      {children}
    </button>
  );
}

/**
 * Back, forward and refresh for the installed app — which has no browser toolbar, so on a phone there is otherwise no way
 * back except a swipe. Not shown in a normal browser tab, where the browser already has these.
 */
export function AppNavButtons({ className }: { className?: string }) {
  const installed = useInstalledApp();
  const nav = useHistoryNavigation();
  if (!installed) return null;
  return (
    <div
      role="group"
      aria-label={APP_NAV_COPY.group}
      className={cn("flex shrink-0 items-center rounded-xl border border-wt-border bg-wt-surface-1 p-0.5 shadow-[var(--wt-shadow-sm)]", className)}
    >
      <NavButton label={APP_NAV_COPY.back} disabled={!nav.canGoBack} onClick={nav.back}>
        <ArrowLeft className="size-[17px]" aria-hidden />
      </NavButton>
      <NavButton label={APP_NAV_COPY.forward} disabled={!nav.canGoForward} onClick={nav.forward}>
        <ArrowRight className="size-[17px]" aria-hidden />
      </NavButton>
      <NavButton label={APP_NAV_COPY.refresh} onClick={nav.refresh} className="max-sm:hidden">
        <RotateCw className={cn("size-[15px]", nav.refreshing && "animate-spin")} aria-hidden />
      </NavButton>
    </div>
  );
}
