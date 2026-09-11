"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function HomeCard({
  title,
  icon,
  href,
  cta,
  onAction,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  href?: string;
  cta?: string;
  /** Alternative to `href` for cards whose "open" action isn't a route — e.g.
   *  opening a dialog. */
  onAction?: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col rounded-2xl border border-wt-border bg-wt-surface-1 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-wt-text-muted">{icon}</span>
          <h2 className="text-sm font-semibold text-wt-text">{title}</h2>
        </div>
        {href ? (
          <Link
            href={href}
            className="inline-flex items-center gap-0.5 text-xs font-medium text-[var(--wt-brand)] hover:underline"
          >
            {cta ?? "Open"}
            <ChevronRight className="size-3.5" />
          </Link>
        ) : onAction ? (
          <button
            type="button"
            onClick={onAction}
            className="inline-flex items-center gap-0.5 text-xs font-medium text-[var(--wt-brand)] hover:underline"
          >
            {cta ?? "Open"}
            <ChevronRight className="size-3.5" />
          </button>
        ) : null}
      </div>
      <div className="mt-3 min-h-0 flex-1">{children}</div>
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
