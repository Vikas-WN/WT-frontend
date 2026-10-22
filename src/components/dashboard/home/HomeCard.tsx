"use client";

import Link from "next/link";
import { CalendarDays, CalendarRange, CheckCheck, Folder, GraduationCap, PartyPopper, Users, LayoutGrid } from "lucide-react";

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
  subtitle,
  titleBadge,
  headerRight,
  href,
  cta,
  onAction,
  children,
  /** Brand-tinted prominent treatment for the one or two cards on the page
   *  that are genuinely more actionable than the rest (e.g. pending
   *  approvals) — spend sparingly, at most one or two per page. */
  featured = false,
  icon,
  tone = "brand",
  className,
}: {
  title: string;
  /** A quieter line under the title. */
  subtitle?: string;
  /** Sits right after the title (a count). */
  titleBadge?: React.ReactNode;
  /** Replaces the link at the right edge (tabs, buttons). */
  headerRight?: React.ReactNode;
  /** Optional custom icon for the section tile. */
  icon?: React.ReactNode;
  href?: string;
  cta?: string;
  /** Alternative to `href` for cards whose "open" action isn't a route — e.g.
   *  opening a dialog. */
  onAction?: () => void;
  children: React.ReactNode;
  featured?: boolean;
  /** Semantic accent for the section tile. */
  tone?: HomeTone;
  className?: string;
}) {
  const TileIcon = /approval/i.test(title) ? CheckCheck : /leave|holiday/i.test(title) ? CalendarDays : /learning/i.test(title) ? GraduationCap : /project/i.test(title) ? Folder : /celebrat/i.test(title) ? PartyPopper : /where|attendance/i.test(title) ? Users : /out/i.test(title) ? CalendarRange : LayoutGrid;
  const linkClass = "wt-card-link shrink-0 rounded text-xs font-medium text-wt-text-muted transition-colors hover:text-wt-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wt-brand";
  return (
    <section
      className={cn(
        "wt-home-card flex flex-col overflow-hidden rounded-2xl border border-wt-border bg-wt-surface-1 p-5 sm:p-6 @2xl:h-full @2xl:min-h-0",
        featured && "border-[color-mix(in_srgb,var(--wt-brand)_20%,var(--wt-border))]",
        className
      )}
    >
      <div className="wt-home-card-heading flex flex-wrap items-center justify-between gap-x-3 gap-y-2.5">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg [&_svg]:size-4", TONE_TILE[tone])} aria-hidden>{icon ?? <TileIcon className="size-4" />}</span>
            <h2 className="truncate text-[0.9375rem] font-semibold leading-tight tracking-[-0.01em] text-wt-text">{title}</h2>
            {titleBadge}
          </div>
          {subtitle ? <p className="mt-0.5 text-sm text-wt-text-muted">{subtitle}</p> : null}
        </div>
        {headerRight ? (
          headerRight
        ) : href ? (
          <Link href={href} className={linkClass}>
            {cta ?? "Open"}
          </Link>
        ) : onAction ? (
          <button type="button" onClick={onAction} className={linkClass}>
            {cta ?? "Open"}
          </button>
        ) : null}
      </div>
      <div className="wt-tile-body mt-4 flex-1 lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain">{children}</div>
    </section>
  );
}

export function CardMessage({ text }: { text: string }) {
  return <p className="py-4 text-sm text-wt-text-muted">{text}</p>;
}

/** A calm empty state: a small icon, what is missing, and what will appear — in a dashed box, as in the redesign. */
export function CardEmpty({ icon, title, hint }: { icon: React.ReactNode; title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl bg-wt-surface-2/60 px-4 py-6 text-center">
      <span className="grid size-11 place-items-center rounded-xl bg-wt-surface-2 text-wt-text-muted" aria-hidden>
        {icon}
      </span>
      <span className="text-[15px] font-semibold text-wt-text">{title}</span>
      {hint ? <span className="max-w-[16rem] text-sm leading-snug text-wt-text-muted">{hint}</span> : null}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="space-y-2 py-1" aria-hidden>
      <div className="h-3 w-2/3 animate-pulse rounded bg-wt-surface-3" />
      <div className="h-3 w-1/3 animate-pulse rounded bg-wt-surface-3" />
    </div>
  );
}
