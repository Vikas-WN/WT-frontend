"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { CONTENT_CARD_CLASS } from "@/components/dashboard/ui/uiLayout";
import { cn } from "@/lib/utils";

export type HomeTone = "brand" | "emerald" | "amber" | "violet" | "rose" | "sky";

/** Tinted icon-tile colours, readable in light and dark. */
const TONE_TILE: Record<HomeTone, string> = {
  brand: "bg-[var(--wt-brand-soft)] text-[var(--wt-brand)]",
  emerald: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400",
  amber: "bg-amber-500/14 text-amber-700 dark:text-amber-400",
  violet: "bg-violet-500/12 text-violet-700 dark:text-violet-300",
  rose: "bg-rose-500/12 text-rose-700 dark:text-rose-300",
  sky: "bg-sky-500/12 text-sky-700 dark:text-sky-300",
};

export function HomeCard({
  title,
  icon,
  href,
  cta,
  onAction,
  children,
  /** Brand-tinted prominent treatment for the one or two cards on the page
   *  that are genuinely more actionable than the rest (e.g. pending
   *  approvals) — spend sparingly, at most one or two per page. */
  featured = false,
  tone = "brand",
  className,
}: {
  title: string;
  icon: React.ReactNode;
  href?: string;
  cta?: string;
  /** Alternative to `href` for cards whose "open" action isn't a route — e.g.
   *  opening a dialog. */
  onAction?: () => void;
  children: React.ReactNode;
  featured?: boolean;
  /** Colour of the icon tile. */
  tone?: HomeTone;
  className?: string;
}) {
  return (
    <section
      className={cn(
        CONTENT_CARD_CLASS,
        "flex h-full min-h-0 flex-col overflow-hidden p-4 sm:p-5 lg:p-4",
        (href || onAction) && "wt-lift",
        featured &&
          "shadow-[inset_3px_0_0_var(--wt-brand)] border-[color-mix(in_srgb,var(--wt-brand)_28%,transparent)] bg-[var(--wt-brand-soft)] dark:bg-[var(--wt-brand-soft)]",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className={cn("grid size-7 shrink-0 place-items-center rounded-lg", TONE_TILE[tone])} aria-hidden>
            {icon}
          </span>
          <h2 className="truncate text-sm font-semibold text-wt-text">{title}</h2>
        </div>
        {href ? (
          <Link
            href={href}
            className="inline-flex shrink-0 items-center gap-0.5 text-xs font-medium text-[var(--wt-brand)] hover:underline"
          >
            {cta ?? "Open"}
            <ChevronRight className="size-3.5" />
          </Link>
        ) : onAction ? (
          <button
            type="button"
            onClick={onAction}
            className="inline-flex shrink-0 items-center gap-0.5 text-xs font-medium text-[var(--wt-brand)] hover:underline"
          >
            {cta ?? "Open"}
            <ChevronRight className="size-3.5" />
          </button>
        ) : null}
      </div>
      <div className="wt-tile-body mt-2.5 min-h-0 flex-1 lg:overflow-y-auto lg:overscroll-contain">{children}</div>
    </section>
  );
}

export function CardMessage({ text }: { text: string }) {
  return <p className="py-4 text-sm text-wt-text-muted">{text}</p>;
}

export function CardSkeleton() {
  return (
    <div className="space-y-2 py-1" aria-hidden>
      <div className="h-3 w-2/3 animate-pulse rounded bg-wt-surface-3" />
      <div className="h-3 w-1/3 animate-pulse rounded bg-wt-surface-3" />
    </div>
  );
}
