"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { MOBILE_DRAWER_COPY } from "@/components/dashboard/referral/mobile-drawer/mobile-drawer.constants";
import type { MobileDrawerProps } from "@/components/dashboard/referral/mobile-drawer/mobile-drawer.types";
import "./mobile-drawer.css";

export function MobileDrawer({ open, onClose, children }: MobileDrawerProps) {
  useEffect(() => {
    if (!open) return;
    const isMobile = typeof window === "undefined" || window.matchMedia("(max-width: 1023px)").matches;
    if (!isMobile) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px] lg:bg-transparent lg:backdrop-blur-none" />
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "absolute right-0 top-0 bottom-0 flex w-full max-w-sm flex-col overflow-hidden",
          "animate-in slide-in-from-right duration-300 ease-[var(--wt-ease)]",
          "bg-wt-surface-1 border-l border-wt-border shadow-xl"
        )}
      >
        <div className="flex items-center justify-between border-b border-wt-border px-5 py-4">
          <h3 className="text-base font-semibold text-wt-text">{MOBILE_DRAWER_COPY.referCandidate}</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-lg text-wt-text-muted hover:bg-wt-surface-2 hover:text-wt-text"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain p-5">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
